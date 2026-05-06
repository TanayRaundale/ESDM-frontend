import { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Linking, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, Image, Platform, Dimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchTeacherDiagramById } from "../../src/services/diagramApi";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const openUrl = async (url) => {
  try {
    if (isWeb) { window.open(url, "_blank"); return; }
    await Linking.openURL(url);
  } catch { Alert.alert("Error", "Unable to open website."); }
};

const TOOL_LINKS = [
  { key: "drawio",     label: "Open Draw.io",   icon: "color-wand-outline",  color: "#f97316" },
  { key: "creately",   label: "Open Creately",  icon: "shapes-outline",      color: "#8b5cf6" },
  { key: "lucidchart", label: "Open Lucidchart", icon: "git-network-outline", color: "#0ea5e9" },
];

export default function DiagramDetails() {
  const { id } = useLocalSearchParams();
  const [diagram, setDiagram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const data = await fetchTeacherDiagramById(id); setDiagram(data); }
      catch { Alert.alert("Error", "Failed to load diagram details"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#0f172a" />
    </View>
  );

  if (!diagram) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
      <Text style={{ marginTop: 10, color: "#ef4444", fontWeight: "700" }}>Diagram not found</Text>
    </View>
  );

  const links = diagram.practiceLinks || {};

  // ── MOBILE ──
  if (!isWeb) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc" }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <View style={mStyles.headerCard}>
          <Image
            source={{ uri: `data:${diagram.imageMimeType || "image/jpeg"};base64,${diagram.imageData}` }}
            style={mStyles.previewImage}
            resizeMode="cover"
          />
          <Text style={mStyles.title}>{diagram.title}</Text>
          <Text style={mStyles.subject}>{diagram.subject}</Text>
          <View style={mStyles.badge}><Text style={mStyles.badgeText}>{diagram.targetBatch}</Text></View>
        </View>

        {!!diagram.description && (
          <View style={mStyles.section}>
            <Text style={mStyles.sectionLabel}>Description</Text>
            <Text style={mStyles.description}>{diagram.description}</Text>
          </View>
        )}

        <Text style={mStyles.sectionLabelMain}>Practice Websites</Text>
        {TOOL_LINKS.map(({ key, label, icon, color }) => (
          <TouchableOpacity
            key={key}
            style={[mStyles.linkBtn, { backgroundColor: color }]}
            onPress={() => openUrl(links[key])}
          >
            <Ionicons name={icon} size={18} color="#fff" />
            <Text style={mStyles.linkBtnText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  // ── WEB ──
  return (
    <ScrollView style={wStyles.root} contentContainerStyle={wStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={wStyles.inner}>

        {/* Hero image with dark overlay */}
        <View style={wStyles.heroCard}>
          <Image
            source={{ uri: `data:${diagram.imageMimeType || "image/jpeg"};base64,${diagram.imageData}` }}
            style={wStyles.heroImage}
            resizeMode="cover"
          />
          <View style={wStyles.heroOverlay}>
            <View style={wStyles.badge}>
              <Text style={wStyles.badgeText}>{diagram.targetBatch}</Text>
            </View>
            <Text style={wStyles.heroTitle}>{diagram.title}</Text>
            <Text style={wStyles.heroSubject}>{diagram.subject}</Text>
          </View>
        </View>

        {/* Content row */}
        <View style={isWideScreen ? wStyles.twoColRow : wStyles.oneColRow}>

          {/* Description */}
          {!!diagram.description && (
            <View style={[wStyles.section, isWideScreen && { flex: 1, marginRight: 16 }]}>
              <View style={wStyles.sectionHeader}>
                <Ionicons name="document-text-outline" size={18} color="#1d4ed8" />
                <Text style={wStyles.sectionTitle}>Description</Text>
              </View>
              <Text style={wStyles.descText}>{diagram.description}</Text>
            </View>
          )}

          {/* Practice links */}
          <View style={[wStyles.section, isWideScreen && { flex: 1 }]}>
            <View style={wStyles.sectionHeader}>
              <Ionicons name="link-outline" size={18} color="#1d4ed8" />
              <Text style={wStyles.sectionTitle}>Practice Websites</Text>
            </View>
            {TOOL_LINKS.map(({ key, label, icon, color }) => (
              <TouchableOpacity
                key={key}
                style={[wStyles.linkBtn, { borderLeftColor: color }]}
                onPress={() => openUrl(links[key])}
                activeOpacity={0.8}
              >
                <View style={[wStyles.linkIconBox, { backgroundColor: `${color}15` }]}>
                  <Ionicons name={icon} size={18} color={color} />
                </View>
                <Text style={wStyles.linkBtnText}>{label}</Text>
                <Ionicons name="open-outline" size={16} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={wStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mStyles = StyleSheet.create({
  headerCard:       { backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", marginBottom: 14 },
  previewImage:     { width: "100%", height: 200, borderRadius: 12, backgroundColor: "#e2e8f0" },
  title:            { fontSize: 20, fontWeight: "800", color: "#0f172a", marginTop: 12, textAlign: "center" },
  subject:          { color: "#1d4ed8", fontWeight: "700", marginTop: 4 },
  badge:            { marginTop: 10, backgroundColor: "#eff6ff", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText:        { color: "#1d4ed8", fontWeight: "700" },
  section:          { marginTop: 14, backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  sectionLabel:     { color: "#64748b", fontWeight: "700", marginBottom: 6 },
  sectionLabelMain: { marginTop: 16, marginBottom: 10, color: "#334155", fontWeight: "800", fontSize: 16 },
  description:      { color: "#334155", lineHeight: 20 },
  linkBtn:          { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 10 },
  linkBtnText:      { color: "#fff", fontWeight: "800" },
});

const wStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 900 },
  heroCard:    { borderRadius: 20, overflow: "hidden", marginBottom: 24, position: "relative", shadowColor: "#0f172a", shadowOpacity: 0.1, shadowRadius: 14, elevation: 6 },
  heroImage:   { width: "100%", height: 280 },
  heroOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(15,23,42,0.75)", padding: 24 },
  badge:       { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: "flex-start", marginBottom: 8 },
  badgeText:   { color: "#fff", fontWeight: "700", fontSize: 12 },
  heroTitle:   { fontSize: 24, fontWeight: "800", color: "#fff" },
  heroSubject: { fontSize: 14, color: "#bfdbfe", fontWeight: "600", marginTop: 4 },
  twoColRow:   { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  oneColRow:   { flexDirection: "column", marginBottom: 20 },
  section:     { backgroundColor: "#fff", borderRadius: 18, padding: 24, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  sectionTitle:  { fontSize: 15, fontWeight: "700", color: "#0f172a", marginLeft: 8 },
  descText:    { fontSize: 14, color: "#334155", lineHeight: 22 },
  linkBtn:     { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#f8fafc", borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0", borderLeftWidth: 4 },
  linkIconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 14 },
  linkBtnText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#0f172a" },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});