import { useEffect, useState, useCallback } from "react";
import { reportService } from "../../api/reportes.api"; 
import { useAuth } from "../../context/AuthContext"; 
import { 
  RiFileList3Line, 
  RiSearchLine, 
  RiUserReceived2Line, 
  RiTruckLine, 
  RiCheckboxCircleLine, 
  RiDatabase2Line,
} from "react-icons/ri";

const GestionReportes = () => {
  const { user } = useAuth(); 
  const [reportes, setReportes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    if (!user?.token) return; 

    try {
      setLoading(true);
      
      const dataRep = await reportService.getAllAdmin(user.token);
      setReportes(Array.isArray(dataRep) ? dataRep : []);

      const resUser = await fetch("http://localhost:5000/usuarios", {
        headers: {
          "Authorization": `Bearer ${user.token}` 
        }
      });
      const dataUser = await resUser.json();
      
      if (Array.isArray(dataUser)) {
        const soloConductores = dataUser.filter(u => 
          (u.ROL === "RECOLECTOR")
        );
        setConductores(soloConductores);
      }
    } catch (error) {
      console.error("Error al cargar datos en Gestión:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const manejarAsignacion = async (idSolicitud, idRecolector) => {
    if (!idRecolector || !user?.token) return;

    try {
      // CORRECCIÓN CRÍTICA: Convertimos el string del select a un número entero 
      // para que Oracle lo inserte sin problemas de incompatibilidad de tipos.
      const idRecolectorNum = parseInt(idRecolector, 10);
      const idSolicitudNum = parseInt(idSolicitud, 10);

      await reportService.assignReport(idSolicitudNum, idRecolectorNum, user.token);
      
      alert("🎉 Conductor asignado con Éxito en Oracle");
      await cargarDatos(); 
    } catch (error) {
      console.error("Error al asignar:", error);
      alert("Error: No se pudo actualizar en la base de datos.");
    }
  };

  const reportesFiltrados = reportes.filter((r) => {
    const desc = (r.DESCRIPCION || "").toLowerCase();
    const ciudad = (r.CIUDADANO || "").toLowerCase();
    const search = busqueda.toLowerCase();
    return desc.includes(search) || ciudad.includes(search);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <RiDatabase2Line className="text-5xl text-emerald-500 animate-pulse mb-4" />
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Sincronizando con Oracle Cloud...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
            <RiFileList3Line className="text-emerald-600" /> Panel de Control
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestión de rutas y asignación de personal recolector.</p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500" />
          <input
            type="text"
            placeholder="Filtrar por reporte o ciudadano..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-emerald-500 border-2 rounded-2xl outline-none transition-all font-medium text-gray-700"
          />
        </div>
      </div>

      {/* Reportes */}
      <div className="grid grid-cols-1 gap-4">
        {reportesFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
             <p className="text-gray-400 font-bold italic">No se encontraron registros en la base de datos.</p>
          </div>
        ) : (
          reportesFiltrados.map((r) => {
            const id = r.ID_SOLICITUD;
            const desc = r.DESCRIPCION;
            const ciudad = r.CIUDADANO;
            const estado = r.ESTADO;
            const conductorActual = r.CONDUCTOR;

            return (
              <div
                key={id}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md hover:border-emerald-100 transition-all gap-6 group"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg uppercase">
                      Solicitud #{id}
                    </span>
                    <EstadoBadge estado={estado} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 leading-tight group-hover:text-emerald-700 transition-colors">
                      {desc}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <RiUserReceived2Line className="text-emerald-500" /> Reportado por: {ciudad}
                    </p>
                  </div>

                  {conductorActual && (
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                      <RiTruckLine /> Asignado a: {conductorActual}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="w-full md:w-auto">
                  {estado === "Pendiente" ? (
                    <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <label className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Elegir Recolector</label>
                      <select
                        onChange={(e) => manejarAsignacion(id, e.target.value)}
                        defaultValue=""
                        className="w-full md:w-56 bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer shadow-sm"
                      >
                        <option value="" disabled>Seleccionar de la lista...</option>
                        {conductores.map((c) => (
                          <option key={c.ID} value={c.ID}>
                            {c.NOMBRE} {c.APELLIDO}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                      <RiCheckboxCircleLine className="text-lg" /> Gestión en curso
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const EstadoBadge = ({ estado }) => {
  const config = {
    Pendiente: "bg-amber-100 text-amber-700 border-amber-200",
    "En ruta": "bg-purple-100 text-purple-700 border-purple-200",
    Asignado: "bg-blue-100 text-blue-700 border-blue-200",
    Completada: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  return (
    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${config[estado] || "bg-gray-100 text-gray-500"}`}>
      {estado}
    </span>
  );
};

export default GestionReportes;