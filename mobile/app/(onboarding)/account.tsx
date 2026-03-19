import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import PagerView from 'react-native-pager-view';

// 1. UPDATED DATA STRUCTURE: Now an array of objects!
const ONBOARDING_QUESTIONS = [
  { 
    text: "What is your name?", 
    type: "text" 
  },
  { 
    text: "what is your phone number?", 
    type: "pnumber" 
  },
  {
    text: "What is you yearly income",
    type: "number"

  },
  {
    text: "Why did you instsll our app",
    type: "multiple_choice",
    options:["Cuase i need money!","I am really broke and got into debt", "I need to save up for the crib", "i need to save up for hommie"] 
  },
  { 
    text: "If you overspend in a category, whaat matters most to you?", 
    type: "multiple_choice", 
    options: ["How it affects my debt payoff timeline", "How it impacts my future months", "Whether it's becoming a pattern", "How can I adjust habits next time"] 
  }
];

type AnswersMap = Record<number, string>;

export default function AccountScreen() {
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [hasReachedReview, setHasReachedReview] = useState(false);
  const pagerRef = useRef<PagerView>(null);

  const handleAnswerChange = (text: string, index: number) => {
    setAnswers((prevAnswers: AnswersMap) => ({
      ...prevAnswers,
      [index]: text
    }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <PagerView 
        style={styles.container} 
        initialPage={0} 
        ref={pagerRef}
        onPageSelected={(e) => {
            if (e.nativeEvent.position === ONBOARDING_QUESTIONS.length) {
                setHasReachedReview(true);
            }
        }}
      >
        {/* --- THE QUESTIONS --- */}
        {ONBOARDING_QUESTIONS.map((question, index) => (
          <View style={styles.page} key={index.toString()}> 
            <Text style={styles.headline}>{question.text}</Text>

            {/* 2. CONDITIONAL RENDERING: Text vs Multiple Choice */}
            {question.type === 'text' || question.type === 'number' || question.type === 'pnumber'? (
              <TextInput 
                style={[styles.input, { width: '80%' }]}
                placeholder = {question.type === 'number' ? "Enter a number..." : "Type your answer here..."}
                placeholderTextColor="grey"
                value={answers[index] || ''}
                onChangeText={(text) => {
                  if (question.type === 'number') {
                    const digitsOnly = text.replace(/[^0-9]/g, '');
                    const formatted = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    handleAnswerChange(formatted, index);
                
                  } else if (question.type === 'pnumber') {
                    const digitsOnly = text.replace(/[^0-9]/g, '');
                
                    let formatted = digitsOnly;
                
                    if (digitsOnly.length > 3 && digitsOnly.length <= 6) {
                      formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
                    } else if (digitsOnly.length > 6) {
                      formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
                    }
                
                    handleAnswerChange(formatted, index);
                
                  } else {
                    handleAnswerChange(text, index);
                  }
                }}
              />
            ) : (
              <View style={{ width: '80%' }}>
                {question.options?.map((option, optIndex) => {
                  const isSelected = answers[index] === option;
                  return (
                    <TouchableOpacity 
                      key={optIndex}
                      style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                      onPress={() => handleAnswerChange(option, index)}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {index < ONBOARDING_QUESTIONS.length - 1 ? (
              <Text style={[styles.footerText, { marginTop: 20 }]}>Swipe ➡️</Text>
            ) : (
              <Text style={[styles.footerText, { marginTop: 20 }]}>Swipe to Review ➡️</Text>
            )}

            {hasReachedReview && (
              <TouchableOpacity 
                style={[styles.button, { marginTop: 20 }]}
                onPress={() => pagerRef.current?.setPage(ONBOARDING_QUESTIONS.length)} 
              >
                <Text style={{color: 'white', fontWeight: 'bold'}}>Jump back to Review</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* --- THE NEW REVIEW PAGE --- */}
        <View style={styles.page} key="review">
          <Text style={styles.headline}>Review Your Answers</Text>
          <View style={{ width: '80%', marginBottom: 20 }}>
            {/* 3. UPDATED REVIEW MAPPING to use question.text */}
            {ONBOARDING_QUESTIONS.map((q, i) => (
              <View key={`review-${i}`} style={styles.reviewItem}>
                <Text style={styles.reviewQuestion}>{q.text}</Text>
                <View style={styles.reviewAnswerRow}>
                  <Text style={styles.reviewAnswer}>
                    {answers[i] ? answers[i] : (
                      <Text style={{ fontStyle: 'italic', color: 'grey' }}>Left blank</Text>
                    )}
                  </Text>
                  <TouchableOpacity onPress={() => pagerRef.current?.setPage(i)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          <Text style={styles.footerText}>You're all done! 🎉</Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#34C759' }]} // Made green!
            onPress={() => {
                console.log("Final Answers:", answers); 
                router.push('/(tabs)');
            }}
          >
            <Text style={{color: 'white', fontWeight: 'bold', paddingHorizontal: 10}}>Submit</Text>
          </TouchableOpacity>
        </View>
      </PagerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1 },
  headline: { textAlign: 'center', fontSize: 20, marginBottom: 20, fontWeight: '700', paddingHorizontal: 20 },
  input: { borderWidth: 1, borderRadius: 10, padding: 15, marginTop: 10, marginBottom: 10, borderColor: 'grey', fontSize: 16 },
  page: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  footerText: { color: '#333', fontWeight: '600' },
  button: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 6, backgroundColor: '#007AFF', alignSelf: 'center' },
  reviewItem: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  reviewQuestion: { fontSize: 14, color: '#666', marginBottom: 4 },
  reviewAnswerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAnswer: { fontSize: 16, fontWeight: '500', flex: 1 },
  editText: { color: '#007AFF', fontWeight: '600', marginLeft: 10 },
  
  // NEW STYLES FOR MULTIPLE CHOICE
  optionButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E5F1FF',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#007AFF',
    fontWeight: 'bold',
  }
});