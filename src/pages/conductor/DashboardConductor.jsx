import { useEffect, useState, useCallback } from "react";
import { reportService } from "../../services/report.service";
import { useAuth } from "../../context/AuthContext";
import { 
  RiTruckLine, 
  RiMapPinRangeLine, 
  RiCheckboxCircleLine, 
  RiSteering2Line,
  RiPinDistanceLine,
  RiInformationLine,
  RiArrowRightSLine,
  RiHistoryLine
} from "react-icons/ri";

const DashboardConductor = () => {
  const { user } = useAuth();
  const [rutaActiva, setRutaActiva] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarReportes = useCallback(async () => {
    if (!user?.email || !user?.token) return;
    try {
      setLoading(true);
      // Petición limpia usando el servicio unificado
      const tareas = await reportService.getTasksByEmail(user.email, user.token);
      setReportes(Array.isArray(tareas) ? tareas : []);
      
      const hayRutaEnCurso = tareas.some(t => t.ESTADO === 'En ruta');
      if (hayRutaEnCurso) {
        setRutaActiva(true);
        if (progreso === 0) setProgreso(30); 
      }
    } catch (error) {
      console.error("Error al cargar tareas en Dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.token, progreso]);

  useEffect(() => {
    cargarReportes();
  }, [cargarReportes]);

  const iniciarRuta = async () => {
    if (!window.confirm("¿Deseas iniciar la ruta de recolección?")) return;
    try {
      for (const r of reportes) {
        await reportService.updateStatus(r.ID_SOLICITUD, 'En ruta', user.token);
      }
      setRutaActiva(true);
      setProgreso(15);
      await cargarReportes();
    } catch (error) {
      alert("Error al iniciar ruta. Revisa la conexión con Oracle.");
    }
  };

  const avanzar = () => setProgreso((prev) => Math.min(prev + 25, 100));

  const finalizarRuta = async () => {
    if (!window.confirm("¿Confirmas que has terminado todos los puntos?")) return;
    try {
      for (const r of reportes) {
        await reportService.updateStatus(r.ID_SOLICITUD, 'Completada', user.token);
      }
      setRutaActiva(false);
      setProgreso(0);
      alert("¡Misión cumplida! Datos sincronizados correctamente.");
      await cargarReportes();
    } catch (error) {
      console.error("Error al finalizar:", error);
      alert("Hubo un problema al cerrar la ruta en el servidor.");
    }
  };

  if (loading && reportes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-blue-600">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <span className="font-black uppercase tracking-widest text-xs">Obteniendo Hoja de Ruta...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <RiSteering2Line size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800">Panel de Ruta</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Operador: {user?.nombre || 'S/N'}</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Servidor Oracle</p>
          <span className="text-emerald-500 font-bold text-sm flex items-center justify-end gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> Online
          </span>
        </div>
      </header>

      {/* Control de Progreso */}
      <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <RiPinDistanceLine className="text-blue-600" /> Progreso del Recorrido
            </p>
            <p className="text-xs text-gray-400">Estado actual de la ruta asignada</p>
          </div>
          <p className="text-2xl font-black text-blue-600">{progreso}%</p>
        </div>

        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden border border-gray-50">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out shadow-inner"
            style={{ width: `${progreso}%` }}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          {!rutaActiva && reportes.length > 0 ? (
            <button 
              onClick={iniciarRuta} 
              className="group flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
            >
              <RiTruckLine className="text-xl group-hover:animate-bounce" /> Iniciar Recolección
            </button>
          ) : rutaActiva && progreso < 100 ? (
            <button 
              onClick={avanzar} 
              className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              <RiMapPinRangeLine className="text-xl" /> Registrar punto visitado
            </button>
          ) : rutaActiva && progreso === 100 ? (
            <button 
              onClick={finalizarRuta} 
              className="flex items-center gap-3 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 animate-pulse"
            >
              <RiCheckboxCircleLine className="text-xl" /> Confirmar Entrega Total
            </button>
          ) : null}
        </div>
      </section>

      {/* Lista de Puntos Asignados */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <RiHistoryLine className="text-blue-500" /> Hoja de Ruta Actual
          </h2>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-lg">
            {reportes.length} PUNTOS ASIGNADOS
          </span>
        </div>

        <div className="divide-y divide-gray-50">
          {reportes.length === 0 ? (
            <div className="p-12 text-center">
              <RiInformationLine size={40} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 font-medium italic">No tienes tareas pendientes asignadas hoy.</p>
            </div>
          ) : (
            reportes.map((r) => (
              <div key={r.ID_SOLICITUD} className="p-5 flex items-start justify-between hover:bg-gray-50/50 transition-colors group">
                <div className="flex gap-4">
                  <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    r.ESTADO === 'En ruta' ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-500'
                  }`}>
                    <RiMapPinRangeLine size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-gray-800 truncate text-sm">
                      Reporte #{r.ID_SOLICITUD}
                    </p>
                    <p className="text-xs text-blue-600 font-bold mt-0.5 flex items-center gap-1">
                      {r.DIRECCION || "Consultar en mapa"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-1 italic">
                      {r.DESCRIPCION || 'Sin observaciones'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter border ${
                    r.ESTADO === 'En ruta' 
                    ? 'bg-amber-50 text-amber-600 border-amber-100' 
                    : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {r.ESTADO}
                  </span>
                  <RiArrowRightSLine className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardConductor;