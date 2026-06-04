import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { RiMailSendLine, RiLockPasswordLine, RiArrowLeftLine, RiCheckLine } from "react-icons/ri";

export default function ForgotPassword() {
  const { requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  // Manejo de OTP
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.value !== "" && index < 5) inputRefs.current[index + 1].focus();
  };

  // Paso 1: Solicitar código
  const handleRequestEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestPasswordReset(email);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Cambiar contraseña
  const handleReset = async (e) => {
    e.preventDefault();
    const codigo = otp.join("");
    if (codigo.length < 6 || !newPassword) {
      setError("Completa todos los campos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(email, codigo, newPassword);
      alert("Contraseña actualizada con éxito");
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            {step === 1 ? <RiMailSendLine /> : <RiLockPasswordLine />}
          </div>
          <h2 className="text-2xl font-black text-gray-800">
            {step === 1 ? "Recuperar Acceso" : "Nueva Contraseña"}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            {step === 1 
              ? "Ingresa tu correo para recibir un código de verificación." 
              : `Ingresa el código enviado a ${email}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestEmail} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Correo Electrónico</label>
              <input
                type="email"
                required
                className="w-full mt-1 px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            <button
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Enviando..." : "Enviar Código"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            {/* Inputs OTP */}
            <div className="flex justify-center gap-2">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={data}
                  onChange={(e) => handleOtpChange(e.target, index)}
                  className="w-10 h-12 text-center text-lg font-bold bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 outline-none"
                />
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nueva Contraseña</label>
              <input
                type="password"
                required
                className="w-full mt-1 px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

            <button
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
            >
              <RiCheckLine className="text-xl" /> {loading ? "Procesando..." : "Restablecer Contraseña"}
            </button>
          </form>
        )}

        <button
          onClick={() => step === 1 ? navigate("/login") : setStep(1)}
          className="w-full mt-6 text-gray-400 hover:text-gray-600 text-xs font-bold uppercase flex items-center justify-center gap-2"
        >
          <RiArrowLeftLine /> Volver
        </button>
      </div>
    </div>
  );
}