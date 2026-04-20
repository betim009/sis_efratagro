import api from "./api";

const authService = {
  /**
   * POST /auth/login
   * Retorna: { status, message, data: { token, tokenType, expiresIn, user } }
   */
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  /**
   * POST /auth/logout (autenticado)
   */
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  /**
   * GET /auth/me (autenticado)
   * Retorna: { status, data: { id, name, email, phone, status, profile, session, permissions } }
   */
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  /**
   * POST /auth/password-reset/request
   */
  requestPasswordReset: async (email) => {
    const response = await api.post("/auth/password-reset/request", { email });
    return response.data;
  },

  /**
   * POST /auth/password-reset/confirm
   */
  confirmPasswordReset: async (token, newPassword) => {
    const response = await api.post("/auth/password-reset/confirm", {
      token,
      newPassword,
    });
    return response.data;
  },
};

export default authService;
