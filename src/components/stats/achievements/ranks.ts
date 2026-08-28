export const ACHIEVEMENT_RANKS = [
  {
    minXp: 6000,
    level: 6,
    title: "Zen Grandmaster",
    color: "text-amber-400 border-amber-500/40 bg-amber-500/15",
  },
  {
    minXp: 4000,
    level: 5,
    title: "Deep Flow Knight",
    color: "text-purple-400 border-purple-500/40 bg-purple-500/15",
  },
  {
    minXp: 2500,
    level: 4,
    title: "Focus Champion",
    color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/15",
  },
  {
    minXp: 1200,
    level: 3,
    title: "Habit Builder",
    color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/15",
  },
  {
    minXp: 500,
    level: 2,
    title: "Flow Apprentice",
    color: "text-blue-400 border-blue-500/40 bg-blue-500/15",
  },
  {
    minXp: 0,
    level: 1,
    title: "Novice Practitioner",
    color: "text-muted border-separator/40 bg-surface-secondary/40",
  },
] as const;

export function getRankFromXp(xp: number) {
  return (
    ACHIEVEMENT_RANKS.find((r) => xp >= r.minXp) ||
    ACHIEVEMENT_RANKS[ACHIEVEMENT_RANKS.length - 1]
  );
}
