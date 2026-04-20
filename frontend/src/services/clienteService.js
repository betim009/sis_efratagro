import api from "./api";

const BASE = "/clientes";

const clienteService = {
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

  alterarStatus: async (id, status) => {
    const response = await api.patch(`${BASE}/${id}/status`, { status });
    return response.data;
  },

  inativar: async (id) => {
    const response = await api.patch(`${BASE}/${id}/inativar`);
    return response.data;
  },

  getHistoricoCompras: async (id) => {
    const response = await api.get(`${BASE}/${id}/historico-compras`);
    return response.data;
  },

  getDebitosEmAberto: async (id) => {
    const response = await api.get(`${BASE}/${id}/debitos-em-aberto`);
    return response.data;
  },
};

export default clienteService;
