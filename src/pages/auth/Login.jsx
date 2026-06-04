import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
// 1. IMPORTANTE: Agregamos Link aquí
import { useNavigate, Link } from "react-router-dom"; 
import { 
  RiMailLine, 
  RiLockPasswordLine, 
  RiShieldCheckLine, 
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiQuestionLine // Icono opcional para el link
} from "react-icons/ri";
import VerificarOtp from "./VerificarOtp";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [mostrarOtp, setMostrarOtp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await login(email.trim(), password);
      if (response.status === "OTP_SENT") {
        setMostrarOtp(true);
      }
    } catch (err) {
      setError(err.message || "Credenciales incorrectas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSuccess = (userData) => {
    const userRole = userData?.rol;
    if (userRole === "ADMIN") {
      navigate("/admin");
    } else if (userRole === "RECOLECTOR") {
      navigate("/conductor");
    } else {
      navigate("/ciudadano");
    }
  };

  if (mostrarOtp) {
    return (
      <VerificarOtp 
        email={email} 
        onVerifySuccess={handleOtpSuccess} 
        onCancel={() => setMostrarOtp(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans animate-in fade-in duration-500">
      <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
        
        {/* Panel Lateral */}
        <div className="md:w-1/2 bg-emerald-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500 rounded-full opacity-50"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-emerald-700 rounded-full opacity-50"></div>

          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tighter mb-2 italic">SGR-MX</h1>
            <div className="h-1.5 w-12 bg-white rounded-full mb-8"></div>
            <h2 className="text-3xl font-black leading-tight mb-4 tracking-tight">
              Mantenemos nuestra ciudad limpia.
            </h2>
            <p className="text-emerald-100 text-sm font-medium leading-relaxed">
              Sistema bajo arquitectura SOA para la gestión integral de residuos urbanos. Conéctate para continuar.
            </p>
          </div>
          
          <div className="relative z-10 flex items-center gap-2 text-xs font-bold text-emerald-200 uppercase tracking-widest">
            <RiCheckboxCircleLine className="text-lg text-white" /> Conexión segura con Oracle
          </div>
        </div>

        {/* Panel del Formulario */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-10">
            <h3 className="text-3xl font-black text-gray-800 tracking-tight">Acceso</h3>
            <p className="text-gray-400 text-sm font-medium">Ingresa tus datos de acceso al sistema.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs p-4 rounded-r-xl flex items-center gap-3">
              <RiShieldCheckLine className="text-xl shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">
                Correo Electrónico
              </label>
              <div className="relative">
                <RiMailLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:bg-white outline-none transition-all text-gray-700 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Contraseña
                </label>
                {/* 2. AGREGADO: Link de recuperación sutil debajo de la etiqueta */}
                <Link 
                  to="/recuperar" 
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:bg-white outline-none transition-all text-gray-700 font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Enviar Código <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center space-y-4">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              ¿No tienes cuenta?{" "}
              <button 
                onClick={() => navigate("/registro-ciudadano")} 
                className="text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;