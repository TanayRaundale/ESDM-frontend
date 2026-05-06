import { useCallback, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View, ScrollView,
  Platform, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { fetchTeacherVideos } from "../../src/services/videoApi";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

export default function TeacherVideos() {
  const router = useRouter();
  const [videos, setVideos]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVideos = async () => {
    try { const data = await fetchTeacherVideos(); setVideos(data); }
    catch (error) { Alert.alert("Error", error?.response?.data?.message || "Unable to load videos"); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); loadVideos(); }, []));

  if (loading) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );

  const VideoCard = ({ item }) => (
    <TouchableOpacity
      style={isWeb ? wStyles.card : mStyles.videoCard}
      onPress={() => router.push({ pathname: "/(teacher)/video-details", params: { id: item._id } })}
      activeOpacity={0.82}
    >
      <View style={isWeb ? wStyles.cardTop : mStyles.videoTopRow}>
        <View style={isWeb ? wStyles.iconBox : mStyles.iconBox}>
          <Ionicons name="logo-youtube" size={22} color="#dc2626" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={isWeb ? wStyles.cardTitle : mStyles.videoTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={isWeb ? wStyles.cardUrl : mStyles.videoUrl} numberOfLines={1}>{item.url}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </View>
      <View style={isWeb ? wStyles.metaRow : mStyles.metaRow}>
        <View style={isWeb ? wStyles.badge : mStyles.badge}>
          <Text style={isWeb ? wStyles.badgeText : mStyles.badgeText}>{item.targetBatch}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ── MOBILE ──
  if (!isWeb) {
    return (
      <View style={mStyles.container}>
        <FlatList
          data={videos}
          keyExtractor={(item) => item._id}
          contentContainerStyle={videos.length === 0 ? mStyles.emptyWrap : mStyles.list}
          renderItem={({ item }) => <VideoCard item={item} />}
          ListHeaderComponent={
            <View style={mStyles.headerWrap}>
              <Text style={mStyles.heading}>YouTube Video Links</Text>
              <Text style={mStyles.subheading}>Tap a link to view full details.</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={mStyles.emptyBox}>
              <Ionicons name="logo-youtube" size={52} color="#cbd5e1" />
              <Text style={mStyles.emptyTitle}>No video links yet</Text>
              <Text style={mStyles.emptyText}>Tap "+" to add your first link</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadVideos(); }} />}
        />
        <TouchableOpacity style={mStyles.fab} onPress={() => router.push("/(teacher)/create-video")} activeOpacity={0.85}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  // ── WEB ──
  return (
    <ScrollView
      style={wStyles.root}
      contentContainerStyle={wStyles.rootContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadVideos(); }} />}
    >
      <View style={wStyles.inner}>

        <View style={wStyles.pageHeader}>
          <View>
            <Text style={wStyles.pageTitle}>YouTube Video Links</Text>
            <Text style={wStyles.pageSubtitle}>Manage video lessons shared with students</Text>
          </View>
          <View style={wStyles.headerRight}>
            <View style={wStyles.countBadge}>
              <Ionicons name="logo-youtube" size={14} color="#dc2626" />
              <Text style={wStyles.countBadgeText}>{videos.length} videos</Text>
            </View>
            <TouchableOpacity style={wStyles.createBtn} onPress={() => router.push("/(teacher)/create-video")}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={wStyles.createBtnText}>Add Video</Text>
            </TouchableOpacity>
          </View>
        </View>

        {videos.length === 0 ? (
          <View style={wStyles.emptyBox}>
            <View style={wStyles.emptyIconBox}>
              <Ionicons name="logo-youtube" size={48} color="#cbd5e1" />
            </View>
            <Text style={wStyles.emptyTitle}>No video links yet</Text>
            <Text style={wStyles.emptyText}>Add your first YouTube video link for students</Text>
            <TouchableOpacity style={wStyles.emptyBtn} onPress={() => router.push("/(teacher)/create-video")}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={wStyles.emptyBtnText}>Add Video</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={isWideScreen ? wStyles.gridWide : wStyles.gridNarrow}>
            {videos.map((item) => <VideoCard key={item._id} item={item} />)}
          </View>
        )}

        <Text style={wStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mStyles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#f8fafc" },
  list:        { paddingHorizontal: 16, paddingBottom: 100 },
  emptyWrap:   { flex: 1, justifyContent: "center", alignItems: "center", padding: 36 },
  headerWrap:  { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  heading:     { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  subheading:  { marginTop: 6, color: "#64748b", marginBottom: 14 },
  videoCard:   { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  videoTopRow: { flexDirection: "row", alignItems: "center" },
  iconBox:     { width: 44, height: 44, borderRadius: 12, backgroundColor: "#fee2e2", justifyContent: "center", alignItems: "center" },
  videoTitle:  { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  videoUrl:    { marginTop: 3, color: "#64748b", fontSize: 12 },
  metaRow:     { marginTop: 10, flexDirection: "row" },
  badge:       { backgroundColor: "#eff6ff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:   { color: "#1d4ed8", fontWeight: "700", fontSize: 12 },
  emptyBox:    { backgroundColor: "#fff", borderRadius: 12, padding: 18, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  emptyTitle:  { marginTop: 12, fontSize: 17, fontWeight: "700", color: "#334155" },
  emptyText:   { color: "#64748b", marginTop: 6 },
  fab:         { position: "absolute", bottom: 28, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", elevation: 6 },
});

const wStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1100 },
  pageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  pageTitle:   { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle:{ fontSize: 14, color: "#64748b", marginTop: 4 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  countBadge:  { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#e2e8f0", gap: 6 },
  countBadgeText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  createBtn:   { flexDirection: "row", alignItems: "center", backgroundColor: "#dc2626", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, gap: 6 },
  createBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  gridWide:    { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  gridNarrow:  { flexDirection: "column", marginBottom: 24 },
  card:        { backgroundColor: "#fff", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 16, shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, width: "48%", marginRight: "2%" },
  cardTop:     { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconBox:     { width: 44, height: 44, borderRadius: 12, backgroundColor: "#fee2e2", justifyContent: "center", alignItems: "center" },
  cardTitle:   { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  cardUrl:     { marginTop: 3, color: "#64748b", fontSize: 12 },
  metaRow:     { flexDirection: "row", alignItems: "center", gap: 8 },
  badge:       { backgroundColor: "#eff6ff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:   { color: "#1d4ed8", fontWeight: "700", fontSize: 12 },
  emptyBox:    { backgroundColor: "#fff", borderRadius: 20, padding: 48, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  emptyIconBox:{ width: 90, height: 90, borderRadius: 45, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle:  { fontSize: 20, fontWeight: "800", color: "#334155", marginBottom: 8 },
  emptyText:   { fontSize: 14, color: "#94a3b8", textAlign: "center", marginBottom: 20 },
  emptyBtn:    { flexDirection: "row", alignItems: "center", backgroundColor: "#dc2626", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, gap: 6 },
  emptyBtnText:{ fontSize: 14, fontWeight: "700", color: "#fff" },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});