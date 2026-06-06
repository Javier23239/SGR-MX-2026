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
      // Unificado a query params si tu backend migró la arquitectura general
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
  // --- RECOLECTOR / CONDUCTOR ---
  // ==========================================

  getTasksByEmail: async (email, token) => {
    try {
      // CORRECCIÓN EJECUTADA: Envía Query Params (?email=...) a la ruta limpia de conductores
      const res = await axios.get(`${API_URL}/conductor/reportes`, {
        params: { email },
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (error) {
      console.error("Error en getTasksByEmail:", error);
      throw error;
    }
  },

  getHistoryByEmail: async (email, token) => {
    try {
      // CORRECCIÓN DE SEGURIDAD: Cambiado /recolector/historial/ a la nueva API estructurada del conductor
      const res = await axios.get(`${API_URL}/conductor/historial`, {
        params: { email },
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (error) {
      console.error("Error en getHistoryByEmail:", error);
      throw error;
    }
  },

  updateStatus: async (id_solicitud, estado, token) => {
    try {
      // CORRECCIÓN EJECUTADA: Mapeo exacto del body parseado a enteros para compatibilidad con Oracle DB
      const res = await axios.put(`${API_URL}/conductor/actualizar-estado`, 
        {
          id_solicitud: parseInt(id_solicitud, 10),
          estado: estado
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return res.data;
    } catch (error) {
      console.error("Error en updateStatus:", error);
      throw error;
    }
  },

  // ==========================================
  // --- ADMINISTRADOR ---
  // ==========================================

  getAllAdmin: async (token) => {
    try {
      const res = await axios.get(`${API_URL}/admin/reportes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      console.error("Error en getAllAdmin:", error);
      throw error;
    }
  },

  assignReport: async (id_solicitud, id_recolector, token) => {
    try {
      // CORRECCIÓN EJECUTADA: Casteo explícito a base 10 para evitar rechazos en las transacciones del Admin
      const res = await axios.put(`${API_URL}/admin/asignar-reporte`, 
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
      console.error("Error en assignReport:", error);
      throw error;
    }
  }
};