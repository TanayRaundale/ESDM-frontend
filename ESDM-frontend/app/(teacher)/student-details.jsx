import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Image, TouchableOpacity, Platform, Dimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchStudentAnalytics, fetchStudentById } from "../../src/services/studentApi";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

export default function StudentDetails() {
  const { studentId } = useLocalSearchParams();
  const [student, setStudent]   = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, a] = await Promise.all([fetchStudentById(studentId), fetchStudentAnalytics(studentId)]);
        setStudent(s); setAnalytics(a);
      } finally { setLoading(false); }
    })();
  }, [studentId]);

  if (loading) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (!student) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={{ color: "#64748b", fontSize: 16 }}>Student not found.</Text></View>;

  const A = analytics || { overallScore: 0, assignmentCompletion: 0, completedAssignments: 0, pendingAssignments: 0, performance: [] };
  const studentClass = student.class || (Array.isArray(student.classAssigned) && student.classAssigned.length > 0 ? student.classAssigned.join(", ").replace(/SE/g, "SY") : "Not Assigned");

  const kpis = [
    { label: "Overall Score",      value: `${A.overallScore}%`,        color: "#2563eb", bg: "#eff6ff",  icon: "trophy-outline"         },
    { label: "Assignment Done",    value: `${A.assignmentCompletion}%`, color: "#16a34a", bg: "#f0fdf4",  icon: "checkmark-circle-outline" },
    { label: "Completed",          value: String(A.completedAssignments), color: "#7c3aed", bg: "#f5f3ff", icon: "clipboard-outline"       },
    { label: "Pending",            value: String(A.pendingAssignments),  color: "#ef4444", bg: "#fef2f2", icon: "time-outline"            },
  ];

  const details = [
    { label: "Phone",      value: student.phone      || "N/A" },
    { label: "Address",    value: student.address    || "N/A" },
    { label: "Department", value: student.department || "N/A" },
    { label: "Year",       value: student.year       || "N/A" },
    { label: "Status",     value: student.isActive ? "Active" : "Inactive" },
  ];

  if (!isWeb) {
    return (
      <ScrollView style={mobileStyles.container} contentContainerStyle={mobileStyles.content}>
        <View style={mobileStyles.profileCard}>
          {student.photo
            ? <Image source={{ uri: `data:image/jpeg;base64,${student.photo}` }} style={mobileStyles.avatar} />
            : <View style={mobileStyles.avatarFallback}><Ionicons name="person" size={42} color="#94a3b8" /></View>}
          <View style={{ flex: 1 }}>
            <Text style={mobileStyles.name}>{student.name}</Text>
            <Text style={mobileStyles.subInfo}>{student.rollNo}</Text>
            <Text style={mobileStyles.subInfo}>{student.email}</Text>
            <Text style={mobileStyles.subInfo}>Class: {studentClass}</Text>
          </View>
        </View>

        <View style={mobileStyles.detailsCard}>
          <Text style={mobileStyles.sectionTitle}>Student Details</Text>
          {details.map((d, i) => (
            <View key={i} style={mobileStyles.detailRow}>
              <Text style={mobileStyles.detailLabel}>{d.label}</Text>
              <Text style={mobileStyles.detailValue}>{d.value}</Text>
            </View>
          ))}
        </View>

        <Text style={mobileStyles.sectionTitle}>Analytics</Text>
        <View style={mobileStyles.kpiRow}>
          <View style={mobileStyles.kpiCard}><Text style={mobileStyles.kpiLabel}>Overall Score</Text><Text style={[mobileStyles.kpiValue, { color: "#2563eb" }]}>{A.overallScore}%</Text></View>
          <View style={mobileStyles.kpiCard}><Text style={mobileStyles.kpiLabel}>Completion</Text><Text style={[mobileStyles.kpiValue, { color: "#16a34a" }]}>{A.assignmentCompletion}%</Text></View>
        </View>
        <View style={mobileStyles.kpiRow}>
          <View style={mobileStyles.kpiCard}><Text style={mobileStyles.kpiLabel}>Completed</Text><Text style={[mobileStyles.kpiValue, { color: "#7c3aed" }]}>{A.completedAssignments}</Text></View>
          <View style={mobileStyles.kpiCard}><Text style={mobileStyles.kpiLabel}>Pending</Text><Text style={[mobileStyles.kpiValue, { color: "#ef4444" }]}>{A.pendingAssignments}</Text></View>
        </View>

        <View style={mobileStyles.analyticsCard}>
          <Text style={mobileStyles.sectionTitle}>Performance By Area</Text>
          {(A.performance || []).map((item) => (
            <View key={item.subject} style={mobileStyles.barRow}>
              <Text style={mobileStyles.barLabel}>{item.subject}</Text>
              <View style={mobileStyles.barTrack}><View style={[mobileStyles.barFill, { width: `${item.value}%` }]} /></View>
              <Text style={mobileStyles.barValue}>{item.value}%</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  // WEB
  return (
    <ScrollView style={webStyles.root} contentContainerStyle={webStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={webStyles.inner}>

        {/* PROFILE HEADER */}
        <View style={webStyles.profileCard}>
          {student.photo
            ? <Image source={{ uri: `data:image/jpeg;base64,${student.photo}` }} style={webStyles.avatar} />
            : <View style={webStyles.avatarFallback}><Ionicons name="person" size={48} color="#94a3b8" /></View>}
          <View style={webStyles.profileInfo}>
            <Text style={webStyles.name}>{student.name}</Text>
            <Text style={webStyles.email}>{student.email}</Text>
            <View style={webStyles.metaRow}>
              <View style={webStyles.metaChip}>
                <Ionicons name="card-outline" size={13} color="#64748b" />
                <Text style={webStyles.metaChipText}>{student.rollNo}</Text>
              </View>
              <View style={webStyles.metaChip}>
                <Ionicons name="school-outline" size={13} color="#64748b" />
                <Text style={webStyles.metaChipText}>{studentClass}</Text>
              </View>
              <View style={[webStyles.metaChip, { backgroundColor: student.isActive ? "#f0fdf4" : "#fef2f2", borderColor: student.isActive ? "#bbf7d0" : "#fecaca" }]}>
                <View style={[webStyles.statusDot, { backgroundColor: student.isActive ? "#16a34a" : "#ef4444" }]} />
                <Text style={[webStyles.metaChipText, { color: student.isActive ? "#16a34a" : "#ef4444" }]}>
                  {student.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* KPI GRID */}
        <View style={isWideScreen ? webStyles.kpiGridWide : webStyles.kpiGridNarrow}>
          {kpis.map((k, i) => (
            <View key={i} style={[webStyles.kpiCard, isWideScreen && { marginRight: i < 3 ? 16 : 0 }]}>
              <View style={[webStyles.kpiIconBox, { backgroundColor: k.bg }]}>
                <Ionicons name={k.icon} size={22} color={k.color} />
              </View>
              <Text style={[webStyles.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={webStyles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* DETAILS + PERFORMANCE */}
        <View style={isWideScreen ? webStyles.twoColRow : webStyles.oneColRow}>

          {/* Details */}
          <View style={[webStyles.section, isWideScreen && { flex: 1, marginRight: 16 }]}>
            <View style={webStyles.sectionHeader}>
              <Ionicons name="person-outline" size={18} color="#2563eb" />
              <Text style={webStyles.sectionTitle}>Student Details</Text>
            </View>
            {details.map((d, i) => (
              <View key={i} style={webStyles.detailRow}>
                <Text style={webStyles.detailLabel}>{d.label}</Text>
                <Text style={webStyles.detailValue}>{d.value}</Text>
              </View>
            ))}
          </View>

          {/* Performance */}
          <View style={[webStyles.section, isWideScreen && { flex: 1 }]}>
            <View style={webStyles.sectionHeader}>
              <Ionicons name="bar-chart-outline" size={18} color="#2563eb" />
              <Text style={webStyles.sectionTitle}>Performance By Area</Text>
            </View>
            {(A.performance || []).length === 0
              ? <Text style={{ color: "#94a3b8", fontSize: 13 }}>No performance data yet</Text>
              : (A.performance || []).map((item) => (
                  <View key={item.subject} style={webStyles.barRow}>
                    <Text style={webStyles.barLabel}>{item.subject}</Text>
                    <View style={webStyles.barTrack}>
                      <View style={[webStyles.barFill, { width: `${item.value}%` }]} />
                    </View>
                    <Text style={webStyles.barValue}>{item.value}%</Text>
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
  container:    { flex: 1, backgroundColor: "#f8fafc" },
  content:      { padding: 18, paddingBottom: 26 },
  profileCard:  { backgroundColor: "#fff", borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", elevation: 3, marginBottom: 16 },
  avatar:       { width: 74, height: 74, borderRadius: 37, marginRight: 12 },
  avatarFallback: { width: 74, height: 74, borderRadius: 37, backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center", marginRight: 12 },
  name:         { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  subInfo:      { marginTop: 2, color: "#64748b" },
  detailsCard:  { backgroundColor: "#fff", borderRadius: 18, padding: 16, elevation: 3, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a", marginBottom: 10, marginTop: 16 },
  detailRow:    { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingVertical: 10 },
  detailLabel:  { color: "#64748b", fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  detailValue:  { marginTop: 4, color: "#0f172a", fontSize: 15, fontWeight: "600" },
  kpiRow:       { flexDirection: "row", marginBottom: 10 },
  kpiCard:      { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, elevation: 2, marginRight: 10 },
  kpiLabel:     { color: "#64748b", fontSize: 12, fontWeight: "700" },
  kpiValue:     { marginTop: 8, fontSize: 22, fontWeight: "900" },
  analyticsCard:{ backgroundColor: "#fff", borderRadius: 18, padding: 16, marginTop: 14, elevation: 3 },
  barRow:       { flexDirection: "row", alignItems: "center", marginTop: 10 },
  barLabel:     { width: 90, fontSize: 12, color: "#475569", fontWeight: "700" },
  barTrack:     { flex: 1, height: 10, backgroundColor: "#e2e8f0", borderRadius: 999, overflow: "hidden" },
  barFill:      { height: "100%", backgroundColor: "#2563eb", borderRadius: 999 },
  barValue:     { width: 46, textAlign: "right", color: "#334155", fontWeight: "700", fontSize: 12 },
});

const webStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1000 },
  profileCard: { backgroundColor: "#fff", borderRadius: 20, padding: 28, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 24, shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 14, elevation: 4 },
  avatar:      { width: 90, height: 90, borderRadius: 45, marginRight: 24, borderWidth: 3, borderColor: "#e2e8f0" },
  avatarFallback: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginRight: 24, borderWidth: 3, borderColor: "#e2e8f0" },
  profileInfo: { flex: 1 },
  name:        { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  email:       { fontSize: 14, color: "#64748b", marginBottom: 12 },
  metaRow:     { flexDirection: "row", flexWrap: "wrap" },
  metaChip:    { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 6, borderWidth: 1, borderColor: "#e2e8f0" },
  metaChipText:{ fontSize: 13, color: "#64748b", fontWeight: "600", marginLeft: 5 },
  statusDot:   { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  kpiGridWide: { flexDirection: "row", marginBottom: 20 },
  kpiGridNarrow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  kpiCard:     { flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 22, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 16, minWidth: 160 },
  kpiIconBox:  { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  kpiValue:    { fontSize: 30, fontWeight: "900" },
  kpiLabel:    { fontSize: 13, color: "#64748b", fontWeight: "600", marginTop: 4 },
  twoColRow:   { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  oneColRow:   { flexDirection: "column", marginBottom: 20 },
  section:     { backgroundColor: "#fff", borderRadius: 18, padding: 24, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  sectionTitle:  { fontSize: 16, fontWeight: "700", color: "#0f172a", marginLeft: 8 },
  detailRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  detailLabel: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  detailValue: { fontSize: 14, color: "#0f172a", fontWeight: "700" },
  barRow:      { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  barLabel:    { width: 120, fontSize: 13, color: "#475569", fontWeight: "600" },
  barTrack:    { flex: 1, height: 10, backgroundColor: "#f1f5f9", borderRadius: 5, overflow: "hidden", marginHorizontal: 12 },
  barFill:     { height: "100%", backgroundColor: "#2563eb", borderRadius: 5 },
  barValue:    { width: 46, textAlign: "right", color: "#334155", fontWeight: "700", fontSize: 13 },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});