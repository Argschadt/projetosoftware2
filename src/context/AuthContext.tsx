import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  username: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const login = async (user: string, pass: string): Promise<boolean> => {
    // Aqui você pode fazer uma chamada para o backend
    // Por enquanto, usando credenciais básicas
    if (user === 'admin' && pass === 'admin123') {
      setIsAuthenticated(true);
      setUsername(user);
      localStorage.setItem('adminAuth', JSON.stringify({ user, timestamp: Date.now() }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem('adminAuth');
  };

  // Verificar se o usuário já está autenticado ao iniciar
  const storedAuth = localStorage.getItem('adminAuth');
  if (storedAuth && !isAuthenticated) {
    try {
      const auth = JSON.parse(storedAuth);
      setIsAuthenticated(true);
      setUsername(auth.user);
    } catch (e) {
      localStorage.removeItem('adminAuth');
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, username }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
