/**
 * Games Autopilot can schedule, using the bot's own activity keys (these are
 * what's stored in autopilot_schedules.activity_key). Matches AUTOPILOT_GAMES,
 * CLOSES_AFTER and PHASED in bot/cogs/autopilot.py and PLAN_ACTIVITIES in
 * bot/entitlements/defaults.py. Custom games are scheduled with /autopilot add.
 */

export type AutopilotPlan = "FREE" | "CORE" | "PRO" | "ELITE";

export type AutopilotGame = {
  key: string;
  name: string;
  plan: AutopilotPlan; // cheapest plan that includes the game
  style: "timed" | "lobby" | "open" | "phased";
  closesAfter?: number; // open-ended games: default minutes before Autopilot closes them
};

export const AUTOPILOT_GAMES: AutopilotGame[] = [
  { key: "trivia", name: "Trivia", plan: "PRO", style: "lobby" },
  { key: "quiz", name: "Quiz", plan: "CORE", style: "timed" },
  { key: "riddle", name: "Riddle", plan: "FREE", style: "open", closesAfter: 30 },
  { key: "cipher", name: "Cipher", plan: "CORE", style: "timed" },
  { key: "hidden", name: "Hidden Word", plan: "CORE", style: "open", closesAfter: 30 },
  { key: "true_false", name: "True or False", plan: "FREE", style: "timed" },
  { key: "reflex", name: "Reflex Arena", plan: "ELITE", style: "lobby" },
  { key: "emoji", name: "Emoji Race", plan: "ELITE", style: "lobby" },
  { key: "typing", name: "Speed Typing", plan: "ELITE", style: "timed" },
  { key: "meme", name: "Meme War", plan: "PRO", style: "phased" },
  { key: "caption", name: "Caption This", plan: "PRO", style: "phased" },
  { key: "hot", name: "Hot Takes", plan: "ELITE", style: "phased" },
  { key: "gif", name: "GIF Battle", plan: "PRO", style: "phased" },
  { key: "truths", name: "Two Truths & A Lie", plan: "PRO", style: "timed" },
  { key: "story", name: "Story Chain", plan: "CORE", style: "open", closesAfter: 120 },
  { key: "puzzle", name: "Puzzle Drop", plan: "ELITE", style: "open", closesAfter: 30 },
  { key: "wyr", name: "Would You Rather", plan: "FREE", style: "timed" },
];

export const PLAN_ORDER: AutopilotPlan[] = ["FREE", "CORE", "PRO", "ELITE"];
export const PLAN_LABELS: Record<AutopilotPlan, string> = { FREE: "Free", CORE: "Core", PRO: "Pro", ELITE: "Elite" };

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function gameByKey(key: string): AutopilotGame | undefined {
  return AUTOPILOT_GAMES.find((game) => game.key === key);
}

export function gameName(key: string): string {
  return key === "custom" ? "Custom game" : gameByKey(key)?.name ?? key;
}

export function planIncludes(plan: AutopilotPlan, game: AutopilotGame): boolean {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(game.plan);
}

/** e.g. "Every Monday at 20:00 (Asia/Karachi)". */
export function whenText(weekday: number, hour: number, minute: number, timezone: string): string {
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const day = weekday === -1 ? "Every day" : `Every ${DAYS[weekday] ?? "day"}`;
  return `${day} at ${time} (${timezone})`;
}
