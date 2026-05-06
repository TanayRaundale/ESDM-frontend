// ============================================================
// FILE: app/(teacher)/activate-quiz.jsx
// ============================================================
import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Linking, Alert, ScrollView, Platform, Dimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchTeacherQuizzes } from "../../src/services/quizApi";
import API from "../../src/services/api";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

export default function ActivateQuiz() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadQuizzes = async () => {
    try { const data = await fetchTeacherQuizzes(); setQuizzes(data); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); loadQuizzes(); }, []));

  const openTemplate = async () => {
    try { await Linking.openURL(`${API.defaults.baseURL}/quizzes/template`); }
    catch { Alert.alert("Error", "Unable to open template link."); }
  };

  const QuizCard = ({ item }) => {
    const isActive = item.status === "Active";
    return (
      <TouchableOpacity
        style={isWeb ? webStyles.card : mobileStyles.card}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: "/(teacher)/quiz-details", params: { quizId: item._id || item.id } })}
      >
        <View style={isWeb ? webStyles.cardHeader : mobileStyles.cardHeader}>
          <View style={isWeb ? webStyles.cardIconBox : null}>
            {isWeb && <Ionicons name="help-circle-outline" size={22} color="#2563eb" />}
          </View>
          <View style={{ flex: 1, marginLeft: isWeb ? 12 : 0 }}>
            <Text style={isWeb ? webStyles.quizName : mobileStyles.quizName} numberOfLines={1}>{item.name}</Text>
            <Text style={isWeb ? webStyles.quizDesc : mobileStyles.description} numberOfLines={2}>{item.description}</Text>
          </View>
          <View style={[isWeb ? webStyles.statusPill : mobileStyles.statusBadge, isActive ? (isWeb ? webStyles.statusActive : mobileStyles.activeBadge) : (isWeb ? webStyles.statusInactive : mobileStyles.inactiveBadge)]}>
            {isWeb && <View style={[webStyles.statusDot, { backgroundColor: isActive ? "#16a34a" : "#94a3b8" }]} />}
            <Text style={[isWeb ? webStyles.statusText : mobileStyles.statusText, isActive ? (isWeb ? { color: "#16a34a" } : mobileStyles.activeText) : (isWeb ? { color: "#64748b" } : mobileStyles.inactiveText)]}>{item.status}</Text>
          </View>
        </View>
        <View style={isWeb ? webStyles.metaRow : mobileStyles.metaRow}>
          <View style={isWeb ? webStyles.metaChip : mobileStyles.metaItem}>
            <Ionicons name="people-outline" size={14} color="#64748b" />
            <Text style={isWeb ? webStyles.metaChipText : mobileStyles.metaText}>{item.targetBatch}</Text>
          </View>
          <View style={isWeb ? webStyles.metaChip : mobileStyles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#64748b" />
            <Text style={isWeb ? webStyles.metaChipText : mobileStyles.metaText}>{item.duration}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isWeb) {
    return (
      <View style={mobileStyles.container}>
        <View style={mobileStyles.header}>
          <View style={mobileStyles.headerRow}>
            <Text style={mobileStyles.title}>Activate Quiz</Text>
            <TouchableOpacity style={mobileStyles.templateButton} onPress={openTemplate}>
              <Ionicons name="download-outline" size={16} color="#1d4ed8" />
              <Text style={mobileStyles.templateButtonText}>Template</Text>
            </TouchableOpacity>
          </View>
          <Text style={mobileStyles.subtitle}>Open a quiz to review details and activate it.</Text>
        </View>
        {loading ? <View style={mobileStyles.loader}><ActivityIndicator size="large" color="#2563eb" /></View> : (
          <FlatList data={quizzes} keyExtractor={(item) => String(item._id || item.id)} renderItem={({ item }) => <QuizCard item={item} />}
            contentContainerStyle={mobileStyles.listContent}
            ListEmptyComponent={<View style={mobileStyles.emptyState}><Ionicons name="help-circle-outline" size={42} color="#94a3b8" /><Text style={mobileStyles.emptyTitle}>No quizzes available</Text><Text style={mobileStyles.emptyText}>Tap the plus button to create your first quiz.</Text></View>}
          />
        )}
        <TouchableOpacity style={mobileStyles.fab} onPress={() => router.push("/(teacher)/create-quiz")}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={webStyles.root} contentContainerStyle={webStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={webStyles.inner}>
        <View style={webStyles.pageHeader}>
          <View>
            <Text style={webStyles.pageTitle}>Activate Quiz</Text>
            <Text style={webStyles.pageSubtitle}>Open a quiz to review details and activate it for a batch.</Text>
          </View>
          <View style={webStyles.headerActions}>
            <TouchableOpacity style={webStyles.templateBtn} onPress={openTemplate}>
              <Ionicons name="download-outline" size={16} color="#1d4ed8" />
              <Text style={webStyles.templateBtnText}>Template</Text>
            </TouchableOpacity>
            <TouchableOpacity style={webStyles.createBtn} onPress={() => router.push("/(teacher)/create-quiz")}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={webStyles.createBtnText}>Create Quiz</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} /> : (
          quizzes.length === 0 ? (
            <View style={webStyles.emptyBox}>
              <View style={webStyles.emptyIconBox}><Ionicons name="help-circle-outline" size={48} color="#cbd5e1" /></View>
              <Text style={webStyles.emptyTitle}>No quizzes yet</Text>
              <Text style={webStyles.emptyText}>Create your first quiz to get started</Text>
            </View>
          ) : (
            <View style={isWideScreen ? webStyles.gridWide : webStyles.gridNarrow}>
              {quizzes.map((item) => <QuizCard key={String(item._id || item.id)} item={item} />)}
            </View>
          )
        )}
        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mobileStyles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#f8fafc", paddingHorizontal: 18, paddingTop: 18 },
  header:      { marginBottom: 12 },
  headerRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title:       { fontSize: 26, fontWeight: "800", color: "#0f172a" },
  subtitle:    { marginTop: 6, fontSize: 14, color: "#64748b", lineHeight: 20 },
  templateButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#dbeafe", borderWidth: 1, borderColor: "#93c5fd", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  templateButtonText: { fontSize: 13, fontWeight: "800", color: "#1d4ed8", marginLeft: 4 },
  loader:      { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingBottom: 100 },
  card:        { backgroundColor: "#fff", borderRadius: 18, padding: 18, marginTop: 14, elevation: 4 },
  cardHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  quizName:    { flex: 1, fontSize: 18, fontWeight: "800", color: "#0f172a" },
  description: { marginTop: 10, color: "#475569", fontSize: 14, lineHeight: 20 },
  metaRow:     { flexDirection: "row", flexWrap: "wrap", marginTop: 14 },
  metaItem:    { flexDirection: "row", alignItems: "center", marginRight: 14 },
  metaText:    { fontSize: 13, color: "#475569", fontWeight: "600", marginLeft: 5 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  activeBadge: { backgroundColor: "#dcfce7" },
  inactiveBadge: { backgroundColor: "#fee2e2" },
  statusText:  { fontSize: 12, fontWeight: "800" },
  activeText:  { color: "#15803d" },
  inactiveText:{ color: "#b91c1c" },
  emptyState:  { backgroundColor: "#fff", borderRadius: 18, padding: 26, marginTop: 20, alignItems: "center" },
  emptyTitle:  { marginTop: 12, fontSize: 18, fontWeight: "700", color: "#0f172a" },
  emptyText:   { marginTop: 8, textAlign: "center", color: "#64748b", lineHeight: 20 },
  fab:         { position: "absolute", right: 22, bottom: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center", elevation: 8 },
});

const webStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1100 },
  pageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  pageTitle:   { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle:{ fontSize: 14, color: "#64748b", marginTop: 4 },
  headerActions: { flexDirection: "row", alignItems: "center" },
  templateBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#dbeafe", borderWidth: 1, borderColor: "#93c5fd", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginRight: 12 },
  templateBtnText: { fontSize: 13, fontWeight: "700", color: "#1d4ed8", marginLeft: 6 },
  createBtn:   { flexDirection: "row", alignItems: "center", backgroundColor: "#2563eb", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  createBtnText: { fontSize: 14, fontWeight: "700", color: "#fff", marginLeft: 6 },
  gridWide:    { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  gridNarrow:  { flexDirection: "column", marginBottom: 24 },
  card:        { backgroundColor: "#fff", borderRadius: 18, padding: 22, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 16, shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3, width: "48%", marginRight: "2%" },
  cardHeader:  { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  cardIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center" },
  quizName:    { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  quizDesc:    { fontSize: 12, color: "#64748b", marginTop: 2 },
  statusPill:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusActive:   { backgroundColor: "#f0fdf4" },
  statusInactive: { backgroundColor: "#f1f5f9" },
  statusDot:   { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  statusText:  { fontSize: 12, fontWeight: "700" },
  metaRow:     { flexDirection: "row", flexWrap: "wrap" },
  metaChip:    { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  metaChipText:{ fontSize: 12, color: "#64748b", marginLeft: 5, fontWeight: "600" },
  emptyBox:    { backgroundColor: "#fff", borderRadius: 20, padding: 48, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  emptyIconBox:{ width: 90, height: 90, borderRadius: 45, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle:  { fontSize: 20, fontWeight: "800", color: "#334155", marginBottom: 8 },
  emptyText:   { fontSize: 14, color: "#94a3b8", textAlign: "center" },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});