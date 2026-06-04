import { Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import RegistroCiudadano from "../pages/auth/RegistroCiudadano"; 
import ProtectedRoute from "../components/common/ProtectedRoute";
import MainLayout from "../layout/MainLayout";
import Home from "../pages/public/Home";
// CORRECCIÓN 1: Importamos con el nombre correcto del componente
import ForgotPassword from "../pages/auth/ForgotPassword"; 

// --- SECCION ADMIN ---
import DashboardAdmin from "../pages/admin/DashboardAdmin";
import GestionReportes from "../pages/admin/GestionReportes";
import Usuarios from "../pages/admin/Usuarios"; 

// --- SECCION CIUDADANO ---
import DashboardCiudadano from "../pages/ciudadano/DashboardCiudadano";
import ReportesCiudadano from "../pages/ciudadano/ReportesCiudadano";
import NuevoReporte from "../pages/ciudadano/NuevoReporte";

// --- SECCION CONDUCTOR ---
import DashboardConductor from "../pages/conductor/DashboardConductor";
import RutasConductor from "../pages/conductor/RutasConductor";
import HistorialConductor from "../pages/conductor/HistorialConductor";
import MapaRuta from "../pages/conductor/MapaRuta";

const AppRouter = () => {
  return (
    <Routes>
      {/* RUTAS PUBLICAS */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro-ciudadano" element={<RegistroCiudadano />} />      
      <Route path="/recuperar" element={<ForgotPassword />} />


      {/* RUTAS DE ADMINISTRADOR */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardAdmin />} />
        <Route path="reportes" element={<GestionReportes />} />
        <Route path="usuarios" element={<Usuarios />} />
      </Route>

      {/* RUTAS DE CIUDADANO */}
      <Route
        path="/ciudadano"
        element={
          <ProtectedRoute role="CIUDADANO"> 
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardCiudadano />} />
        <Route path="reportes" element={<ReportesCiudadano />} />
        <Route path="reportes/nuevo" element={<NuevoReporte />} />
      </Route>

      {/* RUTAS DE CONDUCTOR */}
      <Route
        path="/conductor"
        element={
          <ProtectedRoute role="RECOLECTOR">
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardConductor />} />
        <Route path="rutas" element={<RutasConductor />} />
        <Route path="historial" element={<HistorialConductor />} />
        <Route path="mapa" element={<MapaRuta/>} />
      </Route>

      {/* RUTA ERROR */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-10 bg-white rounded-3xl shadow-xl border border-gray-100">
            <h1 className="text-6xl font-black text-emerald-600 mb-4">404</h1>
            <p className="text-xl font-bold text-gray-800">Página no encontrada</p>
            <p className="text-gray-500 mt-2">Parece que te has perdido en el sistema.</p>
          </div>
        </div>
      } />
    </Routes>
  );
};

export default AppRouter;