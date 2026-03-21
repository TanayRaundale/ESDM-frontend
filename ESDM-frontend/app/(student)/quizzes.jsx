import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import {
  fetchStudentActiveQuizzes,
  fetchStudentQuizResults,
} from "../../src/services/quizApi";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

export default function Quizzes() {
  const router = useRouter();
  const [activeQuizzes, setActiveQuizzes] = useState([]);
  const [previousResults, setPreviousResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQuizDashboard = async () => {
    try {
      const [quizList, resultList] = await Promise.all([
        fetchStudentActiveQuizzes(),
        fetchStudentQuizResults(),
      ]);
      setActiveQuizzes(quizList);
      setPreviousResults(resultList);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadQuizDashboard();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadQuizDashboard();
  };

  const openQuiz = (quizId) => {
    router.push({ pathname: "/(student)/take-quiz", params: { quizId } });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // ─── MOBILE LAYOUT (unchanged) ───
  if (!isWeb) {
    return (
      <View style={mobileStyles.container}>
        <Text style={mobileStyles.heading}>📝 Quizzes</Text>
        <Text style={mobileStyles.subheading}>Attend quizzes & track your performance</Text>

        <FlatList
          data={previousResults}
          keyExtractor={(item) => String(item._id || item.quizId)}
          renderItem={({ item }) => <MobileResultCard result={item} />}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View>
              <Text style={mobileStyles.sectionTitle}>Active Quizzes</Text>
              {activeQuizzes.length === 0 ? (
                <MobileEmptyCard icon="time-outline" title="No active quiz right now" text="Once a teacher activates a quiz for your batch, it will appear here." />
              ) : (
                activeQuizzes.map((item) => (
                  <MobileQuizCard key={item._id} quiz={item} onStart={openQuiz} />
                ))
              )}
              <Text style={mobileStyles.sectionTitle}>Previous Results</Text>
            </View>
          }
          ListEmptyComponent={
            <MobileEmptyCard icon="bar-chart-outline" title="No quiz results yet" text="Submit your first quiz to see marks here." />
          }
        />
      </View>
    );
  }

  // ─── WEB LAYOUT ───
  return (
    <ScrollView
      style={webStyles.root}
      contentContainerStyle={webStyles.rootContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={webStyles.inner}>

        {/* PAGE HEADER */}
        <View style={webStyles.pageHeader}>
          <View>
            <Text style={webStyles.pageTitle}>📝 Quizzes</Text>
            <Text style={webStyles.pageSubtitle}>Attend quizzes & track your performance</Text>
          </View>
          <View style={webStyles.statsBadgeRow}>
            <View style={webStyles.statsBadge}>
              <Ionicons name="flash-outline" size={14} color="#16a34a" />
              <Text style={webStyles.statsBadgeText}>{activeQuizzes.length} Active</Text>
            </View>
            <View style={[webStyles.statsBadge, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
              <Ionicons name="bar-chart-outline" size={14} color="#2563eb" />
              <Text style={[webStyles.statsBadgeText, { color: "#2563eb" }]}>{previousResults.length} Results</Text>
            </View>
          </View>
        </View>

        <View style={isWideScreen ? webStyles.twoColLayout : webStyles.oneColLayout}>

          {/* LEFT — ACTIVE QUIZZES */}
          <View style={isWideScreen ? webStyles.leftCol : webStyles.fullCol}>
            <View style={webStyles.sectionHeader}>
              <View style={webStyles.sectionDot} />
              <Text style={webStyles.sectionTitle}>Active Quizzes</Text>
            </View>

            {activeQuizzes.length === 0 ? (
              <WebEmptyCard
                icon="time-outline"
                title="No active quiz right now"
                text="Once a teacher activates a quiz for your batch, it will appear here."
              />
            ) : (
              activeQuizzes.map((item) => (
                <WebQuizCard key={item._id} quiz={item} onStart={openQuiz} />
              ))
            )}
          </View>

          {/* RIGHT — PREVIOUS RESULTS */}
          <View style={isWideScreen ? webStyles.rightCol : webStyles.fullCol}>
            <View style={webStyles.sectionHeader}>
              <View style={[webStyles.sectionDot, { backgroundColor: "#7c3aed" }]} />
              <Text style={webStyles.sectionTitle}>Previous Results</Text>
            </View>

            {previousResults.length === 0 ? (
              <WebEmptyCard
                icon="bar-chart-outline"
                title="No quiz results yet"
                text="Submit your first quiz to see marks here."
              />
            ) : (
              previousResults.map((item) => (
                <WebResultCard key={String(item._id || item.quizId)} result={item} />
              ))
            )}
          </View>
        </View>

        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Student Portal</Text>
      </View>
    </ScrollView>
  );
}

/* ─── MOBILE COMPONENTS ─── */
function MobileQuizCard({ quiz, onStart }) {
  const isActive = quiz.status === "Active";
  return (
    <View style={mobileStyles.card}>
      <View style={mobileStyles.cardHeader}>
        <Text style={mobileStyles.quizTitle}>{quiz.name}</Text>
        <View style={[mobileStyles.statusBadge, isActive ? mobileStyles.active : mobileStyles.upcoming]}>
          <Text style={mobileStyles.statusText}>{quiz.status}</Text>
        </View>
      </View>
      <Text style={mobileStyles.subject}>{quiz.description}</Text>
      <View style={mobileStyles.metaRow}><Ionicons name="time-outline" size={14} color="#64748b" /><Text style={mobileStyles.metaText}>{quiz.duration}</Text></View>
      <View style={mobileStyles.metaRow}><Ionicons name="people-outline" size={14} color="#64748b" /><Text style={mobileStyles.metaText}>{quiz.targetBatch}</Text></View>
      <View style={mobileStyles.metaRow}><Ionicons name="help-outline" size={14} color="#64748b" /><Text style={mobileStyles.metaText}>{quiz.questionCount} Questions</Text></View>
      <TouchableOpacity style={[mobileStyles.startBtn, !isActive && mobileStyles.disabledBtn]} disabled={!isActive} onPress={() => onStart(quiz._id)}>
        <Ionicons name="play-outline" size={18} color="#fff" />
        <Text style={mobileStyles.startText}>{isActive ? "Start Quiz" : "Not Available"}</Text>
      </TouchableOpacity>
    </View>
  );
}

function MobileResultCard({ result }) {
  const passed = result.result === "Passed";
  return (
    <View style={mobileStyles.card}>
      <Text style={mobileStyles.quizTitle}>{result.title}</Text>
      <Text style={mobileStyles.subject}>{result.description}</Text>
      <View style={mobileStyles.resultRow}>
        <Text style={mobileStyles.score}>Score: {result.score}/{result.total}</Text>
        <Text style={[mobileStyles.resultStatus, passed ? mobileStyles.pass : mobileStyles.fail]}>{result.result}</Text>
      </View>
      <Text style={mobileStyles.metaText}>Percentage: {result.percentage}%</Text>
    </View>
  );
}

function MobileEmptyCard({ icon, title, text }) {
  return (
    <View style={mobileStyles.emptyCard}>
      <Ionicons name={icon} size={26} color="#94a3b8" />
      <Text style={mobileStyles.emptyTitle}>{title}</Text>
      <Text style={mobileStyles.emptyText}>{text}</Text>
    </View>
  );
}

/* ─── WEB COMPONENTS ─── */
function WebQuizCard({ quiz, onStart }) {
  const isActive = quiz.status === "Active";
  return (
    <View style={webStyles.quizCard}>
      <View style={webStyles.quizCardTop}>
        <View style={webStyles.quizIconBox}>
          <Ionicons name="help-circle-outline" size={22} color="#2563eb" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={webStyles.quizTitle} numberOfLines={1}>{quiz.name}</Text>
          <Text style={webStyles.quizDesc} numberOfLines={1}>{quiz.description}</Text>
        </View>
        <View style={[webStyles.statusPill, isActive ? webStyles.statusActive : webStyles.statusInactive]}>
          <View style={[webStyles.statusDot, { backgroundColor: isActive ? "#16a34a" : "#94a3b8" }]} />
          <Text style={[webStyles.statusText, { color: isActive ? "#16a34a" : "#64748b" }]}>{quiz.status}</Text>
        </View>
      </View>

      <View style={webStyles.quizMeta}>
        <View style={webStyles.metaChip}>
          <Ionicons name="time-outline" size={13} color="#64748b" />
          <Text style={webStyles.metaChipText}>{quiz.duration}</Text>
        </View>
        <View style={webStyles.metaChip}>
          <Ionicons name="people-outline" size={13} color="#64748b" />
          <Text style={webStyles.metaChipText}>{quiz.targetBatch}</Text>
        </View>
        <View style={webStyles.metaChip}>
          <Ionicons name="help-outline" size={13} color="#64748b" />
          <Text style={webStyles.metaChipText}>{quiz.questionCount} Qs</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[webStyles.startBtn, !isActive && webStyles.startBtnDisabled]}
        disabled={!isActive}
        onPress={() => onStart(quiz._id)}
      >
        <Ionicons name="play-circle-outline" size={18} color="#fff" />
        <Text style={webStyles.startBtnText}>{isActive ? "Start Quiz" : "Not Available"}</Text>
      </TouchableOpacity>
    </View>
  );
}

function WebResultCard({ result }) {
  const passed = result.result === "Passed";
  const pct = Number(result.percentage || 0);
  return (
    <View style={webStyles.resultCard}>
      <View style={webStyles.resultCardTop}>
        <View style={[webStyles.resultIconBox, { backgroundColor: passed ? "#f0fdf4" : "#fef2f2" }]}>
          <Ionicons name={passed ? "checkmark-circle-outline" : "close-circle-outline"} size={22} color={passed ? "#16a34a" : "#ef4444"} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={webStyles.resultTitle} numberOfLines={1}>{result.title}</Text>
          <Text style={webStyles.resultDesc} numberOfLines={1}>{result.description}</Text>
        </View>
        <View style={[webStyles.resultPill, { backgroundColor: passed ? "#dcfce7" : "#fee2e2" }]}>
          <Text style={[webStyles.resultPillText, { color: passed ? "#16a34a" : "#dc2626" }]}>{result.result}</Text>
        </View>
      </View>

      {/* SCORE BAR */}
      <View style={webStyles.scoreBarWrap}>
        <View style={webStyles.scoreBarBg}>
          <View style={[webStyles.scoreBarFill, { width: `${pct}%`, backgroundColor: passed ? "#16a34a" : "#ef4444" }]} />
        </View>
        <Text style={[webStyles.scorePct, { color: passed ? "#16a34a" : "#ef4444" }]}>{pct}%</Text>
      </View>

      <Text style={webStyles.scoreLabel}>Score: {result.score}/{result.total}</Text>
    </View>
  );
}

function WebEmptyCard({ icon, title, text }) {
  return (
    <View style={webStyles.emptyCard}>
      <View style={webStyles.emptyIconBox}>
        <Ionicons name={icon} size={32} color="#cbd5e1" />
      </View>
      <Text style={webStyles.emptyTitle}>{title}</Text>
      <Text style={webStyles.emptyText}>{text}</Text>
    </View>
  );
}

/* ─────────────── MOBILE STYLES ─────────────── */
const mobileStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9", padding: 20 },
  heading: { fontSize: 26, fontWeight: "800", color: "#0f172a" },
  subheading: { fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 10, marginTop: 20 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 18, marginBottom: 14, elevation: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  quizTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", flex: 1 },
  subject: { fontSize: 13, color: "#475569", fontWeight: "600", marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  metaText: { marginLeft: 6, fontSize: 13, color: "#64748b" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  active: { backgroundColor: "#dcfce7" },
  upcoming: { backgroundColor: "#e5e7eb" },
  statusText: { fontSize: 12, fontWeight: "700", color: "#0f172a" },
  startBtn: { marginTop: 14, backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 12, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  disabledBtn: { backgroundColor: "#94a3b8" },
  startText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
  resultRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  score: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  resultStatus: { fontSize: 14, fontWeight: "700" },
  pass: { color: "#16a34a" },
  fail: { color: "#dc2626" },
  emptyCard: { backgroundColor: "#fff", borderRadius: 18, padding: 20, marginBottom: 16, alignItems: "center" },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "800", color: "#0f172a" },
  emptyText: { marginTop: 6, textAlign: "center", color: "#64748b", lineHeight: 20 },
});

/* ─────────────── WEB STYLES ─────────────── */
const webStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner: { width: "100%", maxWidth: 1100 },

  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  statsBadgeRow: { flexDirection: "row" },
  statsBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0fdf4", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#bbf7d0", marginLeft: 10 },
  statsBadgeText: { fontSize: 13, fontWeight: "700", color: "#16a34a", marginLeft: 5 },

  twoColLayout: { flexDirection: "row", marginBottom: 24 },
  oneColLayout: { flexDirection: "column", marginBottom: 24 },
  leftCol: { flex: 1, marginRight: 16 },
  rightCol: { flex: 1 },
  fullCol: { marginBottom: 24 },

  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  sectionDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#2563eb", marginRight: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a" },

  // QUIZ CARD
  quizCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  quizCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  quizIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center" },
  quizTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  quizDesc: { fontSize: 12, color: "#64748b", marginTop: 2 },
  statusPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusActive: { backgroundColor: "#f0fdf4" },
  statusInactive: { backgroundColor: "#f1f5f9" },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  statusText: { fontSize: 12, fontWeight: "700" },
  quizMeta: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  metaChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8, marginBottom: 6, borderWidth: 1, borderColor: "#e2e8f0" },
  metaChipText: { fontSize: 12, color: "#64748b", marginLeft: 5, fontWeight: "600" },
  startBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", shadowColor: "#16a34a", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  startBtnDisabled: { backgroundColor: "#94a3b8", shadowOpacity: 0 },
  startBtnText: { color: "#fff", fontWeight: "700", marginLeft: 8 },

  // RESULT CARD
  resultCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  resultCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  resultIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  resultTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  resultDesc: { fontSize: 12, color: "#64748b", marginTop: 2 },
  resultPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  resultPillText: { fontSize: 12, fontWeight: "700" },
  scoreBarWrap: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  scoreBarBg: { flex: 1, height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden", marginRight: 10 },
  scoreBarFill: { height: "100%", borderRadius: 4 },
  scorePct: { fontSize: 14, fontWeight: "800", width: 45, textAlign: "right" },
  scoreLabel: { fontSize: 13, color: "#64748b", fontWeight: "600" },

  // EMPTY CARD
  emptyCard: { backgroundColor: "#fff", borderRadius: 18, padding: 28, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 14 },
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#334155", marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 20 },

  footer: { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});