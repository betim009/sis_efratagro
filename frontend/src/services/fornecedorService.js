import api from "./api";

const BASE = "/fornecedores";
const STATUS_ROUTE_AVAILABLE = false;

const fornecedorService = {
  listar: async (params = {}) => {
    const response = await api.get(BASE, { params });
    return response.data;
  },

  buscarPorId: async (id) => {
    const response = await api.get(`${BASE}/${id}`);
    return response.data;
  },

  criar: async (payload) => {
    const response = await api.post(BASE, payload);
    return response.data;
  },

  atualizar: async (id, payload) => {
    const response = await api.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  inativar: async (id) => {
    const response = await api.patch(`${BASE}/${id}/inativar`);
    return response.data;
  },

  atualizarStatus: async (id, status) => {
    if (!STATUS_ROUTE_AVAILABLE) {
      throw new Error("A API atual ainda nao possui endpoint de alteracao ampla de status.");
    }

    const response = await api.patch(`${BASE}/${id}/status`, { status });
    return response.data;
  },

  listarProdutos: async (id) => {
    const response = await api.get(`${BASE}/${id}/produtos`);
    return response.data;
  },

  buscarHistoricoCompras: async (id) => {
    const response = await api.get(`${BASE}/${id}/historico-compras`);
    return response.data;
  },

  supportsStatusRoute: () => STATUS_ROUTE_AVAILABLE,
};

export default fornecedorService;
