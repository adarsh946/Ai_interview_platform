import api from "@/lib/api";
import { create } from "zustand";

interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthAction {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthAction>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    const { data } = await api.post("/auth/signin", { email, password });
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    await api.post("auth/logout");
    set({ user: null, isAuthenticated: false });
  },

  register: async (fullName: string, email: string, password: string) => {
    const { data } = await api.post("/auth/signup", {
      fullName,
      email,
      password,
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
