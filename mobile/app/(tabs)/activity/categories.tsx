import ModalBottomSheet from "@/components/ModalBottomSheet";
import {
  CHART_PALETTE,
  type ActivityCategory,
  useActivityCategories,
} from "@/context/ActivityCategoriesContext";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { colors, fontSize, fontWeight, radius, spacing } from "@/theme";

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function parseAmount(raw: string): number {
  const t = raw.replace(/[$,\s]/g, "").trim();
  if (t === "") return 0;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function CategoryCard({
  category,
  onEdit,
}: {
  category: ActivityCategory;
  onEdit: () => void;
}) {
  const progress =
    category.budget > 0 ? clamp01(category.spent / category.budget) : 0;
  const percent = Math.round(progress * 100);
  const remaining = Math.max(category.budget - category.spent, 0);
  const hasBudget = category.budget > 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTitleWrap}>
          <View style={styles.nameRow}>
            <View
              style={[styles.colorSwatchSmall, { backgroundColor: category.color }]}
            />
            <Text style={styles.cardTitle}>{category.name}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.85}
          onPress={onEdit}
        >
          <Text style={styles.editButtonText}>
            {hasBudget ? "Edit" : "Set Budget"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.spentText}>{formatMoney(category.spent)} spent</Text>
        {hasBudget ? (
          <Text style={styles.budgetText}>
            {formatMoney(category.budget)} budget
          </Text>
        ) : (
          <Text style={styles.noBudgetText}>No budget set</Text>
        )}
      </View>

      {hasBudget && (
        <>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percent}%`,
                  backgroundColor: percent >= 100 ? colors.danger : colors.primary,
                },
              ]}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.remainingText}>
              {formatMoney(remaining)} remaining
            </Text>
            <Text style={styles.percentText}>{percent}%</Text>
          </View>
        </>
      )}
    </View>
  );
}

function BudgetFormSheetContent({
  formLaunchKey,
  category,
  onClose,
  onSave,
}: {
  formLaunchKey: number;
  category: ActivityCategory | null;
  onClose: () => void;
  onSave: (id: string, v: { budget: number; color: string }) => void;
}) {
  const [budgetStr, setBudgetStr] = useState("");
  const [color, setColor] = useState(CHART_PALETTE[0] ?? colors.primary);

  useEffect(() => {
    if (category) {
      setBudgetStr(category.budget > 0 ? String(category.budget) : "");
      setColor(category.color);
    }
  }, [formLaunchKey, category]);

  const submit = () => {
    if (!category) return;
    const budget = parseAmount(budgetStr);
    onSave(category.id, { budget, color });
    onClose();
  };

  if (!category) return null;

  return (
    <BottomSheetScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sheetTitle}>Set Budget</Text>
      <Text style={styles.sheetCategoryName}>{category.name}</Text>
      <Text style={styles.sheetSpentLabel}>
        Current spending: {formatMoney(category.spent)}
      </Text>

      <Text style={styles.fieldLabel}>Monthly budget</Text>
      <BottomSheetTextInput
        style={styles.input}
        value={budgetStr}
        onChangeText={setBudgetStr}
        placeholder="0"
        placeholderTextColor={colors.textPlaceholder}
        keyboardType="decimal-pad"
      />

      <Text style={styles.fieldLabel}>Chart color</Text>
      <View style={styles.colorRow}>
        {CHART_PALETTE.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorChoice,
              { backgroundColor: c },
              color === c && styles.colorChoiceSelected,
            ]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      <View style={styles.sheetActions}>
        <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
          <Text style={styles.sheetCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sheetSave} onPress={submit}>
          <Text style={styles.sheetSaveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetScrollView>
  );
}

export default function Screen() {
  const { categories, ready, updateCategory } = useActivityCategories();

  const { height } = useWindowDimensions();
  const formSheetRef = useRef<BottomSheet>(null);

  const formSnapPoints = useMemo(
    () => [Math.round(height * 0.45)],
    [height]
  );

  const [formLaunchKey, setFormLaunchKey] = useState(0);
  const [editing, setEditing] = useState<ActivityCategory | null>(null);

  const openEdit = useCallback(
    (c: ActivityCategory) => {
      setEditing(c);
      setFormLaunchKey((k) => k + 1);
      requestAnimationFrame(() => {
        formSheetRef.current?.snapToIndex(0);
      });
    },
    []
  );

  const closeForm = useCallback(() => {
    formSheetRef.current?.close();
  }, []);

  const onSave = useCallback(
    (id: string, v: { budget: number; color: string }) => {
      updateCategory(id, { budget: v.budget, color: v.color });
    },
    [updateCategory]
  );

  if (!ready) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screenRoot}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Categories</Text>
        </View>

        {categories.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No spending categories yet.
            </Text>
            <Text style={styles.emptyHint}>
              Link a bank account and sync your transactions to see categories
              here automatically.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>
              Spending by Category ({categories.length})
            </Text>

            <View style={styles.list}>
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={() => openEdit(category)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <ModalBottomSheet ref={formSheetRef} snapPoints={formSnapPoints}>
        <BudgetFormSheetContent
          formLaunchKey={formLaunchKey}
          category={editing}
          onClose={closeForm}
          onSave={onSave}
        />
      </ModalBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },

  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.screenBackground,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
    backgroundColor: colors.screenBackground,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },

  title: {
    fontSize: fontSize.heroSm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },

  sectionLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },

  list: {
    gap: spacing.md,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xs,
  },

  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textPlaceholder,
    textAlign: "center",
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  cardTitleWrap: {
    flex: 1,
    marginRight: spacing.md,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  colorSwatchSmall: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },

  editButton: {
    height: spacing.xl,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  editButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },

  spentText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },

  budgetText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },

  noBudgetText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPlaceholder,
    fontStyle: "italic",
  },

  progressTrack: {
    height: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.divider,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },

  progressFill: {
    height: "100%",
    borderRadius: radius.md,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  remainingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },

  percentText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },

  sheetTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  sheetCategoryName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },

  sheetSpentLabel: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },

  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    marginBottom: spacing.xxs,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },

  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },

  colorChoice: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.transparent,
  },

  colorChoiceSelected: {
    borderColor: colors.textPrimary,
  },

  sheetActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },

  sheetCancel: {
    flex: 1,
    height: spacing.xxxl,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },

  sheetCancelText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },

  sheetSave: {
    flex: 1,
    height: spacing.xxxl,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  sheetSaveText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
});
