import type { Transaction } from "@/lib/plaidApi";

export type CategoryDayInfo = {
  slug: string;
  name: string;
  color: string;
  spent: number;
  dailyBudget: number;
  isOver: boolean;
};

export type DaySummary = {
  budgetedRows: CategoryDayInfo[];
  unbudgetedTotal: number;
  totalSpent: number;
  isRedDay: boolean;
  hasBudgets: boolean;
  transactions: Transaction[];
};

export type WeekSummaryStatus = "track" | "caution" | "over";

export type WeekSummary = {
  key: string;
  rangeLabel: string;
  redCount: number;
  spent: number;
  weeklyBudget: number;
  status: WeekSummaryStatus;
  dates: string[];
};

export type CategoryWeekInfo = {
  slug: string;
  name: string;
  color: string;
  spent: number;
  weeklyBudget: number;
  isOver: boolean;
};

export type WeekInsight = {
  rangeLabel: string;
  status: WeekSummaryStatus;
  spent: number;
  weeklyBudget: number;
  redCount: number;
  categoryRows: CategoryWeekInfo[];
  unbudgetedTotal: number;
  redDayDates: string[];
};
