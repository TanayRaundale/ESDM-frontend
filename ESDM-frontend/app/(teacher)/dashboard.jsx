import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Image, Dimensions, RefreshControl, Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { fetchTeacherDashboardAnalytics } from "../../src/services/dashboardApi";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

// Only import charts on native — they don't work well on web
let LineChart = null;
let BarChart = null;
if (!isWeb) {
  const chartKit = require("react-native-chart-kit");
  LineChart = chartKit.LineChart;
  BarChart  = chartKit.BarChart;
}

const chartConfigBlue = {
  backgroundGradientFrom: "#ffffff", backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(37,99,235,${opacity})`,
  labelColor: () => "#64748b",
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#2563eb" },
};
const chartConfigGreen = {
  backgroundGradientFrom: "#ffffff", backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(22,163,74,${opacity})`,
  labelColor: () => "#64748b",
};

export default function TeacherDashboard() {
  const [teacher, setTeacher]           = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [analytics, setAnalytics]       = useState(null);

  const loadHeaderIdentity = async () => {
    const userData = await AsyncStorage.getItem("user");
    const image    = await AsyncStorage.getItem("profileImage");
    if (userData) setTeacher(JSON.parse(userData));
    setProfileImage(image || null);
  };

  const loadAnalytics = async () => {
    try {
      const data = await fetchTeacherDashboardAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.log("Dashboard fetch error:", error?.response?.data || error?.message);
      setAnalytics(null);
    }
  };

  const loadAll = async () => {
    try { await Promise.all([loadHeaderIdentity(), loadAnalytics()]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadAll(); }, []);
  useFocusEffect(useCallback(() => { loadAll(); }, []));

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  const overview       = analytics?.overview       || { totalStudents: 0, totalAssignments: 0, totalNotes: 0, totalQuizzes: 0 };
  const charts         = analytics?.charts         || {};
  const summary        = analytics?.todaySummary   || { dueTodayAssignments: 0, notesUploadedToday: 0, activeQuizzes: 0, totalStudents: 0 };
  const recentActivity = analytics?.recentActivity || [];

  const trendLabels = charts.assignmentSubmissionTrend?.labels?.length ? charts.assignmentSubmissionTrend.labels : ["-","-","-","-","-","-"];
  const trendValues = charts.assignmentSubmissionTrend?.values?.length ? charts.assignmentSubmissionTrend.values : [0,0,0,0,0,0];
  const quizLabels  = charts.quizPerformance?.labels?.length ? charts.quizPerformance.labels : ["No","Data"];
  const quizValues  = charts.quizPerformance?.values?.length ? charts.quizPerformance.values : [0,0];

  const kpis = [
    { title: "Students",    value: overview.totalStudents,    icon: "people",          color: "#2563eb", bg: "#eff6ff"  },
    { title: "Assignments", value: overview.totalAssignments, icon: "clipboard",       color: "#f59e0b", bg: "#fffbeb"  },
    { title: "Notes",       value: overview.totalNotes,       icon: "document-text",   color: "#16a34a", bg: "#f0fdf4"  },
    { title: "Quizzes",     value: overview.totalQuizzes,     icon: "help-circle",     color: "#7c3aed", bg: "#f5f3ff"  },
  ];

  const summaryItems = [
    { icon: "clipboard-outline",      text: `${summary.dueTodayAssignments} Assignments Due Today`,  color: "#f59e0b" },
    { icon: "document-text-outline",  text: `${summary.notesUploadedToday} Notes Uploaded Today`,   color: "#2563eb" },
    { icon: "help-circle-outline",    text: `${summary.activeQuizzes} Active Quizzes`,              color: "#16a34a" },
    { icon: "people-outline",         text: `${summary.totalStudents} Students Enrolled`,           color: "#7c3aed" },
  ];

  // ─── MOBILE ───
  if (!isWeb) {
    return (
      <ScrollView style={mobileStyles.container} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} />}
      >
        {/* Header */}
        <View style={mobileStyles.header}>
          <View style={mobileStyles.headerRow}>
            <View>
              <Text style={mobileStyles.welcome}>Welcome Back</Text>
              <Text style={mobileStyles.name}>{teacher?.name || "Teacher"}</Text>
              <Text style={mobileStyles.role}>{teacher?.role}</Text>
            </View>
            {profileImage
              ? <Image source={{ uri: `data:image/jpeg;base64,${profileImage}` }} style={mobileStyles.avatar} />
              : <View style={mobileStyles.avatarPlaceholder}><Ionicons name="person" size={28} color="#94a3b8" /></View>
            }
          </View>
        </View>

        <Text style={mobileStyles.sectionTitle}>Overview</Text>
        <View style={mobileStyles.analyticsGrid}>
          {kpis.map((k, i) => (
            <View key={i} style={mobileStyles.analyticsCard}>
              <Ionicons name={k.icon} size={24} color="#2563eb" />
              <Text style={mobileStyles.analyticsValue}>{k.value ?? 0}</Text>
              <Text style={mobileStyles.analyticsTitle}>{k.title}</Text>
            </View>
          ))}
        </View>

        {LineChart && (
          <View style={mobileStyles.chartContainer}>
            <Text style={mobileStyles.sectionTitle}>Assignment Submissions (Last 6 Days)</Text>
            <LineChart data={{ labels: trendLabels, datasets: [{ data: trendValues }] }} width={width - 32} height={220} chartConfig={chartConfigBlue} style={{ borderRadius: 16 }} />
          </View>
        )}
        {BarChart && (
          <View style={mobileStyles.chartContainer}>
            <Text style={mobileStyles.sectionTitle}>Quiz Performance (Avg % by Batch)</Text>
            <BarChart data={{ labels: quizLabels, datasets: [{ data: quizValues }] }} width={width - 32} height={220} fromZero chartConfig={chartConfigGreen} style={{ borderRadius: 16 }} />
          </View>
        )}

        <Text style={mobileStyles.sectionTitle}>Today's Summary</Text>
        <View style={mobileStyles.summaryCard}>
          {summaryItems.map((item, i) => (
            <View key={i} style={mobileStyles.summaryItem}>
              <Ionicons name={item.icon} size={18} color="#2563eb" />
              <Text style={mobileStyles.summaryText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Text style={mobileStyles.sectionTitle}>Recent Activity</Text>
        <View style={mobileStyles.activityCard}>
          {recentActivity.length === 0
            ? <Text style={mobileStyles.emptyText}>No recent activity yet</Text>
            : recentActivity.map((item, i) => (
                <View key={i} style={mobileStyles.activityItem}>
                  <Ionicons name={item.icon || "time"} size={18} color="#2563eb" />
                  <Text style={mobileStyles.activityText}>{item.text}</Text>
                </View>
              ))
          }
        </View>
      </ScrollView>
    );
  }

  // ─── WEB ───
  return (
    <ScrollView style={webStyles.root} contentContainerStyle={webStyles.rootContent} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} />}
    >
      <View style={webStyles.inner}>

        {/* HEADER CARD */}
        <View style={webStyles.headerCard}>
          <View style={webStyles.headerBlob1} /><View style={webStyles.headerBlob2} />
          <View style={webStyles.headerLeft}>
            <View>
              <Text style={webStyles.welcome}>Welcome Back 👋</Text>
              <Text style={webStyles.name}>{teacher?.name || "Teacher"}</Text>
              <Text style={webStyles.role}>{teacher?.role}</Text>
            </View>
            {profileImage
              ? <Image source={{ uri: `data:image/jpeg;base64,${profileImage}` }} style={webStyles.avatar} />
              : <View style={webStyles.avatarPlaceholder}><Ionicons name="person" size={32} color="#94a3b8" /></View>
            }
          </View>
        </View>

        {/* KPI GRID */}
        <View style={isWideScreen ? webStyles.kpiGridWide : webStyles.kpiGridNarrow}>
          {kpis.map((k, i) => (
            <View key={i} style={[webStyles.kpiCard, isWideScreen && { marginRight: i < 3 ? 16 : 0 }]}>
              <View style={[webStyles.kpiIconBox, { backgroundColor: k.bg }]}>
                <Ionicons name={k.icon} size={24} color={k.color} />
              </View>
              <Text style={[webStyles.kpiValue, { color: k.color }]}>{k.value ?? 0}</Text>
              <Text style={webStyles.kpiLabel}>{k.title}</Text>
            </View>
          ))}
        </View>

        {/* CHARTS ROW */}
        <View style={isWideScreen ? webStyles.chartsRowWide : webStyles.chartsRowNarrow}>
          {/* Submission Trend */}
          <View style={[webStyles.chartCard, isWideScreen && { flex: 1.6, marginRight: 16 }]}>
            <View style={webStyles.cardHeader}>
              <Ionicons name="trending-up-outline" size={18} color="#2563eb" />
              <Text style={webStyles.cardTitle}>Assignment Submissions (Last 6 Days)</Text>
            </View>
            <View style={webStyles.webChart}>
              {trendValues.map((val, i) => (
                <View key={i} style={webStyles.barCol}>
                  <Text style={webStyles.barValue}>{val}</Text>
                  <View style={[webStyles.bar, { height: Math.max((val / Math.max(...trendValues, 1)) * 120, 4), backgroundColor: "#2563eb" }]} />
                  <Text style={webStyles.barLabel}>{trendLabels[i]}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Quiz Performance */}
          <View style={[webStyles.chartCard, isWideScreen && { flex: 1 }]}>
            <View style={webStyles.cardHeader}>
              <Ionicons name="bar-chart-outline" size={18} color="#16a34a" />
              <Text style={webStyles.cardTitle}>Quiz Avg % by Batch</Text>
            </View>
            <View style={webStyles.webChart}>
              {quizValues.map((val, i) => (
                <View key={i} style={webStyles.barCol}>
                  <Text style={webStyles.barValue}>{val}%</Text>
                  <View style={[webStyles.bar, { height: Math.max((val / 100) * 120, 4), backgroundColor: "#16a34a" }]} />
                  <Text style={webStyles.barLabel}>{quizLabels[i]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* BOTTOM ROW */}
        <View style={isWideScreen ? webStyles.bottomRowWide : webStyles.bottomRowNarrow}>
          {/* Today's Summary */}
          <View style={[webStyles.section, isWideScreen && { flex: 1, marginRight: 16 }]}>
            <View style={webStyles.cardHeader}>
              <Ionicons name="today-outline" size={18} color="#2563eb" />
              <Text style={webStyles.cardTitle}>Today's Summary</Text>
            </View>
            {summaryItems.map((item, i) => (
              <View key={i} style={webStyles.summaryRow}>
                <View style={[webStyles.summaryIconBox, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={16} color={item.color} />
                </View>
                <Text style={webStyles.summaryText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Recent Activity */}
          <View style={[webStyles.section, isWideScreen && { flex: 1 }]}>
            <View style={webStyles.cardHeader}>
              <Ionicons name="time-outline" size={18} color="#2563eb" />
              <Text style={webStyles.cardTitle}>Recent Activity</Text>
            </View>
            {recentActivity.length === 0
              ? <Text style={webStyles.emptyText}>No recent activity yet</Text>
              : recentActivity.map((item, i) => (
                  <View key={i} style={webStyles.activityRow}>
                    <View style={webStyles.activityDot} />
                    <Text style={webStyles.activityText}>{item.text}</Text>
                  </View>
                ))
            }
          </View>
        </View>

        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mobileStyles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#f1f5f9", padding: 16 },
  header:         { backgroundColor: "#2563eb", borderRadius: 22, padding: 24, marginBottom: 20 },
  headerRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  welcome:        { color: "#c7d2fe", fontSize: 14 },
  name:           { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 6 },
  role:           { color: "#e0e7ff", fontSize: 14 },
  avatar:         { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: "#fff" },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },
  sectionTitle:   { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#0f172a" },
  analyticsGrid:  { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
  analyticsCard:  { backgroundColor: "#fff", width: "48%", padding: 18, borderRadius: 16, marginBottom: 12, alignItems: "center", elevation: 3 },
  analyticsValue: { fontSize: 22, fontWeight: "800", marginTop: 6, color: "#0f172a" },
  analyticsTitle: { fontSize: 12, color: "#64748b" },
  chartContainer: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 20, elevation: 3 },
  summaryCard:    { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 20, elevation: 3 },
  summaryItem:    { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  summaryText:    { color: "#334155", marginLeft: 8 },
  activityCard:   { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 18, elevation: 3 },
  activityItem:   { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  activityText:   { color: "#334155", flex: 1, marginLeft: 8 },
  emptyText:      { color: "#94a3b8" },
});

const webStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1100 },

  headerCard:  { backgroundColor: "#2563eb", borderRadius: 24, padding: 32, marginBottom: 24, overflow: "hidden", position: "relative" },
  headerBlob1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "rgba(255,255,255,0.08)", top: -80, right: -60 },
  headerBlob2: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)", bottom: -60, left: 40 },
  headerLeft:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  welcome:     { color: "#bfdbfe", fontSize: 15 },
  name:        { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 6 },
  role:        { color: "#dbeafe", fontSize: 14, marginTop: 4, textTransform: "capitalize" },
  avatar:      { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: "rgba(255,255,255,0.4)" },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },

  kpiGridWide:   { flexDirection: "row", marginBottom: 20 },
  kpiGridNarrow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  kpiCard:       { flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 22, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3, marginBottom: 16, minWidth: 160 },
  kpiIconBox:    { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  kpiValue:      { fontSize: 32, fontWeight: "900" },
  kpiLabel:      { fontSize: 13, color: "#64748b", fontWeight: "600", marginTop: 4 },

  chartsRowWide:   { flexDirection: "row", marginBottom: 20 },
  chartsRowNarrow: { flexDirection: "column", marginBottom: 20 },
  chartCard:       { backgroundColor: "#fff", borderRadius: 18, padding: 22, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3, marginBottom: 16 },
  cardHeader:      { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  cardTitle:       { fontSize: 15, fontWeight: "700", color: "#0f172a", marginLeft: 8, flex: 1 },
  webChart:        { flexDirection: "row", alignItems: "flex-end", height: 160, paddingTop: 16 },
  barCol:          { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar:             { width: "60%", borderRadius: 6, minHeight: 4 },
  barValue:        { fontSize: 11, fontWeight: "700", color: "#64748b", marginBottom: 4 },
  barLabel:        { fontSize: 10, color: "#94a3b8", marginTop: 6, textAlign: "center" },

  bottomRowWide:   { flexDirection: "row", marginBottom: 20 },
  bottomRowNarrow: { flexDirection: "column", marginBottom: 20 },
  section:         { backgroundColor: "#fff", borderRadius: 18, padding: 22, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3, marginBottom: 16 },
  summaryRow:      { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  summaryIconBox:  { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12 },
  summaryText:     { fontSize: 14, color: "#334155", fontWeight: "500", flex: 1 },
  activityRow:     { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  activityDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563eb", marginRight: 12 },
  activityText:    { fontSize: 13, color: "#475569", flex: 1 },
  emptyText:       { color: "#94a3b8", fontSize: 13 },

  footer: { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});