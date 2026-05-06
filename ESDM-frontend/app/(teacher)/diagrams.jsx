import { useCallback, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View, ScrollView,
  Platform, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { fetchTeacherDiagrams } from "../../src/services/diagramApi";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

export default function TeacherDiagrams() {
  const router = useRouter();
  const [diagrams, setDiagrams]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDiagrams = async () => {
    try { const data = await fetchTeacherDiagrams(); setDiagrams(data); }
    catch (error) { Alert.alert("Error", error?.response?.data?.message || "Unable to load diagrams"); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); loadDiagrams(); }, []));

  if (loading) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#2563eb" /></View>;

  const DiagramCard = ({ item }) => (
    <TouchableOpacity
      style={isWeb ? webStyles.card : mobileStyles.diagramCard}
      onPress={() => router.push({ pathname: "/(teacher)/diagram-details", params: { id: item._id } })}
      activeOpacity={0.82}
    >
      <View style={isWeb ? webStyles.cardTop : mobileStyles.topRow}>
        <View style={isWeb ? webStyles.iconBox : mobileStyles.iconBox}>
          <Ionicons name="images-outline" size={22} color="#1d4ed8" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={isWeb ? webStyles.cardTitle : mobileStyles.diagramTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={isWeb ? webStyles.cardSubject : mobileStyles.diagramSubject} numberOfLines={1}>{item.subject}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </View>
      <View style={isWeb ? webStyles.metaRow : mobileStyles.metaRow}>
        <View style={isWeb ? webStyles.badge : mobileStyles.badge}>
          <Text style={isWeb ? webStyles.badgeText : mobileStyles.badgeText}>{item.targetBatch}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!isWeb) {
    return (
      <View style={mobileStyles.container}>
        <FlatList
          data={diagrams}
          keyExtractor={(item) => item._id}
          contentContainerStyle={diagrams.length === 0 ? mobileStyles.emptyWrap : mobileStyles.list}
          renderItem={({ item }) => <DiagramCard item={item} />}
          ListHeaderComponent={<View style={mobileStyles.headerWrap}><Text style={mobileStyles.heading}>Diagram Practice Library</Text><Text style={mobileStyles.subheading}>Tap a diagram to view full details.</Text></View>}
          ListEmptyComponent={
            <View style={mobileStyles.emptyBox}>
              <Ionicons name="images-outline" size={52} color="#cbd5e1" />
              <Text style={mobileStyles.emptyTitle}>No diagrams yet</Text>
              <Text style={mobileStyles.emptyText}>Tap "+" to add your first diagram</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDiagrams(); }} />}
        />
        <TouchableOpacity style={mobileStyles.fab} onPress={() => router.push("/(teacher)/create-diagram")}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={webStyles.root} contentContainerStyle={webStyles.rootContent} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDiagrams(); }} />}>
      <View style={webStyles.inner}>
        <View style={webStyles.pageHeader}>
          <View>
            <Text style={webStyles.pageTitle}>Diagram Practice Library</Text>
            <Text style={webStyles.pageSubtitle}>Manage diagrams shared with students</Text>
          </View>
          <TouchableOpacity style={webStyles.createBtn} onPress={() => router.push("/(teacher)/create-diagram")}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={webStyles.createBtnText}>Add Diagram</Text>
          </TouchableOpacity>
        </View>

        {diagrams.length === 0 ? (
          <View style={webStyles.emptyBox}>
            <View style={webStyles.emptyIconBox}><Ionicons name="images-outline" size={48} color="#cbd5e1" /></View>
            <Text style={webStyles.emptyTitle}>No diagrams yet</Text>
            <Text style={webStyles.emptyText}>Add your first diagram to get started</Text>
          </View>
        ) : (
          <View style={isWideScreen ? webStyles.gridWide : webStyles.gridNarrow}>
            {diagrams.map((item) => <DiagramCard key={item._id} item={item} />)}
          </View>
        )}
        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mobileStyles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: "#f8fafc" },
  list:          { paddingHorizontal: 16, paddingBottom: 100 },
  emptyWrap:     { flex: 1, justifyContent: "center", alignItems: "center", padding: 36 },
  headerWrap:    { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  heading:       { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  subheading:    { marginTop: 6, color: "#64748b", marginBottom: 8 },
  diagramCard:   { backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 12 },
  topRow:        { flexDirection: "row", alignItems: "center" },
  iconBox:       { width: 44, height: 44, borderRadius: 12, backgroundColor: "#dbeafe", justifyContent: "center", alignItems: "center" },
  diagramTitle:  { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  diagramSubject:{ color: "#1d4ed8", fontWeight: "700", marginTop: 3 },
  metaRow:       { marginTop: 10, flexDirection: "row" },
  badge:         { backgroundColor: "#eff6ff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:     { color: "#1d4ed8", fontWeight: "700", fontSize: 12 },
  emptyBox:      { backgroundColor: "#fff", borderRadius: 12, padding: 18, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  emptyTitle:    { marginTop: 12, fontSize: 17, fontWeight: "700", color: "#334155" },
  emptyText:     { color: "#64748b", marginTop: 6 },
  fab:           { position: "absolute", bottom: 28, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", elevation: 6 },
});

const webStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1100 },
  pageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  pageTitle:   { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle:{ fontSize: 14, color: "#64748b", marginTop: 4 },
  createBtn:   { flexDirection: "row", alignItems: "center", backgroundColor: "#1d4ed8", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  createBtnText: { fontSize: 14, fontWeight: "700", color: "#fff", marginLeft: 6 },
  gridWide:    { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  gridNarrow:  { flexDirection: "column", marginBottom: 24 },
  card:        { backgroundColor: "#fff", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 16, shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, width: "48%", marginRight: "2%" },
  cardTop:     { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconBox:     { width: 44, height: 44, borderRadius: 12, backgroundColor: "#dbeafe", justifyContent: "center", alignItems: "center" },
  cardTitle:   { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  cardSubject: { color: "#1d4ed8", fontWeight: "600", fontSize: 13, marginTop: 2 },
  metaRow:     { flexDirection: "row" },
  badge:       { backgroundColor: "#eff6ff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:   { color: "#1d4ed8", fontWeight: "700", fontSize: 12 },
  emptyBox:    { backgroundColor: "#fff", borderRadius: 20, padding: 48, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  emptyIconBox:{ width: 90, height: 90, borderRadius: 45, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle:  { fontSize: 20, fontWeight: "800", color: "#334155", marginBottom: 8 },
  emptyText:   { fontSize: 14, color: "#94a3b8", textAlign: "center" },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});