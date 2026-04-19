import api from "./api";

const BASE = "/financeiro";

const financeiroService = {
  listarDuplicatas: async (params = {}) => {
    const response = await api.get(`${BASE}/duplicatas`, { params });
    return response.data;
  },

  buscarDuplicata: async (id) => {
    const response = await api.get(`${BASE}/duplicatas/${id}`);
    return response.data;
  },

  listarPorStatus: async (status, params = {}) => {
    const response = await api.get(`${BASE}/duplicatas/status/${status}`, { params });
    return response.data;
  },

  listarPorCliente: async (clienteId, params = {}) => {
    const response = await api.get(`${BASE}/duplicatas/cliente/${clienteId}`, { params });
    return response.data;
  },

  gerarDuplicata: async (data) => {
    const response = await api.post(`${BASE}/duplicatas/gerar`, data);
    return response.data;
  },

  gerarParcelas: async (data) => {
    const response = await api.post(`${BASE}/duplicatas/gerar-parcelas`, data);
    return response.data;
  },

  registrarPagamento: async (duplicataId, data) => {
    const response = await api.post(`${BASE}/duplicatas/${duplicataId}/pagamentos`, data);
    return response.data;
  },

  listarPagamentos: async (duplicataId) => {
    const response = await api.get(`${BASE}/duplicatas/${duplicataId}/pagamentos`);
    return response.data;
  },

  getAlertasVencidas: async () => {
    const response = await api.get(`${BASE}/duplicatas/alertas/vencidas`);
    return response.data;
  },

  getAlertasVencendo: async () => {
    const response = await api.get(`${BASE}/duplicatas/alertas/vencendo`);
    return response.data;
  },

  getResumo: async () => {
    const response = await api.get(`${BASE}/resumo`);
    return response.data;
  },
};

export default financeiroService;
