import { usePlayStore } from "../store/playStore";

export function WaitingRoomScreen() {
  const studentName = usePlayStore(state => state.studentName);
  const quizTitle = usePlayStore(state => state.quizTitle);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[70vh] px-4 text-center">
      <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl border border-[var(--color-border)] p-8 w-full max-w-sm flex flex-col items-center">
        <h2 className="text-xl font-heading font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">
          {quizTitle}
        </h2>
        <div className="text-3xl font-black text-[var(--color-accent)] mb-8">
          You're in, {studentName}!
        </div>

        <div className="flex gap-2 mb-8 mt-4">
          <div className="w-4 h-4 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-4 h-4 bg-[var(--color-accent)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-4 h-4 bg-[var(--color-accent)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>

        <p className="text-[var(--color-text-secondary)] font-medium text-lg">
          Waiting for the host to start...
        </p>
      </div>
    </div>
  );
}
