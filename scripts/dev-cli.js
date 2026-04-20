#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const net = require("net");

const projectRoot = path.resolve(__dirname, "..");
const rootEnvPath = path.join(projectRoot, ".env");
const rootEnvExamplePath = path.join(projectRoot, ".env.example");
const pgVolumeName = "efratagro_pgdata";
const services = ["postgres", "backend", "frontend"];

const log = (message) => console.log(`[dev-cli] ${message}`);
const fail = (message) => {
  console.error(`[dev-cli] ${message}`);
  process.exit(1);
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: options.stdio || "inherit",
    encoding: "utf8",
    shell: false
  });

  if (result.error) {
    if (result.error.code === "ENOENT") {
      fail(`Comando nao encontrado: ${command}`);
    }

    fail(result.error.message);
  }

  if (options.allowFailure) {
    return result;
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  return result;
};

const runCompose = (args, options = {}) =>
  run("docker", ["compose", ...args], options);

const readEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return acc;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      return acc;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    acc[key] = value;
    return acc;
  }, {});
};

const rootEnv = () => readEnvFile(rootEnvPath);

const ensureDocker = () => {
  run("docker", ["--version"]);
  runCompose(["version"]);
};

const ensureRootEnv = () => {
  if (fs.existsSync(rootEnvPath)) {
    return;
  }

  if (!fs.existsSync(rootEnvExamplePath)) {
    fail("Arquivo .env.example nao encontrado na raiz do projeto.");
  }

  fs.copyFileSync(rootEnvExamplePath, rootEnvPath);
  log("Arquivo .env criado a partir de .env.example.");
};

const isPortBusy = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (error) => {
      resolve(error.code === "EADDRINUSE");
    });

    server.once("listening", () => {
      server.close(() => resolve(false));
    });

    server.listen(port, "0.0.0.0");
  });

const validatePorts = async () => {
  const env = rootEnv();
  const ports = [
    { name: "PostgreSQL", port: Number(env.DB_EXTERNAL_PORT || 5433) },
    { name: "Backend", port: Number(env.PORT || 3002) },
    { name: "Frontend", port: 5173 }
  ];

  for (const entry of ports) {
    if (await isPortBusy(entry.port) && !isPortOwnedByProject(entry.port)) {
      fail(`A porta ${entry.port} (${entry.name}) ja esta em uso por outro processo.`);
    }
  }
};

const isPortOwnedByProject = (port) => {
  const result = run("docker", ["ps", "--format", "{{.Names}}\t{{.Ports}}"], {
    stdio: "pipe",
    allowFailure: true
  });

  if (result.status !== 0) {
    return false;
  }

  return result.stdout.split(/\r?\n/).some((line) => {
    if (!line) {
      return false;
    }

    const [containerName = "", portsInfo = ""] = line.split("\t");

    return (
      containerName.startsWith("efratagro_") &&
      portsInfo.includes(`:${port}->`)
    );
  });
};

const isServiceRunning = (serviceName) => {
  const result = runCompose(
    ["ps", "--status", "running", "--services", serviceName],
    { stdio: "pipe", allowFailure: true }
  );

  return result.status === 0 && result.stdout.trim().split(/\r?\n/).includes(serviceName);
};

const waitForService = (serviceName, retries = 30, delayMs = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    if (isServiceRunning(serviceName)) {
      return;
    }

    log(`Aguardando o servico ${serviceName} ficar disponivel (${attempt}/${retries})...`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);
  }

  fail(`Servico ${serviceName} nao ficou disponivel a tempo.`);
};

const runBackendScript = (scriptName) => {
  const result = runCompose(
    ["exec", "-T", "backend", "npm", "run", scriptName],
    { allowFailure: true }
  );

  if (result.status !== 0) {
    fail(`Falha ao executar npm run ${scriptName} no container backend.`);
  }
};

const upAll = async () => {
  await validatePorts();
  runCompose(["up", "-d", "--build", ...services]);
  waitForService("postgres");
  waitForService("backend");
  waitForService("frontend");
};

const setup = async () => {
  ensureDocker();
  ensureRootEnv();
  log("Subindo ambiente completo...");
  await upAll();
  log("Rodando migrations...");
  runBackendScript("db:migrate");
  log("Rodando seed...");
  runBackendScript("db:seed");
  log("Ambiente pronto.");
  log("Frontend: http://localhost:5173");
  log("Backend: http://localhost:3002/api");
};

const dev = async () => {
  ensureDocker();
  ensureRootEnv();
  log("Subindo ambiente completo...");
  await upAll();
  log("Ambiente em execucao.");
  log("Frontend: http://localhost:5173");
  log("Backend: http://localhost:3002/api");
};

const reset = async () => {
  ensureDocker();
  ensureRootEnv();
  log("Parando containers...");
  runCompose(["down"], { allowFailure: true });
  log("Removendo volume do PostgreSQL...");
  run("docker", ["volume", "rm", "-f", pgVolumeName], { allowFailure: true });
  log("Recriando ambiente...");
  await upAll();
  log("Rodando migrations...");
  runBackendScript("db:migrate");
  log("Rodando seed...");
  runBackendScript("db:seed");
  log("Banco recriado com sucesso.");
};

const stop = () => {
  ensureDocker();
  ensureRootEnv();
  log("Parando ambiente...");
  runCompose(["stop"]);
  log("Ambiente parado.");
};

const command = process.argv[2];

const handlers = {
  setup,
  dev,
  reset,
  stop
};

if (!handlers[command]) {
  fail("Comando invalido. Use: setup, dev, reset ou stop.");
}

Promise.resolve(handlers[command]()).catch((error) => {
  fail(error.message);
});
