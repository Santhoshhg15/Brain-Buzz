import type { PerformanceReport } from "../store/playStore";

export interface Achievement {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export function calculateAchievements(
  performanceReport: PerformanceReport,
  finalRank: number | null
): Achievement[] {
  const achievements: Achievement[] = [];
  if (!performanceReport) return achievements;

  const { totalQuestions, answeredCount, accuracyPercent, perQuestionBreakdown } = performanceReport;

  // 1. Perfect Score (🏆)
  if (accuracyPercent === 100 && answeredCount === totalQuestions && totalQuestions > 0) {
    achievements.push({
      id: "perfect_score",
      label: "Perfect Score",
      icon: "🏆",
      description: "Answered every question correctly!",
    });
  }

  // Calculate longest streak from breakdown
  let currentStreak = 0;
  let longestStreak = 0;
  if (perQuestionBreakdown && perQuestionBreakdown.length > 0) {
    for (const q of perQuestionBreakdown) {
      if (q.isCorrect) {
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    }
  }

  // 2. On Fire (🔥)
  if (longestStreak >= 5) {
    achievements.push({
      id: "on_fire",
      label: "On Fire",
      icon: "🔥",
      description: `Maintained a streak of ${longestStreak} correct answers!`,
    });
  }

  // 3. Comeback Kid (📈) - Approximation based on first-half vs second-half performance
  if (perQuestionBreakdown && perQuestionBreakdown.length >= 4) {
    const totalQ = perQuestionBreakdown.length;
    const midPoint = Math.floor(totalQ / 2);
    
    const firstHalf = perQuestionBreakdown.slice(0, midPoint);
    const secondHalf = perQuestionBreakdown.slice(midPoint);
    
    const firstHalfCorrect = firstHalf.filter(q => q.isCorrect).length;
    const secondHalfCorrect = secondHalf.filter(q => q.isCorrect).length;
    
    const firstHalfAccuracy = (firstHalfCorrect / firstHalf.length) * 100;
    const secondHalfAccuracy = (secondHalfCorrect / secondHalf.length) * 100;

    // Comeback defined as: <= 33% accuracy in first half, and >= 75% accuracy in second half
    if (firstHalfAccuracy <= 33 && secondHalfAccuracy >= 75 && secondHalfCorrect > 0) {
      achievements.push({
        id: "comeback_kid",
        label: "Comeback Kid",
        icon: "📈",
        description: "Turned the game around after a tough start!",
      });
    }
  }

  // 4. Podium Finish (🥇🥈🥉)
  if (finalRank === 1) {
    achievements.push({
      id: "podium_1",
      label: "Champion",
      icon: "🥇",
      description: "Finished in 1st place!",
    });
  } else if (finalRank === 2) {
    achievements.push({
      id: "podium_2",
      label: "Silver Podium",
      icon: "🥈",
      description: "Finished in 2nd place!",
    });
  } else if (finalRank === 3) {
    achievements.push({
      id: "podium_3",
      label: "Bronze Podium",
      icon: "🥉",
      description: "Finished in 3rd place!",
    });
  }

  // 5. Sharp Shooter (🎯)
  if (accuracyPercent >= 90 && accuracyPercent < 100) {
    achievements.push({
      id: "sharp_shooter",
      label: "Sharp Shooter",
      icon: "🎯",
      description: `${accuracyPercent}% accuracy! Direct hits only.`,
    });
  }

  return achievements;
}
