/**
 * Contexto de Autenticação do PetPrev
 * Segue a mesma lógica de localStorage já usada pelo DevRoleSwitcher.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserRole = "rt" | "tutor" | "vet";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  credential: string; // CRMV, ID, etc.
  token: string;
}

// Usuários de demonstração (espelha o DevRoleSwitcher e os dados do seed)
export const DEMO_USERS: Record<string, AuthUser & { phone: string; otp: string }> = {
  "(71) 9 0000-0001": {
    id: "demo-admin-001",
    name: "Dra. Helena Braga",
    role: "rt",
    roleLabel: "Responsável Técnica",
    credential: "CRMV-BA 9182",
    phone: "(71) 9 0000-0001",
    token: "DEMO_RT_TOKEN",
    otp: "123456",
  },
  "(71) 9 0000-0002": {
    id: "demo-tutor-002",
    name: "Ana Ribeiro",
    role: "tutor",
    roleLabel: "Tutora",
    credential: "CPF: •••.456.789-••",
    phone: "(71) 9 0000-0002",
    token: "DEMO_TUTOR_TOKEN",
    otp: "123456",
  },
  "(71) 9 0000-0003": {
    id: "demo-vet-003",
    name: "Dr. Caio Menezes",
    role: "vet",
    roleLabel: "Veterinário de Campo",
    credential: "CRMV-BA 7341",
    phone: "(71) 9 0000-0003",
    token: "DEMO_VET_TOKEN",
    otp: "123456",
  },
};

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function resolveUserFromStorage(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("petprev_auth_token");
  const role = localStorage.getItem("petprev_demo_role") as UserRole | null;

  if (!token || !role) return null;

  // Rehydrate user from stored role
  const found = Object.values(DEMO_USERS).find((u) => u.role === role && u.token === token);
  if (!found) return null;

  const { otp: _otp, phone: _phone, ...user } = found;
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => resolveUserFromStorage());

  // Sincroniza se o token mudar em outra aba (DevRoleSwitcher, seed, etc.)
  useEffect(() => {
    const handleStorage = () => setUser(resolveUserFromStorage());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = (incoming: AuthUser) => {
    localStorage.setItem("petprev_auth_token", incoming.token);
    localStorage.setItem("petprev_demo_role", incoming.role);
    // Manter compatibilidade com DevRoleSwitcher
    if (incoming.role === "rt") localStorage.setItem("petprev_demo_rt_token", incoming.token);
    if (incoming.role === "tutor") localStorage.setItem("petprev_demo_tutor_token", incoming.token);
    if (incoming.role === "vet") localStorage.setItem("petprev_demo_vet_token", incoming.token);
    setUser(incoming);
  };

  const logout = () => {
    localStorage.removeItem("petprev_auth_token");
    localStorage.removeItem("petprev_demo_role");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
