import axios from "axios";
import tokenStorage from "../utils/tokenStorage";

// ---------------------------------------------------------------------------
// Evento customizado para sinalizar sessão expirada.
// O AuthContext escuta esse evento e faz o redirect via React Router,
// evitando window.location.href que causa reload completo.
// ---------------------------------------------------------------------------
const SESSION_EXPIRED_EVENT = "auth:session-expired";

export function onSessionExpired(callback) {
  window.addEventListener(SESSION_EXPIRED_EVENT, callback);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, callback);
}

function emitSessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

// ---------------------------------------------------------------------------
// Instância Axios
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Interceptor de REQUEST — injeta token automaticamente
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Interceptor de RESPONSE — trata 401 e 403
// ---------------------------------------------------------------------------
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Erro de rede / timeout
      return Promise.reject(error);
    }

    const { status, config } = error.response;

    // 401 — Token inválido ou sessão expirada
    // Ignora 401 na própria rota de login para não causar loop
    if (status === 401 && !config.url?.includes("/auth/login")) {
      tokenStorage.clear();

      if (!isRedirecting) {
        isRedirecting = true;
        emitSessionExpired();
        // Reseta o flag após breve intervalo para permitir futuras detecções
        setTimeout(() => {
          isRedirecting = false;
        }, 2000);
      }
    }

    // 403 — Sem permissão (não limpa a sessão, apenas rejeita)
    // A página deve tratar e mostrar mensagem apropriada

    return Promise.reject(error);
  }
);

export default api;
