import { useCallback, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  ScrollView, Platform, Dimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchStudents } from "../../src/services/studentApi";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const avatarColors = ["#3b82f6","#8b5cf6","#ec4899","#f97316","#06b6d4","#22c55e"];

function getInitials(name) {
  const parts = String(name || "").trim().split(" ").filter(Boolean);
  return (parts[0]?.[0] || "S") + (parts[1]?.[0] || "");
}

const getDisplayClass = (student) => {
  if (student.class) return student.class;
  const first = Array.isArray(student.classAssigned) ? student.classAssigned[0] : "";
  if (!first) return "Not Assigned";
  return first.replace("SE", "SY");
};

export default function Students() {
  const router = useRouter();
  const [students, setStudents]   = useState([]);
  const [search, setSearch]       = useState("");
  const [batch, setBatch]         = useState("All");
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const batchOptions = ["All", "SY9", "SY10", "SY11"];

  const loadStudents = async (s = search, b = batch) => {
    try {
      const data = await fetchStudents({ search: s, batch: b });
      setStudents(data);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { setLoading(true); loadStudents(search, batch); }, [search, batch]));

  const openStudentDetails = (id) => router.push({ pathname: "/(teacher)/student-details", params: { studentId: id } });

  const StudentCard = ({ item, index }) => (
    <TouchableOpacity
      style={isWeb ? webStyles.studentCard : mobileStyles.studentCard}
      activeOpacity={0.85}
      onPress={() => openStudentDetails(item._id)}
    >
      <View style={[isWeb ? webStyles.avatarCircle : mobileStyles.avatarCircle, { backgroundColor: avatarColors[index % avatarColors.length] }]}>
        <Text style={isWeb ? webStyles.avatarText : mobileStyles.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={isWeb ? webStyles.studentName : mobileStyles.studentName}>{item.name}</Text>
        <Text style={isWeb ? webStyles.metaText : mobileStyles.metaText}>{item.rollNo} · {item.email}</Text>
        <Text style={isWeb ? webStyles.metaText : mobileStyles.metaText}>Class: {getDisplayClass(item)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  // ─── MOBILE ───
  if (!isWeb) {
    return (
      <View style={mobileStyles.screen}>
        <View style={mobileStyles.header}>
          <Text style={mobileStyles.headerTitle}>Students</Text>
          <Text style={mobileStyles.headerSub}>Search and filter by class</Text>
        </View>
        <View style={mobileStyles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#64748b" />
          <TextInput style={mobileStyles.searchInput} placeholder="Search by name, roll no, email" value={search} onChangeText={setSearch} placeholderTextColor="#94a3b8" />
        </View>
        <View style={mobileStyles.filterRow}>
          {batchOptions.map((item) => (
            <TouchableOpacity key={item} style={[mobileStyles.pill, batch === item && mobileStyles.pillActive]} onPress={() => setBatch(item)}>
              <Text style={[mobileStyles.pillText, batch === item && mobileStyles.pillTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={mobileStyles.sectionLabel}>{students.length} students</Text>
        <FlatList
          data={students}
          keyExtractor={(item) => String(item._id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStudents(); }} />}
          contentContainerStyle={mobileStyles.listContent}
          renderItem={({ item, index }) => <StudentCard item={item} index={index} />}
          ListEmptyComponent={
            <View style={mobileStyles.emptyCard}>
              <Ionicons name="people-outline" size={34} color="#94a3b8" />
              <Text style={mobileStyles.emptyTitle}>No students found</Text>
              <Text style={mobileStyles.emptyText}>Try changing search text or filter.</Text>
            </View>
          }
        />
      </View>
    );
  }

  // ─── WEB ───
  return (
    <ScrollView style={webStyles.root} contentContainerStyle={webStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={webStyles.inner}>

        {/* HEADER */}
        <View style={webStyles.pageHeader}>
          <View>
            <Text style={webStyles.pageTitle}>Students</Text>
            <Text style={webStyles.pageSubtitle}>Search and filter enrolled students</Text>
          </View>
          <View style={webStyles.countBadge}>
            <Ionicons name="people-outline" size={15} color="#2563eb" />
            <Text style={webStyles.countBadgeText}>{students.length} students</Text>
          </View>
        </View>

        {/* SEARCH + FILTERS */}
        <View style={isWideScreen ? webStyles.searchRowWide : webStyles.searchRowNarrow}>
          <View style={webStyles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput style={webStyles.searchInput} placeholder="Search by name, roll no, email..." value={search} onChangeText={setSearch} placeholderTextColor="#94a3b8" />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
          <View style={webStyles.filterRow}>
            {batchOptions.map((item) => (
              <TouchableOpacity key={item} style={[webStyles.pill, batch === item && webStyles.pillActive]} onPress={() => setBatch(item)}>
                <Text style={[webStyles.pillText, batch === item && webStyles.pillTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* STUDENT GRID */}
        {students.length === 0 ? (
          <View style={webStyles.emptyBox}>
            <View style={webStyles.emptyIconBox}><Ionicons name="people-outline" size={48} color="#cbd5e1" /></View>
            <Text style={webStyles.emptyTitle}>No students found</Text>
            <Text style={webStyles.emptyText}>Try adjusting your search or filter</Text>
          </View>
        ) : (
          <View style={isWideScreen ? webStyles.gridWide : webStyles.gridNarrow}>
            {students.map((item, index) => (
              <StudentCard key={String(item._id)} item={item} index={index} />
            ))}
          </View>
        )}

        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mobileStyles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: "#f8fafc" },
  header:       { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 8 },
  headerTitle:  { fontSize: 26, fontWeight: "800", color: "#0f172a" },
  headerSub:    { marginTop: 4, color: "#64748b" },
  searchBox:    { marginHorizontal: 20, marginTop: 10, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center" },
  searchInput:  { flex: 1, fontSize: 14, color: "#0f172a", marginLeft: 8 },
  filterRow:    { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, marginTop: 14 },
  pill:         { backgroundColor: "#e2e8f0", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  pillActive:   { backgroundColor: "#2563eb" },
  pillText:     { color: "#334155", fontWeight: "700" },
  pillTextActive: { color: "#fff" },
  sectionLabel: { paddingHorizontal: 20, marginTop: 16, marginBottom: 8, color: "#64748b", fontWeight: "700" },
  listContent:  { paddingHorizontal: 20, paddingBottom: 24 },
  studentCard:  { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: "row", alignItems: "center", elevation: 3 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText:   { color: "#fff", fontWeight: "700", fontSize: 14 },
  studentName:  { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  metaText:     { marginTop: 2, color: "#64748b", fontSize: 12 },
  emptyCard:    { backgroundColor: "#fff", borderRadius: 14, padding: 24, alignItems: "center", marginTop: 16 },
  emptyTitle:   { marginTop: 10, color: "#0f172a", fontSize: 16, fontWeight: "800" },
  emptyText:    { marginTop: 6, color: "#64748b", textAlign: "center" },
});

const webStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1100 },
  pageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  pageTitle:   { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle:{ fontSize: 14, color: "#64748b", marginTop: 4 },
  countBadge:  { flexDirection: "row", alignItems: "center", backgroundColor: "#eff6ff", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: "#bfdbfe" },
  countBadgeText: { fontSize: 13, fontWeight: "700", color: "#2563eb", marginLeft: 6 },
  searchRowWide:   { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  searchRowNarrow: { flexDirection: "column", marginBottom: 24 },
  searchBar:   { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 16, paddingVertical: 13, marginRight: 16, shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  searchInput: { flex: 1, fontSize: 15, color: "#0f172a", marginLeft: 10 },
  filterRow:   { flexDirection: "row" },
  pill:        { backgroundColor: "#e2e8f0", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, marginLeft: 8 },
  pillActive:  { backgroundColor: "#2563eb" },
  pillText:    { color: "#334155", fontWeight: "700" },
  pillTextActive: { color: "#fff" },
  gridWide:    { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  gridNarrow:  { flexDirection: "column", marginBottom: 24 },
  studentCard: { backgroundColor: "#fff", borderRadius: 16, padding: 18, marginBottom: 14, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, width: "48%", marginRight: "2%" },
  avatarCircle:{ width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginRight: 14 },
  avatarText:  { color: "#fff", fontWeight: "700", fontSize: 16 },
  studentName: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  metaText:    { marginTop: 2, color: "#64748b", fontSize: 12 },
  emptyBox:    { backgroundColor: "#fff", borderRadius: 20, padding: 48, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  emptyIconBox:{ width: 90, height: 90, borderRadius: 45, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle:  { fontSize: 20, fontWeight: "800", color: "#334155", marginBottom: 8 },
  emptyText:   { fontSize: 14, color: "#94a3b8", textAlign: "center" },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});