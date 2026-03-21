import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { fetchStudentDiagrams } from "../../src/services/diagramApi";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const openUrl = async (url) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Error", "Unable to open link.");
  }
};

export default function Diagrams() {
  const [diagrams, setDiagrams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDiagrams = async () => {
    try {
      const data = await fetchStudentDiagrams();
      setDiagrams(data);
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to load diagrams";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDiagrams();
    }, [])
  );

  if (loading) {
    return (
      <View style={mobileStyles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // ─── MOBILE LAYOUT (unchanged) ───
  if (!isWeb) {
    return (
      <ScrollView
        style={mobileStyles.container}
        contentContainerStyle={mobileStyles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadDiagrams(); }}
          />
        }
      >
        <Text style={mobileStyles.heading}>Diagram Practice</Text>
        <Text style={mobileStyles.subheading}>View teacher diagrams and practice using your preferred tool.</Text>

        {diagrams.length === 0 ? (
          <View style={mobileStyles.emptyBox}>
            <Text style={mobileStyles.emptyText}>No diagrams available for your class yet.</Text>
          </View>
        ) : (
          diagrams.map((item) => {
            const links = item.practiceLinks || {};
            return (
              <View key={item._id} style={mobileStyles.card}>
                <Image
                  source={{ uri: `data:${item.imageMimeType || "image/jpeg"};base64,${item.imageData}` }}
                  style={mobileStyles.diagramImage}
                  resizeMode="cover"
                />
                <View style={mobileStyles.cardBody}>
                  <Text style={mobileStyles.title}>{item.title}</Text>
                  <Text style={mobileStyles.subject}>{item.subject}</Text>
                  {!!item.description && <Text style={mobileStyles.description}>{item.description}</Text>}
                  <View style={mobileStyles.toolRow}>
                    <TouchableOpacity style={mobileStyles.toolBtn} onPress={() => openUrl(links.drawio)}>
                      <Ionicons name="open-outline" size={16} color="#fff" />
                      <Text style={mobileStyles.toolBtnText}>Draw.io</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={mobileStyles.toolBtn} onPress={() => openUrl(links.creately)}>
                      <Ionicons name="open-outline" size={16} color="#fff" />
                      <Text style={mobileStyles.toolBtnText}>Creately</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={mobileStyles.toolBtn} onPress={() => openUrl(links.lucidchart)}>
                      <Ionicons name="open-outline" size={16} color="#fff" />
                      <Text style={mobileStyles.toolBtnText}>Lucidchart</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={mobileStyles.badge}>
                  <Text style={mobileStyles.badgeText}>{item.targetBatch}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    );
  }

  // ─── WEB LAYOUT ───
  return (
    <ScrollView
      style={webStyles.root}
      contentContainerStyle={webStyles.rootContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadDiagrams(); }}
        />
      }
    >
      <View style={webStyles.inner}>

        {/* PAGE HEADER */}
        <View style={webStyles.pageHeader}>
          <View>
            <Text style={webStyles.pageTitle}>Diagram Practice</Text>
            <Text style={webStyles.pageSubtitle}>
              Study teacher diagrams and practice with your preferred tool
            </Text>
          </View>
          <View style={webStyles.countBadge}>
            <Ionicons name="brush-outline" size={15} color="#7c3aed" />
            <Text style={webStyles.countBadgeText}>
              {diagrams.length} {diagrams.length === 1 ? "Diagram" : "Diagrams"}
            </Text>
          </View>
        </View>

        {/* EMPTY STATE */}
        {diagrams.length === 0 ? (
          <View style={webStyles.emptyBox}>
            <View style={webStyles.emptyIconBox}>
              <Ionicons name="brush-outline" size={48} color="#cbd5e1" />
            </View>
            <Text style={webStyles.emptyTitle}>No diagrams yet</Text>
            <Text style={webStyles.emptyText}>
              Your teacher hasn't uploaded any diagrams for your class yet.
            </Text>
          </View>
        ) : (
          <View style={isWideScreen ? webStyles.gridWide : webStyles.gridNarrow}>
            {diagrams.map((item) => {
              const links = item.practiceLinks || {};
              return (
                <View key={item._id} style={[webStyles.card, isWideScreen && webStyles.cardWide]}>

                  {/* DIAGRAM IMAGE */}
                  <View style={webStyles.imageBox}>
                    <Image
                      source={{ uri: `data:${item.imageMimeType || "image/jpeg"};base64,${item.imageData}` }}
                      style={webStyles.diagramImage}
                      resizeMode="cover"
                    />
                    {/* Batch badge */}
                    <View style={webStyles.imageBadge}>
                      <Text style={webStyles.imageBadgeText}>{item.targetBatch}</Text>
                    </View>
                  </View>

                  {/* CARD BODY */}
                  <View style={webStyles.cardBody}>
                    <Text style={webStyles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={webStyles.cardSubject}>{item.subject}</Text>
                    {!!item.description && (
                      <Text style={webStyles.cardDesc} numberOfLines={3}>{item.description}</Text>
                    )}

                    {/* DIVIDER */}
                    <View style={webStyles.divider} />

                    {/* PRACTICE TOOLS */}
                    <Text style={webStyles.toolsLabel}>Practice with:</Text>
                    <View style={webStyles.toolRow}>
                      <TouchableOpacity
                        style={[webStyles.toolBtn, { backgroundColor: "#ff6b35" }]}
                        onPress={() => openUrl(links.drawio)}
                      >
                        <Ionicons name="git-network-outline" size={14} color="#fff" />
                        <Text style={webStyles.toolBtnText}>Draw.io</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[webStyles.toolBtn, { backgroundColor: "#7c3aed" }]}
                        onPress={() => openUrl(links.creately)}
                      >
                        <Ionicons name="shapes-outline" size={14} color="#fff" />
                        <Text style={webStyles.toolBtnText}>Creately</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[webStyles.toolBtn, { backgroundColor: "#0ea5e9" }]}
                        onPress={() => openUrl(links.lucidchart)}
                      >
                        <Ionicons name="analytics-outline" size={14} color="#fff" />
                        <Text style={webStyles.toolBtnText}>Lucidchart</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Student Portal</Text>
      </View>
    </ScrollView>
  );
}

/* ─────────────── MOBILE STYLES ─────────────── */
const mobileStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  content: { padding: 16, paddingBottom: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f1f5f9" },
  heading: { fontSize: 26, fontWeight: "800", color: "#0f172a" },
  subheading: { fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 14 },
  emptyBox: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  emptyText: { color: "#64748b" },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 14 },
  diagramImage: { width: "100%", height: 190, backgroundColor: "#e2e8f0" },
  cardBody: { padding: 12 },
  title: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  subject: { fontSize: 14, fontWeight: "700", color: "#2563eb", marginTop: 3 },
  description: { marginTop: 8, color: "#475569", lineHeight: 20 },
  toolRow: { marginTop: 12, flexDirection: "row", flexWrap: "wrap" },
  toolBtn: {
    backgroundColor: "#1d4ed8", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    flexDirection: "row", alignItems: "center",
    marginRight: 8, marginBottom: 6,
  },
  toolBtnText: { color: "#fff", fontWeight: "700", fontSize: 12, marginLeft: 4 },
  badge: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "rgba(15,23,42,0.85)",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});

/* ─────────────── WEB STYLES ─────────────── */
const webStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner: { width: "100%", maxWidth: 1100 },

  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  countBadge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f5f3ff", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: "#ddd6fe",
  },
  countBadgeText: { fontSize: 13, fontWeight: "700", color: "#7c3aed", marginLeft: 6 },

  gridWide: { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  gridNarrow: { flexDirection: "column", marginBottom: 24 },

  card: {
    backgroundColor: "#fff", borderRadius: 20,
    overflow: "hidden", marginBottom: 20,
    borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#0f172a", shadowOpacity: 0.07,
    shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardWide: { width: "31.5%", marginRight: "2%" },

  imageBox: { position: "relative", height: 200, backgroundColor: "#e2e8f0" },
  diagramImage: { width: "100%", height: "100%" },
  imageBadge: {
    position: "absolute", top: 12, right: 12,
    backgroundColor: "rgba(15,23,42,0.8)",
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
  },
  imageBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  cardBody: { padding: 18 },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  cardSubject: { fontSize: 14, fontWeight: "700", color: "#2563eb", marginBottom: 8 },
  cardDesc: { fontSize: 13, color: "#475569", lineHeight: 20 },

  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 14 },

  toolsLabel: { fontSize: 12, fontWeight: "700", color: "#94a3b8", marginBottom: 10, textTransform: "uppercase" },
  toolRow: { flexDirection: "row", flexWrap: "wrap" },
  toolBtn: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: "row", alignItems: "center",
    marginRight: 8, marginBottom: 6,
  },
  toolBtnText: { color: "#fff", fontWeight: "700", fontSize: 12, marginLeft: 5 },

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