import { useEffect, useState, useCallback } from "react";
import { reportService } from "../../services/report.service";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom"; 
import { 
  RiMapPin2Line, 
  RiRouteLine, 
  RiCheckboxCircleFill, 
  RiPlayCircleLine, 
  RiLoader4Line,
  RiInformationLine,
  RiCompass3Line,
  RiMap2Line
} from "react-icons/ri";

const RutasConductor = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); 
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarRutas = useCallback(async () => {
    if (!user?.email || !user?.token) return;
    
    try {
      setCargando(true);
      const tareas = await reportService.getTasksByEmail(user.email, user.token);
      setReportes(Array.isArray(tareas) ? tareas : []);
    } catch (error) {
      console.error("Error al cargar rutas:", error);
    } finally {
      setCargando(false);
    }
  }, [user?.email, user?.token]);

  useEffect(() => {
    cargarRutas();
  }, [cargarRutas]);

  // Función unificada para navegar al mapa
  const irAlMapa = (reporte) => {
    navigate('/conductor/mapa', { 
      state: { 
        latDestino: parseFloat(reporte.LATITUD), 
        lngDestino: parseFloat(reporte.LONGITUD),
        descripcion: reporte.DESCRIPCION
      } 
    });
  };

  const iniciarRuta = async (reporte) => {
    if (!user?.token) return alert("Sesión inválida");
    
    try {
      const idNum = parseInt(reporte.ID_SOLICITUD, 10);
      // Llama al servicio que actualiza el estado a 'En ruta' en tu base de datos Oracle
      await reportService.updateStatus(idNum, "En ruta", user.token);
      irAlMapa(reporte);
    } catch (error) {
      console.error("Error iniciarRuta:", error);
      alert("Error al iniciar el recorrido");
    }
  };

  const completar = async (id) => {
    if (!user?.token) return;
    if (!window.confirm("¿Confirmas que has finalizado la recolección?")) return;
    
    try {
      const idNum = parseInt(id, 10);
      // Llama al servicio para pasar el estado a 'Completada' y quitarlo de la jornada actual
      await reportService.updateStatus(idNum, "Completada", user.token);
      await cargarRutas(); 
    } catch (error) {
      console.error("Error completar:", error);
      alert("No se pudo finalizar la recolección");
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <RiLoader4Line className="text-5xl text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Sincronizando Hoja de Ruta...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <RiRouteLine size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Mi Jornada</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-tighter">
              Unidad: {user?.email ? user.email.split('@')[0] : 'Cargando...'}
            </p>
          </div>
        </div>
        <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3">
            <RiCompass3Line className="text-indigo-400" size={20} />
            <span className="text-xs font-black uppercase">{reportes.length} Pendientes</span>
        </div>
      </div>

      {/* Listado */}
      {reportes.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
          <RiInformationLine size={60} className="text-gray-100 mx-auto mb-4" />
          <h2 className="text-gray-400 font-bold text-xl">Ruta Despejada</h2>
          <p className="text-gray-400 text-sm mt-1">No tienes solicitudes pendientes asignadas por el administrador.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reportes.map((r) => (
            <div key={r.ID_SOLICITUD} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 flex flex-col md:flex-row justify-between gap-8">
                <div className="space-y-5 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg">#{r.ID_SOLICITUD}</span>
                    <span className="text-[10px] font-black px-3 py-1 rounded-lg uppercase bg-amber-500 text-white">{r.ESTADO}</span>
                  </div>
                  <div className="flex items-start gap-3 bg-gray-50 p-5 rounded-[1.5rem]">
                    <RiMapPin2Line className="text-indigo-500 mt-1" size={22} />
                    <div>
                      {/* r.DIRECCION renderizará la dirección del ciudadano si existe, de lo contrario usará el respaldo */}
                      <p className="text-gray-800 font-black text-lg">{r.DIRECCION || "Ubicación por coordenadas GPS"}</p>
                      <p className="text-xs text-gray-400 font-medium mt-1">Reporte: {r.DESCRIPCION}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-3">
                  {r.ESTADO !== "En ruta" ? (
                    <button onClick={() => iniciarRuta(r)} className="flex items-center justify-center gap-3 bg-indigo-600 text-white font-black px-10 py-5 rounded-[1.5rem] transition-all hover:bg-indigo-700 active:scale-95 shadow-md">
                      <RiPlayCircleLine size={24} /> Iniciar Ruta
                    </button>
                  ) : (
                    <>
                      <button onClick={() => irAlMapa(r)} className="flex items-center justify-center gap-3 border-2 border-indigo-600 text-indigo-600 font-black px-10 py-4 rounded-[1.5rem] transition-all hover:bg-indigo-50 active:scale-95">
                        <RiMap2Line size={24} /> Ver Mapa
                      </button>
                      <button onClick={() => completar(r.ID_SOLICITUD)} className="flex items-center justify-center gap-3 bg-emerald-500 text-white font-black px-10 py-5 rounded-[1.5rem] transition-all hover:bg-emerald-600 active:scale-95 shadow-md">
                        <RiCheckboxCircleFill size={24} /> Finalizar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RutasConductor;