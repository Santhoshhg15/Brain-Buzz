import { create } from "zustand";

const TOKEN_KEY = "quiz_instructor_token";
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

interface AuthState {
  token: string | null;
  instructorName: string | null;
  instructorEmail: string | null;
  authStatus: "checking" | "authenticated" | "unauthenticated";
  loginError: string | null;

  // Actions
  checkExistingSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY),
  instructorName: null,
  instructorEmail: null,
  authStatus: "checking",
  loginError: null,

  checkExistingSession: async () => {
    const { token } = get();
    if (!token) {
      set({ authStatus: "unauthenticated" });
      return;
    }

    try {
      const res = await fetch(`${SERVER_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        set({
          instructorName: data.name,
          instructorEmail: data.email,
          authStatus: "authenticated"
        });
      } else {
        // Clear invalid token
        localStorage.removeItem(TOKEN_KEY);
        set({
          token: null,
          instructorName: null,
          instructorEmail: null,
          authStatus: "unauthenticated"
        });
      }
    } catch (e) {
      console.error("Failed checking session:", e);
      // On network error, do not drop the session immediately to allow offline use, 
      // or clean it if the server is down. Let's assume unauthenticated for safety.
      localStorage.removeItem(TOKEN_KEY);
      set({
        token: null,
        instructorName: null,
        instructorEmail: null,
        authStatus: "unauthenticated"
      });
    }
  },

  login: async (email, password) => {
    set({ loginError: null });
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem(TOKEN_KEY, data.token);
        set({
          token: data.token,
          instructorName: data.name,
          instructorEmail: data.email,
          authStatus: "authenticated",
          loginError: null
        });
      } else {
        set({ loginError: data.error || "Failed to log in" });
      }
    } catch (e: any) {
      console.error("Login error:", e);
      set({ loginError: "A network error occurred. Please try again." });
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    
    // Disconnect the socket to avoid lingering socket connection
    import("../store/hostStore").then((m) => {
      m.useHostStore.getState().disconnectSocket();
    }).catch((err) => {
      console.error("Failed to disconnect socket on logout:", err);
    });

    set({
      token: null,
      instructorName: null,
      instructorEmail: null,
      authStatus: "unauthenticated",
      loginError: null
    });
  }
}));
