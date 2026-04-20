const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const loadEnvFiles = () => {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env")
  ];

  candidates.forEach((envPath) => {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");

      content.split(/\r?\n/).forEach((line) => {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith("#")) {
          return;
        }

        const separatorIndex = trimmedLine.indexOf("=");

        if (separatorIndex === -1) {
          return;
        }

        const key = trimmedLine.slice(0, separatorIndex).trim();
        let value = trimmedLine.slice(separatorIndex + 1).trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        if (!process.env[key]) {
          process.env[key] = value;
        }
      });
    }
  });
};

const parseDatabaseUrl = (databaseUrl) => {
  try {
    const url = new URL(databaseUrl);

    return {
      host: url.hostname,
      port: Number(url.port || 5432),
      database: url.pathname.replace(/^\//, ""),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password)
    };
  } catch (_error) {
    return null;
  }
};

const toConnectionString = ({ host, port, database, user, password }) =>
  `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

const buildConnectionCandidates = () => {
  const candidates = [];
  const seen = new Set();

  const addCandidate = (candidate) => {
    if (!candidate) {
      return;
    }

    const key = JSON.stringify(candidate);

    if (!seen.has(key)) {
      seen.add(key);
      candidates.push(candidate);
    }
  };

  if (process.env.DATABASE_URL) {
    addCandidate({ connectionString: process.env.DATABASE_URL });

    const parsed = parseDatabaseUrl(process.env.DATABASE_URL);

    if (parsed && parsed.host === "postgres") {
      addCandidate({
        connectionString: toConnectionString({
          ...parsed,
          host: "localhost"
        })
      });
    }
  }

  if (
    process.env.DB_HOST &&
    process.env.DB_PORT &&
    process.env.DB_NAME &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD
  ) {
    addCandidate({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    if (process.env.DB_HOST === "postgres") {
      addCandidate({
        host: "localhost",
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      });
    }
  }

  return candidates;
};

const runWithDockerPsql = (sqlPath) => {
  const containerName = process.env.DB_CONTAINER_NAME || "sis_efratagro_db";
  const dbUser = process.env.DB_USER || "postgres";
  const dbName = process.env.DB_NAME || "sis_efratagro";

  const result = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      containerName,
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      dbUser,
      "-d",
      dbName,
      "-f",
      "-"
    ],
    {
      input: fs.readFileSync(sqlPath, "utf8"),
      encoding: "utf8"
    }
  );

  if (result.status === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    error:
      result.stderr?.trim() ||
      result.stdout?.trim() ||
      result.error?.message ||
      "Falha ao executar SQL via Docker."
  };
};

const connectWithFallback = async (candidates) => {
  let Client;

  try {
    ({ Client } = require("pg"));
  } catch (_error) {
    throw new Error(
      "O pacote 'pg' nao esta instalado localmente e a execucao via Docker nao funcionou."
    );
  }

  const errors = [];

  for (const candidate of candidates) {
    const client = new Client(candidate);

    try {
      await client.connect();
      return client;
    } catch (error) {
      errors.push(error.message);
    }
  }

  throw new Error(
    `Nao foi possivel conectar ao PostgreSQL. Tentativas: ${errors.join(" | ")}`
  );
};

const main = async () => {
  loadEnvFiles();

  const relativeSqlPath = process.argv[2];

  if (!relativeSqlPath) {
    throw new Error("Informe o caminho do arquivo SQL.");
  }

  const sqlPath = path.resolve(process.cwd(), relativeSqlPath);

  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Arquivo SQL nao encontrado: ${sqlPath}`);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");

  const dockerExecution = runWithDockerPsql(sqlPath);

  if (dockerExecution.ok) {
    console.log(`SQL executado com sucesso via Docker: ${relativeSqlPath}`);
    return;
  }

  const candidates = buildConnectionCandidates();

  if (!candidates.length) {
    throw new Error(
      "Configuracao de banco ausente. Defina DATABASE_URL ou DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD."
    );
  }

  let client;

  try {
    client = await connectWithFallback(candidates);
  } catch (error) {
    throw new Error(`${dockerExecution.error} | ${error.message}`);
  }

  try {
    await client.query(sql);
    console.log(`SQL executado com sucesso: ${relativeSqlPath}`);
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
