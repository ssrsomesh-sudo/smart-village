import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// ✅ Hardcoded credentials — change these as needed
const USERS = [
  { username: "admin", password: "admin@123", role: "admin" },
  { username: "user", password: "user@123", role: "user" },
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    // Persist login across page refresh
    const saved = sessionStorage.getItem("sv_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (username, password) => {
    const found = USERS.find(
      (u) => u.username === username && u.password === password
    );
    if (found) {
      const userInfo = { username: found.username, role: found.role };
      setCurrentUser(userInfo);
      sessionStorage.setItem("sv_user", JSON.stringify(userInfo));
      return { success: true };
    }
    return { success: false, error: "Invalid username or password" };
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem("sv_user");
  };

  const isAdmin = () => currentUser?.role === "admin";

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);