import { useState, useEffect, useRef } from "react";
import { 
  RiChatSmile3Line, 
  RiCloseLine, 
  RiSendPlane2Fill,
  RiTimeLine,
  RiMapPinLine,
  RiPriceTag3Line,
  RiCustomerService2Line,
  RiToolsLine
} from "react-icons/ri";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hola 👋 Bienvenido al asistente de SGR-MX. ¿En qué puedo ayudarte hoy?",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const quickQuestion = (questionKey, label) => {
    let response = "";

    if (questionKey === "horario") {
      response = "🕒 El horario de atención ciudadana y recolección es de lunes a viernes de 8:00 AM a 6:00 PM.";
    } else if (questionKey === "ubicacion") {
      response = "📍 Operamos centralmente en el municipio de Ciudad Nezahualcóyotl.";
    } else if (questionKey === "precios") {
      response = "💲 El servicio estándar de reportes urbanos es gratuito para los ciudadanos.";
    } else if (questionKey === "contacto") {
      response = "📞 Central de atención SGR-MX: 5661210072.";
    } else if (questionKey === "servicios") {
      response = "🛠 Ofrecemos gestión integral de residuos, asignación de rutas y reportes ciudadanos.";
    }

    setMessages((prev) => [
      ...prev,
      { text: label, sender: "user" },
      { text: response, sender: "bot" },
    ]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    const text = input.toLowerCase();
    let response = "Lo siento 😅 No entendí tu duda. Prueba usando los botones de preguntas frecuentes o palabras clave como 'reporte', 'roles' u 'oracle'.";

    if (text.includes("hola") || text.includes("buenas") || text.includes("saludos")) {
      response = "¡Hola! Bienvenido a la plataforma del Sistema de Gestión de Residuos (SGR-MX). ¿Qué deseas consultar?";
    } else if (text.includes("servicio") || text.includes("funciona") || text.includes("sistema")) {
      response = "SGR-MX es una plataforma bajo arquitectura SOA que digitaliza y optimiza los reportes de basura y la logística de los recolectores.";
    } else if (text.includes("reporte") || text.includes("basura") || text.includes("crear")) {
      response = "Para levantar un reporte, ve al menú de 'Reportes', llena la descripción, selecciona el tipo de residuo y confirma la ubicación.";
    } else if (text.includes("registro") || text.includes("crear cuenta") || text.includes("registrarme")) {
      response = "Si eres ciudadano, puedes registrarte en la pantalla de Login seleccionando 'Crear cuenta'. Los roles de Admin y Recolector los gestiona el sistema.";
    } else if (text.includes("contacto") || text.includes("telefono") || text.includes("llamar")) {
      response = "Puedes comunicarte al teléfono directo 5661210072 o acudir a las oficinas de atención en Cd. Nezahualcóyotl.";
    } else if (text.includes("oracle") || text.includes("base de datos") || text.includes("seguridad")) {
      response = "Nuestros datos están protegidos en un servidor Oracle Database independiente y las conexiones se validan mediante JWT tokens.";
    }

    const botMessage = { text: response, sender: "bot" };
    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-[10000] font-sans antialiased">
      {/* BOTÓN FLOTANTE MEJORADO */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white w-16 h-16 rounded-full shadow-[0_12px_40px_rgba(16,185,129,0.35)] hover:shadow-[0_12px_45px_rgba(16,185,129,0.5)] text-3xl transition-all duration-300 flex items-center justify-center border-2 border-white focus:outline-none transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <RiCloseLine className="animate-in fade-in zoom-in-50 duration-200" />
        ) : (
          <RiChatSmile3Line className="animate-in fade-in zoom-in-50 duration-200 text-2xl" />
        )}
      </button>

      {/* VENTANA DEL CHAT ESTILIZADA */}
      {open && (
        <div className="absolute bottom-20 right-0 w-[380px] max-w-[92vw] h-[520px] bg-white rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100 flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-300 ease-out">
          
          {/* HEADER PREMIUM */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <RiCustomerService2Line className="text-xl text-emerald-100" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-emerald-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black tracking-tight text-base leading-tight">Asistente SGR-MX</h3>
                <span className="text-xs text-emerald-100/80 font-medium">Soporte Virtual Inteligente</span>
              </div>
            </div>
          </div>

          {/* ÁREA DE MENSAJES CON DISEÑO FLUIDO */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 bg-slate-50/60 flex flex-col gap-3.5 scroll-smooth"
          >
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm shadow-[0_2px_8px_rgba(0,0,0,0.02)] leading-relaxed font-medium transition-all ${
                  msg.sender === "user" 
                    ? "bg-emerald-600 text-white rounded-br-none" 
                    : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* BOTONES DE PREGUNTAS FRECUENTES RENOVADOS */}
          <div className="p-4 bg-white border-t border-slate-100/80 flex flex-wrap gap-2 max-h-28 overflow-y-auto justify-start">
            <button onClick={() => quickQuestion("horario", "Horario")} className="flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all text-xs font-bold px-3 py-2 rounded-xl border border-slate-200/60 shadow-sm">
              <RiTimeLine className="text-sm text-emerald-500" /> Horario
            </button>
            <button onClick={() => quickQuestion("ubicacion", "Ubicación")} className="flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all text-xs font-bold px-3 py-2 rounded-xl border border-slate-200/60 shadow-sm">
              <RiMapPinLine className="text-sm text-emerald-500" /> Ubicación
            </button>
            <button onClick={() => quickQuestion("precios", "Precios")} className="flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all text-xs font-bold px-3 py-2 rounded-xl border border-slate-200/60 shadow-sm">
              <RiPriceTag3Line className="text-sm text-emerald-500" /> Precios
            </button>
            <button onClick={() => quickQuestion("contacto", "Contacto")} className="flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all text-xs font-bold px-3 py-2 rounded-xl border border-slate-200/60 shadow-sm">
              <RiCustomerService2Line className="text-sm text-emerald-500" /> Contacto
            </button>
            <button onClick={() => quickQuestion("servicios", "Servicios")} className="flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all text-xs font-bold px-3 py-2 rounded-xl border border-slate-200/60 shadow-sm">
              <RiToolsLine className="text-sm text-emerald-500" /> Servicios
            </button>
          </div>

          {/* CONTENEDOR DE ENTRADA DE TEXTO */}
          <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
            <input
              type="text"
              className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400"
              placeholder="Escribe tu duda aquí..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button 
              onClick={sendMessage} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 w-11 rounded-xl flex items-center justify-center text-lg transition-colors duration-200 shadow-md shadow-emerald-600/10 active:scale-95 focus:outline-none"
            >
              <RiSendPlane2Fill />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}