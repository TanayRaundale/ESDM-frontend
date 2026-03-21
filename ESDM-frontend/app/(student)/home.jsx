import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { fetchStudentDashboardAnalytics } from "../../src/services/dashboardApi";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState({
    kpis: {
      notes: 0,
      quizzes: 0,
      assignments: 0,
      avgScore: 0,
    },
    progress: {
      weeklyProgress: 0,
      completedAssignments: 0,
      pendingAssignments: 0,
      quizzesAvailable: 0,
      quizzesTaken: 0,
    },
  });

  const loadDashboard = async () => {
    try {
      const data = await fetchStudentDashboardAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.log(
        "Student dashboard fetch error:",
        error?.response?.data || error?.message || error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDashboard();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const stats = analytics?.kpis || {};
  const progress = analytics?.progress || {};
  const weeklyProgress = Math.max(
    0,
    Math.min(100, Number(progress.weeklyProgress || 0))
  );

  // ─── MOBILE LAYOUT (unchanged) ───
  if (!isWeb) {
    return (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDashboard();
            }}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Student Dashboard</Text>
          <Text style={styles.subtitle}>Your learning overview</Text>
        </View>

        <View style={styles.kpiRow}>
          <KpiCard icon="book-outline" label="Notes" value={stats.notes ?? 0} color="#2563eb" />
          <KpiCard icon="help-circle-outline" label="Quizzes Taken" value={stats.quizzes ?? 0} color="#16a34a" />
        </View>

        <View style={styles.kpiRow}>
          <KpiCard icon="document-text-outline" label="Assignments" value={stats.assignments ?? 0} color="#f59e0b" />
          <KpiCard icon="trophy-outline" label="Quiz Avg Score" value={`${stats.avgScore ?? 0}%`} color="#7c3aed" />
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${weeklyProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {weeklyProgress}% completed based on available quizzes & assignments
          </Text>
          <Text style={styles.progressMeta}>
            Completed Assignments: {progress.completedAssignments ?? 0} | Pending:{" "}
            {progress.pendingAssignments ?? 0}
          </Text>
          <Text style={styles.progressMeta}>
            Quizzes Taken: {progress.quizzesTaken ?? 0} / {progress.quizzesAvailable ?? 0}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionCard icon="book" title="Notes" />
          <ActionCard icon="help-circle" title="Quizzes" />
          <ActionCard icon="brush" title="Diagrams" />
          <ActionCard icon="person" title="Profile" />
        </View>

        <View style={styles.progressCard2}>
          <Text style={styles.sectionTitle}>THANK YOU</Text>
          <Text style={styles.progressText}></Text>
        </View>
      </ScrollView>
    );
  }

  // ─── WEB LAYOUT ───
  return (
    <ScrollView
      style={webStyles.root}
      contentContainerStyle={webStyles.rootContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadDashboard();
          }}
        />
      }
    >
      <View style={webStyles.inner}>

        {/* PAGE HEADER */}
        <View style={webStyles.pageHeader}>
          <View>
            <Text style={webStyles.pageTitle}>Student Dashboard</Text>
            <Text style={webStyles.pageSubtitle}>Your learning overview at a glance</Text>
          </View>
          <View style={webStyles.headerBadge}>
            <Ionicons name="pulse-outline" size={16} color="#2563eb" />
            <Text style={webStyles.headerBadgeText}>Live</Text>
          </View>
        </View>

        {/* KPI GRID — 4 columns on wide, 2 on narrow */}
        <View style={isWideScreen ? webStyles.kpiGridWide : webStyles.kpiGridNarrow}>
          <WebKpiCard
            icon="book-outline"
            label="Study Notes"
            value={stats.notes ?? 0}
            color="#2563eb"
            bg="#eff6ff"
          />
          <WebKpiCard
            icon="help-circle-outline"
            label="Quizzes Taken"
            value={stats.quizzes ?? 0}
            color="#16a34a"
            bg="#f0fdf4"
          />
          <WebKpiCard
            icon="document-text-outline"
            label="Assignments"
            value={stats.assignments ?? 0}
            color="#f59e0b"
            bg="#fffbeb"
          />
          <WebKpiCard
            icon="trophy-outline"
            label="Quiz Avg Score"
            value={`${stats.avgScore ?? 0}%`}
            color="#7c3aed"
            bg="#f5f3ff"
          />
        </View>

        {/* BOTTOM SECTION — progress + quick actions */}
        <View style={isWideScreen ? webStyles.bottomRowWide : webStyles.bottomRowNarrow}>

          {/* PROGRESS CARD */}
          <View style={isWideScreen ? webStyles.progressCardWide : webStyles.progressCardNarrow}>
            <View style={webStyles.cardHeader}>
              <Ionicons name="bar-chart-outline" size={20} color="#2563eb" />
              <Text style={webStyles.cardTitle}>Weekly Progress</Text>
            </View>

            {/* Progress bar */}
            <View style={webStyles.progressWrap}>
              <View style={webStyles.progressLabelRow}>
                <Text style={webStyles.progressLabel}>Overall Completion</Text>
                <Text style={webStyles.progressPct}>{weeklyProgress}%</Text>
              </View>
              <View style={webStyles.progressBarBg}>
                <View
                  style={[
                    webStyles.progressBarFill,
                    { width: `${weeklyProgress}%` },
                  ]}
                />
              </View>
            </View>

            {/* Stats row */}
            <View style={webStyles.statsRow}>
              <View style={webStyles.statBox}>
                <Text style={webStyles.statValue}>
                  {progress.completedAssignments ?? 0}
                </Text>
                <Text style={webStyles.statLabel}>Completed</Text>
              </View>
              <View style={webStyles.statDivider} />
              <View style={webStyles.statBox}>
                <Text style={[webStyles.statValue, { color: "#ef4444" }]}>
                  {progress.pendingAssignments ?? 0}
                </Text>
                <Text style={webStyles.statLabel}>Pending</Text>
              </View>
              <View style={webStyles.statDivider} />
              <View style={webStyles.statBox}>
                <Text style={[webStyles.statValue, { color: "#16a34a" }]}>
                  {progress.quizzesTaken ?? 0}/{progress.quizzesAvailable ?? 0}
                </Text>
                <Text style={webStyles.statLabel}>Quizzes</Text>
              </View>
            </View>
          </View>

          {/* QUICK ACTIONS */}
          <View style={isWideScreen ? webStyles.actionsCardWide : webStyles.actionsCardNarrow}>
            <View style={webStyles.cardHeader}>
              <Ionicons name="grid-outline" size={20} color="#2563eb" />
              <Text style={webStyles.cardTitle}>Quick Actions</Text>
            </View>

            <View style={webStyles.actionsGrid}>
              {[
                { icon: "book", title: "Notes", color: "#2563eb", bg: "#eff6ff" },
                { icon: "help-circle", title: "Quizzes", color: "#16a34a", bg: "#f0fdf4" },
                { icon: "brush", title: "Diagrams", color: "#7c3aed", bg: "#f5f3ff" },
                { icon: "person", title: "Profile", color: "#f59e0b", bg: "#fffbeb" },
              ].map((item, i) => (
                <View key={i} style={webStyles.actionBtn}>
                  <View style={[webStyles.actionIconBox, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                  <Text style={webStyles.actionText}>{item.title}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={webStyles.footer}>
          <Text style={webStyles.footerText}>
            © 2025 ESDM Virtual Lab · Student Portal
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

/* ─── MOBILE COMPONENTS ─── */

function KpiCard({ icon, label, value, color }) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({ icon, title }) {
  return (
    <View style={styles.actionCard}>
      <Ionicons name={icon} size={26} color="#2563eb" />
      <Text style={styles.actionText}>{title}</Text>
    </View>
  );
}

/* ─── WEB COMPONENTS ─── */

function WebKpiCard({ icon, label, value, color, bg }) {
  return (
    <View style={webStyles.kpiCard}>
      <View style={webStyles.kpiCardTop}>
        <View style={[webStyles.kpiIconBox, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={webStyles.kpiLabel}>{label}</Text>
      </View>
      <Text style={[webStyles.kpiValue, { color }]}>{value}</Text>
    </View>
  );
}

/* ─────────────── MOBILE STYLES ─────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#0f172a" },
  subtitle: { marginTop: 4, fontSize: 14, color: "#64748b" },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  kpiCard: {
    backgroundColor: "#fff",
    width: "48%",
    borderRadius: 16,
    padding: 16,
    elevation: 4,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  kpiValue: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  kpiLabel: { marginTop: 2, fontSize: 13, color: "#64748b" },
  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginTop: 10,
    elevation: 4,
  },
  progressCard2: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    marginTop: 10,
  },
  progressBarFill: {
    height: 10,
    backgroundColor: "#2563eb",
    borderRadius: 10,
  },
  progressText: { marginTop: 8, fontSize: 13, color: "#64748b" },
  progressMeta: { marginTop: 4, fontSize: 12, color: "#475569" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 25,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    backgroundColor: "#fff",
    width: "48%",
    height: 90,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    elevation: 3,
  },
  actionText: { marginTop: 6, fontSize: 14, fontWeight: "600", color: "#0f172a" },
});

/* ─────────────── WEB STYLES ─────────────── */
const webStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  rootContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  inner: {
    width: "100%",
    maxWidth: 1100,
  },

  // PAGE HEADER
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
    marginLeft: 6,
  },

  // KPI GRIDS
  kpiGridWide: {
    flexDirection: "row",
    marginBottom: 24,
  },
  kpiGridNarrow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minWidth: 160,
    marginBottom: 16,
  },
  kpiCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  kpiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  kpiLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    flex: 1,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
  },

  // BOTTOM ROW
  bottomRowWide: {
    flexDirection: "row",
    marginBottom: 24,
  },
  bottomRowNarrow: {
    flexDirection: "column",
    marginBottom: 24,
  },

  // PROGRESS CARD
  progressCardWide: {
    flex: 1.6,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 24,
    marginRight: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  progressCardNarrow: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  // ACTIONS CARD
  actionsCardWide: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 24,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionsCardNarrow: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 24,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  // SHARED CARD HEADER
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginLeft: 8,
  },

  // PROGRESS
  progressWrap: { marginBottom: 20 },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  progressPct: { fontSize: 14, fontWeight: "800", color: "#2563eb" },
  progressBarBg: {
    height: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
  },
  progressBarFill: {
    height: 10,
    backgroundColor: "#2563eb",
    borderRadius: 10,
  },

  // STATS ROW
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: "500" },
  statDivider: { width: 1, height: 36, backgroundColor: "#e2e8f0" },

  // ACTIONS GRID
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actionBtn: {
    width: "48%",
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 12,
  },
  actionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },

  // FOOTER
  footer: { alignItems: "center", paddingTop: 8 },
  footerText: { fontSize: 12, color: "#94a3b8" },
});