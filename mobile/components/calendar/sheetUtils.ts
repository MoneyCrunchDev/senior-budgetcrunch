import { Ionicons } from "@expo/vector-icons";
import type { WeekSummaryStatus } from "./sheetTypes";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatDateNice(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export const STATUS_META: Record<
  WeekSummaryStatus,
  {
    label: string;
    bg: string;
    fg: string;
    icon: keyof typeof Ionicons.glyphMap;
    explanation: string;
  }
> = {
  track: {
    label: "On Track",
    bg: "#E8F5E9",
    fg: "#1B5E20",
    icon: "checkmark-circle",
    explanation:
      "Every day this week, all your budgeted categories stayed within their daily targets. Great pacing!",
  },
  caution: {
    label: "Needs Attention",
    bg: "#FFF9C4",
    fg: "#F57F17",
    icon: "alert-circle",
    explanation:
      "1–2 days this week had at least one category exceed its daily target. Your overall spending may still be under budget, but your daily pacing was off on those days.",
  },
  over: {
    label: "Off Track",
    bg: "#FFEBEE",
    fg: "#C62828",
    icon: "warning",
    explanation:
      "3 or more days this week had at least one category over its daily target. Even if total spending looks low, the daily pattern suggests overspending habits forming.",
  },
};
