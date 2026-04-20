import api from "./api";

const dashboardService = {
  getResumo: async () => {
    const response = await api.get("/dashboard/resumo");
    return response.data;
  },

  getFinanceiro: async () => {
    const response = await api.get("/dashboard/financeiro");
    return response.data;
  },

  getEstoque: async () => {
    const response = await api.get("/dashboard/estoque");
    return response.data;
  },

  getAlertas: async () => {
    const response = await api.get("/dashboard/alertas");
    return response.data;
  },

  getSeriesVendas: async (params = {}) => {
    const response = await api.get("/dashboard/series/vendas", { params });
    return response.data;
  },

  getVendas: async () => {
    const response = await api.get("/dashboard/vendas");
    return response.data;
  },

  getVendasFuturas: async () => {
    const response = await api.get("/dashboard/vendas-futuras");
    return response.data;
  },

  getCompleto: async () => {
    const response = await api.get("/dashboard/completo");
    return response.data;
  },
};

export default dashboardService;
