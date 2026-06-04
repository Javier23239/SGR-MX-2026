import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  RiHistoryLine, 
  RiMapPin2Line, 
  RiTimeLine, 
  RiFileList3Line,
  RiCheckboxCircleLine,
  RiLoader3Line
} from "react-icons/ri";
import ChatBot from "../../components/chatbot/ChatBot";

const ReportesCiudadano = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchHistorial = useCallback(async () => {
    if (!user?.email || !user?.token) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/solicitudes/${user.email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        }
      });

      if (!response.ok) {
        throw new Error(`Error servidor: ${response.status}`);
      }

      const data = await response.json();
      setReportes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar el historial:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.token]);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-emerald-600">
        <RiLoader3Line className="text-5xl animate-spin mb-4" />
        <span className="font-black uppercase tracking-widest text-xs">Sincronizando con la nube...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
            <RiHistoryLine className="text-emerald-600" /> Mis Reportes
          </h2>
          <p className="text-gray-500 text-sm mt-1">Seguimiento en tiempo real de tus solicitudes.</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-6 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2 shadow-sm">
          <RiFileList3Line />
          <span className="font-black text-sm">Total: {reportes.length}</span>
        </div>
      </div>

      {reportes.length === 0 ? (
        <div className="bg-white p-16 rounded-[2.5rem] shadow-sm text-center border-2 border-dashed border-gray-100">
          <RiFileList3Line className="text-6xl text-gray-200 mx-auto mb-4" />
          <h3 className="text-gray-400 font-bold text-lg">Aún no has realizado reportes</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportes.map((r) => {
            const id = r.ID_SOLICITUD || r.id;
            const estado = r.ESTADO || r.estado;
            const fecha = r.FECHA_SOLICITUD || r.fecha_solicitud;
            const descripcion = r.DESCRIPCION || r.descripcion || "Sin descripción";
            const ubicacion = r.DIRECCION || "Ubicación registrada en GPS";

            return (
              <div
                key={id}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col"
              >
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black bg-gray-900 text-white px-3 py-1 rounded-lg">
                      TICKET #{id}
                    </span>
                    <EstadoBadge estado={estado} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <RiMapPin2Line className="text-emerald-600" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Punto de Recolección</span>
                        <p className="text-sm text-gray-600 font-medium leading-tight">
                          {descripcion.includes('|') ? descripcion.split('|')[1].trim() : ubicacion}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <RiTimeLine className="text-blue-600" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Creado el</span>
                        <p className="text-sm text-gray-600 font-medium">
                          {fecha ? new Date(fecha).toLocaleString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '---'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 px-8 py-4 border-t border-gray-100 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${estado === 'Completada' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-[10px] text-gray-400 font-black uppercase">Sistema SGR-MX</span>
                   </div>
                   {(estado === 'Completada' || estado === 'Recolectado') && (
                     <RiCheckboxCircleLine className="text-emerald-500 text-2xl" />
                   )}
                </div>
              </div>
            );
          })}
          <ChatBot />
        </div>
      )}
    </div>
  );
};

const EstadoBadge = ({ estado }) => {
  const styles = {
    Pendiente: "bg-yellow-50 text-yellow-600 border-yellow-100",
    Asignado: "bg-blue-50 text-blue-600 border-blue-100",
    "En ruta": "bg-purple-50 text-purple-600 border-purple-100",
    Completada: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Recolectado: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border shadow-inner ${styles[estado] || "bg-gray-50 text-gray-400"}`}>
      {estado || "Procesando"}
    </span>
  );
};

export default ReportesCiudadano;