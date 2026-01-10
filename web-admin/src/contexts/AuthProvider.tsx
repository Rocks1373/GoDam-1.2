import { useEffect, useState, type ReactNode } from "react";
import { isAxiosError } from "axios";
import AuthContext, { type AuthContextType, type User } from "./authContext";
import { api } from "../services/api";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("godam_token");
    const storedUser = localStorage.getItem("godam_user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      } catch {
        localStorage.removeItem("godam_token");
        localStorage.removeItem("godam_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      const { accessToken, user: userData } = response.data;
      const userObj: User = {
        id: userData.id,
        username: userData.username,
        role: userData.role,
      };

      localStorage.setItem("godam_token", accessToken);
      localStorage.setItem("godam_user", JSON.stringify(userObj));
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      setToken(accessToken);
      setUser(userObj);
    } catch (err) {
      const message = isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : err instanceof Error
        ? err.message
        : "Login failed. Please try again.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("godam_token");
    localStorage.removeItem("godam_user");

    delete api.defaults.headers.common["Authorization"];

    setToken(null);
    setUser(null);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
