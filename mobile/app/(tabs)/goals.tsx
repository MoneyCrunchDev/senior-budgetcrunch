import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from "react-native";

const GRID = 8;

type Goal = {
  id: string;
  title: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  weeksEstimate: number;
};

const SAMPLE_GOALS: Goal[] = [
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

const ICON_OPTIONS = ["🎯", "🏠", "🚗", "🎁", "✈️", "💻", "📚", "💍", "🛋️", "🎓"];

function formatMoney(n: number): string {
  const rounded = Math.round(n);
  return `$${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

type GoalCardProps = {
  goal: Goal;
  expanded: boolean;
  deleteMode: boolean;
  onToggle: () => void;
  onAddMoney: (goalId: string, amount: number) => void;
  onDeletePress: (goalId: string) => void;
  onOpenCustomAmount: (goalId: string) => void;
};

function GoalCard({
  goal,
  expanded,
  deleteMode,
  onToggle,
  onAddMoney,
  onDeletePress,
  onOpenCustomAmount,
}: GoalCardProps) {
  const progress = clamp01(goal.currentAmount / goal.targetAmount);
  const progressPercent = Math.round(progress * 100);
  const isComplete = goal.currentAmount >= goal.targetAmount;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  function handleCardPress() {
    if (deleteMode) {
      onDeletePress(goal.id);
      return;
    }
    onToggle();
  }

  return (
    <View style={[styles.card, deleteMode && styles.cardDeleteMode]}>
      <TouchableOpacity activeOpacity={0.8} onPress={handleCardPress} style={styles.row}>
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
          {!deleteMode && (
            <View style={styles.quickAddRow}>
              {[10, 25, 50].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.quickBtn,
                    isComplete && styles.disabledButton,
                  ]}
                  activeOpacity={0.8}
                  disabled={isComplete}
                  onPress={() => onAddMoney(goal.id, amount)}
                >
                  <Text
                    style={[
                      styles.quickBtnText,
                      isComplete && styles.disabledButtonText,
                    ]}
                  >
                    +${amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.chevron}>
            {deleteMode ? "−" : expanded ? "˄" : "˅"}
          </Text>
        </View>
      </TouchableOpacity>

      {!deleteMode && (
        <View style={styles.alwaysVisibleProgressSection}>
          {isComplete && (
            <View style={styles.completeBanner}>
              <Text style={styles.completeBannerText}>Goal completed 🎉</Text>
            </View>
          )}

          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.progressMetaRow}>
              <Text style={styles.progressLabel}>{progressPercent}% saved</Text>
              <Text style={styles.progressLabel}>{formatMoney(remaining)} left</Text>
            </View>
          </View>
        </View>
      )}

      {expanded && !deleteMode && (
        <View style={styles.expanded}>
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

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Goal Amount:</Text>
            <Text style={styles.amountValue}>{formatMoney(goal.targetAmount)}</Text>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Saved So Far:</Text>
            <Text style={styles.amountValue}>{formatMoney(goal.currentAmount)}</Text>
          </View>

          <View style={styles.addGrid}>
            {[10, 25, 50, 100, 200].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.addBtn,
                  isComplete && styles.disabledButton,
                ]}
                activeOpacity={0.85}
                disabled={isComplete}
                onPress={() => onAddMoney(goal.id, amount)}
              >
                <Text
                  style={[
                    styles.addBtnText,
                    isComplete && styles.disabledButtonText,
                  ]}
                >
                  +${amount}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.addBtn,
                isComplete && styles.disabledButton,
              ]}
              activeOpacity={0.85}
              disabled={isComplete}
              onPress={() => onOpenCustomAmount(goal.id)}
            >
              <Text
                style={[
                  styles.addBtnText,
                  isComplete && styles.disabledButtonText,
                ]}
              >
                . . .
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function Screen() {
  const initialGoals = useMemo(() => SAMPLE_GOALS, []);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [expandedId, setExpandedId] = useState<string | null>(initialGoals[0]?.id ?? null);

  const [sortMode, setSortMode] = useState<"default" | "progress" | "amount">("default");
  const [filterMode, setFilterMode] = useState<"all" | "active" | "completed">("all");

  const [deleteMode, setDeleteMode] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🎯");
  const [newTargetAmount, setNewTargetAmount] = useState("");
  const [newWeeksEstimate, setNewWeeksEstimate] = useState("");

  const [showCustomAmountModal, setShowCustomAmountModal] = useState(false);
  const [customGoalId, setCustomGoalId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  function handleAddMoney(goalId: string, amount: number) {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;

        if (goal.currentAmount >= goal.targetAmount) {
          return goal;
        }

        const wasComplete = goal.currentAmount >= goal.targetAmount;
        const updatedAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
        const nowComplete = updatedAmount >= goal.targetAmount;

        if (!wasComplete && nowComplete) {
          setTimeout(() => {
            Alert.alert("Goal completed!", `${goal.title} is fully funded.`);
          }, 0);
        }

        return {
          ...goal,
          currentAmount: updatedAmount,
        };
      })
    );
  }

  function handleOpenCustomAmount(goalId: string) {
    setCustomGoalId(goalId);
    setCustomAmount("");
    setShowCustomAmountModal(true);
  }

  function handleSubmitCustomAmount() {
    if (!customGoalId) return;

    const amount = Number(customAmount);

    if (!amount || amount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount.");
      return;
    }

    handleAddMoney(customGoalId, amount);
    setShowCustomAmountModal(false);
    setCustomGoalId(null);
    setCustomAmount("");
  }

  function handleDeleteGoal(goalId: string) {
    const goalToDelete = goals.find((goal) => goal.id === goalId);

    Alert.alert(
      "Delete Goal",
      `Delete "${goalToDelete?.title ?? "this goal"}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
            setExpandedId((prev) => (prev === goalId ? null : prev));
          },
        },
      ]
    );
  }

  function handleOpenAddGoal() {
    setNewTitle("");
    setSelectedIcon("🎯");
    setNewTargetAmount("");
    setNewWeeksEstimate("");
    setShowAddModal(true);
  }

  function handleCreateGoal() {
    const trimmedTitle = newTitle.trim();
    const target = Number(newTargetAmount);
    const weeks = Number(newWeeksEstimate);

    if (!trimmedTitle) {
      Alert.alert("Missing title", "Please enter a goal title.");
      return;
    }

    if (!target || target <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid goal amount.");
      return;
    }

    if (!weeks || weeks <= 0) {
      Alert.alert("Invalid weeks", "Please enter a valid number of weeks.");
      return;
    }

    const createdGoal: Goal = {
      id: Date.now().toString(),
      title: trimmedTitle,
      icon: selectedIcon,
      targetAmount: target,
      currentAmount: 0,
      weeksEstimate: weeks,
    };

    setGoals((prev) => [createdGoal, ...prev]);
    setExpandedId(createdGoal.id);
    setShowAddModal(false);
  }

  function handleSortPress() {
    setSortMode((prev) => {
      if (prev === "default") return "progress";
      if (prev === "progress") return "amount";
      return "default";
    });
  }

  function handleFilterPress() {
    setFilterMode((prev) => {
      if (prev === "all") return "active";
      if (prev === "active") return "completed";
      return "all";
    });
  }

  const visibleGoals = useMemo(() => {
    let nextGoals = [...goals];

    if (filterMode === "active") {
      nextGoals = nextGoals.filter((goal) => goal.currentAmount < goal.targetAmount);
    }

    if (filterMode === "completed") {
      nextGoals = nextGoals.filter((goal) => goal.currentAmount >= goal.targetAmount);
    }

    if (sortMode === "progress") {
      nextGoals.sort(
        (a, b) =>
          b.currentAmount / b.targetAmount - a.currentAmount / a.targetAmount
      );
    }

    if (sortMode === "amount") {
      nextGoals.sort((a, b) => b.targetAmount - a.targetAmount);
    }

    return nextGoals;
  }, [goals, sortMode, filterMode]);

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.85}
              onPress={handleOpenAddGoal}
            >
              <Text style={styles.iconButtonText}>＋</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, deleteMode && styles.iconButtonDanger]}
              activeOpacity={0.85}
              onPress={() => setDeleteMode((prev) => !prev)}
            >
              <Text style={[styles.iconButtonText, deleteMode && styles.iconButtonDangerText]}>
                －
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitle}>Goals</Text>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.smallButton}
              activeOpacity={0.85}
              onPress={handleSortPress}
            >
              <Text style={styles.smallButtonText}>Sort</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallButton}
              activeOpacity={0.85}
              onPress={handleFilterPress}
            >
              <Text style={styles.smallButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerStatusRow}>
          <Text style={styles.headerStatusText}>Sort: {sortMode}</Text>
          <Text style={styles.headerStatusText}>Filter: {filterMode}</Text>
        </View>

        {deleteMode && (
          <View style={styles.deleteModeBanner}>
            <Text style={styles.deleteModeBannerText}>
              Delete mode is on. Tap a goal to remove it.
            </Text>
          </View>
        )}

        <View style={styles.list}>
          {visibleGoals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              expanded={expandedId === g.id}
              deleteMode={deleteMode}
              onToggle={() => setExpandedId((prev) => (prev === g.id ? null : g.id))}
              onAddMoney={handleAddMoney}
              onDeletePress={handleDeleteGoal}
              onOpenCustomAmount={handleOpenCustomAmount}
            />
          ))}
        </View>

        {visibleGoals.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No goals to show</Text>
            <Text style={styles.emptyStateSub}>
              Try changing the filter or add a new goal.
            </Text>
          </View>
        )}

        <View style={{ height: GRID * 3 }} />
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Goal</Text>

            <Text style={styles.modalLabel}>Goal Name</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Ex: New Car"
              style={styles.modalInput}
              placeholderTextColor="#9AA2AF"
            />

            <Text style={styles.modalLabel}>Choose an Icon</Text>
            <View style={styles.iconPickerGrid}>
              {ICON_OPTIONS.map((icon) => {
                const isSelected = selectedIcon === icon;
                return (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconPickerButton,
                      isSelected && styles.iconPickerButtonSelected,
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.iconPickerText}>{icon}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalLabel}>Target Amount</Text>
            <TextInput
              value={newTargetAmount}
              onChangeText={setNewTargetAmount}
              placeholder="5000"
              keyboardType="numeric"
              style={styles.modalInput}
              placeholderTextColor="#9AA2AF"
            />

            <Text style={styles.modalLabel}>Weeks Estimate</Text>
            <TextInput
              value={newWeeksEstimate}
              onChangeText={setNewWeeksEstimate}
              placeholder="12"
              keyboardType="numeric"
              style={styles.modalInput}
              placeholderTextColor="#9AA2AF"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleCreateGoal}
              >
                <Text style={styles.modalPrimaryButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCustomAmountModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomAmountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Custom Amount</Text>

            <Text style={styles.modalLabel}>Amount</Text>
            <TextInput
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder="Ex: 375"
              keyboardType="numeric"
              style={styles.modalInput}
              placeholderTextColor="#9AA2AF"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => {
                  setShowCustomAmountModal(false);
                  setCustomGoalId(null);
                  setCustomAmount("");
                }}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleSubmitCustomAmount}
              >
                <Text style={styles.modalPrimaryButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: GRID * 2,
    paddingTop: GRID * 6,
    backgroundColor: "#F6F7F9",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: GRID * 2,
  },

  headerLeft: {
    flexDirection: "row",
    gap: GRID,
  },

  iconButton: {
    width: GRID * 5,
    height: GRID * 5,
    borderRadius: GRID * 2.5,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8EC",
    alignItems: "center",
    justifyContent: "center",
  },

  iconButtonDanger: {
    backgroundColor: "#FFF1F1",
    borderColor: "#F3C1C1",
  },

  iconButtonText: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 22,
    color: "#111",
  },

  iconButtonDangerText: {
    color: "#C62828",
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
    gap: GRID,
  },

  smallButton: {
    height: GRID * 5,
    paddingHorizontal: GRID * 2,
    borderRadius: GRID,
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

  headerStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: GRID * 2,
  },

  headerStatusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "capitalize",
  },

  deleteModeBanner: {
    marginBottom: GRID * 2,
    paddingVertical: GRID * 1.5,
    paddingHorizontal: GRID * 2,
    borderRadius: GRID,
    backgroundColor: "#FFF1F1",
    borderWidth: 1,
    borderColor: "#F3C1C1",
  },

  deleteModeBannerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#C62828",
  },

  list: {
    gap: GRID * 2,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: GRID * 1.5,
    borderWidth: 1,
    borderColor: "#E6E8EC",
    overflow: "hidden",
  },

  cardDeleteMode: {
    borderColor: "#F3C1C1",
  },

  row: {
    padding: GRID * 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: GRID * 2,
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: GRID * 1.5,
  },

  iconCircle: {
    width: GRID * 5,
    height: GRID * 5,
    borderRadius: GRID * 2.5,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
  },

  iconCircleSm: {
    width: GRID * 4,
    height: GRID * 4,
    borderRadius: GRID * 2,
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
    marginBottom: GRID / 2,
  },

  goalSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  rowRight: {
    alignItems: "flex-end",
    gap: GRID,
  },

  quickAddRow: {
    flexDirection: "row",
    gap: GRID,
  },

  quickBtn: {
    height: GRID * 4,
    paddingHorizontal: GRID * 1.5,
    borderRadius: GRID,
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

  disabledButton: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },

  disabledButtonText: {
    color: "#9CA3AF",
  },

  chevron: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: "800",
    lineHeight: 18,
  },

  alwaysVisibleProgressSection: {
    paddingHorizontal: GRID * 2,
    paddingBottom: GRID * 2,
    gap: GRID,
  },

  expanded: {
    borderTopWidth: 1,
    borderTopColor: "#E6E8EC",
    padding: GRID * 2,
    gap: GRID * 2,
  },

  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: GRID * 2,
  },

  expandedHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: GRID * 1.5,
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

  completeBanner: {
    backgroundColor: "#E9F9EF",
    borderWidth: 1,
    borderColor: "#BFE8CA",
    paddingVertical: GRID * 1.5,
    paddingHorizontal: GRID * 2,
    borderRadius: GRID,
  },

  completeBannerText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F7A3D",
  },

  progressWrap: {
    gap: GRID,
  },

  progressTrack: {
    height: GRID * 1.5,
    borderRadius: GRID,
    backgroundColor: "#EEF0F3",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#2ECC71",
  },

  progressMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  progressLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: GRID,
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
    gap: GRID,
  },

  addBtn: {
    width: "31%",
    height: GRID * 5,
    borderRadius: GRID,
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

  emptyState: {
    marginTop: GRID * 2,
    padding: GRID * 3,
    borderRadius: GRID * 1.5,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8EC",
    alignItems: "center",
  },

  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: GRID,
  },

  emptyStateSub: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: GRID * 2,
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: GRID * 2,
    padding: GRID * 3,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    marginBottom: GRID * 2,
  },

  modalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: GRID,
    marginTop: GRID,
  },

  modalInput: {
    height: GRID * 6,
    borderWidth: 1,
    borderColor: "#D8DCE2",
    borderRadius: GRID,
    paddingHorizontal: GRID * 1.5,
    fontSize: 16,
    color: "#111",
    backgroundColor: "#FFF",
  },

  iconPickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID,
    marginBottom: GRID,
  },

  iconPickerButton: {
    width: GRID * 6,
    height: GRID * 6,
    borderRadius: GRID,
    borderWidth: 1,
    borderColor: "#D8DCE2",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },

  iconPickerButtonSelected: {
    borderColor: "#111",
    backgroundColor: "#F3F4F6",
  },

  iconPickerText: {
    fontSize: 24,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: GRID,
    marginTop: GRID * 3,
  },

  modalSecondaryButton: {
    height: GRID * 5,
    paddingHorizontal: GRID * 2,
    borderRadius: GRID,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  modalSecondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  modalPrimaryButton: {
    height: GRID * 5,
    paddingHorizontal: GRID * 2,
    borderRadius: GRID,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },

  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});