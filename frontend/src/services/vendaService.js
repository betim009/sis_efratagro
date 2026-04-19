import api from "./api";

const BASE = "/vendas";

const vendaService = {
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

  cancelar: async (id, motivo) => {
    const response = await api.patch(`${BASE}/${id}/cancelar`, { motivo });
    return response.data;
  },

  getItens: async (id) => {
    const response = await api.get(`${BASE}/${id}/itens`);
    return response.data;
  },
};

export default vendaService;
