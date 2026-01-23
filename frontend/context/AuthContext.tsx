import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('access_token');

      if (savedUser && savedUser !== "undefined" && savedToken && savedToken !== "undefined") {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Auth initialization error:", e);
          localStorage.clear();
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const login = (data: AuthResponse) => {
    // Čuvamo tokene za Axios presretače
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);

    // Ako backend ispravno šalje 'user', čuvamo ga. 
    // Ako ne šalje, setUser će ostati null i login neće proći (što je ispravno za debug).
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } else {
      console.error("Login Error: Backend did not return user data.");
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};