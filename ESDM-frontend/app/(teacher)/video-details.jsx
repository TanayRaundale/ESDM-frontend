import { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Linking, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { fetchTeacherVideoById } from "../../src/services/videoApi";

const isWeb = Platform.OS === "web";

const openVideo = async (url) => {
  try {
    if (isWeb) { window.open(url, "_blank"); return; }
    await WebBrowser.openBrowserAsync(url);
  } catch { await Linking.openURL(url); }
};

export default function VideoDetails() {
  const { id } = useLocalSearchParams();
  const [video, setVideo]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const data = await fetchTeacherVideoById(id); setVideo(data); }
      catch { Alert.alert("Error", "Failed to load video details"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#0f172a" />
    </View>
  );

  if (!video) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#64748b" }}>Video not found</Text>
    </View>
  );

  // ── MOBILE ──
  if (!isWeb) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc" }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <View style={mStyles.headerCard}>
          <View style={mStyles.iconWrap}>
            <Ionicons name="logo-youtube" size={36} color="#dc2626" />
          </View>
          <Text style={mStyles.title}>{video.title}</Text>
          <View style={mStyles.badge}><Text style={mStyles.badgeText}>{video.targetBatch}</Text></View>
        </View>

        <View style={mStyles.section}>
          <Text style={mStyles.sectionLabel}>Description</Text>
          <Text style={mStyles.description}>{video.description || "No description"}</Text>
        </View>

        <View style={mStyles.section}>
          <Text style={mStyles.sectionLabel}>YouTube URL</Text>
          <Text style={mStyles.url}>{video.url}</Text>
        </View>

        <TouchableOpacity style={mStyles.watchBtn} onPress={() => openVideo(video.url)}>
          <Ionicons name="logo-youtube" size={18} color="#fff" />
          <Text style={mStyles.watchBtnText}>Open on YouTube</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── WEB ──
  return (
    <ScrollView style={wStyles.root} contentContainerStyle={wStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={wStyles.inner}>

        {/* Hero card */}
        <View style={wStyles.heroCard}>
          <View style={wStyles.heroLeft}>
            <View style={wStyles.iconBox}>
              <Ionicons name="logo-youtube" size={36} color="#dc2626" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={wStyles.badge}>
                <Text style={wStyles.badgeText}>{video.targetBatch}</Text>
              </View>
              <Text style={wStyles.heroTitle}>{video.title}</Text>
              {!!video.description && (
                <Text style={wStyles.heroDesc}>{video.description}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={wStyles.watchBtn} onPress={() => openVideo(video.url)}>
            <Ionicons name="logo-youtube" size={18} color="#fff" />
            <Text style={wStyles.watchBtnText}>Open on YouTube</Text>
          </TouchableOpacity>
        </View>

        {/* URL card */}
        <View style={wStyles.urlCard}>
          <View style={wStyles.urlCardHeader}>
            <Ionicons name="link-outline" size={18} color="#2563eb" />
            <Text style={wStyles.urlCardTitle}>YouTube URL</Text>
          </View>
          <View style={wStyles.urlBox}>
            <Text style={wStyles.urlText} numberOfLines={2}>{video.url}</Text>
            <TouchableOpacity
              style={wStyles.copyBtn}
              onPress={() => {
                if (isWeb) navigator.clipboard?.writeText(video.url);
                Alert.alert("Copied", "URL copied to clipboard");
              }}
            >
              <Ionicons name="copy-outline" size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={wStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mStyles = StyleSheet.create({
  headerCard:   { backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 14 },
  iconWrap:     { width: 72, height: 72, borderRadius: 36, backgroundColor: "#fee2e2", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  title:        { fontSize: 20, fontWeight: "800", color: "#0f172a", textAlign: "center" },
  badge:        { marginTop: 10, backgroundColor: "#eff6ff", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText:    { color: "#1d4ed8", fontWeight: "700" },
  section:      { marginTop: 14, backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  sectionLabel: { color: "#64748b", fontWeight: "700", marginBottom: 6 },
  description:  { color: "#334155", lineHeight: 20 },
  url:          { color: "#0f172a" },
  watchBtn:     { marginTop: 16, backgroundColor: "#dc2626", borderRadius: 10, paddingVertical: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  watchBtnText: { color: "#fff", fontWeight: "800" },
});

const wStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 800 },
  heroCard:    { backgroundColor: "#fff", borderRadius: 20, padding: 28, marginBottom: 20, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 14, elevation: 4, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  heroLeft:    { flexDirection: "row", alignItems: "flex-start", flex: 1, marginRight: 16 },
  iconBox:     { width: 64, height: 64, borderRadius: 18, backgroundColor: "#fee2e2", justifyContent: "center", alignItems: "center", marginRight: 18 },
  badge:       { backgroundColor: "#eff6ff", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: "flex-start", marginBottom: 8, borderWidth: 1, borderColor: "#bfdbfe" },
  badgeText:   { color: "#1d4ed8", fontWeight: "700", fontSize: 12 },
  heroTitle:   { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  heroDesc:    { fontSize: 14, color: "#64748b", lineHeight: 22 },
  watchBtn:    { flexDirection: "row", alignItems: "center", backgroundColor: "#dc2626", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, gap: 8, alignSelf: "flex-start" },
  watchBtnText:{ color: "#fff", fontWeight: "700", fontSize: 14 },
  urlCard:     { backgroundColor: "#fff", borderRadius: 18, padding: 24, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 20, shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  urlCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  urlCardTitle:  { fontSize: 15, fontWeight: "700", color: "#0f172a", marginLeft: 8 },
  urlBox:      { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  urlText:     { flex: 1, fontSize: 14, color: "#2563eb", fontWeight: "500" },
  copyBtn:     { width: 34, height: 34, borderRadius: 8, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center", marginLeft: 10 },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});