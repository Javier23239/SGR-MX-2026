import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Efecto inicial para recuperar la sesión del almacenamiento local
  useEffect(() => {
    const initAuth = () => {
      const storedUser = localStorage.getItem("user_oracle");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.token) {
            setUser(parsedUser);
          }
        } catch (error) {
          console.error("Error al restaurar sesión:", error);
          localStorage.removeItem("user_oracle");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // --- LOGIN PASO 1: Validar credenciales y enviar correo ---
  const login = async (email, password) => {
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Credenciales incorrectas");

      return data; // { status: "OTP_SENT" }
    } catch (error) {
      console.error("Error en login:", error.message);
      throw error;
    }
  };

  // --- LOGIN PASO 2: Verificar código y establecer sesión ---
  const verificarOTP = async (email, otp) => {
    try {
      const response = await fetch("http://localhost:5000/verificar-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Código inválido");

      const rolFinal = data.rol ? data.rol.toString().trim().toUpperCase() : "";
      const userData = { 
        email: email.trim().toLowerCase(), 
        rol: rolFinal, 
        nombre: data.nombre, 
        token: data.token 
      };

      localStorage.setItem("user_oracle", JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Error en verificarOTP:", error.message);
      throw error;
    }
  };

  // --- RECUPERACIÓN PASO 1: Solicitar código ---
  const requestPasswordReset = async (email) => {
    try {
      const response = await fetch("http://localhost:5000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    } catch (error) {
      console.error("Error en requestPasswordReset:", error.message);
      throw error;
    }
  };

  // --- RECUPERACIÓN PASO 2: Cambiar contraseña ---
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await fetch("http://localhost:5000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    } catch (error) {
      console.error("Error en resetPassword:", error.message);
      throw error;
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("user_oracle");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        verificarOTP,
        requestPasswordReset,
        resetPassword,
        logout,
        loading
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};