import { useState } from "react";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import { Outlet, useLocation } from "react-router-dom"; 
import ChatBot from "../components/chatbot/ChatBot"; 

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation(); 

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 relative">
      {/* NAVBAR */}
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1">
        {/* SIDEBAR */}
        <Sidebar
          open={sidebarOpen}
          close={() => setSidebarOpen(false)}
        />

        {/* CONTENIDO */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* VALIDACIÓN DIRECTA EN EL LAYOUT */}
      {location.pathname === "/perfil" && <ChatBot />}
    </div>
  );
};

export default MainLayout;