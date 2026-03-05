import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

const GRID = 8;

// --- Fake placeholder data (swap with real data later) ---
const SAMPLE_GOALS = [
  {
    id: "1",
    title: "House Down Payment",
    icon: "🏠",
    targetAmount: 15000,
    currentAmount: 4200,
    weeksEstimate: 24,
  },
  {
    id: "2",
    title: "Anniversary Gift",
    icon: "🎁",
    targetAmount: 250,
    currentAmount: 90,
    weeksEstimate: 5,
  },
];

function formatMoney(n) {
  // simple formatting, no Intl needed (keeps dependencies minimal)
  const rounded = Math.round(n);
  return `$${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function clamp01(x) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function GoalCard({ goal, expanded, onToggle }) {
  const progress = clamp01(goal.currentAmount / goal.targetAmount);
  const progressPercent = Math.round(progress * 100);

  return (
    <View style={styles.card}>
      {/* Collapsed Row (always visible) */}
      <TouchableOpacity activeOpacity={0.8} onPress={onToggle} style={styles.row}>
        <View style={styles.rowLeft}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>{goal.icon}</Text>
          </View>

          <View style={styles.rowMain}>
            <Text style={styles.goalTitle} numberOfLines={1}>
              {goal.title}
            </Text>
            <Text style={styles.goalSub}>
              {formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.rowRight}>
          <View style={styles.quickAddRow}>
            <TouchableOpacity style={styles.quickBtn} activeOpacity={0.8}>
              <Text style={styles.quickBtnText}>+10</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} activeOpacity={0.8}>
              <Text style={styles.quickBtnText}>+25</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} activeOpacity={0.8}>
              <Text style={styles.quickBtnText}>+50</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.chevron}>{expanded ? "˄" : "˅"}</Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expanded}>
          {/* Title Row */}
          <View style={styles.expandedHeader}>
            <View style={styles.expandedHeaderLeft}>
              <View style={styles.iconCircleSm}>
                <Text style={styles.iconText}>{goal.icon}</Text>
              </View>
              <Text style={styles.expandedTitle} numberOfLines={1}>
                {goal.title}
              </Text>
            </View>

            <Text style={styles.weeksText}>{goal.weeksEstimate} weeks</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{progressPercent}%</Text>
          </View>

          {/* Amount */}
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount:</Text>
            <Text style={styles.amountValue}>{formatMoney(goal.targetAmount)}</Text>
          </View>

          {/* Add Money Buttons */}
          <View style={styles.addGrid}>
            {["+10", "+25", "+50", "+100", "+200", "+…"].map((t) => (
              <TouchableOpacity key={t} style={styles.addBtn} activeOpacity={0.85}>
                <Text style={styles.addBtnText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function Screen() {
  const goals = useMemo(() => SAMPLE_GOALS, []);
  const [expandedId, setExpandedId] = useState(goals[0]?.id ?? null);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
          <Text style={styles.iconButtonText}>＋</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Goals</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.smallButton} activeOpacity={0.85}>
            <Text style={styles.smallButtonText}>Sort</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} activeOpacity={0.85}>
            <Text style={styles.smallButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <View style={styles.list}>
        {goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            expanded={expandedId === g.id}
            onToggle={() => setExpandedId((prev) => (prev === g.id ? null : g.id))}
          />
        ))}
      </View>

      {/* Bottom padding so last card isn't glued to bottom */}
      <View style={{ height: GRID * 3 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: GRID * 2, // 16
    paddingTop: GRID * 6, // 48
    backgroundColor: "#F6F7F9",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: GRID * 3, // 24
  },

  iconButton: {
    width: GRID * 5, // 40
    height: GRID * 5, // 40
    borderRadius: GRID * 2.5, // 20
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8EC",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonText: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 22,
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
  },

  headerRight: {
    flexDirection: "row",
    gap: GRID, // 8
  },

  smallButton: {
    height: GRID * 5, // 40
    paddingHorizontal: GRID * 2, // 16
    borderRadius: GRID, // 8
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8EC",
    alignItems: "center",
    justifyContent: "center",
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  list: {
    gap: GRID * 2, // 16
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: GRID * 1.5, // 12
    borderWidth: 1,
    borderColor: "#E6E8EC",
    overflow: "hidden",
  },

  row: {
    padding: GRID * 2, // 16
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: GRID * 2, // 16
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: GRID * 1.5, // 12
  },

  iconCircle: {
    width: GRID * 5, // 40
    height: GRID * 5, // 40
    borderRadius: GRID * 2.5, // 20
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleSm: {
    width: GRID * 4, // 32
    height: GRID * 4, // 32
    borderRadius: GRID * 2, // 16
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 18,
  },

  rowMain: {
    flex: 1,
    minWidth: 0,
  },

  goalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: GRID / 2, // 4
  },
  goalSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  rowRight: {
    alignItems: "flex-end",
    gap: GRID, // 8
  },

  quickAddRow: {
    flexDirection: "row",
    gap: GRID, // 8
  },
  quickBtn: {
    height: GRID * 4, // 32
    paddingHorizontal: GRID * 1.5, // 12
    borderRadius: GRID, // 8
    borderWidth: 1,
    borderColor: "#D8DCE2",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111",
  },

  chevron: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: "800",
    lineHeight: 18,
  },

  expanded: {
    borderTopWidth: 1,
    borderTopColor: "#E6E8EC",
    padding: GRID * 2, // 16
    gap: GRID * 2, // 16
  },

  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: GRID * 2, // 16
  },
  expandedHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: GRID * 1.5, // 12
    flex: 1,
    minWidth: 0,
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
    flex: 1,
  },
  weeksText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
  },

  progressWrap: {
    gap: GRID, // 8
  },
  progressTrack: {
    height: GRID * 1.5, // 12
    borderRadius: GRID, // 8-ish
    backgroundColor: "#EEF0F3",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2ECC71",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: GRID, // 8
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111",
  },

  addGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID, // 8
  },
  addBtn: {
    width: "31%", // rough 3-column grid with gaps; simple + works well
    height: GRID * 5, // 40
    borderRadius: GRID, // 8
    borderWidth: 1,
    borderColor: "#D8DCE2",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111",
  },
});