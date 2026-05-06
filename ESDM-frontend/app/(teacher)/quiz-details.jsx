import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, ScrollView, Platform, Dimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchTeacherQuizById, updateTeacherQuizStatus } from "../../src/services/quizApi";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

export default function QuizDetails() {
  const { quizId } = useLocalSearchParams();
  const [quiz, setQuiz]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    (async () => {
      try { const data = await fetchTeacherQuizById(quizId); setQuiz(data); }
      finally { setLoading(false); }
    })();
  }, [quizId]);

  const handleStatusChange = async () => {
    if (!quiz) return;
    const next = quiz.status === "Active" ? "Inactive" : "Active";
    try {
      setUpdating(true);
      const updated = await updateTeacherQuizStatus(quiz._id || quiz.id, next);
      setQuiz(updated);
      Alert.alert("Success", `Quiz is now ${next.toLowerCase()}.`);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Unable to update quiz status.");
    } finally { setUpdating(false); }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (!quiz)   return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={{ color: "#64748b" }}>Quiz not found</Text></View>;

  const isActive = quiz.status === "Active";

  const details = [
    { label: "Quiz Name",    value: quiz.name,         icon: "help-circle-outline"   },
    { label: "Description",  value: quiz.description,  icon: "document-text-outline", multiline: true },
    { label: "Target Batch", value: quiz.targetBatch,  icon: "people-outline"         },
    { label: "Duration",     value: quiz.duration,     icon: "time-outline"           },
    { label: "Questions",    value: String(quiz.questionCount || 0), icon: "list-outline" },
    { label: "Excel File",   value: quiz.fileName || "No file", icon: "document-attach-outline" },
  ];

  if (!isWeb) {
    return (
      <ScrollView style={mobileStyles.container} contentContainerStyle={mobileStyles.content}>
        <View style={mobileStyles.heroCard}>
          <Text style={mobileStyles.quizName}>{quiz.name}</Text>
          <Text style={mobileStyles.description}>{quiz.description}</Text>
        </View>
        <View style={mobileStyles.detailsCard}>
          {details.map((d, i) => (
            <View key={i} style={mobileStyles.row}>
              <Text style={mobileStyles.label}>{d.label}</Text>
              <Text style={[mobileStyles.value, d.multiline && mobileStyles.multilineValue,
                d.label === "Status" && (isActive ? mobileStyles.activeValue : mobileStyles.inactiveValue)]}>{d.value}</Text>
            </View>
          ))}
          <View style={mobileStyles.row}>
            <Text style={mobileStyles.label}>Status</Text>
            <Text style={[mobileStyles.value, isActive ? mobileStyles.activeValue : mobileStyles.inactiveValue]}>{quiz.status}</Text>
          </View>
          <TouchableOpacity style={[mobileStyles.button, isActive ? mobileStyles.deactivateButton : mobileStyles.activateButton]} onPress={handleStatusChange} disabled={updating}>
            {updating ? <ActivityIndicator color="#fff" /> : (
              <><Ionicons name={isActive ? "pause-circle-outline" : "play-circle-outline"} size={20} color="#fff" />
              <Text style={mobileStyles.buttonText}>{isActive ? "Deactivate Quiz" : "Activate Quiz"}</Text></>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={webStyles.root} contentContainerStyle={webStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={webStyles.inner}>

        {/* HERO CARD */}
        <View style={webStyles.heroCard}>
          <View style={webStyles.heroLeft}>
            <View style={[webStyles.statusPill, isActive ? webStyles.statusActive : webStyles.statusInactive]}>
              <View style={[webStyles.statusDot, { backgroundColor: isActive ? "#16a34a" : "#94a3b8" }]} />
              <Text style={[webStyles.statusText, { color: isActive ? "#16a34a" : "#64748b" }]}>{quiz.status}</Text>
            </View>
            <Text style={webStyles.heroTitle}>{quiz.name}</Text>
            <Text style={webStyles.heroDesc}>{quiz.description}</Text>
            <View style={webStyles.heroMeta}>
              <View style={webStyles.heroMetaChip}><Ionicons name="people-outline" size={14} color="#64748b" /><Text style={webStyles.heroMetaText}>{quiz.targetBatch}</Text></View>
              <View style={webStyles.heroMetaChip}><Ionicons name="time-outline" size={14} color="#64748b" /><Text style={webStyles.heroMetaText}>{quiz.duration}</Text></View>
              <View style={webStyles.heroMetaChip}><Ionicons name="list-outline" size={14} color="#64748b" /><Text style={webStyles.heroMetaText}>{quiz.questionCount} questions</Text></View>
            </View>
          </View>
          <TouchableOpacity
            style={[webStyles.actionBtn, isActive ? webStyles.deactivateBtn : webStyles.activateBtn]}
            onPress={handleStatusChange} disabled={updating}
          >
            {updating ? <ActivityIndicator color="#fff" size="small" /> : (
              <><Ionicons name={isActive ? "pause-circle-outline" : "play-circle-outline"} size={18} color="#fff" />
              <Text style={webStyles.actionBtnText}>{isActive ? "Deactivate" : "Activate Quiz"}</Text></>
            )}
          </TouchableOpacity>
        </View>

        {/* DETAILS GRID */}
        <View style={isWideScreen ? webStyles.detailsGridWide : webStyles.detailsGridNarrow}>
          {details.map((d, i) => (
            <View key={i} style={[webStyles.detailCard, isWideScreen && webStyles.detailCardWide]}>
              <View style={webStyles.detailIconBox}>
                <Ionicons name={d.icon} size={20} color="#2563eb" />
              </View>
              <Text style={webStyles.detailLabel}>{d.label}</Text>
              <Text style={webStyles.detailValue} numberOfLines={d.multiline ? 3 : 1}>{d.value}</Text>
            </View>
          ))}
          <View style={[webStyles.detailCard, isWideScreen && webStyles.detailCardWide]}>
            <View style={[webStyles.detailIconBox, { backgroundColor: isActive ? "#f0fdf4" : "#fef2f2" }]}>
              <Ionicons name="radio-button-on-outline" size={20} color={isActive ? "#16a34a" : "#ef4444"} />
            </View>
            <Text style={webStyles.detailLabel}>Status</Text>
            <Text style={[webStyles.detailValue, { color: isActive ? "#16a34a" : "#ef4444" }]}>{quiz.status}</Text>
          </View>
        </View>

        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mobileStyles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#f8fafc" },
  content:         { padding: 18, paddingBottom: 30 },
  heroCard:        { backgroundColor: "#1d4ed8", borderRadius: 22, padding: 22, marginBottom: 18 },
  quizName:        { fontSize: 24, fontWeight: "800", color: "#fff" },
  description:     { marginTop: 10, color: "#dbeafe", lineHeight: 22, fontSize: 14 },
  detailsCard:     { backgroundColor: "#fff", borderRadius: 20, padding: 18, elevation: 4 },
  row:             { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  label:           { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  value:           { marginTop: 6, fontSize: 16, color: "#0f172a", fontWeight: "600" },
  multilineValue:  { lineHeight: 22 },
  activeValue:     { color: "#15803d" },
  inactiveValue:   { color: "#b91c1c" },
  button:          { marginTop: 24, borderRadius: 14, paddingVertical: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  activateButton:  { backgroundColor: "#2563eb" },
  deactivateButton:{ backgroundColor: "#dc2626" },
  buttonText:      { color: "#fff", fontSize: 16, fontWeight: "800" },
});

const webStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1000 },
  heroCard:    { backgroundColor: "#fff", borderRadius: 20, padding: 28, marginBottom: 24, borderWidth: 1, borderColor: "#e2e8f0", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 14, elevation: 4 },
  heroLeft:    { flex: 1, marginRight: 20 },
  statusPill:  { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  statusActive:  { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0" },
  statusInactive:{ backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0" },
  statusDot:   { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  statusText:  { fontSize: 13, fontWeight: "700" },
  heroTitle:   { fontSize: 26, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  heroDesc:    { fontSize: 15, color: "#475569", lineHeight: 24, marginBottom: 16 },
  heroMeta:    { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  heroMetaChip:{ flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#e2e8f0" },
  heroMetaText:{ fontSize: 13, color: "#64748b", fontWeight: "600", marginLeft: 6 },
  actionBtn:   { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, alignSelf: "flex-start" },
  activateBtn: { backgroundColor: "#2563eb" },
  deactivateBtn:{ backgroundColor: "#dc2626" },
  actionBtnText: { color: "#fff", fontWeight: "700", marginLeft: 8, fontSize: 14 },
  detailsGridWide:  { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  detailsGridNarrow:{ flexDirection: "column", marginBottom: 24 },
  detailCard:  { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  detailCardWide: { width: "31%", marginRight: "2%" },
  detailIconBox:{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  detailLabel: { fontSize: 12, fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  detailValue: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});