import api from "./api";

const BASE = "/produtos";

const produtoService = {
  listar: async (params = {}) => {
    const response = await api.get(BASE, { params });
    return response.data;
  },

  buscarPorId: async (id) => {
    const response = await api.get(`${BASE}/${id}`);
    return response.data;
  },

  criar: async (data) => {
    const response = await api.post(BASE, data);
    return response.data;
  },

  atualizar: async (id, data) => {
    const response = await api.put(`${BASE}/${id}`, data);
    return response.data;
  },

  inativar: async (id) => {
    const response = await api.patch(`${BASE}/${id}/inativar`);
    return response.data;
  },

  listarPorStatus: async (status, params = {}) => {
    const response = await api.get(`${BASE}/status/${status}`, { params });
    return response.data;
  },

  listarPorCategoria: async (categoria, params = {}) => {
    const response = await api.get(`${BASE}/categoria/${categoria}`, { params });
    return response.data;
  },

  getSaldoEstoque: async (id) => {
    const response = await api.get(`${BASE}/${id}/saldo-estoque`);
    return response.data;
  },

  getAlertasEstoqueMinimo: async () => {
    const response = await api.get(`${BASE}/alertas/estoque-minimo`);
    return response.data;
  },
};

export default produtoService;
