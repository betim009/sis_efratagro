const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUS = ["ATIVO", "INATIVO"];
const VALID_TIPO_PESSOA = ["PF", "PJ"];

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const sanitizeString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const sanitized = String(value).trim();
  return sanitized.length ? sanitized : null;
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
    throw new AppError("CNPJ/CPF obrigatorio", 400);
  }

  const isValid =
    (digits.length === 11 && validateCpf(digits)) ||
    (digits.length === 14 && validateCnpj(digits));

  if (!isValid) {
    throw new AppError("CNPJ/CPF invalido", 400);
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

const parseFornecedorPayload = (payload, { partial = false } = {}) => {
  const razaoSocial = sanitizeString(payload.razao_social);
  const nomeFantasia = sanitizeString(payload.nome_fantasia);
  const cnpjCpf = payload.cnpj_cpf !== undefined ? validateDocument(payload.cnpj_cpf) : null;
  const email = sanitizeString(payload.email);
  const contatoResponsavel = sanitizeString(payload.contato_responsavel);
  const tipoPessoa = sanitizeString(payload.tipo_pessoa) || null;
  const status = sanitizeString(payload.status) || null;
  const endereco = normalizeEndereco(payload.endereco || {});

  if (!partial || payload.razao_social !== undefined) {
    if (!razaoSocial) {
      throw new AppError("Razao social obrigatoria", 400);
    }
  }

  if (!partial || payload.cnpj_cpf !== undefined) {
    if (!cnpjCpf) {
      throw new AppError("CNPJ/CPF obrigatorio", 400);
    }
  }

  validateEmail(email);

  const resolvedTipoPessoa =
    tipoPessoa || (cnpjCpf && cnpjCpf.length === 11 ? "PF" : "PJ");

  if (resolvedTipoPessoa && !VALID_TIPO_PESSOA.includes(resolvedTipoPessoa)) {
    throw new AppError("Tipo de pessoa invalido", 400);
  }

  if (status && !VALID_STATUS.includes(status)) {
    throw new AppError("Status invalido para fornecedor", 400);
  }

  return {
    tipoPessoa: resolvedTipoPessoa,
    razaoSocial,
    nomeFantasia,
    cnpjCpf,
    inscricaoEstadual: sanitizeString(payload.inscricao_estadual),
    email,
    telefone: sanitizeString(payload.telefone),
    contatoResponsavel,
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

const parseListFilters = (query) => {
  const status = sanitizeString(query.status);
  const search = sanitizeString(query.search);
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);

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
    offset: (page - 1) * limit
  };
};

const mapFornecedorResponse = (fornecedor) => ({
  id: fornecedor.id,
  tipo_pessoa: fornecedor.tipo_pessoa,
  razao_social: fornecedor.razao_social,
  nome_fantasia: fornecedor.nome_fantasia,
  cnpj_cpf: fornecedor.cpf_cnpj,
  inscricao_estadual: fornecedor.inscricao_estadual,
  email: fornecedor.email,
  telefone: fornecedor.telefone,
  contato_responsavel: fornecedor.contato_responsavel,
  endereco: {
    cep: fornecedor.cep,
    logradouro: fornecedor.logradouro,
    numero: fornecedor.numero,
    complemento: fornecedor.complemento,
    bairro: fornecedor.bairro,
    cidade: fornecedor.cidade,
    estado: fornecedor.estado
  },
  observacoes: fornecedor.observacoes,
  status: fornecedor.status,
  created_at: fornecedor.created_at,
  updated_at: fornecedor.updated_at
});

module.exports = {
  validateUuid,
  parseFornecedorPayload,
  parseListFilters,
  mapFornecedorResponse
};
