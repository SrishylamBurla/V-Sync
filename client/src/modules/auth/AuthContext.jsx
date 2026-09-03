import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { authStorage } from "./authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const loadUser = async () => {
    const token = authStorage.getAccessToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");

      const data = response.data.data;

      setUser(data.user);
      setOrganization(data.user.organizationId);
      setBranches(data.user.branchIds || []);
    } catch (error) {
      console.error("Unable to load authenticated user:", error);

      authStorage.clear();

      setUser(null);
      setOrganization(null);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const initializeAuth = async () => {
      const token = authStorage.getAccessToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        const data = response.data.data;

        setUser(data.user);

        setOrganization(data.user.organizationId);

        setBranches(data.user.branchIds || []);
      } catch (error) {
        console.error("Authentication initialization failed:", error);

        authStorage.clear();

        setUser(null);
        setOrganization(null);
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = ({ accessToken, refreshToken, user }) => {
    authStorage.setTokens(accessToken, refreshToken);

    setUser(user);
  };

  const logout = () => {
    authStorage.clear();

    setUser(null);
    setOrganization(null);
    setBranches([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        branches,
        loading,
        login,
        logout,
        reloadUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
