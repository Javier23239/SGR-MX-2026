import { useState, useRef } from "react";
import { RiLockPasswordLine, RiArrowRightFill, RiMailLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext"; // IMPORTANTE: Importar el hook

export default function VerificarOtp({ email, onVerifySuccess, onCancel }) {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);
  
  // Extraemos la función real del contexto
  const { verificarOTP } = useAuth();

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const codigoCompleto = otp.join("");
    
    if (codigoCompleto.length < 6) {
      setError("Por favor ingresa los 6 dígitos.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      console.log("Iniciando verificación real para:", email);
      
      // LLAMADA REAL AL BACKEND A TRAVÉS DEL CONTEXTO
      // Esta función actualizará el estado 'user' en AuthContext
      const userData = await verificarOTP(email, codigoCompleto);
      
      console.log("Verificación exitosa. Datos recibidos:", userData);

      // Notificamos al padre (Login.jsx) que ya terminó para que haga el navigate
      onVerifySuccess(userData);

    } catch (err) {
      console.error("Error en validación OTP:", err.message);
      setError(err.message || "Código inválido o expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-300">
        
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">
          <RiLockPasswordLine />
        </div>

        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Código de Verificación</h2>
        <p className="text-gray-500 text-sm mt-2 px-4">
          Hemos enviado un código OTP de 6 dígitos a <br />
          <span className="font-bold text-gray-700 flex items-center justify-center gap-1 mt-1 text-xs bg-gray-100 py-1 px-3 rounded-full w-max mx-auto">
            <RiMailLine /> {email}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="flex justify-center gap-2.5">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                ref={(el) => (inputRefs.current[index] = el)}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e.target, index)}
                onFocus={(e) => e.target.select()}
                className="w-12 h-14 text-center text-xl font-black text-gray-800 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all uppercase"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold bg-red-50 py-2 rounded-xl border border-red-100 animate-bounce">
              {error}
            </p>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Validar Acceso <RiArrowRightFill className="text-lg" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-wider py-2 transition-colors"
            >
              Volver al Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}