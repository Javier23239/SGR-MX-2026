import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const reportService = {

  // ==========================================
  // --- CIUDADANO ---
  // ==========================================

  create: async (reportData, token) => {
    try {
      const res = await axios.post(`${API_URL}/solicitudes`, reportData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (error) {
      console.error("Error al crear reporte:", error);
      throw error;
    }
  },

  getByEmail: async (email, token) => {
    try {
      // Fíjate bien que termine en /${email} y NO tenga la propiedad "params: { email }"
      const res = await axios.get(`${API_URL}/solicitudes/${email}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (error) {
      console.error("Error al obtener reportes del ciudadano:", error);
      throw error;
    }
  },
  // ==========================================
  // --- CONDUCTOR / RECOLECTOR ---
  // ==========================================

  getTasksByEmail: async (email, token) => {
    try {
      const res = await axios.get(`${API_URL}/conductor/reportes`, {
        params: { email },
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (error) {
      console.error("Error al obtener tareas del conductor:", error);
      throw error;
    }
  },

  getHistoryByEmail: async (email, token) => {
    try {
      const res = await axios.get(`${API_URL}/conductor/historial`, {
        params: { email },
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (error) {
      console.error("Error al obtener historial del conductor:", error);
      throw error;
    }
  },

  updateStatus: async (id_solicitud, estado, token) => {
    try {
      const res = await axios.put(
        `${API_URL}/conductor/actualizar-estado`,
        {
          id_solicitud: parseInt(id_solicitud, 10),
          estado
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return res.data;
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      throw error;
    }
  },

  // ==========================================
  // --- ADMINISTRADOR ---
  // ==========================================

  getAll: async (token) => {
    try {
      const res = await axios.get(`${API_URL}/admin/reportes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      console.error("Error en getAll:", error);
      return [];
    }
  },

  getAllAdmin: async (token) => {
    try {
      const res = await axios.get(`${API_URL}/admin/reportes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (error) {
      console.error("Error al obtener reportes admin:", error);
      return [];
    }
  },

  assignReport: async (id_solicitud, id_recolector, token) => {
    try {
      const res = await axios.put(
        `${API_URL}/admin/asignar-reporte`,
        {
          id_solicitud: parseInt(id_solicitud, 10),
          id_recolector: parseInt(id_recolector, 10)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return res.data;
    } catch (error) {
      console.error("Error al asignar reporte:", error);
      throw error;
    }
  }
};