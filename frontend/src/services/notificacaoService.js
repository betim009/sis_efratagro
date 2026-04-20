import api from "./api";

const notificacaoService = {
  listar: async (params = {}) => {
    const response = await api.get("/notificacoes", { params });
    return response.data;
  },

  contarNaoLidas: async () => {
    const response = await api.get("/notificacoes/nao-lidas/contagem");
    return response.data;
  },

  marcarComoLida: async (id) => {
    const response = await api.patch(`/notificacoes/${id}/marcar-lida`);
    return response.data;
  },

  marcarTodasComoLidas: async () => {
    const response = await api.patch("/notificacoes/marcar-todas-lidas");
    return response.data;
  },

  arquivar: async (id) => {
    const response = await api.patch(`/notificacoes/${id}/arquivar`);
    return response.data;
  },
};

export default notificacaoService;
