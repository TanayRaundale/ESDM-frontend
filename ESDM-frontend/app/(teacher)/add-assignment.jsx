import { useState, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, RefreshControl,
  ScrollView, Platform, Dimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchAssignments } from "../../src/services/assignmentApi";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const CLASS_COLORS = {
  SY9:  { bg: "#dbeafe", text: "#1d4ed8" },
  SY10: { bg: "#d1fae5", text: "#065f46" },
  SY11: { bg: "#ede9fe", text: "#5b21b6" },
};

export default function AddAssignment() {
  const router = useRouter();
  const [all, setAll]               = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState("");

  const load = async () => {
    try { const data = await fetchAssignments(); setAll(data); }
    catch { Alert.alert("Error", "Failed to load assignments"); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  const filtered = useMemo(() => {
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((a) => a.assignmentTitle?.toLowerCase().includes(q) || a.unitTitle?.toLowerCase().includes(q));
  }, [all, search]);

  const AssignmentCard = ({ item }) => {
    const due       = new Date(item.dueDate);
    const overdue   = due < new Date();
    const submitted = item.submissions?.length ?? 0;

    return (
      <TouchableOpacity
        style={isWeb ? webStyles.card : mobileStyles.card}
        onPress={() => router.push({ pathname: "/(teacher)/assignment-details", params: { id: item._id } })}
        activeOpacity={0.82}
      >
        <View style={isWeb ? webStyles.cardTop : mobileStyles.cardTop}>
          <View style={isWeb ? webStyles.cardIconBox : mobileStyles.cardIconBox}>
            <Ionicons name="document-text" size={22} color="#f59e0b" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={isWeb ? webStyles.cardTitle : mobileStyles.cardTitle} numberOfLines={1}>{item.assignmentTitle}</Text>
            <Text style={isWeb ? webStyles.cardUnit : mobileStyles.cardUnit} numberOfLines={1}>{item.unitTitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </View>

        <View style={isWeb ? webStyles.metaRow : mobileStyles.metaRow}>
          <View style={isWeb ? webStyles.metaChip : mobileStyles.metaChip}>
            <Ionicons name="calendar-outline" size={12} color={overdue ? "#ef4444" : "#64748b"} />
            <Text style={[isWeb ? webStyles.metaText : mobileStyles.metaText, overdue && { color: "#ef4444" }]}>
              {due.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </Text>
          </View>
          <View style={isWeb ? webStyles.metaChip : mobileStyles.metaChip}>
            <Ionicons name="trophy-outline" size={12} color="#64748b" />
            <Text style={isWeb ? webStyles.metaText : mobileStyles.metaText}>{item.totalMarks} pts</Text>
          </View>
          <View style={isWeb ? webStyles.metaChip : mobileStyles.metaChip}>
            <Ionicons name="checkmark-circle-outline" size={12} color="#10b981" />
            <Text style={[isWeb ? webStyles.metaText : mobileStyles.metaText, { color: "#10b981" }]}>{submitted} submitted</Text>
          </View>
        </View>

        <View style={isWeb ? webStyles.badgeRow : mobileStyles.badgeRow}>
          {(item.classes || []).map((c) => (
            <View key={c} style={[isWeb ? webStyles.badge : mobileStyles.badge, { backgroundColor: CLASS_COLORS[c]?.bg ?? "#f1f5f9" }]}>
              <Text style={[isWeb ? webStyles.badgeText : mobileStyles.badgeText, { color: CLASS_COLORS[c]?.text ?? "#475569" }]}>{c}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#0f172a" /></View>;

  if (!isWeb) {
    return (
      <View style={mobileStyles.container}>
        <View style={mobileStyles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput style={mobileStyles.searchInput} placeholder="Search assignments..." placeholderTextColor="#94a3b8" value={search} onChangeText={setSearch} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={18} color="#94a3b8" /></TouchableOpacity>}
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <AssignmentCard item={item} />}
          contentContainerStyle={filtered.length === 0 ? mobileStyles.emptyWrap : mobileStyles.list}
          ListEmptyComponent={
            <View style={mobileStyles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
              <Text style={mobileStyles.emptyTitle}>No assignments yet</Text>
              <Text style={mobileStyles.emptySub}>Tap "+" to create your first assignment</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        />
        <TouchableOpacity style={mobileStyles.fab} onPress={() => router.push("/(teacher)/create-assignment")}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={webStyles.root} contentContainerStyle={webStyles.rootContent} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={webStyles.inner}>

        <View style={webStyles.pageHeader}>
          <View>
            <Text style={webStyles.pageTitle}>Assignments</Text>
            <Text style={webStyles.pageSubtitle}>Manage all assignments shared with students</Text>
          </View>
          <TouchableOpacity style={webStyles.createBtn} onPress={() => router.push("/(teacher)/create-assignment")}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={webStyles.createBtnText}>Create Assignment</Text>
          </TouchableOpacity>
        </View>

        <View style={webStyles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput style={webStyles.searchInput} placeholder="Search by title or unit..." placeholderTextColor="#94a3b8" value={search} onChangeText={setSearch} />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
          <View style={webStyles.resultCount}>
            <Text style={webStyles.resultCountText}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={webStyles.emptyBox}>
            <View style={webStyles.emptyIconBox}><Ionicons name="document-text-outline" size={48} color="#cbd5e1" /></View>
            <Text style={webStyles.emptyTitle}>No assignments found</Text>
            <Text style={webStyles.emptyText}>{search ? "Try adjusting your search" : "Create your first assignment"}</Text>
            {!search && (
              <TouchableOpacity style={webStyles.emptyBtn} onPress={() => router.push("/(teacher)/create-assignment")}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={webStyles.emptyBtnText}>Create Assignment</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={isWideScreen ? webStyles.gridWide : webStyles.gridNarrow}>
            {filtered.map((item) => <AssignmentCard key={item._id} item={item} />)}
          </View>
        )}

        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mobileStyles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#f8fafc" },
  searchBar:  { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, margin: 16, paddingHorizontal: 12, paddingVertical: 10, elevation: 2, gap: 8 },
  searchInput:{ flex: 1, fontSize: 14, color: "#0f172a" },
  list:       { paddingHorizontal: 16, paddingBottom: 100 },
  emptyWrap:  { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#334155", marginTop: 16 },
  emptySub:   { fontSize: 13, color: "#94a3b8", marginTop: 6, textAlign: "center" },
  card:       { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2 },
  cardTop:    { flexDirection: "row", alignItems: "center" },
  cardIconBox:{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#fef3c7", justifyContent: "center", alignItems: "center" },
  cardTitle:  { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  cardUnit:   { fontSize: 12, color: "#64748b", marginTop: 2 },
  metaRow:    { flexDirection: "row", flexWrap: "wrap", marginTop: 10, gap: 8 },
  metaChip:   { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText:   { fontSize: 12, color: "#64748b" },
  badgeRow:   { flexDirection: "row", gap: 6, marginTop: 8 },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText:  { fontSize: 11, fontWeight: "700" },
  fab:        { position: "absolute", bottom: 28, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", elevation: 6 },
});

const webStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1100 },
  pageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  pageTitle:   { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle:{ fontSize: 14, color: "#64748b", marginTop: 4 },
  createBtn:   { flexDirection: "row", alignItems: "center", backgroundColor: "#0f172a", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  createBtnText: { fontSize: 14, fontWeight: "700", color: "#fff", marginLeft: 6 },
  searchBar:   { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 16, paddingVertical: 13, marginBottom: 24, shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  searchInput: { flex: 1, fontSize: 15, color: "#0f172a", marginLeft: 10 },
  resultCount: { backgroundColor: "#f1f5f9", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginLeft: 10 },
  resultCountText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  gridWide:    { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  gridNarrow:  { flexDirection: "column", marginBottom: 24 },
  card:        { backgroundColor: "#fff", borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, width: "48%", marginRight: "2%" },
  cardTop:     { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#fef3c7", justifyContent: "center", alignItems: "center" },
  cardTitle:   { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  cardUnit:    { fontSize: 12, color: "#64748b", marginTop: 2 },
  metaRow:     { flexDirection: "row", flexWrap: "wrap", marginBottom: 10, gap: 8 },
  metaChip:    { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText:    { fontSize: 12, color: "#64748b" },
  badgeRow:    { flexDirection: "row", gap: 6 },
  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText:   { fontSize: 11, fontWeight: "700" },
  emptyBox:    { backgroundColor: "#fff", borderRadius: 20, padding: 48, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  emptyIconBox:{ width: 90, height: 90, borderRadius: 45, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle:  { fontSize: 20, fontWeight: "800", color: "#334155", marginBottom: 8 },
  emptyText:   { fontSize: 14, color: "#94a3b8", textAlign: "center", marginBottom: 20 },
  emptyBtn:    { flexDirection: "row", alignItems: "center", backgroundColor: "#0f172a", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText:{ fontSize: 14, fontWeight: "700", color: "#fff", marginLeft: 6 },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});