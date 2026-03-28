import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';

export default function CalendarDynamicBorderScreen() {
  
  // 1. Our temporary object holding the spent amounts for various days
  const mockSpending = {
    '2026-03-20': 350,  // Under 500 -> Should be Green
    '2026-03-21': 500,  // Exactly 500 -> Should be Green
    '2026-03-22': 720,  // Over 500 -> Should be Red
    '2026-03-25': 150,  // Under 500 -> Should be Green
    '2026-03-28': 890,  // Over 500 -> Should be Red
    '2026-03-27': 650,
  };

  const markedDates = useMemo(() => {
    const generatedMarks: Record<string, any> = {};

    // Loop through every date in our mock data
    Object.keys(mockSpending).forEach((date) => {
      const spentAmount = mockSpending[date as keyof typeof mockSpending];
      
      // Check if they went over the $500 limit
      const isOverBudget = spentAmount > 500;

      // Assign the red or green border dynamically
      generatedMarks[date] = {
        customStyles: {
          container: {
            borderWidth: 2,
            borderColor: isOverBudget ? '#FF3B30' : '#34C759', // Red if over, Green if under/equal
            borderRadius: 8,
          },
          text: {
            color: '#333',
            fontWeight: 'bold',
          }
        }
      };
    });

    return generatedMarks;
  }, []); // useMemo prevents this from recalculating on every single render

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Calendar
          // CRITICAL: Must be 'custom' to accept container borders
          markingType={'custom'} 
          
          // Pass in our dynamically generated object
          markedDates={markedDates}
          
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            todayTextColor: '#007AFF',
            arrowColor: '#007AFF',
            textDayFontWeight: '500',
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: 'white' 
  },
  container: { 
    flex: 1, 
    padding: 20,
    justifyContent: 'center'
  }
});

//@/components/ModalBottomSheet