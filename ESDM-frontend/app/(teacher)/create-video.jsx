// ============================================================
// FILE: app/(teacher)/create-video.jsx
// ============================================================
import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createTeacherVideo } from "../../src/services/videoApi";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const BATCH_OPTIONS = ["SY9", "SY10", "SY11", "All"];

function WebInput({ label, required, icon, value, onChangeText, placeholder, multiline, focusKey, focusedField, setFocusedField }) {
  const focused = focusedField === focusKey;
  return (
    <View style={cvStyles.fieldGroup}>
      <Text style={cvStyles.label}>{label}{required && <Text style={cvStyles.req}> *</Text>}</Text>
      <View style={[cvStyles.inputWrap, focused && cvStyles.inputWrapFocused, multiline && { alignItems: "flex-start" }]}>
        {icon && <Ionicons name={icon} size={17} color={focused ? "#dc2626" : "#94a3b8"} style={multiline && { marginTop: 3 }} />}
        <TextInput
          style={[cvStyles.input, multiline && { minHeight: 80, textAlignVertical: "top" }]}
          placeholder={placeholder || `Enter ${label}`}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          autoCapitalize="none"
          onFocus={() => setFocusedField(focusKey)}
          onBlur={() => setFocusedField(null)}
        />
      </View>
    </View>
  );
}

export default function CreateVideo() {
  const router = useRouter();
  const [title, setTitle]           = useState("");
  const [url, setUrl]               = useState("");
  const [description, setDescription] = useState("");
  const [targetBatch, setTargetBatch] = useState("All");
  const [saving, setSaving]         = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const onCreate = async () => {
    if (!title.trim() || !url.trim()) { Alert.alert("Missing Fields", "Title and YouTube URL are required."); return; }
    try {
      setSaving(true);
      await createTeacherVideo({ title: title.trim(), description: description.trim(), url: url.trim(), targetBatch });
      Alert.alert("Success", "Video link uploaded successfully.", [{ text: "OK", onPress: () => router.replace("/(teacher)/videos") }]);
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.message || "Unable to upload video link");
    } finally { setSaving(false); }
  };

  if (!isWeb) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc" }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <Text style={mStyles.title}>Add Video Link</Text>
        <Text style={mStyles.subtitle}>Fill details and share YouTube video with students.</Text>
        <Text style={mStyles.label}>Title <Text style={mStyles.req}>*</Text></Text>
        <TextInput style={mStyles.input} placeholder="e.g. Introduction to Sensors" value={title} onChangeText={setTitle} />
        <Text style={mStyles.label}>YouTube URL <Text style={mStyles.req}>*</Text></Text>
        <TextInput style={mStyles.input} placeholder="https://www.youtube.com/watch?v=..." autoCapitalize="none" value={url} onChangeText={setUrl} />
        <Text style={mStyles.label}>Description</Text>
        <TextInput style={[mStyles.input, { minHeight: 90, textAlignVertical: "top" }]} placeholder="Optional description" multiline value={description} onChangeText={setDescription} />
        <Text style={mStyles.label}>Target Batch</Text>
        <View style={mStyles.batchRow}>
          {BATCH_OPTIONS.map((b) => (
            <TouchableOpacity key={b} style={[mStyles.batchChip, targetBatch === b && mStyles.batchChipActive]} onPress={() => setTargetBatch(b)}>
              <Text style={[mStyles.batchText, targetBatch === b && mStyles.batchTextActive]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[mStyles.btn, saving && { opacity: 0.7 }]} onPress={onCreate} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={mStyles.btnText}>Upload Video Link</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={cvStyles.root} contentContainerStyle={cvStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={cvStyles.inner}>
        <View style={cvStyles.pageHeader}>
          <View>
            <Text style={cvStyles.pageTitle}>Add Video Link</Text>
            <Text style={cvStyles.pageSubtitle}>Share YouTube video lessons with your students</Text>
          </View>
          <View style={cvStyles.headerIconBox}>
            <Ionicons name="logo-youtube" size={26} color="#dc2626" />
          </View>
        </View>

        <View style={isWideScreen ? cvStyles.twoColLayout : cvStyles.oneColLayout}>
          <View style={[cvStyles.formCard, isWideScreen && { flex: 1.4, marginRight: 20 }]}>
            <WebInput label="Video Title" required icon="text-outline" value={title} onChangeText={setTitle} placeholder="e.g. Introduction to Sensors" focusKey="title" focusedField={focusedField} setFocusedField={setFocusedField} />
            <WebInput label="YouTube URL" required icon="link-outline" value={url} onChangeText={setUrl} placeholder="https://www.youtube.com/watch?v=..." focusKey="url" focusedField={focusedField} setFocusedField={setFocusedField} />
            <WebInput label="Description" icon="document-text-outline" value={description} onChangeText={setDescription} placeholder="Optional description..." multiline focusKey="desc" focusedField={focusedField} setFocusedField={setFocusedField} />
            <View style={cvStyles.fieldGroup}>
              <Text style={cvStyles.label}>Target Batch <Text style={cvStyles.req}>*</Text></Text>
              <View style={cvStyles.batchRow}>
                {BATCH_OPTIONS.map((b) => (
                  <TouchableOpacity key={b} style={[cvStyles.batchChip, targetBatch === b && cvStyles.batchChipActive]} onPress={() => setTargetBatch(b)}>
                    {targetBatch === b && <Ionicons name="checkmark-circle" size={15} color="#fff" style={{ marginRight: 4 }} />}
                    <Text style={[cvStyles.batchChipText, targetBatch === b && cvStyles.batchChipTextActive]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={[cvStyles.submitBtn, saving && { opacity: 0.7 }]} onPress={onCreate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="cloud-upload-outline" size={18} color="#fff" /><Text style={cvStyles.submitBtnText}>Upload Video Link</Text></>}
            </TouchableOpacity>
          </View>

          <View style={[cvStyles.infoCard, isWideScreen && { flex: 1 }]}>
            <View style={cvStyles.infoHeader}>
              <Ionicons name="logo-youtube" size={20} color="#dc2626" />
              <Text style={cvStyles.infoTitle}>Supported URL Formats</Text>
            </View>
            {["https://www.youtube.com/watch?v=...", "https://youtu.be/...", "https://www.youtube.com/shorts/...", "https://m.youtube.com/watch?v=..."].map((ex, i) => (
              <View key={i} style={cvStyles.exRow}>
                <Ionicons name="checkmark-circle-outline" size={15} color="#16a34a" />
                <Text style={cvStyles.exText}>{ex}</Text>
              </View>
            ))}
            <View style={cvStyles.tipBox}>
              <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
              <Text style={cvStyles.tipText}>Students can watch videos directly from the app without leaving the platform.</Text>
            </View>
          </View>
        </View>
        <Text style={cvStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mStyles = StyleSheet.create({
  title:    { fontSize: 23, fontWeight: "800", color: "#0f172a" },
  subtitle: { marginTop: 5, color: "#64748b", marginBottom: 14 },
  label:    { marginTop: 10, marginBottom: 6, fontWeight: "700", color: "#334155" },
  req:      { color: "#ef4444" },
  input:    { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 12 },
  batchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  batchChip:{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "#e2e8f0" },
  batchChipActive: { backgroundColor: "#1d4ed8" },
  batchText:{ color: "#334155", fontWeight: "700" },
  batchTextActive: { color: "#fff" },
  btn:      { backgroundColor: "#dc2626", borderRadius: 10, marginTop: 16, paddingVertical: 12, alignItems: "center" },
  btnText:  { color: "#fff", fontWeight: "800" },
});

const cvStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1100 },
  pageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  pageTitle:   { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle:{ fontSize: 14, color: "#64748b", marginTop: 4 },
  headerIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#fee2e2", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#fecaca" },
  twoColLayout:{ flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  oneColLayout:{ flexDirection: "column", marginBottom: 20 },
  formCard:    { backgroundColor: "#fff", borderRadius: 20, padding: 28, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, marginBottom: 16 },
  fieldGroup:  { marginBottom: 20 },
  label:       { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 },
  req:         { color: "#ef4444" },
  inputWrap:        { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: "#f8fafc" },
  inputWrapFocused: { borderColor: "#dc2626", backgroundColor: "#fff", shadowColor: "#dc2626", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  input:            { flex: 1, fontSize: 15, color: "#0f172a", marginLeft: 10, outlineStyle: "none", outlineWidth: 0 },
  batchRow:    { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  batchChip:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: "#f1f5f9", borderWidth: 1.5, borderColor: "#e2e8f0" },
  batchChipActive: { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8" },
  batchChipText:   { fontSize: 14, fontWeight: "700", color: "#475569" },
  batchChipTextActive: { color: "#fff" },
  submitBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, marginTop: 8 },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  infoCard:    { backgroundColor: "#fff", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, marginBottom: 16 },
  infoHeader:  { flexDirection: "row", alignItems: "center", marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  infoTitle:   { fontSize: 16, fontWeight: "700", color: "#0f172a", marginLeft: 8 },
  exRow:       { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  exText:      { fontSize: 12, color: "#64748b", marginLeft: 8, flex: 1 },
  tipBox:      { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fffbeb", borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: "#fde68a" },
  tipText:     { fontSize: 13, color: "#92400e", marginLeft: 8, flex: 1, lineHeight: 20 },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});