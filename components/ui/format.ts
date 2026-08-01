// Small shared formatting helpers used across screens.

/** Seconds → mm:ss (matches the reference timer/summary formatting). */
export function formatTime(totalSeconds: number): string {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
