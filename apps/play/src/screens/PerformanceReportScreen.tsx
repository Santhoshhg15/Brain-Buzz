import { useEffect } from "react";
import { usePlayStore } from "../store/playStore";
import { useCountUp } from "../hooks/useCountUp";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { RippleButton } from "../components/RippleButton";

export function PerformanceReportScreen() {
  const { 
    performanceReport, 
    reportLoading, 
    fetchPerformanceReport, 
    setReportScreenActive 
  } = usePlayStore();

  useEffect(() => {
    if (!performanceReport) {
      fetchPerformanceReport();
    }
  }, [performanceReport, fetchPerformanceReport]);

  if (reportLoading || !performanceReport) {
    return (
      <div className="flex flex-col w-full min-h-[90vh] px-4 py-8 bg-[var(--color-surface)] animate-pulse">
        <div className="h-6 w-32 bg-[var(--color-border)] rounded mb-8"></div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="h-24 bg-[var(--color-border)] rounded-2xl"></div>
          <div className="h-24 bg-[var(--color-border)] rounded-2xl"></div>
          <div className="h-24 bg-[var(--color-border)] rounded-2xl"></div>
          <div className="h-24 bg-[var(--color-border)] rounded-2xl"></div>
        </div>
        <div className="h-48 bg-[var(--color-border)] rounded-2xl mb-8"></div>
        <div className="h-32 bg-[var(--color-border)] rounded-2xl"></div>
      </div>
    );
  }

  return (
    <ReportView 
      performanceReport={performanceReport} 
      setReportScreenActive={setReportScreenActive} 
    />
  );
}

interface PerformanceReport {
  finalScore: number;
  finalRank: number;
  totalParticipants: number;
  accuracyPercent: number;
  correctCount: number;
  wrongCount: number;
  responseTimeStats?: {
    minMs: number;
    maxMs: number;
    avgMs: number;
    totalMs: number;
  } | null;
  perQuestionBreakdown: Array<{
    questionText: string;
    isCorrect: boolean;
    pointsAwarded: number;
    responseTimeMs: number | null;
  }>;
}

function ReportView({ 
  performanceReport, 
  setReportScreenActive 
}: { 
  performanceReport: PerformanceReport;
  setReportScreenActive: (active: boolean) => void;
}) {
  const {
    finalScore,
    finalRank,
    totalParticipants,
    accuracyPercent,
    correctCount,
    wrongCount,
    responseTimeStats,
    perQuestionBreakdown
  } = performanceReport;

  // Unconditional hook calls in the sub-component:
  const animatedScore = useCountUp(finalScore);
  const animatedAccuracy = useCountUp(accuracyPercent);
  const animatedCorrectCount = useCountUp(correctCount);

  const chartData = [
    { name: "Correct", value: correctCount, color: "var(--color-success, #10b981)" },
    { name: "Wrong", value: wrongCount, color: "var(--color-error, #ef4444)" }
  ];

  return (
    <div className="flex flex-col w-full min-h-[90vh] px-4 py-6 bg-[var(--color-surface)] pb-24 animate-[screenEnter_300ms_var(--ease-out-expo)]">
      <RippleButton 
        onClick={() => setReportScreenActive(false)}
        className="flex items-center text-[var(--color-text-secondary)] font-bold mb-6 hover:text-[var(--color-accent)] transition-colors w-fit bg-transparent border-0 shadow-none hover:shadow-none"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Results
      </RippleButton>

      <h1 className="text-2xl font-heading font-black text-[var(--color-text-primary)] mb-6">Your Performance</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard title="Final Score" value={animatedScore} />
        <StatCard title="Final Rank" value={`${finalRank}${getOrdinal(finalRank)}`} subtitle={`of ${totalParticipants}`} />
        <StatCard title="Accuracy" value={`${animatedAccuracy}%`} highlight />
        <StatCard title="Correct" value={`${animatedCorrectCount}/${correctCount + wrongCount}`} />
      </div>

      <div className="bg-[var(--color-surface-elevated)] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm mb-6">
        <h3 className="font-bold text-[var(--color-text-secondary)] mb-4 text-sm uppercase tracking-widest text-center">Correct vs Wrong</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'var(--color-border)', opacity: 0.2 }}
                contentStyle={{ backgroundColor: 'var(--color-surface-elevated)', borderRadius: '8px', border: '1px solid var(--color-border)' }} 
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {responseTimeStats && (
        <div className="bg-[var(--color-surface-elevated)] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm mb-6">
          <h3 className="font-bold text-[var(--color-text-secondary)] mb-4 text-sm uppercase tracking-widest">Timing</h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <TimingStat label="Fastest" ms={responseTimeStats.minMs} />
            <TimingStat label="Slowest" ms={responseTimeStats.maxMs} />
            <TimingStat label="Average" ms={responseTimeStats.avgMs} />
            <TimingStat label="Total" ms={responseTimeStats.totalMs} highlight />
          </div>
        </div>
      )}

      <div className="bg-[var(--color-surface-elevated)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
        <h3 className="font-bold text-[var(--color-text-secondary)] p-4 border-b border-[var(--color-border)] text-sm uppercase tracking-widest">Question Breakdown</h3>
        <div className="flex flex-col">
          {perQuestionBreakdown.map((q, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 border-b border-[var(--color-border)] last:border-0 bg-[var(--color-surface)]">
              <div className="shrink-0">
                {q.isCorrect ? 
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : 
                  <XCircle className="w-5 h-5 text-rose-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{q.questionText}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs font-bold ${q.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    +{q.pointsAwarded} pts
                  </span>
                  {q.responseTimeMs !== null && (
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {(q.responseTimeMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {perQuestionBreakdown.length === 0 && (
            <div className="p-6 text-center text-[var(--color-text-secondary)] text-sm">
              No questions answered.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, highlight }: { title: string, value: string | number, subtitle?: string, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-center items-center text-center ${highlight ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white animate-pulse-subtle' : 'bg-[var(--color-surface-elevated)] border-[var(--color-border)]'}`}>
      <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${highlight ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}`}>{title}</div>
      <div className={`text-2xl font-heading font-black ${highlight ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>{value}</div>
      {subtitle && <div className={`text-xs mt-1 ${highlight ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}`}>{subtitle}</div>}
    </div>
  );
}

function TimingStat({ label, ms, highlight }: { label: string, ms: number, highlight?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-[var(--color-text-secondary)] font-semibold">{label}</span>
      <span className={`text-lg font-mono font-bold ${highlight ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
        {(ms / 1000).toFixed(1)}s
      </span>
    </div>
  );
}

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
