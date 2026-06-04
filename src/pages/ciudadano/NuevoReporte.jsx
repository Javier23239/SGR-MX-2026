import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; 
import ChatBot from "../../components/chatbot/ChatBot";
import { 
  RiAlertLine, 
  RiMapPinLine, 
  RiFileList3Line, 
  RiSendPlaneFill,
  RiInformationLine,
  RiRadarLine,
  RiCheckboxCircleLine
} from "react-icons/ri";

const NuevoReporte = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); 

  const [form, setForm] = useState({
    tipo: "",
    descripcion: "",
    ubicacion: "",
    latitud: null, 
    longitud: null, 
  });

  const [cargando, setCargando] = useState(false);
  const [obteniendoGps, setObteniendoGps] = useState(false);

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      return alert("Tu navegador no soporta GPS. Por favor usa un dispositivo móvil o un navegador moderno.");
    }

    setObteniendoGps(true);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({
          ...form,
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude
        });
        setObteniendoGps(false);
      },
      (error) => {
        console.error("Error GPS:", error);
        setObteniendoGps(false);
        alert("No pudimos obtener tu ubicación exacta. Asegúrate de dar permisos de GPS al sitio.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.latitud || !form.longitud) {
      return alert("Por favor, captura tu ubicación GPS para que el conductor pueda encontrar el reporte.");
    }

    if (!user?.token) {
      return alert("Sesión expirada. Por favor, vuelve a iniciar sesión.");
    }

    setCargando(true);

    const descripcionFinal = `[${form.tipo}] - ${form.descripcion} | Referencia: ${form.ubicacion}`;

    try {
      const response = await fetch("http://localhost:5000/solicitudes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}` 
        },
        body: JSON.stringify({
          descripcion: descripcionFinal,
          email: user?.email,
          latitud: form.latitud.toString(), 
          longitud: form.longitud.toString()
        }),
      });

      if (response.ok) {
        alert("Reporte enviado con éxito. El recolector ya tiene tus coordenadas.");
        navigate("/ciudadano/reportes");
      } else {
        const errorData = await response.json();
        alert("Error en el servidor: " + (errorData.error || errorData.message || "Acceso Denegado"));
      }
    } catch (error) {
      console.error("Error en peticion:", error);
      alert("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Encabezado  */}
        <div className="bg-emerald-600 p-10 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <RiAlertLine className="animate-pulse" /> Nuevo Reporte
            </h2>
            <p className="text-emerald-100 text-sm mt-2 font-medium">
              Captura tu ubicación exacta para una recolección inteligente.
            </p>
          </div>
          <RiMapPinLine className="absolute -right-4 -bottom-4 text-white/10 size-40 rotate-12" />
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <RiFileList3Line className="text-emerald-500" /> Categoría
              </label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-700 font-bold appearance-none"
              >
                <option value="" disabled>Seleccione...</option>
                <option value="Basura acumulada">Basura en vía pública</option>
                <option value="Contenedor lleno">Contenedor saturado</option>
                <option value="Residuos químicos">Residuos químicos</option>
                <option value="Basura hogar">Basura en el hogar</option>
                <option value="Otro">Otro reporte</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <RiMapPinLine className="text-emerald-500" /> Geolocalización
              </label>
              <button
                type="button"
                onClick={obtenerUbicacion}
                className={`w-full p-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 border-2 
                  ${form.latitud 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                    : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'}`}
              >
                {obteniendoGps ? (
                  <RiRadarLine className="animate-spin text-lg" />
                ) : form.latitud ? (
                  <RiCheckboxCircleLine className="text-lg" />
                ) : (
                  <RiMapPinLine className="text-lg" />
                )}
                {form.latitud ? "UBICACIÓN CAPTURADA" : "CAPTURAR MI GPS"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <RiInformationLine className="text-emerald-500" /> Detalles del incidente
            </label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Describe brevemente el problema..."
              required
              rows="3"
              className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-700 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <RiMapPinLine className="text-emerald-500" /> Referencia Visual
            </label>
            <input
              type="text"
              name="ubicacion"
              value={form.ubicacion}
              onChange={handleChange}
              placeholder="Ej: Portón café junto al parque..."
              required
              className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-700"
            />
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={cargando}
              className={`w-full py-5 rounded-[1.5rem] font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 group
                ${cargando 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gray-900 hover:bg-black active:scale-95'}`}
            >
              {cargando ? (
                <RiRadarLine className="animate-spin text-xl" />
              ) : (
                <>
                  ENVIAR REPORTE 
                  <RiSendPlaneFill className="text-xl group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
            
            {form.latitud && (
              <p className="text-[9px] text-center text-emerald-600 mt-4 font-mono">
                SISTEMA GPS ACTIVO: {form.latitud.toFixed(6)}, {form.longitud.toFixed(6)}
              </p>
            )}
          </div>
        </form>
      </div>
      <ChatBot />
    </div>
  );
};

export default NuevoReporte;