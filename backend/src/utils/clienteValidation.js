const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUS = ["ATIVO", "BLOQUEADO", "INATIVO"];
const VALID_TIPO_CLIENTE = ["PF", "PJ"];

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const sanitizeString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const sanitized = String(value).trim();
  return sanitized.length ? sanitized : null;
};

const sanitizeNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new AppError(`${fieldName} invalido`, 400);
  }

  return parsed;
};

const validateUuid = (value, fieldName = "id") => {
  if (!UUID_PATTERN.test(String(value || ""))) {
    throw new AppError(`${fieldName} invalido`, 400);
  }
};

const validateEmail = (email) => {
  if (email && !EMAIL_PATTERN.test(email)) {
    throw new AppError("E-mail invalido", 400);
  }
};

const validateCpf = (cpf) => {
  const digits = onlyDigits(cpf);

  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits[i]) * (10 - i);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  if (remainder !== Number(digits[9])) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(digits[i]) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  return remainder === Number(digits[10]);
};

const validateCnpj = (cnpj) => {
  const digits = onlyDigits(cnpj);

  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  const calculateDigit = (base, factors) => {
    const sum = base.split("").reduce((accumulator, digit, index) => {
      return accumulator + Number(digit) * factors[index];
    }, 0);

    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstFactor = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondFactor = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const firstDigit = calculateDigit(digits.slice(0, 12), firstFactor);
  const secondDigit = calculateDigit(
    digits.slice(0, 12) + String(firstDigit),
    secondFactor
  );

  return digits.endsWith(`${firstDigit}${secondDigit}`);
};

const validateDocument = (document) => {
  const digits = onlyDigits(document);

  if (!digits) {
    throw new AppError("CPF/CNPJ obrigatorio", 400);
  }

  const isValid =
    (digits.length === 11 && validateCpf(digits)) ||
    (digits.length === 14 && validateCnpj(digits));

  if (!isValid) {
    throw new AppError("CPF/CNPJ invalido", 400);
  }

  return digits;
};

const normalizeEndereco = (endereco = {}) => ({
  cep: sanitizeString(endereco.cep),
  logradouro: sanitizeString(endereco.logradouro),
  numero: sanitizeString(endereco.numero),
  complemento: sanitizeString(endereco.complemento),
  bairro: sanitizeString(endereco.bairro),
  cidade: sanitizeString(endereco.cidade),
  estado: sanitizeString(endereco.estado)
});

const parseClientePayload = (payload, { allowStatus = false } = {}) => {
  const nomeRazaoSocial = sanitizeString(payload.nome_razao_social);
  const cpfCnpj = payload.cpf_cnpj !== undefined ? validateDocument(payload.cpf_cnpj) : null;
  const email = sanitizeString(payload.email);
  const tipoCliente = sanitizeString(payload.tipo_cliente) || null;
  const status = sanitizeString(payload.status) || null;
  const endereco = normalizeEndereco(payload.endereco || {});

  if (!nomeRazaoSocial) {
    throw new AppError("Nome/razao social obrigatorio", 400);
  }

  if (!cpfCnpj) {
    throw new AppError("CPF/CNPJ obrigatorio", 400);
  }

  validateEmail(email);

  const resolvedTipoCliente =
    tipoCliente || (cpfCnpj.length === 11 ? "PF" : "PJ");

  if (!VALID_TIPO_CLIENTE.includes(resolvedTipoCliente)) {
    throw new AppError("Tipo de cliente invalido", 400);
  }

  if (status && !allowStatus) {
    throw new AppError("Use o endpoint de status para alterar a situacao do cliente", 400);
  }

  if (status && !VALID_STATUS.includes(status)) {
    throw new AppError("Status invalido para cliente", 400);
  }

  return {
    nomeRazaoSocial,
    cpfCnpj,
    email,
    telefone: sanitizeString(payload.telefone),
    tipoCliente: resolvedTipoCliente,
    limiteCredito: sanitizeNumber(payload.limite_credito, "Limite de credito"),
    cep: endereco.cep,
    logradouro: endereco.logradouro,
    numero: endereco.numero,
    complemento: endereco.complemento,
    bairro: endereco.bairro,
    cidade: endereco.cidade,
    estado: endereco.estado,
    observacoes: sanitizeString(payload.observacoes),
    status: status || "ATIVO"
  };
};

const parseStatusPayload = (payload) => {
  const status = sanitizeString(payload.status);

  if (!status || !VALID_STATUS.includes(status)) {
    throw new AppError("Status invalido para cliente", 400);
  }

  return status;
};

const parseListFilters = (query) => {
  const status = sanitizeString(query.status);
  const search = sanitizeString(query.search);
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const includeInactive =
    String(query.include_inativos || "false").toLowerCase() === "true";

  if (status && !VALID_STATUS.includes(status)) {
    throw new AppError("Filtro de status invalido", 400);
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Parametro page invalido", 400);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError("Parametro limit invalido", 400);
  }

  return {
    status,
    search,
    page,
    limit,
    offset: (page - 1) * limit,
    includeInactive
  };
};

const mapClienteResponse = (cliente) => ({
  id: cliente.id,
  nome_razao_social: cliente.nome_razao_social,
  cpf_cnpj: cliente.cpf_cnpj,
  email: cliente.email,
  telefone: cliente.telefone,
  tipo_cliente: cliente.tipo_pessoa,
  limite_credito: cliente.limite_credito,
  endereco: {
    cep: cliente.cep,
    logradouro: cliente.logradouro,
    numero: cliente.numero,
    complemento: cliente.complemento,
    bairro: cliente.bairro,
    cidade: cliente.cidade,
    estado: cliente.estado
  },
  observacoes: cliente.observacoes,
  status: cliente.status,
  created_at: cliente.created_at,
  updated_at: cliente.updated_at
});

module.exports = {
  VALID_STATUS,
  validateUuid,
  parseClientePayload,
  parseStatusPayload,
  parseListFilters,
  mapClienteResponse
};
