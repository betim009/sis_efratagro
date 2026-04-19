const TOKEN_KEY = "efrat_token";
const USER_KEY = "efrat_user";

const tokenStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),

  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),

  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),

  removeUser: () => localStorage.removeItem(USER_KEY),

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  hasToken: () => !!localStorage.getItem(TOKEN_KEY),
};

export default tokenStorage;
