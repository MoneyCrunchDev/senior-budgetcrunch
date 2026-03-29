import React, { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import BottomSheet from "@gorhom/bottom-sheet";

// Make sure this path matches your project structure
import ModalBottomSheet from "@/components/ModalBottomSheet"; 

export default function CalendarScreen() {
  const { height } = useWindowDimensions();
  
  // --- BOTTOM SHEET STATE ---
  const sheetRef = useRef<BottomSheet>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [spentOnSelectedDate, setSpentOnSelectedDate] = useState(0);

  const snapPoints = useMemo(() => [Math.round(height * 0.40)], [height]);

  const openSheet = useCallback(() => {
    requestAnimationFrame(() => {
      sheetRef.current?.snapToIndex(0);
    });
  }, []);

  // --- MOCK DATA ---
  const mockSpending = useMemo(() => ({
    '2026-03-20': 350,  // Under 500 -> Green
    '2026-03-21': 5500,  // Exactly 500 -> Green
    '2026-03-22': 720,  // Over 500 -> Red
    '2026-03-25': 1150,  // Under 500 -> Green
    '2026-03-28': 890,  // Over 500 -> Red
    '2026-03-24': 1350,  // Under 500 -> Green
    '2026-03-27': 500,  // Exactly 500 -> Green
    '2026-03-29': 720,  // Over 500 -> Red
    '2026-03-15': 200,  // Under 500 -> Green
    '2026-03-16': 200,  // Exactly 500 -> Green
    '2026-03-17': 100,  // Over 500 -> Red
    '2026-03-18': 3300,  // Under 500 -> Green
    '2026-03-19': 234,



  
  }), []);

 
 const markedDates = useMemo(() => {
  const generatedMarks: Record<string, any> = {};
  const weekStats: Record<string, { overBudgetCount: number }> = {};

  const todayDate = new Date().toISOString().split('T')[0];

  Object.keys(mockSpending).forEach((date) => {
    const spentAmount = mockSpending[date as keyof typeof mockSpending];
    const isOverBudget = spentAmount > 500;

    generatedMarks[date] = {
      customStyles: {
        container: {
          borderWidth: 2,
          borderColor: isOverBudget ? '#FF3B30' : '#34C759', 
          borderRadius: 8,
        },
        text: {
          color: '#333',
          fontWeight: 'bold',
        }
      }
    };

    const d = new Date(date + 'T00:00:00'); 
    const dayOfWeek = d.getDay(); // 0 is Sunday
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek);
    const weekKey = sunday.toISOString().split('T')[0];

    if (!weekStats[weekKey]) {
      weekStats[weekKey] = { overBudgetCount: 0 };
    }
    if (isOverBudget) {
      weekStats[weekKey].overBudgetCount += 1;
    }
  });

  const dToday = new Date(todayDate + 'T00:00:00');
  const todayDayOfWeek = dToday.getDay();
  const currentSunday = new Date(dToday);
  currentSunday.setDate(dToday.getDate() - todayDayOfWeek);
  const currentWeekKey = currentSunday.toISOString().split('T')[0];
  // -------------------------------------------------------------------

  Object.keys(weekStats).forEach((weekSunday) => {
    
    if (weekSunday === currentWeekKey) {
      return; // This acts like 'continue' in a forEach loop
    }

    const redDays = weekStats[weekSunday].overBudgetCount;
    
    let weeklyBgColor = '';
    if (redDays === 0) {
      weeklyBgColor = '#E8F5E9'; // Soft Green
    } else if (redDays <= 2) {
      weeklyBgColor = '#FFF9C4'; // Soft Yellow
    } else {
      weeklyBgColor = '#FFEBEE'; // Soft Red
    }

    let currentDay = new Date(weekSunday + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
      const dateStr = currentDay.toISOString().split('T')[0];

      generatedMarks[dateStr] = {
        ...generatedMarks[dateStr],
        customStyles: {
          ...generatedMarks[dateStr]?.customStyles,
          container: {
            ...generatedMarks[dateStr]?.customStyles?.container,
            backgroundColor: weeklyBgColor,
            borderRadius: 8,
          },
          text: {
            ...generatedMarks[dateStr]?.customStyles?.text,
            color: '#333',
            fontWeight: generatedMarks[dateStr]?.customStyles?.text?.fontWeight || 'normal',
          }
        }
      };

      currentDay.setDate(currentDay.getDate() + 1);
    }
  });

  generatedMarks[todayDate] = {
    ...generatedMarks[todayDate], 
    customStyles: {
      ...generatedMarks[todayDate]?.customStyles,
      container: {
        ...generatedMarks[todayDate]?.customStyles?.container,
        borderColor: '#037AFF', 
        borderWidth: 2,
        borderRadius: 8,
      },
      text: {
        ...generatedMarks[todayDate]?.customStyles?.text,
        color: '#037AFF', 
        fontWeight: '900',
      }
    }
  };

  if (selectedDate) {
    generatedMarks[selectedDate] = {
      ...generatedMarks[selectedDate], 
      customStyles: {
        ...generatedMarks[selectedDate]?.customStyles,
        container: {
          ...generatedMarks[selectedDate]?.customStyles?.container,
          borderColor: '#007AFF', 
          backgroundColor: '#007AFF', 
          borderRadius: 100, 
        },
        text: {
          color: 'white',
          fontWeight: 'bold',
        }
      }
    };
  }

  return generatedMarks;
}, [mockSpending, selectedDate]);
  // --- EVENT HANDLERS ---
  const handleDayPress = (day: any) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);
    
    setSpentOnSelectedDate(mockSpending[dateStr as keyof typeof mockSpending] || 0);
    openSheet();
  };

  return (
    <SafeAreaView style={styles.screenRoot}>
      
      <View style={styles.container}>
        <Text style={styles.title}>Calendar</Text>
        
        <Calendar 
          markingType={'custom'}
          markedDates={markedDates}
          onDayPress={handleDayPress} 
          theme={{
            backgroundColor: "#F6F7F9",
            calendarBackground: "#F6F7F9",
            todayTextColor: '#007AFF',
            arrowColor: '#007AFF',
            textDayFontWeight: '500',
          }}
        />
      </View>

      <ModalBottomSheet ref={sheetRef} snapPoints={snapPoints}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Activity for</Text>
          <Text style={styles.dateText}>{selectedDate}</Text>
          
          <View style={styles.spentCard}>
            <Text style={styles.spentLabel}>Total Spent:</Text>
            <Text style={[
                styles.spentAmount, 
                { color: spentOnSelectedDate > 500 ? '#FF3B30' : '#34C759' } 
            ]}>
              ${spentOnSelectedDate.toFixed(2)}
            </Text>
          </View>

        </View>
      </ModalBottomSheet>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: "#F6F7F9",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 24,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
    marginBottom: 20,
  },
  spentCard: {
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E6E8EC',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  spentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  spentAmount: {
    fontSize: 32,
    fontWeight: '800',
  }
});

//@/components/ModalBottomSheet