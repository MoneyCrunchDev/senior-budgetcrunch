import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import PagerView from 'react-native-pager-view';

import { useAuth } from '@/context/AuthContext';
import { account } from '@/lib/appwriteConfig';
import { usDisplayToE164 } from '@/lib/phoneE164';

/** Indices must stay aligned with ONBOARDING_QUESTIONS. */
const Q = {
  NAME: 0,
  PHONE: 1,
  INCOME: 2,
  PRIMARY_GOAL: 3,
} as const;

const ONBOARDING_QUESTIONS = [
  {
    text: 'What is your name?',
    type: 'text' as const,
  },
  {
    text: 'What is your phone number?',
    type: 'pnumber' as const,
  },
  {
    text: 'What is your yearly income?',
    type: 'number' as const,
  },
  {
    text: 'What best describes why you are here, or what matters most when you overspend?',
    type: 'multiple_choice' as const,
    options: [
      'I need to get on top of money or pay off debt',
      'I am saving for something important (home, family, etc.)',
      'How overspending affects my debt payoff timeline',
      'How overspending impacts my future months',
      'Whether overspending is becoming a pattern',
      'How I can adjust my habits next time',
    ],
  },
];

type AnswersMap = Record<number, string>;

export default function AccountScreen() {
  const { consumePasswordForPhoneSetup, refreshUser } = useAuth();
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [hasReachedReview, setHasReachedReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const pagerRef = useRef<PagerView>(null);

  const handleAnswerChange = (text: string, index: number) => {
    setAnswers((prev) => ({
      ...prev,
      [index]: text,
    }));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    const name = (answers[Q.NAME] || '').trim();
    const phoneDisplay = answers[Q.PHONE] || '';
    const yearlyIncomeDisplay = answers[Q.INCOME] || '';
    const primaryGoal = answers[Q.PRIMARY_GOAL] || '';

    if (!name) {
      setSubmitError('Please enter your name. Use Edit to go back.');
      return;
    }

    const e164 = usDisplayToE164(phoneDisplay);
    if (!e164) {
      setSubmitError('Enter a valid US phone number (10 digits).');
      return;
    }

    const incomeDigits = yearlyIncomeDisplay.replace(/[^0-9]/g, '');

    const goToTabs = () => {
      router.push('/(tabs)');
    };

    setSubmitting(true);
    try {
      await account.updateName(name);

      const user = await account.get();
      const prefs = {
        ...(user.prefs && typeof user.prefs === 'object' ? user.prefs : {}),
        yearlyIncome: incomeDigits,
        onboardingPrimaryGoal: primaryGoal,
        phoneE164: e164,
      };
      await account.updatePrefs(prefs);

      const password = consumePasswordForPhoneSetup();
      if (password) {
        try {
          await account.updatePhone({ phone: e164, password });
        } catch (phoneErr: unknown) {
          const msg =
            phoneErr && typeof phoneErr === 'object' && 'message' in phoneErr
              ? String((phoneErr as { message?: string }).message)
              : 'Could not attach phone to your account.';
          await refreshUser();
          Alert.alert(
            'Phone not linked for search',
            `${msg} Your number is still saved in account preferences. In Appwrite Console, turn on Auth → Settings → Phone, then you can add your phone from app settings if needed.`,
            [{ text: 'OK', onPress: goToTabs }]
          );
          return;
        }
      } else {
        await refreshUser();
        Alert.alert(
          'Phone lookup',
          'Your number was saved to preferences, but we could not link it for Auth search (no password in memory — for example the app was restarted). You can add your phone from settings after enabling Phone in Appwrite.',
          [{ text: 'OK', onPress: goToTabs }]
        );
        return;
      }

      await refreshUser();
      goToTabs();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message?: string }).message) : 'Something went wrong.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
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
        }}>
        {ONBOARDING_QUESTIONS.map((question, index) => (
          <View style={styles.page} key={index.toString()}>
            <Text style={styles.headline}>{question.text}</Text>

            {question.type === 'text' || question.type === 'number' || question.type === 'pnumber' ? (
              <TextInput
                style={[styles.input, { width: '80%' }]}
                placeholder={question.type === 'number' ? 'Enter a number…' : 'Type your answer here…'}
                placeholderTextColor="grey"
                keyboardType={question.type === 'pnumber' ? 'phone-pad' : question.type === 'number' ? 'number-pad' : 'default'}
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
                      onPress={() => handleAnswerChange(option, index)}>
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option}</Text>
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
                onPress={() => pagerRef.current?.setPage(ONBOARDING_QUESTIONS.length)}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Jump back to Review</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={styles.page} key="review">
          <Text style={styles.headline}>Review your answers</Text>
          <ScrollView style={styles.reviewScroll} contentContainerStyle={styles.reviewScrollContent}>
            {ONBOARDING_QUESTIONS.map((q, i) => (
              <View key={`review-${i}`} style={styles.reviewItem}>
                <Text style={styles.reviewQuestion}>{q.text}</Text>
                <View style={styles.reviewAnswerRow}>
                  <Text style={styles.reviewAnswer}>
                    {answers[i] ? (
                      answers[i]
                    ) : (
                      <Text style={{ fontStyle: 'italic', color: 'grey' }}>Left blank</Text>
                    )}
                  </Text>
                  <TouchableOpacity onPress={() => pagerRef.current?.setPage(i)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
          <Text style={styles.footerText}>You are all done! 🎉</Text>
          <TouchableOpacity
            style={[styles.button, styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: 'white', fontWeight: 'bold', paddingHorizontal: 10 }}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </PagerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1 },
  headline: {
    textAlign: 'center',
    fontSize: 20,
    marginBottom: 20,
    fontWeight: '700',
    paddingHorizontal: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 10,
    borderColor: 'grey',
    fontSize: 16,
  },
  page: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  footerText: { color: '#333', fontWeight: '600' },
  button: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    alignSelf: 'center',
    minWidth: 120,
    alignItems: 'center',
  },
  submitButton: { backgroundColor: '#34C759' },
  buttonDisabled: { opacity: 0.6 },
  reviewScroll: { maxHeight: '45%', width: '100%' },
  reviewScrollContent: { paddingHorizontal: '10%', paddingBottom: 8 },
  reviewItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  reviewQuestion: { fontSize: 14, color: '#666', marginBottom: 4 },
  reviewAnswerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAnswer: { fontSize: 16, fontWeight: '500', flex: 1 },
  editText: { color: '#007AFF', fontWeight: '600', marginLeft: 10 },
  errorText: {
    color: '#b00020',
    marginTop: 8,
    marginHorizontal: 24,
    textAlign: 'center',
    fontSize: 13,
  },
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
  },
});
