import { QRCodeSVG } from "qrcode.react";
import { useDisplayStore } from "../store/displayStore";

export function LobbyDisplayScreen() {
  const roomCode = useDisplayStore(state => state.roomCode);
  const quizTitle = useDisplayStore(state => state.quizTitle);
  const participants = useDisplayStore(state => state.participants);

  const joinUrl = `${import.meta.env.VITE_PLAY_APP_URL || "https://brain-buzz-play.vercel.app"}?room=${roomCode}`;

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[var(--color-surface)] py-12 px-8 sm:px-16 md:px-24 overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* Top Banner */}
        <div className="w-full bg-[var(--color-surface-elevated)] rounded-2xl shadow-2xl p-10 lg:p-14 flex flex-col xl:flex-row items-center justify-between border-4 border-indigo-50 mb-12 relative overflow-hidden gap-8">
          <div className="absolute top-0 left-0 w-full h-3 lg:h-4 bg-[var(--color-accent)]"></div>
          
          <div className="flex flex-col max-w-xl text-center xl:text-left mb-8 xl:mb-0">
            <h2 className="text-xl lg:text-2xl font-heading font-bold text-[var(--color-text-secondary)] uppercase tracking-widest mb-3">
              Join the Quiz:
            </h2>
            <h1 className="text-4xl lg:text-5xl font-heading font-black text-[var(--color-text-primary)] leading-tight">
              {quizTitle}
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 bg-[var(--color-surface)] p-8 rounded-2xl border border-[var(--color-border)] shadow-inner w-full xl:w-auto justify-center">
            <div className="flex flex-col items-center text-center">
              <span className="text-xl lg:text-2xl font-heading font-bold text-[var(--color-accent)] mb-2">Room Code</span>
              <div className="text-5xl lg:text-6xl font-mono font-black text-[var(--color-accent)] tracking-widest bg-[var(--color-surface)] px-6 py-4 rounded-2xl leading-none drop-shadow-md uppercase">
                {roomCode}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-white rounded-xl shadow-md border border-gray-100">
                <QRCodeSVG value={joinUrl} size={240} />
              </div>
              <span className="text-xl font-bold text-[var(--color-text-secondary)]">Scan to join</span>
            </div>
          </div>
        </div>

        {/* Participants Area */}
        <div className="w-full flex flex-col items-center flex-1">
          <div className="bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] px-8 py-3 rounded-xl text-2xl font-heading font-bold mb-10 shadow-md">
            {participants.length} Player{participants.length !== 1 ? 's' : ''} Joined
          </div>

          {participants.length === 0 ? (
            <div className="text-2xl lg:text-3xl text-[var(--color-text-secondary)] font-medium animate-pulse mt-16">
              Waiting for players to connect...
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4 lg:gap-6 w-full">
              {participants.map(p => (
                <div 
                  key={p.id} 
                  className="bg-[var(--color-surface-elevated)] border-2 border-[var(--color-border)] text-[var(--color-text-primary)] px-6 py-4 rounded-xl text-2xl lg:text-3xl font-heading font-bold shadow-md animate-[fadeScaleIn_250ms_var(--ease-spring)] transform transition hover:scale-105"
                >
                  {p.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
