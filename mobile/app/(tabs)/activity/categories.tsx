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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const GRID = 8;

function formatMoney(value: number): string {
  return `$${value}`;
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
          <Text style={styles.cardSubtitle}>This Week</Text>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.85}
          onPress={onEdit}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.spentText}>{formatMoney(category.spent)} spent</Text>
        <Text style={styles.budgetText}>
          {formatMoney(category.budget)} budget
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.remainingText}>
          {formatMoney(remaining)} remaining
        </Text>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>
    </View>
  );
}

type FormMode = "add" | "edit";

function CategoryFormSheetContent({
  formLaunchKey,
  mode,
  initial,
  nextColorHint,
  onClose,
  onSaveAdd,
  onSaveEdit,
}: {
  formLaunchKey: number;
  mode: FormMode;
  initial: ActivityCategory | null;
  nextColorHint: string;
  onClose: () => void;
  onSaveAdd: (v: {
    name: string;
    budget: number;
    spent: number;
    color: string;
  }) => void;
  onSaveEdit: (
    id: string,
    v: { name: string; budget: number; spent: number; color: string },
  ) => void;
}) {
  const [name, setName] = useState("");
  const [budgetStr, setBudgetStr] = useState("");
  const [spentStr, setSpentStr] = useState("");
  const [color, setColor] = useState(CHART_PALETTE[0] ?? "#4CAF50");

  useEffect(() => {
    if (mode === "edit" && initial) {
      setName(initial.name);
      setBudgetStr(String(initial.budget));
      setSpentStr(String(initial.spent));
      setColor(initial.color);
    } else {
      setName("");
      setBudgetStr("");
      setSpentStr("0");
      setColor(nextColorHint);
    }
  }, [formLaunchKey, mode, initial, nextColorHint]);

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    const budget = parseAmount(budgetStr);
    const spent = parseAmount(spentStr);
    if (mode === "add") {
      onSaveAdd({ name: n, budget, spent, color });
    } else if (initial) {
      onSaveEdit(initial.id, { name: n, budget, spent, color });
    }
    onClose();
  };

  return (
    <BottomSheetScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sheetTitle}>
        {mode === "add" ? "New category" : "Edit category"}
      </Text>

      <Text style={styles.fieldLabel}>Name</Text>
      <BottomSheetTextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Groceries"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.fieldLabel}>Weekly budget</Text>
      <BottomSheetTextInput
        style={styles.input}
        value={budgetStr}
        onChangeText={setBudgetStr}
        placeholder="0"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />

      <Text style={styles.fieldLabel}>Spent this week</Text>
      <BottomSheetTextInput
        style={styles.input}
        value={spentStr}
        onChangeText={setSpentStr}
        placeholder="0"
        placeholderTextColor="#9CA3AF"
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

function ManageSheetContent({
  categories,
  onClose,
  onRemove,
  onMove,
  onEdit,
  onRestoreDefaults,
}: {
  categories: ActivityCategory[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onEdit: (c: ActivityCategory) => void;
  onRestoreDefaults: () => void;
}) {
  return (
    <BottomSheetScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.manageScrollContent}
    >
      <Text style={styles.sheetTitle}>Manage categories</Text>
      <Text style={styles.manageSub}>
        Reorder, remove, or tap a row to edit.
      </Text>

      {categories.map((c, index) => (
        <View key={c.id} style={styles.manageRow}>
          <View
            style={[styles.colorSwatchSmall, { backgroundColor: c.color }]}
          />
          <TouchableOpacity
            style={styles.manageNameBtn}
            onPress={() => {
              onEdit(c);
            }}
          >
            <Text style={styles.manageName} numberOfLines={1}>
              {c.name}
            </Text>
          </TouchableOpacity>

          <View style={styles.manageRowActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => onMove(index, index - 1)}
              disabled={index === 0}
            >
              <Text
                style={[
                  styles.iconBtnText,
                  index === 0 && styles.iconBtnDisabled,
                ]}
              >
                ↑
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => onMove(index, index + 1)}
              disabled={index === categories.length - 1}
            >
              <Text
                style={[
                  styles.iconBtnText,
                  index === categories.length - 1 && styles.iconBtnDisabled,
                ]}
              >
                ↓
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => onRemove(c.id)}
            >
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.restoreBtn}
        onPress={() => {
          onRestoreDefaults();
          onClose();
        }}
      >
        <Text style={styles.restoreBtnText}>Restore sample categories</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.sheetDoneButton} onPress={onClose}>
        <Text style={styles.sheetSaveText}>Done</Text>
      </TouchableOpacity>
    </BottomSheetScrollView>
  );
}

export default function Screen() {
  const {
    categories,
    addCategory,
    updateCategory,
    removeCategory,
    moveCategory,
    resetToSample,
  } = useActivityCategories();

  const { height } = useWindowDimensions();
  const formSheetRef = useRef<BottomSheet>(null);
  const manageSheetRef = useRef<BottomSheet>(null);

  const formSnapPoints = useMemo(
    () => [Math.round(height * 0.50)],
    [height],
  );
  const manageSnapPoints = useMemo(
    () => [Math.round(height * 0.64)],
    [height],
  );

  const [formLaunchKey, setFormLaunchKey] = useState(0);
  const [formMode, setFormMode] = useState<FormMode>("add");
  const [editing, setEditing] = useState<ActivityCategory | null>(null);

  const nextColorHint =
    CHART_PALETTE[categories.length % CHART_PALETTE.length] ?? "#4CAF50";

  const openFormSheet = useCallback(() => {
    requestAnimationFrame(() => {
      formSheetRef.current?.snapToIndex(0);
    });
  }, []);

  const openAdd = useCallback(() => {
    setFormMode("add");
    setEditing(null);
    setFormLaunchKey((k) => k + 1);
    openFormSheet();
  }, [openFormSheet]);

  const openEdit = useCallback(
    (c: ActivityCategory) => {
      setFormMode("edit");
      setEditing(c);
      setFormLaunchKey((k) => k + 1);
      openFormSheet();
    },
    [openFormSheet],
  );

  const closeForm = useCallback(() => {
    formSheetRef.current?.close();
  }, []);

  const openManageSheet = useCallback(() => {
    requestAnimationFrame(() => {
      manageSheetRef.current?.snapToIndex(0);
    });
  }, []);

  const closeManageSheet = useCallback(() => {
    manageSheetRef.current?.close();
  }, []);

  const openEditFromManage = useCallback(
    (c: ActivityCategory) => {
      manageSheetRef.current?.close();
      setFormMode("edit");
      setEditing(c);
      setFormLaunchKey((k) => k + 1);
      setTimeout(() => {
        formSheetRef.current?.snapToIndex(0);
      }, 280);
    },
    [],
  );

  const onSaveAdd = useCallback(
    (v: { name: string; budget: number; spent: number; color: string }) => {
      addCategory({
        name: v.name,
        budget: v.budget,
        spent: v.spent,
        color: v.color,
      });
    },
    [addCategory],
  );

  const onSaveEdit = useCallback(
    (
      id: string,
      v: { name: string; budget: number; spent: number; color: string },
    ) => {
      updateCategory(id, {
        name: v.name,
        budget: v.budget,
        spent: v.spent,
        color: v.color,
      });
    },
    [updateCategory],
  );

  return (
    <View style={styles.screenRoot}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Categories</Text>

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={openAdd}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Weekly Budgets</Text>

        <View style={styles.list}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={() => openEdit(category)}
            />
          ))}
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={openManageSheet}
          >
            <Text style={styles.secondaryButtonText}>Manage Categories</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ModalBottomSheet ref={formSheetRef} snapPoints={formSnapPoints}>
        <CategoryFormSheetContent
          formLaunchKey={formLaunchKey}
          mode={formMode}
          initial={editing}
          nextColorHint={nextColorHint}
          onClose={closeForm}
          onSaveAdd={onSaveAdd}
          onSaveEdit={onSaveEdit}
        />
      </ModalBottomSheet>

      <ModalBottomSheet ref={manageSheetRef} snapPoints={manageSnapPoints}>
        <ManageSheetContent
          categories={categories}
          onClose={closeManageSheet}
          onRemove={removeCategory}
          onMove={moveCategory}
          onEdit={openEditFromManage}
          onRestoreDefaults={resetToSample}
        />
      </ModalBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },

  container: {
    paddingHorizontal: GRID * 2,
    paddingTop: GRID * 6,
    paddingBottom: GRID * 4,
    backgroundColor: "#F6F7F9",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: GRID * 3,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },

  addButton: {
    height: GRID * 5,
    paddingHorizontal: GRID * 2,
    borderRadius: GRID,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8EC",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: GRID * 2,
  },

  list: {
    gap: GRID * 2,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: GRID * 1.5,
    padding: GRID * 2,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: GRID * 2,
  },

  cardTitleWrap: {
    flex: 1,
    marginRight: GRID * 2,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: GRID,
  },

  colorSwatchSmall: {
    width: GRID * 1.5,
    height: GRID * 1.5,
    borderRadius: GRID,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: GRID / 2,
    flex: 1,
  },

  cardSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  editButton: {
    height: GRID * 4,
    paddingHorizontal: GRID * 1.5,
    borderRadius: GRID,
    backgroundColor: "#F8F9FB",
    borderWidth: 1,
    borderColor: "#E6E8EC",
    alignItems: "center",
    justifyContent: "center",
  },

  editButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: GRID,
  },

  spentText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  budgetText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },

  progressTrack: {
    height: GRID * 1.5,
    borderRadius: GRID,
    backgroundColor: "#E9EDF2",
    overflow: "hidden",
    marginBottom: GRID,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#2ECC71",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  remainingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  percentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },

  bottomActions: {
    marginTop: GRID * 3,
  },

  secondaryButton: {
    height: GRID * 6,
    borderRadius: GRID,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8DCE2",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    marginBottom: GRID * 2,
  },

  manageSub: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: GRID * 2,
  },

  manageScrollContent: {
    paddingBottom: GRID * 2,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: GRID / 2,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E6E8EC",
    borderRadius: GRID,
    paddingHorizontal: GRID * 1.5,
    paddingVertical: GRID * 1.25,
    fontSize: 16,
    color: "#111",
    marginBottom: GRID * 1.5,
    backgroundColor: "#FAFBFC",
  },

  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID,
    marginBottom: GRID * 2,
  },

  colorChoice: {
    width: GRID * 4,
    height: GRID * 4,
    borderRadius: GRID * 2,
    borderWidth: 2,
    borderColor: "transparent",
  },

  colorChoiceSelected: {
    borderColor: "#111",
  },

  sheetActions: {
    flexDirection: "row",
    gap: GRID * 1.5,
    marginTop: GRID,
  },

  sheetCancel: {
    flex: 1,
    height: GRID * 6,
    borderRadius: GRID,
    borderWidth: 1,
    borderColor: "#D8DCE2",
    alignItems: "center",
    justifyContent: "center",
  },

  sheetCancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  sheetSave: {
    flex: 1,
    height: GRID * 6,
    borderRadius: GRID,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },

  sheetSaveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  sheetDoneButton: {
    marginTop: GRID * 1.5,
    height: GRID * 6,
    borderRadius: GRID,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },

  manageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: GRID * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F4",
    gap: GRID,
  },

  manageNameBtn: {
    flex: 1,
    minWidth: 0,
  },

  manageName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  manageRowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: GRID / 2,
  },

  iconBtn: {
    width: GRID * 4,
    height: GRID * 4,
    borderRadius: GRID,
    backgroundColor: "#F8F9FB",
    borderWidth: 1,
    borderColor: "#E6E8EC",
    alignItems: "center",
    justifyContent: "center",
  },

  iconBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },

  iconBtnDisabled: {
    color: "#C4C9D2",
  },

  removeBtn: {
    paddingHorizontal: GRID,
    paddingVertical: GRID / 2,
  },

  removeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#C62828",
  },

  restoreBtn: {
    paddingVertical: GRID * 1.5,
    alignItems: "center",
  },

  restoreBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
});
