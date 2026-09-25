export const INTRO_END = 0.1;
export const OUTRO_START = 0.9;

export function tourProgress(shell: HTMLElement) {
  const distance = Math.max(1, shell.offsetHeight - window.innerHeight);
  return Math.max(
    0,
    Math.min(1, -shell.getBoundingClientRect().top / distance),
  );
}

export function dishTravel(progress: number, count: number) {
  const span = Math.max(0, count - 1);
  return Math.max(
    0,
    Math.min(span, ((progress - INTRO_END) / (OUTRO_START - INTRO_END)) * span),
  );
}
