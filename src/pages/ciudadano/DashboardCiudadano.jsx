import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; 
import { reportService } from "../../services/report.service"; 
import ChatBot from "../../components/chatbot/ChatBot";
import { 
  RiAddLine, 
  RiHistoryLine, 
  RiDashboard3Line, 
  RiCheckboxCircleLine, 
  RiTimeLine, 
  RiTruckLine,
  RiArrowRightSLine,
  RiDatabaseLine
} from "react-icons/ri";

const DashboardCiudadano = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const obtenerReportes = async () => {
      try {
        setLoading(true);
        if (user?.email && user?.token) {
          const data = await reportService.getByEmail(user.email, user.token);
          setReportes(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error al obtener reportes:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerReportes();
  }, [user]);

  const total = reportes.length;
  const pendientes = reportes.filter(r => (r.ESTADO || r.estado) === "Pendiente").length;
  const enProceso = reportes.filter(r => ["Asignado", "En ruta"].includes(r.ESTADO || r.estado)).length;
  const completados = reportes.filter(r => ["Recolectado", "Completada", "Completado"].includes(r.ESTADO || r.estado)).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-emerald-600">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
        <span className="font-black uppercase tracking-widest text-xs">Sincronizando con Oracle...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
            <RiDashboard3Line className="text-emerald-600" /> Hola, {user?.nombre || 'Ciudadano'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Este es el resumen de tu impacto ambiental en la ciudad.</p>
        </div>
        <Link
          to="/ciudadano/reportes/nuevo"
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 group"
        >
          <RiAddLine className="text-xl group-hover:rotate-90 transition-transform" />
          Nuevo reporte
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Solicitudes" value={total} icon={<RiHistoryLine/>} color="text-gray-600" bg="bg-gray-50" />
        <MetricCard title="Pendientes" value={pendientes} icon={<RiTimeLine/>} color="text-amber-600" bg="bg-amber-50" />
        <MetricCard title="En proceso" value={enProceso} icon={<RiTruckLine/>} color="text-blue-600" bg="bg-blue-50" />
        <MetricCard title="Completados" value={completados} icon={<RiCheckboxCircleLine/>} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      {/* Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lista de Actividad */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-gray-800 text-xl flex items-center gap-2">
              Actividad Reciente
            </h2>
            <Link to="/ciudadano/reportes" className="text-emerald-600 text-xs font-bold hover:underline flex items-center gap-1 uppercase tracking-wider">
              Ver todo <RiArrowRightSLine />
            </Link>
          </div>

          {reportes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-medium italic">No se han encontrado registros en Oracle.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportes.slice(0, 4).map((r) => (
                <div 
                  key={r.ID_SOLICITUD || r.id} 
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-emerald-50/50 rounded-2xl transition-all border border-transparent hover:border-emerald-100 gap-4"
                >
                  <div className="flex-1 min-w-0"> 
                    <p className="font-bold text-gray-800 group-hover:text-emerald-700 transition-colors truncate text-sm md:text-base">
                      {(r.DESCRIPCION || r.descripcion || "Sin descripción").split('|')[0]}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
                      <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        ID: #{r.ID_SOLICITUD || r.id}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium whitespace-nowrap">
                        <RiTimeLine /> {new Date(r.FECHA_SOLICITUD || r.fecha_solicitud).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-start sm:justify-end">
                    <EstadoBadge estado={r.ESTADO || r.estado} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status  */}
        <div className="bg-emerald-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="bg-emerald-800 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <RiDatabaseLine className="text-2xl text-emerald-400" />
            </div>
            <h3 className="font-black text-xl mb-2 tracking-tight">Estado del Sistema</h3>
            <p className="text-emerald-200 text-sm leading-relaxed mb-6">
              Tu conexión con la base de datos Oracle está activa. Los reportes se sincronizan en tiempo real.
            </p>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold border-b border-emerald-800 pb-2 text-emerald-300">
                <span>DATABASE</span>
                <span className="text-white">ORACLE XEPDB1</span>
              </div>
              <div className="flex justify-between text-xs font-bold border-b border-emerald-800 pb-2 text-emerald-300">
                <span>SESIÓN</span>
                <span className="text-emerald-400 flex items-center gap-1">● ACTIVA</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 -mb-10 -mr-10 w-40 h-40 bg-emerald-800 rounded-full opacity-30"></div>
        </div>

      </div>
      <ChatBot />
    </div>
  );
};

const MetricCard = ({ title, value, icon, color, bg }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:scale-[1.02] transition-transform duration-300">
    <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center mb-4 text-xl`}>
      {icon}
    </div>
    <p className="text-xs uppercase tracking-widest text-gray-400 font-black">{title}</p>
    <p className="text-4xl font-black text-gray-800 mt-1 tracking-tighter">{value}</p>
  </div>
);

const EstadoBadge = ({ estado }) => {
  const styles = {
    Pendiente: "bg-amber-50 text-amber-600 border-amber-100",
    Asignado: "bg-blue-50 text-blue-600 border-blue-100",
    "En ruta": "bg-purple-50 text-purple-600 border-purple-100",
    Recolectado: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Completada: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Completado: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border ${styles[estado] || "bg-gray-50 text-gray-400 border-gray-100"}`}>
      {estado || "S/N"}
    </span>
  );
};

export default DashboardCiudadano;