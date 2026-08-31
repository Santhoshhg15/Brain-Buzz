import React, { useState } from "react";
import { useAuthStore } from "./authStore";
import { KeyRound, Mail, Loader2 } from "lucide-react";
import { RippleButton } from "../components/RippleButton";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const loginError = useAuthStore((state) => state.loginError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6 relative">
      {/* Centered Login Card */}
      <div className="w-full max-w-md bg-[var(--color-surface-elevated)] p-8 rounded-3xl border border-[var(--color-border)]/60 shadow-premium animate-[screenEnter_300ms_var(--ease-out-expo)] relative overflow-hidden">
        
        {/* Branding/Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[var(--color-accent)] text-white w-10 h-10 rounded-2xl flex items-center justify-center font-heading font-black text-xl shadow-lg shadow-[var(--color-accent)]/20 animate-[popIn_400ms_var(--ease-spring)]">
              Q
            </div>
            <h1 className="text-2xl font-heading font-bold tracking-tight text-[var(--color-text-primary)]">
              BrainBuzz <span className="text-[var(--color-accent)] font-black">HOST</span>
            </h1>
          </div>
          <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest pl-1">
            Instructor Console
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block pl-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 w-4 h-4 text-[var(--color-text-secondary)] pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="instructor@example.com"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-11 pr-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 ring-[var(--color-accent)]/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block pl-1">
              Password
            </label>
            <div className="relative flex items-center">
              <KeyRound className="absolute left-4 w-4 h-4 text-[var(--color-text-secondary)] pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-11 pr-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 ring-[var(--color-accent)]/20 transition-all font-medium"
              />
            </div>
          </div>

          {loginError && (
            <div className="bg-[var(--color-error-bg)]/80 text-[var(--color-error)] border border-[var(--color-error)]/25 text-xs font-bold p-3.5 rounded-xl text-center animate-[screenEnter_200ms_var(--ease-out-expo)]">
              {loginError}
            </div>
          )}

          <RippleButton
            type="submit"
            disabled={loading || !email || !password}
            className="w-full btn-primary"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging In...</span>
              </>
            ) : (
              <span>Log In</span>
            )}
          </RippleButton>
        </form>
      </div>
    </div>
  );
}
export default LoginScreen;
