import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import {
  CalendarDaySheetContent,
  CalendarWeekSheetContent,
  formatMoney,
  MONTHS,
  sheetContentStyles,
  STATUS_META,
  type CategoryDayInfo,
  type CategoryWeekInfo,
  type DaySummary,
  type WeekInsight,
  type WeekSummary,
  type WeekSummaryStatus,
} from "@/components/calendar";
import ModalBottomSheet from "@/components/ModalBottomSheet";
import { useTransactions } from "@/context/TransactionContext";
import { useActivityCategories } from "@/context/ActivityCategoriesContext";
import { getPrimarySlug } from "@/lib/categoryHelpers";
import { colors, fontSize, fontWeight, radius, spacing } from "@/theme";

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** All 7 date keys for the week starting on Sunday `sundayStr`. */
function weekDatesFromSunday(sundayStr: string): string[] {
  const start = new Date(sundayStr + "T00:00:00");
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(toDateKey(d));
  }
  return out;
}

function dateInMonth(
  dateStr: string,
  year: number,
  month: number
): boolean {
  const d = new Date(dateStr + "T00:00:00");
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

function shortMonthDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

// ─── Component ───────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { height } = useWindowDimensions();
  const { transactions, loadTransactions } = useTransactions();
  const { categories, refreshPrefs } = useActivityCategories();

  const sheetRef = useRef<BottomSheet>(null);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedWeekKey, setSelectedWeekKey] = useState<string | null>(null);
  const [sheetMode, setSheetMode] = useState<"day" | "week">("day");
  const snapPoints = useMemo(() => [Math.round(height * 0.70)], [height]);

  const now = useMemo(() => new Date(), []);
  const [displayedMonth, setDisplayedMonth] = useState(now.getMonth() + 1);
  const [displayedYear, setDisplayedYear] = useState(now.getFullYear());

  const openSheet = useCallback(() => {
    requestAnimationFrame(() => {
      sheetRef.current?.snapToIndex(0);
    });
  }, []);

  const onListRefresh = useCallback(async () => {
    setListRefreshing(true);
    try {
      await Promise.all([loadTransactions(), refreshPrefs()]);
    } finally {
      setListRefreshing(false);
    }
  }, [loadTransactions, refreshPrefs]);

  // ── 1. Daily spending per category ──────────────────────────────────
  // Map<dateStr, Map<categorySlug, totalAmount>>
  const dailySpendByCat = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const t of transactions) {
      if (t.amount <= 0 || !t.date) continue;
      const slug = getPrimarySlug(t);
      if (!map.has(t.date)) map.set(t.date, new Map());
      const dayMap = map.get(t.date)!;
      dayMap.set(slug, (dayMap.get(slug) ?? 0) + t.amount);
    }
    return map;
  }, [transactions]);

  // Map<dateStr, totalSpent> (all outflows, budgeted or not)
  const dailyTotalSpend = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.amount <= 0 || !t.date) continue;
      map.set(t.date, (map.get(t.date) ?? 0) + t.amount);
    }
    return map;
  }, [transactions]);

  // ── 2. Daily budgets per category for the displayed month ───────────
  const daysInMonth = new Date(displayedYear, displayedMonth, 0).getDate();

  const budgetedCategories = useMemo(
    () => categories.filter((c) => c.budget > 0),
    [categories]
  );

  const dailyBudgets = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of budgetedCategories) {
      map.set(cat.id, cat.budget / daysInMonth);
    }
    return map;
  }, [budgetedCategories, daysInMonth]);

  const hasBudgets = budgetedCategories.length > 0;

  const totalMonthlyBudget = useMemo(
    () => budgetedCategories.reduce((s, c) => s + c.budget, 0),
    [budgetedCategories]
  );

  // ── 3. Day status (green / red / neutral) ───────────────────────────
  type DayStatus = "green" | "red" | "neutral";

  const dayStatuses = useMemo(() => {
    const map = new Map<string, DayStatus>();

    for (const [dateStr, catMap] of dailySpendByCat) {
      if (!hasBudgets) {
        map.set(dateStr, "neutral");
        continue;
      }

      let anyBudgetedSpending = false;
      let anyOver = false;

      for (const [slug, dailyBudget] of dailyBudgets) {
        const spent = catMap.get(slug) ?? 0;
        if (spent > 0) anyBudgetedSpending = true;
        if (spent > dailyBudget) anyOver = true;
      }

      if (anyOver) map.set(dateStr, "red");
      else if (anyBudgetedSpending) map.set(dateStr, "green");
      else map.set(dateStr, "neutral");
    }

    return map;
  }, [dailySpendByCat, dailyBudgets, hasBudgets]);

  // ── 4. Calendar marks: subtle tints only (no borders, no week bands) ─
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    const todayStr = toDateKey(new Date());

    for (const [dateStr, status] of dayStatuses) {
      if (status === "green") {
        marks[dateStr] = {
          customStyles: {
            container: {
              backgroundColor: colors.successSoft,
              borderRadius: radius.md,
            },
            text: { color: colors.textSecondary, fontWeight: fontWeight.medium },
          },
        };
      } else if (status === "red") {
        marks[dateStr] = {
          customStyles: {
            container: {
              backgroundColor: colors.dangerSoft,
              borderRadius: radius.md,
            },
            text: { color: colors.textSecondary, fontWeight: fontWeight.medium },
          },
        };
      }
    }

    // Today highlight: info text + soft info tint
    marks[todayStr] = {
      ...marks[todayStr],
      customStyles: {
        ...marks[todayStr]?.customStyles,
        container: {
          ...marks[todayStr]?.customStyles?.container,
          backgroundColor:
            marks[todayStr]?.customStyles?.container?.backgroundColor ??
            colors.infoSoft,
          borderRadius: radius.md,
        },
        text: {
          ...marks[todayStr]?.customStyles?.text,
          color: colors.info,
          fontWeight: fontWeight.bold,
        },
      },
    };

    // Selected day: keep tint, add an accent bar at the bottom
    if (selectedDate) {
      const existing = marks[selectedDate]?.customStyles?.container ?? {};
      const existingText = marks[selectedDate]?.customStyles?.text ?? {};
      marks[selectedDate] = {
        customStyles: {
          container: {
            ...existing,
            backgroundColor: existing.backgroundColor ?? colors.divider,
            borderRadius: radius.md,
            borderBottomWidth: 3,
            borderBottomColor: colors.primary,
          },
          text: {
            ...existingText,
            color: existingText.color === colors.info ? colors.info : colors.textPrimary,
            fontWeight: fontWeight.bold,
          },
        },
      };
    }

    return marks;
  }, [dayStatuses, selectedDate]);

  // ── 4b. Weekly summaries for the list below the calendar ────────────
  const weeklySummaries = useMemo((): WeekSummary[] => {
    if (!hasBudgets || totalMonthlyBudget <= 0) return [];

    const y = displayedYear;
    const m = displayedMonth;
    const weeklyBudgetAlloc = (totalMonthlyBudget / daysInMonth) * 7;
    const last = new Date(y, m - 1, daysInMonth);

    const sun = new Date(y, m - 1, 1);
    sun.setDate(sun.getDate() - sun.getDay());

    const out: WeekSummary[] = [];

    while (true) {
      const dates = weekDatesFromSunday(toDateKey(sun));
      const touchesMonth = dates.some((d) => dateInMonth(d, y, m));

      if (!touchesMonth) {
        if (sun.getTime() > last.getTime()) break;
        sun.setDate(sun.getDate() + 7);
        continue;
      }

      let redCount = 0;
      let spent = 0;
      for (const d of dates) {
        if (dayStatuses.get(d) === "red") redCount++;
        spent += dailyTotalSpend.get(d) ?? 0;
      }

      const status: WeekSummaryStatus =
        redCount === 0 ? "track" : redCount <= 2 ? "caution" : "over";

      const inMonthDates = dates.filter((d) => dateInMonth(d, y, m));
      const rangeLabel =
        inMonthDates.length > 0
          ? `${shortMonthDay(inMonthDates[0])} – ${shortMonthDay(
              inMonthDates[inMonthDates.length - 1]
            )}`
          : `${shortMonthDay(dates[0])} – ${shortMonthDay(dates[6])}`;

      out.push({
        key: toDateKey(sun),
        rangeLabel,
        redCount,
        spent: Math.round(spent * 100) / 100,
        weeklyBudget: Math.round(weeklyBudgetAlloc * 100) / 100,
        status,
        dates,
      });

      sun.setDate(sun.getDate() + 7);
      if (sun.getTime() > last.getTime() + 6 * 86400000) break;
    }

    return out;
  }, [
    hasBudgets,
    totalMonthlyBudget,
    daysInMonth,
    displayedYear,
    displayedMonth,
    dayStatuses,
    dailyTotalSpend,
  ]);

  // ── 5. Build day summary for the bottom sheet ───────────────────────
  const daySummary = useMemo<DaySummary | null>(() => {
    if (!selectedDate) return null;

    const catMap = dailySpendByCat.get(selectedDate);
    const totalSpent = dailyTotalSpend.get(selectedDate) ?? 0;

    const dayTxns = transactions.filter(
      (t) => t.date === selectedDate && t.amount > 0
    );

    const budgetedRows: CategoryDayInfo[] = [];
    let budgetedSpendTotal = 0;
    let isRedDay = false;

    for (const cat of budgetedCategories) {
      const spent = catMap?.get(cat.id) ?? 0;
      const db = dailyBudgets.get(cat.id) ?? 0;
      const over = spent > db;
      if (over) isRedDay = true;
      budgetedSpendTotal += spent;
      budgetedRows.push({
        slug: cat.id,
        name: cat.name,
        color: cat.color,
        spent: Math.round(spent * 100) / 100,
        dailyBudget: Math.round(db * 100) / 100,
        isOver: over,
      });
    }

    budgetedRows.sort((a, b) => b.spent - a.spent);

    const unbudgetedTotal =
      Math.round(Math.max(totalSpent - budgetedSpendTotal, 0) * 100) / 100;

    return {
      budgetedRows,
      unbudgetedTotal,
      totalSpent: Math.round(totalSpent * 100) / 100,
      isRedDay,
      hasBudgets,
      transactions: dayTxns,
    };
  }, [
    selectedDate,
    dailySpendByCat,
    dailyTotalSpend,
    transactions,
    budgetedCategories,
    dailyBudgets,
    hasBudgets,
  ]);

  // ── 5b. Build week insight for the bottom sheet ─────────────────────
  const weekInsight = useMemo<WeekInsight | null>(() => {
    if (!selectedWeekKey || !hasBudgets) return null;
    const week = weeklySummaries.find((w) => w.key === selectedWeekKey);
    if (!week) return null;

    const weeklyBudgetPerCat = new Map<string, number>();
    for (const cat of budgetedCategories) {
      weeklyBudgetPerCat.set(cat.id, (cat.budget / daysInMonth) * 7);
    }

    const catSpend = new Map<string, number>();
    let totalBudgeted = 0;
    const redDayDates: string[] = [];

    for (const d of week.dates) {
      if (dayStatuses.get(d) === "red") redDayDates.push(d);
      const catMap = dailySpendByCat.get(d);
      if (!catMap) continue;
      for (const [slug, amt] of catMap) {
        catSpend.set(slug, (catSpend.get(slug) ?? 0) + amt);
      }
    }

    const categoryRows: CategoryWeekInfo[] = [];
    for (const cat of budgetedCategories) {
      const spent = Math.round((catSpend.get(cat.id) ?? 0) * 100) / 100;
      const wb = Math.round((weeklyBudgetPerCat.get(cat.id) ?? 0) * 100) / 100;
      totalBudgeted += spent;
      categoryRows.push({
        slug: cat.id,
        name: cat.name,
        color: cat.color,
        spent,
        weeklyBudget: wb,
        isOver: spent > wb,
      });
    }
    categoryRows.sort((a, b) => b.spent - a.spent);

    const unbudgetedTotal =
      Math.round(Math.max(week.spent - totalBudgeted, 0) * 100) / 100;

    return {
      rangeLabel: week.rangeLabel,
      status: week.status,
      spent: week.spent,
      weeklyBudget: week.weeklyBudget,
      redCount: week.redCount,
      categoryRows,
      unbudgetedTotal,
      redDayDates,
    };
  }, [
    selectedWeekKey,
    hasBudgets,
    weeklySummaries,
    budgetedCategories,
    daysInMonth,
    dayStatuses,
    dailySpendByCat,
  ]);

  // ── 6. Event handlers ──────────────────────────────────────────────
  const handleDayPress = useCallback(
    (day: any) => {
      setSelectedDate(day.dateString);
      setSheetMode("day");
      openSheet();
    },
    [openSheet]
  );

  const handleWeekPress = useCallback(
    (weekKey: string) => {
      setSelectedWeekKey(weekKey);
      setSheetMode("week");
      openSheet();
    },
    [openSheet]
  );

  const handleMonthChange = useCallback((monthObj: any) => {
    setDisplayedMonth(monthObj.month);
    setDisplayedYear(monthObj.year);
  }, []);

  // ── 7. Render ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.screenRoot} edges={[]}>
      <ScrollView
        style={styles.scrollOuter}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={listRefreshing}
            onRefresh={onListRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Calendar
          style={styles.calendar}
          markingType="custom"
          markedDates={markedDates}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          theme={{
            backgroundColor: colors.screenBackground,
            calendarBackground: colors.screenBackground,
            monthTextColor: colors.textPrimary,
            textMonthFontWeight: fontWeight.bold,
            textSectionTitleColor: colors.textSecondary,
            textSectionTitleDisabledColor: colors.textPlaceholder,
            dayTextColor: colors.textPrimary,
            textDisabledColor: colors.textPlaceholder,
            selectedDayTextColor: colors.textPrimary,
            todayTextColor: colors.textPrimary,
            arrowColor: colors.textPrimary,
            textDayFontWeight: fontWeight.medium,
          }}
        />

        {hasBudgets && weeklySummaries.length > 0 && (
          <View style={styles.weeklySection}>
            <Text style={styles.weeklySectionTitle}>This month by week</Text>
            <Text style={styles.weeklySectionHint}>
              Status badges show daily pacing: "On Track" = no days over,
              "Needs Attention" = 1–2 days over, "Off Track" = 3+ days over a
              category's daily limit. Tap a card for the full breakdown.
            </Text>
            {weeklySummaries.map((w) => (
              <WeeklySummaryCard
                key={w.key}
                week={w}
                onPress={() => handleWeekPress(w.key)}
              />
            ))}
          </View>
        )}

        {!hasBudgets && (
          <View style={styles.noBudgetBanner}>
            <Text style={styles.noBudgetText}>
              Set monthly budgets in Activity → Categories to enable budget
              tracking on the calendar.
            </Text>
          </View>
        )}
      </ScrollView>

      <ModalBottomSheet ref={sheetRef} snapPoints={snapPoints}>
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScroll}
        >
          {sheetMode === "day" && selectedDate ? (
            <CalendarDaySheetContent
              summary={daySummary}
              dateStr={selectedDate}
            />
          ) : null}
          {sheetMode === "week" && weekInsight ? (
            <CalendarWeekSheetContent insight={weekInsight} />
          ) : null}
        </BottomSheetScrollView>
      </ModalBottomSheet>
    </SafeAreaView>
  );
}

// ─── Weekly summary card (below calendar) ────────────────────────────

function WeeklySummaryCard({
  week,
  onPress,
}: {
  week: WeekSummary;
  onPress: () => void;
}) {
  const meta = STATUS_META[week.status];

  const ratio =
    week.weeklyBudget > 0
      ? Math.min(week.spent / week.weeklyBudget, 1.5)
      : 0;
  const barPct = Math.min(100, (ratio / 1.5) * 100);
  const barColor =
    week.spent <= week.weeklyBudget ? colors.success : colors.danger;

  return (
    <TouchableOpacity
      style={styles.weekCard}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.weekCardHeader}>
        <Text style={styles.weekRange}>{week.rangeLabel}</Text>
        <View style={[sheetContentStyles.weekBadge, { backgroundColor: meta.bg }]}>
          <Text style={[sheetContentStyles.weekBadgeText, { color: meta.fg }]}>
            {meta.label}
          </Text>
        </View>
      </View>
      <Text style={styles.weekSpentLine}>
        {formatMoney(week.spent)} of {formatMoney(week.weeklyBudget)} weekly
        budget
      </Text>
      <View style={styles.weekProgressTrack}>
        <View
          style={[styles.weekProgressFill, { width: `${barPct}%`, backgroundColor: barColor }]}
        />
      </View>
      {week.redCount > 0 ? (
        <Text style={styles.weekRedFootnote}>
          <Ionicons name="alert-circle" size={12} color={colors.warningStrong} />{" "}
          {week.redCount} day{week.redCount === 1 ? "" : "s"} had a category
          exceed its daily limit
        </Text>
      ) : (
        <Text style={[styles.weekRedFootnote, { color: colors.successText }]}>
          <Ionicons name="checkmark-circle" size={12} color={colors.successText} /> All
          days within daily targets
        </Text>
      )}
      <Text style={styles.weekTapHint}>Tap for details</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  scrollOuter: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  calendar: {
    marginBottom: 0,
  },

  weeklySection: {
    marginTop: spacing.lg,
  },
  weeklySectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  weeklySectionHint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  weekCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  weekCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  weekRange: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  weekSpentLine: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  weekProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.divider,
    overflow: "hidden",
  },
  weekProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  weekRedFootnote: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  weekTapHint: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPlaceholder,
    textAlign: "right",
    marginTop: spacing.xs,
  },

  noBudgetBanner: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  noBudgetText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },

  sheetScroll: {
    paddingBottom: spacing.xl,
  },
});
