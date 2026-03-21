import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  fetchStudentQuizById,
  submitStudentQuiz,
} from "../../src/services/quizApi";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

function parseDurationToSeconds(duration) {
  const rawValue = String(duration || "").toLowerCase();
  const numberMatch = rawValue.match(/\d+/);
  const minutes = numberMatch ? Number(numberMatch[0]) : 0;
  return minutes * 60;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function TakeQuiz() {
  const router = useRouter();
  const { quizId } = useLocalSearchParams();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const response = await fetchStudentQuizById(quizId);
        setQuiz(response);
        setRemainingSeconds(parseDurationToSeconds(response.duration));
      } catch (error) {
        const message = error.response?.data?.message || "Unable to load quiz.";
        Alert.alert("Error", message, [
          { text: "Back", onPress: () => router.replace("/(student)/quizzes") },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [quizId, router]);

  useEffect(() => {
    if (!quiz || result || remainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz, result, remainingSeconds]);

  useEffect(() => {
    if (quiz && !result && remainingSeconds === 0) {
      handleSubmitQuiz(true);
    }
  }, [remainingSeconds, quiz, result]);

  const currentQuestion = useMemo(() => quiz?.questions?.[currentIndex] || null, [quiz, currentIndex]);

  const selectOption = (option) => {
    if (!currentQuestion || submitting || result) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.questionIndex]: option }));
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (!quiz || submitting || result) return;
    try {
      setSubmitting(true);
      const answers = quiz.questions.map((q) => ({
        questionIndex: q.questionIndex,
        selectedOption: selectedAnswers[q.questionIndex] || "",
      }));
      const submissionResult = await submitStudentQuiz(quiz._id, answers);
      setResult(submissionResult);
      if (autoSubmit) Alert.alert("Time Up", "Quiz submitted automatically.");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Unable to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalCount = quiz?.questions?.length || 0;
  const timerIsLow = remainingSeconds > 0 && remainingSeconds <= 60;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <Text style={{ fontSize: 16, color: "#475569" }}>Quiz not available.</Text>
      </View>
    );
  }

  // ─── RESULT SCREEN ───
  if (result) {
    const passed = result.result === "Passed";

    if (!isWeb) {
      return (
        <View style={mobileStyles.container}>
          <View style={mobileStyles.resultCard}>
            <Ionicons name="trophy-outline" size={46} color="#f59e0b" />
            <Text style={mobileStyles.resultTitle}>{quiz.name}</Text>
            <Text style={mobileStyles.resultScore}>{result.score}/{result.total}</Text>
            <Text style={mobileStyles.resultSubtitle}>Score</Text>
            <Text style={mobileStyles.resultMeta}>Percentage: {result.percentage}%</Text>
            <Text style={[mobileStyles.resultStatus, passed ? mobileStyles.pass : mobileStyles.fail]}>{result.result}</Text>
            <TouchableOpacity style={mobileStyles.backButton} onPress={() => router.replace("/(student)/quizzes")}>
              <Text style={mobileStyles.backButtonText}>Back To Quizzes</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={webStyles.root} contentContainerStyle={webStyles.resultRoot}>
        <View style={webStyles.resultBox}>
          <View style={[webStyles.resultIconCircle, { backgroundColor: passed ? "#f0fdf4" : "#fef2f2" }]}>
            <Ionicons name="trophy-outline" size={52} color={passed ? "#16a34a" : "#f59e0b"} />
          </View>
          <Text style={webStyles.resultQuizName}>{quiz.name}</Text>
          <Text style={webStyles.resultScoreBig}>{result.score}<Text style={webStyles.resultScoreTotal}>/{result.total}</Text></Text>
          <Text style={webStyles.resultScoreLabel}>Questions Correct</Text>

          <View style={webStyles.resultStatsRow}>
            <View style={webStyles.resultStat}>
              <Text style={[webStyles.resultStatVal, { color: "#2563eb" }]}>{result.percentage}%</Text>
              <Text style={webStyles.resultStatLabel}>Score</Text>
            </View>
            <View style={webStyles.resultStatDivider} />
            <View style={webStyles.resultStat}>
              <Text style={[webStyles.resultStatVal, { color: passed ? "#16a34a" : "#ef4444" }]}>{result.result}</Text>
              <Text style={webStyles.resultStatLabel}>Result</Text>
            </View>
            <View style={webStyles.resultStatDivider} />
            <View style={webStyles.resultStat}>
              <Text style={[webStyles.resultStatVal, { color: "#f59e0b" }]}>{totalCount}</Text>
              <Text style={webStyles.resultStatLabel}>Total Qs</Text>
            </View>
          </View>

          <View style={[webStyles.resultBanner, { backgroundColor: passed ? "#f0fdf4" : "#fef2f2", borderColor: passed ? "#bbf7d0" : "#fecaca" }]}>
            <Ionicons name={passed ? "checkmark-circle" : "close-circle"} size={20} color={passed ? "#16a34a" : "#ef4444"} />
            <Text style={[webStyles.resultBannerText, { color: passed ? "#16a34a" : "#ef4444" }]}>
              {passed ? "Congratulations! You passed the quiz." : "You didn't pass this time. Keep practicing!"}
            </Text>
          </View>

          <TouchableOpacity style={webStyles.backBtn} onPress={() => router.replace("/(student)/quizzes")}>
            <Ionicons name="arrow-back-outline" size={18} color="#fff" />
            <Text style={webStyles.backBtnText}>Back to Quizzes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─── MOBILE QUIZ SCREEN (unchanged) ───
  if (!isWeb) {
    return (
      <ScrollView style={mobileStyles.container} contentContainerStyle={mobileStyles.content}>
        <View style={mobileStyles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={mobileStyles.quizTitle}>{quiz.name}</Text>
            <Text style={mobileStyles.quizDescription}>{quiz.description}</Text>
          </View>
          <View style={mobileStyles.timerBadge}>
            <Ionicons name="timer-outline" size={16} color="#fff" />
            <Text style={mobileStyles.timerText}>{formatTime(remainingSeconds)}</Text>
          </View>
        </View>

        <View style={mobileStyles.progressRow}>
          <Text style={mobileStyles.progressText}>Question {currentIndex + 1} of {quiz.questions.length}</Text>
          <Text style={mobileStyles.progressText}>Batch: {quiz.targetBatch}</Text>
        </View>

        <View style={mobileStyles.questionCard}>
          <Text style={mobileStyles.questionText}>{currentQuestion?.question}</Text>
          {currentQuestion?.options.map((option) => {
            const isSelected = selectedAnswers[currentQuestion.questionIndex] === option;
            return (
              <TouchableOpacity
                key={`${currentQuestion.questionIndex}-${option}`}
                style={[mobileStyles.optionButton, isSelected && mobileStyles.optionButtonSelected]}
                onPress={() => selectOption(option)}
                activeOpacity={0.85}
              >
                <Text style={[mobileStyles.optionText, isSelected && mobileStyles.optionTextSelected]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={mobileStyles.navigationRow}>
          <TouchableOpacity style={[mobileStyles.navButton, currentIndex === 0 && mobileStyles.navButtonDisabled]} disabled={currentIndex === 0} onPress={() => setCurrentIndex((p) => p - 1)}>
            <Text style={mobileStyles.navButtonText}>Previous</Text>
          </TouchableOpacity>
          {currentIndex < quiz.questions.length - 1 ? (
            <TouchableOpacity style={mobileStyles.navButton} onPress={() => setCurrentIndex((p) => p + 1)}>
              <Text style={mobileStyles.navButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[mobileStyles.submitButton, submitting && mobileStyles.submitButtonDisabled]} onPress={() => handleSubmitQuiz(false)} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={mobileStyles.submitButtonText}>Submit Quiz</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  // ─── WEB QUIZ SCREEN ───
  return (
    <ScrollView style={webStyles.root} contentContainerStyle={webStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={webStyles.inner}>

        {/* QUIZ HEADER */}
        <View style={webStyles.quizHeader}>
          <View style={{ flex: 1 }}>
            <Text style={webStyles.quizName}>{quiz.name}</Text>
            <Text style={webStyles.quizDesc}>{quiz.description}</Text>
          </View>
          <View style={[webStyles.timerBox, timerIsLow && webStyles.timerBoxRed]}>
            <Ionicons name="timer-outline" size={20} color={timerIsLow ? "#ef4444" : "#fff"} />
            <Text style={[webStyles.timerText, timerIsLow && { color: "#ef4444" }]}>{formatTime(remainingSeconds)}</Text>
          </View>
        </View>

        {/* PROGRESS ROW */}
        <View style={webStyles.progressRow}>
          <View style={webStyles.progressInfo}>
            <Text style={webStyles.progressText}>Question {currentIndex + 1} of {totalCount}</Text>
            <Text style={webStyles.progressBatch}>Batch: {quiz.targetBatch}</Text>
          </View>
          <Text style={webStyles.answeredText}>{answeredCount}/{totalCount} answered</Text>
        </View>

        {/* PROGRESS BAR */}
        <View style={webStyles.progressBarBg}>
          <View style={[webStyles.progressBarFill, { width: `${((currentIndex + 1) / totalCount) * 100}%` }]} />
        </View>

        <View style={isWideScreen ? webStyles.quizLayoutWide : webStyles.quizLayoutNarrow}>

          {/* QUESTION CARD */}
          <View style={isWideScreen ? webStyles.questionPanelWide : webStyles.questionPanelNarrow}>
            <View style={webStyles.questionNumberRow}>
              <View style={webStyles.questionNumberBadge}>
                <Text style={webStyles.questionNumberText}>Q{currentIndex + 1}</Text>
              </View>
            </View>
            <Text style={webStyles.questionText}>{currentQuestion?.question}</Text>

            <View style={webStyles.optionsList}>
              {currentQuestion?.options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQuestion.questionIndex] === option;
                const labels = ["A", "B", "C", "D"];
                return (
                  <TouchableOpacity
                    key={`${currentQuestion.questionIndex}-${option}`}
                    style={[webStyles.optionBtn, isSelected && webStyles.optionBtnSelected]}
                    onPress={() => selectOption(option)}
                    activeOpacity={0.85}
                  >
                    <View style={[webStyles.optionLabel, isSelected && webStyles.optionLabelSelected]}>
                      <Text style={[webStyles.optionLabelText, isSelected && { color: "#fff" }]}>{labels[idx] || idx + 1}</Text>
                    </View>
                    <Text style={[webStyles.optionText, isSelected && webStyles.optionTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* NAV BUTTONS */}
            <View style={webStyles.navRow}>
              <TouchableOpacity
                style={[webStyles.navBtn, currentIndex === 0 && webStyles.navBtnDisabled]}
                disabled={currentIndex === 0}
                onPress={() => setCurrentIndex((p) => p - 1)}
              >
                <Ionicons name="arrow-back-outline" size={16} color={currentIndex === 0 ? "#94a3b8" : "#fff"} />
                <Text style={[webStyles.navBtnText, currentIndex === 0 && { color: "#94a3b8" }]}>Previous</Text>
              </TouchableOpacity>

              {currentIndex < totalCount - 1 ? (
                <TouchableOpacity style={webStyles.navBtnNext} onPress={() => setCurrentIndex((p) => p + 1)}>
                  <Text style={webStyles.navBtnNextText}>Next</Text>
                  <Ionicons name="arrow-forward-outline" size={16} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[webStyles.submitBtn, submitting && { opacity: 0.7 }]}
                  onPress={() => handleSubmitQuiz(false)}
                  disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text style={webStyles.submitBtnText}>Submit Quiz</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* SIDEBAR — question navigator */}
          {isWideScreen && (
            <View style={webStyles.sidebar}>
              <Text style={webStyles.sidebarTitle}>Questions</Text>
              <View style={webStyles.questionGrid}>
                {quiz.questions.map((_, idx) => {
                  const isAnswered = selectedAnswers[idx] !== undefined;
                  const isCurrent = idx === currentIndex;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        webStyles.qNumBtn,
                        isAnswered && webStyles.qNumBtnAnswered,
                        isCurrent && webStyles.qNumBtnCurrent,
                      ]}
                      onPress={() => setCurrentIndex(idx)}
                    >
                      <Text style={[
                        webStyles.qNumText,
                        isAnswered && { color: "#fff" },
                        isCurrent && { color: "#fff" },
                      ]}>{idx + 1}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={webStyles.sidebarLegend}>
                <View style={webStyles.legendItem}>
                  <View style={[webStyles.legendDot, { backgroundColor: "#2563eb" }]} />
                  <Text style={webStyles.legendText}>Current</Text>
                </View>
                <View style={webStyles.legendItem}>
                  <View style={[webStyles.legendDot, { backgroundColor: "#16a34a" }]} />
                  <Text style={webStyles.legendText}>Answered</Text>
                </View>
                <View style={webStyles.legendItem}>
                  <View style={[webStyles.legendDot, { backgroundColor: "#e2e8f0" }]} />
                  <Text style={webStyles.legendText}>Unanswered</Text>
                </View>
              </View>

              <View style={webStyles.sidebarStats}>
                <Text style={webStyles.sidebarStatsText}>{answeredCount} of {totalCount} answered</Text>
                <View style={webStyles.sidebarProgressBg}>
                  <View style={[webStyles.sidebarProgressFill, { width: `${(answeredCount / totalCount) * 100}%` }]} />
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

/* ─────────────── MOBILE STYLES ─────────────── */
const mobileStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 18, paddingBottom: 28 },
  headerCard: { backgroundColor: "#1d4ed8", borderRadius: 22, padding: 20, flexDirection: "row" },
  quizTitle: { fontSize: 22, fontWeight: "800", color: "#ffffff" },
  quizDescription: { marginTop: 8, color: "#dbeafe", lineHeight: 20 },
  timerBadge: { alignSelf: "flex-start", backgroundColor: "rgba(15,23,42,0.25)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center" },
  timerText: { color: "#ffffff", fontWeight: "800", marginLeft: 6 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  progressText: { color: "#64748b", fontWeight: "700" },
  questionCard: { marginTop: 18, backgroundColor: "#fff", borderRadius: 20, padding: 18, elevation: 4 },
  questionText: { fontSize: 18, fontWeight: "700", color: "#0f172a", lineHeight: 26 },
  optionButton: { marginTop: 14, borderRadius: 14, borderWidth: 1, borderColor: "#cbd5e1", padding: 14, backgroundColor: "#fff" },
  optionButtonSelected: { borderColor: "#2563eb", backgroundColor: "#dbeafe" },
  optionText: { color: "#0f172a", fontWeight: "600" },
  optionTextSelected: { color: "#1d4ed8" },
  navigationRow: { marginTop: 20, flexDirection: "row", justifyContent: "space-between" },
  navButton: { flex: 1, backgroundColor: "#0f172a", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginHorizontal: 4 },
  navButtonDisabled: { backgroundColor: "#94a3b8" },
  navButtonText: { color: "#fff", fontWeight: "800" },
  submitButton: { flex: 1, backgroundColor: "#16a34a", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginHorizontal: 4 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: "#fff", fontWeight: "800" },
  resultCard: { margin: 20, backgroundColor: "#fff", borderRadius: 24, padding: 26, alignItems: "center", elevation: 5 },
  resultTitle: { marginTop: 14, fontSize: 22, fontWeight: "800", color: "#0f172a", textAlign: "center" },
  resultScore: { marginTop: 20, fontSize: 42, fontWeight: "900", color: "#2563eb" },
  resultSubtitle: { marginTop: 6, color: "#64748b", fontWeight: "700" },
  resultMeta: { marginTop: 16, color: "#334155", fontWeight: "700" },
  resultStatus: { marginTop: 10, fontSize: 18, fontWeight: "800" },
  pass: { color: "#16a34a" },
  fail: { color: "#dc2626" },
  backButton: { marginTop: 24, backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20 },
  backButtonText: { color: "#fff", fontWeight: "800" },
});

/* ─────────────── WEB STYLES ─────────────── */
const webStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner: { width: "100%", maxWidth: 1100 },

  // QUIZ HEADER
  quizHeader: { backgroundColor: "#1d4ed8", borderRadius: 20, padding: 24, flexDirection: "row", alignItems: "center", marginBottom: 20, shadowColor: "#1d4ed8", shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  quizName: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },
  quizDesc: { fontSize: 14, color: "#bfdbfe", lineHeight: 20 },
  timerBox: { backgroundColor: "rgba(15,23,42,0.3)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", marginLeft: 16 },
  timerBoxRed: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca" },
  timerText: { fontSize: 20, fontWeight: "900", color: "#fff", marginLeft: 8 },

  // PROGRESS
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  progressInfo: { flexDirection: "row", alignItems: "center" },
  progressText: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginRight: 16 },
  progressBatch: { fontSize: 13, color: "#64748b" },
  answeredText: { fontSize: 13, fontWeight: "600", color: "#2563eb" },
  progressBarBg: { height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, marginBottom: 24, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#2563eb", borderRadius: 3 },

  // LAYOUT
  quizLayoutWide: { flexDirection: "row", alignItems: "flex-start" },
  quizLayoutNarrow: { flexDirection: "column" },
  questionPanelWide: { flex: 1, marginRight: 20 },
  questionPanelNarrow: { width: "100%" },

  // QUESTION CARD
  questionNumberRow: { flexDirection: "row", marginBottom: 16 },
  questionNumberBadge: { backgroundColor: "#eff6ff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  questionNumberText: { fontSize: 13, fontWeight: "700", color: "#2563eb" },
  questionText: { fontSize: 20, fontWeight: "700", color: "#0f172a", lineHeight: 30, marginBottom: 20, backgroundColor: "#fff", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  optionsList: { marginBottom: 24 },
  optionBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#e2e8f0", padding: 16, marginBottom: 10, shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  optionBtnSelected: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  optionLabel: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginRight: 14 },
  optionLabelSelected: { backgroundColor: "#2563eb" },
  optionLabelText: { fontSize: 13, fontWeight: "800", color: "#64748b" },
  optionText: { fontSize: 15, fontWeight: "600", color: "#0f172a", flex: 1 },
  optionTextSelected: { color: "#1d4ed8" },

  // NAV
  navRow: { flexDirection: "row", justifyContent: "space-between" },
  navBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#0f172a", borderRadius: 12, paddingVertical: 13, paddingHorizontal: 20 },
  navBtnDisabled: { backgroundColor: "#e2e8f0" },
  navBtnText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
  navBtnNext: { flexDirection: "row", alignItems: "center", backgroundColor: "#0f172a", borderRadius: 12, paddingVertical: 13, paddingHorizontal: 20 },
  navBtnNextText: { color: "#fff", fontWeight: "700", marginRight: 6 },
  submitBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24, shadowColor: "#16a34a", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  submitBtnText: { color: "#fff", fontWeight: "700", marginLeft: 8 },

  // SIDEBAR
  sidebar: { width: 220, backgroundColor: "#fff", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  sidebarTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 14 },
  questionGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  qNumBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", margin: 3, borderWidth: 1, borderColor: "#e2e8f0" },
  qNumBtnAnswered: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  qNumBtnCurrent: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  qNumText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  sidebarLegend: { marginBottom: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 12, color: "#64748b" },
  sidebarStats: { borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12 },
  sidebarStatsText: { fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: "600" },
  sidebarProgressBg: { height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, overflow: "hidden" },
  sidebarProgressFill: { height: "100%", backgroundColor: "#2563eb", borderRadius: 3 },

  // RESULT SCREEN
  resultRoot: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  resultBox: { width: "100%", maxWidth: 500, backgroundColor: "#fff", borderRadius: 24, padding: 36, alignItems: "center", shadowColor: "#0f172a", shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  resultIconCircle: { width: 96, height: 96, borderRadius: 48, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  resultQuizName: { fontSize: 20, fontWeight: "800", color: "#0f172a", textAlign: "center", marginBottom: 20 },
  resultScoreBig: { fontSize: 64, fontWeight: "900", color: "#2563eb" },
  resultScoreTotal: { fontSize: 32, color: "#94a3b8" },
  resultScoreLabel: { fontSize: 14, color: "#64748b", marginBottom: 24, marginTop: 4 },
  resultStatsRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 16, padding: 20, width: "100%", marginBottom: 20, borderWidth: 1, borderColor: "#e2e8f0" },
  resultStat: { flex: 1, alignItems: "center" },
  resultStatVal: { fontSize: 22, fontWeight: "800" },
  resultStatLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  resultStatDivider: { width: 1, height: 40, backgroundColor: "#e2e8f0" },
  resultBanner: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 14, width: "100%", marginBottom: 24, borderWidth: 1 },
  resultBannerText: { fontSize: 14, fontWeight: "600", marginLeft: 10, flex: 1 },
  backBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, shadowColor: "#2563eb", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, marginLeft: 8 },
});