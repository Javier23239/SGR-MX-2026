import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FullPageLoader from "./FullPageLoader";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Mientras verifica si hay una sesión activa
  if (loading) {
    return <FullPageLoader />;
  }

  // 2. Si no hay usuario en el Contexto, mandamos al Login
  if (!user) {
    console.log("DEBUG: No hay usuario en AuthContext, redirigiendo a /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Normalización de Roles (Seguridad extra para Oracle)
  // Aquí usamos trim() para quitar espacios que Oracle mete a veces en los CHAR
  const userRole = (user.rol || user.ROL || "").toString().toUpperCase().trim();
  const requiredRole = (role || "").toString().toUpperCase().trim();

  // 4. LOGS DE DEPURACIÓN (Mira esto en la consola F12 al intentar entrar)
  console.log("--- DEBUG PROTECTED ROUTE ---");
  console.log("Objeto usuario completo:", user);
  console.log("Rol detectado del usuario:", `"${userRole}"`); // Las comillas ayudan a ver si hay espacios
  console.log("Rol que la ruta exige:", `"${requiredRole}"`);

  // Función interna para verificar si un rol es de tipo administrador
  const esTipoAdmin = (r) => r === "ADMIN" || r === "ADMINISTRADOR";

  // Verificamos si los roles coinciden o si ambos son Admin
  const tienePermiso = 
    userRole === requiredRole || 
    (esTipoAdmin(userRole) && esTipoAdmin(requiredRole));

  // 5. Si tiene el rol equivocado
  if (requiredRole && !tienePermiso) {
    console.warn(`[Acceso Denegado]: El usuario tiene '${userRole}' pero se requiere '${requiredRole}'`);
    
    // Redirigimos a su Home correspondiente para que no se quede trabado
    if (esTipoAdmin(userRole)) return <Navigate to="/admin" replace />;
    if (userRole === "RECOLECTOR") return <Navigate to="/conductor" replace />;
    
    return <Navigate to="/ciudadano" replace />;
  }

  // 6. Si pasó todas las pruebas, adelante
  console.log(`[Acceso Concedido]: Bienvenido ${userRole}`);
  return children;
};

export default ProtectedRoute;