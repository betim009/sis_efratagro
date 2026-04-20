import api from "./api";

const createCrudService = (basePath) => ({
  listar: async (params = {}) => {
    const response = await api.get(basePath, { params });
    return response.data;
  },

  buscarPorId: async (id) => {
    const response = await api.get(`${basePath}/${id}`);
    return response.data;
  },

  criar: async (data) => {
    const response = await api.post(basePath, data);
    return response.data;
  },

  atualizar: async (id, data) => {
    const response = await api.put(`${basePath}/${id}`, data);
    return response.data;
  },

  excluir: async (id) => {
    const response = await api.delete(`${basePath}/${id}`);
    return response.data;
  },
});

export const clienteService = createCrudService("/clientes");
export const fornecedorService = createCrudService("/fornecedores");
export const produtoService = createCrudService("/produtos");
export const freteService = createCrudService("/fretes");

export default createCrudService;
