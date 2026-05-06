import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { createTeacherQuiz } from "../../src/services/quizApi";
import API from "../../src/services/api";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const BATCH_OPTIONS = ["SY9", "SY10", "SY11", "All"];

// ── Web input with focus ring (defined OUTSIDE component) ──
function WebInput({ label, required, icon, value, onChangeText, placeholder, keyboardType, multiline, focusKey, focusedField, setFocusedField }) {
  const focused = focusedField === focusKey;
  return (
    <View style={webStyles.fieldGroup}>
      <Text style={webStyles.label}>{label}{required && <Text style={webStyles.req}> *</Text>}</Text>
      <View style={[webStyles.inputWrap, focused && webStyles.inputWrapFocused, multiline && { alignItems: "flex-start" }]}>
        {icon && <Ionicons name={icon} size={17} color={focused ? "#2563eb" : "#94a3b8"} style={multiline && { marginTop: 3 }} />}
        <TextInput
          style={[webStyles.input, multiline && { minHeight: 90, textAlignVertical: "top" }]}
          placeholder={placeholder || `Enter ${label}`}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setFocusedField(focusKey)}
          onBlur={() => setFocusedField(null)}
        />
      </View>
    </View>
  );
}

export default function CreateQuiz() {
  const router = useRouter();
  const [quizName, setQuizName]             = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [targetBatch, setTargetBatch]       = useState("SY9");
  const [duration, setDuration]             = useState("");
  const [excelFile, setExcelFile]           = useState(null);
  const [saving, setSaving]                 = useState(false);
  const [focusedField, setFocusedField]     = useState(null);

  const pickExcelFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled) setExcelFile(result.assets[0]);
  };

  const handleAddQuiz = async () => {
    if (!quizName.trim() || !quizDescription.trim() || !duration.trim() || !excelFile) {
      Alert.alert("Missing Fields", "Please fill all fields and attach an Excel file.");
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("name", quizName.trim());
      formData.append("description", quizDescription.trim());
      formData.append("targetBatch", targetBatch);
      formData.append("duration", duration.trim());
      formData.append("file", { uri: excelFile.uri, name: excelFile.name, type: excelFile.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      await createTeacherQuiz(formData);
      Alert.alert("Success", "Quiz created successfully.", [{ text: "OK", onPress: () => router.replace("/(teacher)/activate-quiz") }]);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Unable to create quiz.");
    } finally { setSaving(false); }
  };

  // ── MOBILE ──
  if (!isWeb) {
    return (
      <ScrollView style={mobileStyles.container} contentContainerStyle={mobileStyles.content}>
        <Text style={mobileStyles.title}>Create Quiz</Text>
        <Text style={mobileStyles.subtitle}>Fill details and attach the Excel sheet with question, options, and answer columns.</Text>

        <Text style={mobileStyles.label}>Quiz Name</Text>
        <TextInput style={mobileStyles.input} placeholder="Enter quiz name" value={quizName} onChangeText={setQuizName} />

        <Text style={mobileStyles.label}>Description</Text>
        <TextInput style={[mobileStyles.input, mobileStyles.textArea]} placeholder="Enter quiz description" multiline value={quizDescription} onChangeText={setQuizDescription} />

        <Text style={mobileStyles.label}>Target Batch</Text>
        <View style={mobileStyles.batchRow}>
          {BATCH_OPTIONS.map((opt) => (
            <TouchableOpacity key={opt} style={[mobileStyles.batchBtn, targetBatch === opt && mobileStyles.batchBtnActive]} onPress={() => setTargetBatch(opt)}>
              <Text style={[mobileStyles.batchText, targetBatch === opt && mobileStyles.batchTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={mobileStyles.label}>Duration</Text>
        <TextInput style={mobileStyles.input} placeholder="e.g. 20 Minutes" value={duration} onChangeText={setDuration} />

        <Text style={mobileStyles.label}>Excel File</Text>
        <TouchableOpacity style={mobileStyles.fileBtn} onPress={pickExcelFile}>
          <Ionicons name="document-attach-outline" size={22} color="#2563eb" />
          <Text style={mobileStyles.fileBtnText}>{excelFile ? excelFile.name : "Upload Excel file"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[mobileStyles.addBtn, saving && { opacity: 0.7 }]} onPress={handleAddQuiz} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="add-circle-outline" size={20} color="#fff" /><Text style={mobileStyles.addBtnText}>Add Quiz</Text></>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── WEB ──
  return (
    <ScrollView style={webStyles.root} contentContainerStyle={webStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={webStyles.inner}>

        <View style={webStyles.pageHeader}>
          <View>
            <Text style={webStyles.pageTitle}>Create Quiz</Text>
            <Text style={webStyles.pageSubtitle}>Fill details and attach the Excel sheet with questions</Text>
          </View>
          <View style={webStyles.headerIconBox}>
            <Ionicons name="help-circle-outline" size={26} color="#2563eb" />
          </View>
        </View>

        <View style={isWideScreen ? webStyles.twoColLayout : webStyles.oneColLayout}>

          {/* Left: form */}
          <View style={[webStyles.formCard, isWideScreen && { flex: 1.4, marginRight: 20 }]}>

            <View style={isWideScreen ? webStyles.twoFieldRow : null}>
              <View style={isWideScreen ? { flex: 1, marginRight: 16 } : null}>
                <WebInput label="Quiz Name" required icon="help-circle-outline" value={quizName} onChangeText={setQuizName} placeholder="Enter quiz name" focusKey="name" focusedField={focusedField} setFocusedField={setFocusedField} />
              </View>
              <View style={isWideScreen ? { flex: 1 } : null}>
                <WebInput label="Duration" required icon="time-outline" value={duration} onChangeText={setDuration} placeholder="e.g. 20 Minutes" focusKey="duration" focusedField={focusedField} setFocusedField={setFocusedField} />
              </View>
            </View>

            <WebInput label="Description" required icon="document-text-outline" value={quizDescription} onChangeText={setQuizDescription} placeholder="Describe what this quiz covers..." multiline focusKey="desc" focusedField={focusedField} setFocusedField={setFocusedField} />

            {/* Target Batch */}
            <View style={webStyles.fieldGroup}>
              <Text style={webStyles.label}>Target Batch <Text style={webStyles.req}>*</Text></Text>
              <View style={webStyles.batchRow}>
                {BATCH_OPTIONS.map((opt) => (
                  <TouchableOpacity key={opt} style={[webStyles.batchChip, targetBatch === opt && webStyles.batchChipActive]} onPress={() => setTargetBatch(opt)}>
                    {targetBatch === opt && <Ionicons name="checkmark-circle" size={15} color="#fff" style={{ marginRight: 4 }} />}
                    <Text style={[webStyles.batchChipText, targetBatch === opt && webStyles.batchChipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* File Upload */}
            <View style={webStyles.fieldGroup}>
              <Text style={webStyles.label}>Excel File <Text style={webStyles.req}>*</Text></Text>
              <TouchableOpacity style={[webStyles.fileBtn, excelFile && webStyles.fileBtnSuccess]} onPress={pickExcelFile}>
                <View style={[webStyles.fileIconBox, { backgroundColor: excelFile ? "#f0fdf4" : "#eff6ff" }]}>
                  <Ionicons name="document-attach-outline" size={22} color={excelFile ? "#16a34a" : "#2563eb"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[webStyles.fileBtnTitle, excelFile && { color: "#16a34a" }]}>{excelFile ? "File Selected" : "Upload Excel File"}</Text>
                  <Text style={webStyles.fileBtnSub} numberOfLines={1}>{excelFile ? excelFile.name : "question, options, and answer columns required"}</Text>
                </View>
                <Ionicons name={excelFile ? "checkmark-circle" : "cloud-upload-outline"} size={20} color={excelFile ? "#16a34a" : "#94a3b8"} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[webStyles.submitBtn, saving && { opacity: 0.7 }]} onPress={handleAddQuiz} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="add-circle-outline" size={18} color="#fff" /><Text style={webStyles.submitBtnText}>Create Quiz</Text></>}
            </TouchableOpacity>
          </View>

          {/* Right: info card */}
          <View style={[webStyles.infoCard, isWideScreen && { flex: 1 }]}>
            <View style={webStyles.infoHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#2563eb" />
              <Text style={webStyles.infoTitle}>Excel Format Guide</Text>
            </View>
            {[
              { col: "question",  desc: "The quiz question text" },
              { col: "option1",   desc: "First answer option" },
              { col: "option2",   desc: "Second answer option" },
              { col: "option3",   desc: "Third answer option" },
              { col: "option4",   desc: "Fourth answer option" },
              { col: "answer",    desc: "Exact text of correct option" },
            ].map((row, i) => (
              <View key={i} style={webStyles.infoRow}>
                <View style={webStyles.infoColBadge}><Text style={webStyles.infoColText}>{row.col}</Text></View>
                <Text style={webStyles.infoDesc}>{row.desc}</Text>
              </View>
            ))}
            <TouchableOpacity style={webStyles.templateBtn} onPress={() => { if (isWeb) window.open(`${API.defaults.baseURL}/quizzes/template`, "_blank"); }}>
              <Ionicons name="download-outline" size={16} color="#2563eb" />
              <Text style={webStyles.templateBtnText}>Download Template</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mobileStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content:   { padding: 20, paddingBottom: 40 },
  title:     { fontSize: 26, fontWeight: "800", color: "#0f172a" },
  subtitle:  { marginTop: 6, fontSize: 14, color: "#64748b", lineHeight: 20, marginBottom: 18 },
  label:     { marginTop: 12, marginBottom: 8, fontSize: 14, fontWeight: "700", color: "#334155" },
  input:     { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: "#0f172a" },
  textArea:  { minHeight: 110, textAlignVertical: "top" },
  batchRow:  { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  batchBtn:  { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: "#e2e8f0" },
  batchBtnActive: { backgroundColor: "#2563eb" },
  batchText: { fontSize: 14, fontWeight: "700", color: "#334155" },
  batchTextActive: { color: "#fff" },
  fileBtn:   { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#93c5fd", padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  fileBtnText: { color: "#2563eb", fontSize: 15, fontWeight: "700", flex: 1 },
  addBtn:    { marginTop: 28, backgroundColor: "#16a34a", borderRadius: 14, paddingVertical: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  addBtnText:{ color: "#fff", fontSize: 16, fontWeight: "800" },
});

const webStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1100 },
  pageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  pageTitle:   { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle:{ fontSize: 14, color: "#64748b", marginTop: 4 },
  headerIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#bfdbfe" },
  twoColLayout:  { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  oneColLayout:  { flexDirection: "column", marginBottom: 20 },
  formCard:    { backgroundColor: "#fff", borderRadius: 20, padding: 28, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, marginBottom: 16 },
  twoFieldRow: { flexDirection: "row" },
  fieldGroup:  { marginBottom: 20 },
  label:       { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 },
  req:         { color: "#ef4444" },
  inputWrap:        { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: "#f8fafc" },
  inputWrapFocused: { borderColor: "#2563eb", backgroundColor: "#fff", shadowColor: "#2563eb", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  input:            { flex: 1, fontSize: 15, color: "#0f172a", marginLeft: 10, outlineStyle: "none", outlineWidth: 0 },
  batchRow:    { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  batchChip:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: "#f1f5f9", borderWidth: 1.5, borderColor: "#e2e8f0" },
  batchChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  batchChipText:   { fontSize: 14, fontWeight: "700", color: "#475569" },
  batchChipTextActive: { color: "#fff" },
  fileBtn:     { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 14, borderWidth: 1.5, borderColor: "#e2e8f0", padding: 16, gap: 14 },
  fileBtnSuccess: { borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" },
  fileIconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  fileBtnTitle:{ fontSize: 15, fontWeight: "700", color: "#0f172a" },
  fileBtnSub:  { fontSize: 12, color: "#64748b", marginTop: 2 },
  submitBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 15, marginTop: 8 },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  infoCard:    { backgroundColor: "#fff", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, marginBottom: 16 },
  infoHeader:  { flexDirection: "row", alignItems: "center", marginBottom: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  infoTitle:   { fontSize: 16, fontWeight: "700", color: "#0f172a", marginLeft: 8 },
  infoRow:     { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  infoColBadge:{ backgroundColor: "#eff6ff", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginRight: 12, minWidth: 90 },
  infoColText: { fontSize: 12, fontWeight: "700", color: "#2563eb", textAlign: "center" },
  infoDesc:    { fontSize: 13, color: "#64748b", flex: 1 },
  templateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#eff6ff", borderRadius: 12, paddingVertical: 12, marginTop: 16, borderWidth: 1, borderColor: "#bfdbfe", gap: 8 },
  templateBtnText: { fontSize: 13, fontWeight: "700", color: "#2563eb" },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});