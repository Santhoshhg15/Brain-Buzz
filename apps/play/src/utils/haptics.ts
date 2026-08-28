export function triggerHaptic(pattern: number | number[] = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently ignore
    }
  }
}

export const haptics = {
  tap: () => triggerHaptic(10),
  success: () => triggerHaptic([10, 50, 10]),
  error: () => triggerHaptic(30),
  urgent: () => triggerHaptic(15),
};
