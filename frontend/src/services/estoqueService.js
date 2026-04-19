import api from "./api";

const BASE = "/estoque";

const estoqueService = {
  listarSaldos: async (params = {}) => {
    const response = await api.get(`${BASE}/saldos`, { params });
    return response.data;
  },

  listarMovimentacoes: async (params = {}) => {
    const response = await api.get(`${BASE}/movimentacoes`, { params });
    return response.data;
  },

  registrarEntrada: async (data) => {
    const response = await api.post(`${BASE}/movimentacoes/entrada`, data);
    return response.data;
  },

  registrarSaida: async (data) => {
    const response = await api.post(`${BASE}/movimentacoes/saida`, data);
    return response.data;
  },

  registrarTransferencia: async (data) => {
    const response = await api.post(`${BASE}/movimentacoes/transferencia`, data);
    return response.data;
  },

  listarLocais: async () => {
    const response = await api.get(`${BASE}/locais`);
    return response.data;
  },

  getAlertasBaixoEstoque: async () => {
    const response = await api.get(`${BASE}/alertas/baixo-estoque`);
    return response.data;
  },
};

export default estoqueService;
