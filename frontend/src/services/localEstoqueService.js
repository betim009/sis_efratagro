import api from "./api";

const BASE = "/estoque/locais";

const normalizeCode = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase()
    .slice(0, 30);

const buildPayload = (local) => ({
  nome: local.nome,
  codigo: local.codigo || normalizeCode(local.nome),
  descricao: local.descricao || null,
  tipo_local: local.tipo_local || "DEPOSITO",
  endereco_referencia: local.endereco_referencia || null,
  status: local.status || "ATIVO",
});

const localEstoqueService = {
  listar: async (params = {}) => {
    const response = await api.get(BASE, { params });
    return response.data;
  },

  criar: async (local) => {
    const response = await api.post(BASE, buildPayload(local));
    return response.data;
  },

  atualizar: async (id, local) => {
    const response = await api.put(`${BASE}/${id}`, buildPayload(local));
    return response.data;
  },

  inativar: async (id) => {
    const response = await api.patch(`${BASE}/${id}/inativar`);
    return response.data;
  },
};

export default localEstoqueService;
