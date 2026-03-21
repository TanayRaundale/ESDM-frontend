import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { fetchStudentAssignments } from "../../src/services/assignmentApi";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const CLASS_COLORS = {
  SY9:  { bg: "#dbeafe", text: "#1d4ed8" },
  SY10: { bg: "#d1fae5", text: "#065f46" },
  SY11: { bg: "#ede9fe", text: "#5b21b6" },
};

/* ─── MOBILE CARD ─── */
function AssignmentCard({ assignment, onPress }) {
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = dueDate < new Date();

  return (
    <TouchableOpacity style={mobileStyles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={mobileStyles.cardHeader}>
        <View style={mobileStyles.iconBox}>
          <Ionicons name="document-text-outline" size={20} color="#2563eb" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={mobileStyles.cardTitle} numberOfLines={2}>{assignment.assignmentTitle}</Text>
          <Text style={mobileStyles.cardSubtitle} numberOfLines={1}>{assignment.unitTitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>

      <View style={mobileStyles.metaRow}>
        <View style={mobileStyles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={isOverdue ? "#ef4444" : "#64748b"} />
          <Text style={[mobileStyles.metaText, isOverdue && { color: "#ef4444" }]}>
            Due: {dueDate.toLocaleDateString("en-IN")}
          </Text>
        </View>
        <View style={mobileStyles.metaItem}>
          <Ionicons name="trophy-outline" size={13} color="#64748b" />
          <Text style={mobileStyles.metaText}>{assignment.totalMarks} marks</Text>
        </View>
      </View>

      <View style={mobileStyles.badgeRow}>
        {(assignment.classes || []).map((c) => (
          <View key={c} style={[mobileStyles.badge, { backgroundColor: CLASS_COLORS[c]?.bg || "#f1f5f9" }]}>
            <Text style={[mobileStyles.badgeText, { color: CLASS_COLORS[c]?.text || "#475569" }]}>{c}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

/* ─── WEB CARD ─── */
function WebAssignmentCard({ assignment, onPress, isWide }) {
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = dueDate < new Date();

  return (
    <TouchableOpacity
      style={[webStyles.card, isWide && webStyles.cardWide]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* TOP ROW */}
      <View style={webStyles.cardTop}>
        <View style={webStyles.cardIconBox}>
          <Ionicons name="document-text-outline" size={22} color="#2563eb" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={webStyles.cardTitle} numberOfLines={2}>{assignment.assignmentTitle}</Text>
          <Text style={webStyles.cardUnit} numberOfLines={1}>{assignment.unitTitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>

      {/* META */}
      <View style={webStyles.metaRow}>
        <View style={[webStyles.metaChip, isOverdue && webStyles.metaChipRed]}>
          <Ionicons name="calendar-outline" size={13} color={isOverdue ? "#ef4444" : "#64748b"} />
          <Text style={[webStyles.metaText, isOverdue && { color: "#ef4444" }]}>
            {dueDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </Text>
        </View>
        <View style={webStyles.metaChip}>
          <Ionicons name="trophy-outline" size={13} color="#f59e0b" />
          <Text style={webStyles.metaText}>{assignment.totalMarks} pts</Text>
        </View>
      </View>

      {/* BADGES */}
      <View style={webStyles.badgeRow}>
        {(assignment.classes || []).map((c) => (
          <View key={c} style={[webStyles.badge, { backgroundColor: CLASS_COLORS[c]?.bg || "#f1f5f9" }]}>
            <Text style={[webStyles.badgeText, { color: CLASS_COLORS[c]?.text || "#475569" }]}>{c}</Text>
          </View>
        ))}
        {isOverdue && (
          <View style={webStyles.overdueBadge}>
            <Text style={webStyles.overdueBadgeText}>Overdue</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function Assignments() {
  const router = useRouter();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const loadAssignments = async () => {
    try {
      const data = await fetchStudentAssignments();
      setAssignments(data);
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to load assignments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadAssignments();
    }, [])
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return assignments;
    const q = search.toLowerCase();
    return assignments.filter(
      (a) =>
        a.assignmentTitle?.toLowerCase().includes(q) ||
        a.unitTitle?.toLowerCase().includes(q)
    );
  }, [assignments, search]);

  if (loading) {
    return (
      <View style={mobileStyles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // ─── MOBILE LAYOUT ───
  if (!isWeb) {
    return (
      <View style={mobileStyles.container}>
        <View style={mobileStyles.header}>
          <Text style={mobileStyles.title}>My Assignments</Text>
          <Text style={mobileStyles.subtitle}>Assignments shared by your teachers</Text>
        </View>

        <View style={mobileStyles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={mobileStyles.searchInput}
            placeholder="Search assignments..."
            placeholderTextColor="#94a3b8"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <AssignmentCard
              assignment={item}
              onPress={() => router.push({ pathname: "/(student)/assignment-details", params: { id: item._id } })}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAssignments(); }} />
          }
          ListEmptyComponent={
            <View style={mobileStyles.emptyState}>
              <Ionicons name="document-text-outline" size={60} color="#cbd5e1" />
              <Text style={mobileStyles.emptyText}>No assignments available</Text>
              <Text style={mobileStyles.emptySubText}>Teacher assignments for your class will appear here</Text>
            </View>
          }
          contentContainerStyle={filtered.length === 0 ? mobileStyles.emptyWrap : mobileStyles.listWrap}
          showsVerticalScrollIndicator={false}
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
    >
      <View style={webStyles.inner}>

        {/* PAGE HEADER */}
        <View style={webStyles.pageHeader}>
          <View>
            <Text style={webStyles.pageTitle}>My Assignments</Text>
            <Text style={webStyles.pageSubtitle}>Assignments shared by your teachers</Text>
          </View>
          <View style={webStyles.countBadge}>
            <Ionicons name="document-text-outline" size={15} color="#2563eb" />
            <Text style={webStyles.countBadgeText}>{filtered.length} assignments</Text>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={webStyles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={webStyles.searchInput}
            placeholder="Search by title or unit..."
            placeholderTextColor="#94a3b8"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* GRID */}
        {filtered.length === 0 ? (
          <View style={webStyles.emptyBox}>
            <View style={webStyles.emptyIconBox}>
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
            </View>
            <Text style={webStyles.emptyTitle}>No assignments found</Text>
            <Text style={webStyles.emptyText}>
              {search ? "Try a different search term" : "Teacher assignments will appear here"}
            </Text>
          </View>
        ) : (
          <View style={isWideScreen ? webStyles.gridWide : webStyles.gridNarrow}>
            {filtered.map((item) => (
              <WebAssignmentCard
                key={item._id}
                assignment={item}
                isWide={isWideScreen}
                onPress={() => router.push({ pathname: "/(student)/assignment-details", params: { id: item._id } })}
              />
            ))}
          </View>
        )}

        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Student Portal</Text>
      </View>
    </ScrollView>
  );
}

/* ─────────────── MOBILE STYLES ─────────────── */
const mobileStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  header: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 13, color: "#64748b", marginTop: 3 },
  searchBar: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: "#fff",
    borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0",
    paddingHorizontal: 10, paddingVertical: 10,
    flexDirection: "row", alignItems: "center",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a", marginLeft: 8 },
  listWrap: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyWrap: { flexGrow: 1, justifyContent: "center" },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0",
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  cardSubtitle: { fontSize: 12, color: "#64748b", marginTop: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 10, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", marginRight: 14, marginBottom: 4 },
  metaText: { fontSize: 12, color: "#64748b", marginLeft: 4 },
  badgeRow: { flexDirection: "row", marginTop: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16, marginRight: 6 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingHorizontal: 30 },
  emptyText: { marginTop: 14, fontSize: 16, fontWeight: "700", color: "#475569" },
  emptySubText: { marginTop: 4, textAlign: "center", fontSize: 13, color: "#94a3b8" },
});

/* ─────────────── WEB STYLES ─────────────── */
const webStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner: { width: "100%", maxWidth: 1100 },

  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  countBadge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#eff6ff", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: "#bfdbfe",
  },
  countBadgeText: { fontSize: 13, fontWeight: "700", color: "#2563eb", marginLeft: 6 },

  searchBar: {
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: "#e2e8f0",
    paddingHorizontal: 16, paddingVertical: 13,
    flexDirection: "row", alignItems: "center",
    marginBottom: 24,
    shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#0f172a", marginLeft: 10 },

  gridWide: { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  gridNarrow: { flexDirection: "column", marginBottom: 24 },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardWide: { width: "48%", marginRight: "2%" },

  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  cardIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  cardUnit: { fontSize: 12, color: "#64748b", marginTop: 2 },

  metaRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  metaChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f8fafc", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    marginRight: 8, marginBottom: 6,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  metaChipRed: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  metaText: { fontSize: 12, color: "#64748b", marginLeft: 5, fontWeight: "600" },

  badgeRow: { flexDirection: "row", flexWrap: "wrap" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 6 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  overdueBadge: { backgroundColor: "#fee2e2", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  overdueBadgeText: { fontSize: 11, fontWeight: "700", color: "#ef4444" },

  emptyBox: {
    backgroundColor: "#fff", borderRadius: 20, padding: 48,
    alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 24,
  },
  emptyIconBox: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#334155", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#94a3b8", textAlign: "center" },

  footer: { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});