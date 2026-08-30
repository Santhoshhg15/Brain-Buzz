import { AmbientBackground } from "./components/AmbientBackground";
import { Laptop, PlayCircle } from "lucide-react";
import { ThemeToggle } from "./components/ThemeToggle";

function App() {
  const hostUrl = import.meta.env.VITE_HOST_APP_URL || "https://brain-buzz-host.vercel.app";
  const playUrl = import.meta.env.VITE_PLAY_APP_URL || "https://brain-buzz-play.vercel.app";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-sans text-[var(--color-text-primary)] flex items-center justify-center p-6 relative overflow-hidden">
      <AmbientBackground />
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-3xl flex flex-col items-center text-center animate-[screenEnter_300ms_var(--ease-out-expo)]">
        {/* Branding Logo Area */}
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[var(--color-accent)] text-white w-12 h-12 rounded-2xl flex items-center justify-center font-heading font-black text-2xl shadow-lg shadow-[var(--color-accent)]/20 animate-[popIn_400ms_var(--ease-spring)]">
            Q
          </div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            BrainBuzz
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-[var(--color-text-secondary)] font-medium text-lg mb-12">
          Live quizzes for the classroom.
        </p>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Host Card */}
          <a
            href={hostUrl}
            className="group bg-[var(--color-surface-elevated)] p-8 rounded-3xl border border-[var(--color-border)]/60 shadow-premium hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 ease-[var(--ease-smooth)] flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Laptop className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-heading font-bold text-[var(--color-text-primary)] mb-2">
              I'm Hosting a Quiz
            </h2>
            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Instructor console
            </p>
          </a>

          {/* Join Card */}
          <a
            href={playUrl}
            className="group bg-[var(--color-surface-elevated)] p-8 rounded-3xl border border-[var(--color-border)]/60 shadow-premium hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 ease-[var(--ease-smooth)] flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="bg-[var(--color-success)]/10 text-[var(--color-success)] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <PlayCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-heading font-bold text-[var(--color-text-primary)] mb-2">
              I'm Joining a Quiz
            </h2>
            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Enter a room code
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
