import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Platform,
  Dimensions, Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { createAssignment } from "../../src/services/assignmentApi";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const CLASS_LIST   = ["SY9", "SY10", "SY11"];
const CLASS_COLORS = {
  SY9:  { selBg: "#1d4ed8", selText: "#fff" },
  SY10: { selBg: "#065f46", selText: "#fff" },
  SY11: { selBg: "#5b21b6", selText: "#fff" },
};

const getFileIcon = (mimeType = "") => {
  if (mimeType.startsWith("image/"))  return "image-outline";
  if (mimeType === "application/pdf") return "document-text-outline";
  if (mimeType.includes("word"))      return "document-outline";
  return "attach-outline";
};

const formatDateDisplay = (date) => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
};

const formatDateInputValue = (date) => date ? date.toISOString().slice(0, 10) : "";

const handleWebDateInput = (value, setDueDateValue, setForm) => {
  if (!value) {
    setDueDateValue(null);
    setForm((prev) => ({ ...prev, dueDate: "" }));
    return;
  }
  const [year, month, day] = value.split("-");
  const selected = new Date(`${year}-${month}-${day}T00:00:00`);
  setDueDateValue(selected);
  setForm((prev) => ({ ...prev, dueDate: formatDateDisplay(selected) }));
};

// ── Defined OUTSIDE to prevent re-render focus loss ──
function WebInput({ label, required, icon, value, onChangeText, placeholder, keyboardType, multiline, focusKey, focusedField, setFocusedField }) {
  const focused = focusedField === focusKey;
  return (
    <View style={wStyles.fieldGroup}>
      <Text style={wStyles.label}>{label}{required && <Text style={wStyles.req}> *</Text>}</Text>
      <View style={[wStyles.inputWrap, focused && wStyles.inputWrapFocused, multiline && { alignItems: "flex-start" }]}>
        {icon && <Ionicons name={icon} size={17} color={focused ? "#0f172a" : "#94a3b8"} style={multiline && { marginTop: 3 }} />}
        <TextInput
          style={[wStyles.input, multiline && { minHeight: 90, textAlignVertical: "top" }]}
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

export default function CreateAssignmentScreen() {
  const router = useRouter();
  const [submitting, setSubmitting]         = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDateValue, setDueDateValue]     = useState(null);
  const [focusedField, setFocusedField]     = useState(null);
  const [form, setForm] = useState({ unitTitle: "", assignmentTitle: "", description: "", dueDate: "", totalMarks: "" });
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [attachments, setAttachments]          = useState([]);

  const toggleClass = (cls) =>
    setSelectedClasses((prev) => prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]);

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
      if (result.canceled) return;
      setAttachments((prev) => [...prev, ...result.assets.map((f) => ({ name: f.name, mimeType: f.mimeType || "application/octet-stream", uri: f.uri, isImage: false }))]);
    } catch { Alert.alert("Error", "Could not pick files"); }
  };

  const openCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) { Alert.alert("Permission Denied", "Camera access is required"); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled) {
      const asset = result.assets[0];
      setAttachments((prev) => [...prev, { name: `photo_${Date.now()}.jpg`, mimeType: "image/jpeg", base64: asset.base64, isImage: true }]);
    }
  };

  const removeAttachment = (i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i));

  const onDueDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event?.type === "dismissed" || !selectedDate) return;
    setDueDateValue(selectedDate);
    setForm((prev) => ({ ...prev, dueDate: formatDateDisplay(selectedDate) }));
  };

  const handleCreate = async () => {
    const { unitTitle, assignmentTitle, dueDate, totalMarks } = form;
    if (!unitTitle.trim() || !assignmentTitle.trim() || !dueDate.trim() || !totalMarks) {
      Alert.alert("Missing Fields", "Please fill all required (*) fields"); return;
    }
    if (!selectedClasses.length) { Alert.alert("Missing Fields", "Please select at least one class"); return; }
    if (!dueDateValue) { Alert.alert("Missing Fields", "Please select due date from calendar"); return; }
    try {
      setSubmitting(true);
      const processed = await Promise.all(
        attachments.map(async (f) => {
          if (f.base64) return { name: f.name, mimeType: f.mimeType, data: f.base64 };
          try {
            const b64 = await FileSystem.readAsStringAsync(f.uri, { encoding: FileSystem.EncodingType.Base64 });
            return { name: f.name, mimeType: f.mimeType, data: b64 };
          } catch { return { name: f.name, mimeType: f.mimeType, data: "" }; }
        })
      );
      await createAssignment({ unitTitle: form.unitTitle.trim(), assignmentTitle: form.assignmentTitle.trim(), description: form.description.trim(), dueDate: dueDateValue.toISOString(), totalMarks: Number(form.totalMarks), classes: selectedClasses, attachments: processed });
      Alert.alert("Success", "Assignment created successfully", [{ text: "OK", onPress: () => router.replace("/(teacher)/add-assignment") }]);
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message ?? "Failed to create assignment");
    } finally { setSubmitting(false); }
  };

  // ── MOBILE ──
  if (!isWeb) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc" }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={mStyles.title}>Create Assignment</Text>
        <Text style={mStyles.label}>Unit Title <Text style={mStyles.req}>*</Text></Text>
        <TextInput style={mStyles.input} placeholder="e.g. Unit 3 - Sensors" value={form.unitTitle} onChangeText={(v) => setForm((p) => ({ ...p, unitTitle: v }))} />
        <Text style={mStyles.label}>Assignment Title <Text style={mStyles.req}>*</Text></Text>
        <TextInput style={mStyles.input} placeholder="e.g. Sensor Data Logger" value={form.assignmentTitle} onChangeText={(v) => setForm((p) => ({ ...p, assignmentTitle: v }))} />
        <Text style={mStyles.label}>Description</Text>
        <TextInput style={[mStyles.input, { height: 100, textAlignVertical: "top" }]} placeholder="Instructions..." value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} multiline />
        <Text style={mStyles.label}>Due Date <Text style={mStyles.req}>*</Text></Text>
        <TouchableOpacity style={mStyles.input} onPress={() => setShowDatePicker(true)}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="calendar-outline" size={18} color="#64748b" />
            <Text style={[{ marginLeft: 8, fontSize: 14 }, !form.dueDate && { color: "#94a3b8" }]}>{form.dueDate || "Select due date"}</Text>
          </View>
        </TouchableOpacity>
        {showDatePicker && <DateTimePicker value={dueDateValue || new Date()} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} minimumDate={new Date()} onChange={onDueDateChange} />}
        <Text style={mStyles.label}>Total Marks <Text style={mStyles.req}>*</Text></Text>
        <TextInput style={mStyles.input} placeholder="e.g. 20" value={form.totalMarks} onChangeText={(v) => setForm((p) => ({ ...p, totalMarks: v }))} keyboardType="numeric" />
        <Text style={mStyles.label}>Assign to Class <Text style={mStyles.req}>*</Text></Text>
        <View style={mStyles.classRow}>
          {CLASS_LIST.map((cls) => {
            const active = selectedClasses.includes(cls);
            return (
              <TouchableOpacity key={cls} style={[mStyles.classChip, { borderColor: CLASS_COLORS[cls].selBg }, active && { backgroundColor: CLASS_COLORS[cls].selBg }]} onPress={() => toggleClass(cls)}>
                <Text style={[mStyles.classChipText, { color: active ? CLASS_COLORS[cls].selText : CLASS_COLORS[cls].selBg }]}>{cls}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={mStyles.label}>Attachments</Text>
        <View style={mStyles.attachRow}>
          <TouchableOpacity style={mStyles.attachBtn} onPress={pickFiles}><Ionicons name="attach" size={17} color="#0f172a" /><Text style={mStyles.attachBtnText}>Pick Files</Text></TouchableOpacity>
          <TouchableOpacity style={mStyles.attachBtn} onPress={openCamera}><Ionicons name="camera-outline" size={17} color="#0f172a" /><Text style={mStyles.attachBtnText}>Camera</Text></TouchableOpacity>
        </View>
        {attachments.length > 0 && (
          <View style={mStyles.fileList}>
            {attachments.map((f, i) => (
              <View key={i} style={mStyles.fileChip}>
                {f.isImage && f.base64 ? <Image source={{ uri: `data:image/jpeg;base64,${f.base64}` }} style={mStyles.fileThumb} /> : <Ionicons name={getFileIcon(f.mimeType)} size={15} color="#1d4ed8" />}
                <Text style={mStyles.fileChipName} numberOfLines={1}>{f.name}</Text>
                <TouchableOpacity onPress={() => removeAttachment(i)}><Ionicons name="close-circle" size={17} color="#ef4444" /></TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity style={[mStyles.createBtn, submitting && { opacity: 0.6 }]} onPress={handleCreate} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={mStyles.createBtnText}>Create Assignment</Text>}
        </TouchableOpacity>
        <View style={{ height: 28 }} />
      </ScrollView>
    );
  }

  // ── WEB ──
  return (
    <ScrollView style={wStyles.root} contentContainerStyle={wStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={wStyles.inner}>

        <View style={wStyles.pageHeader}>
          <View>
            <Text style={wStyles.pageTitle}>Create Assignment</Text>
            <Text style={wStyles.pageSubtitle}>Fill in the details to share a new assignment with students</Text>
          </View>
          <View style={wStyles.headerIconBox}>
            <Ionicons name="document-text-outline" size={26} color="#f59e0b" />
          </View>
        </View>

        <View style={isWideScreen ? wStyles.twoColLayout : wStyles.oneColLayout}>

          {/* Left: main form */}
          <View style={[wStyles.formCard, isWideScreen && { flex: 1.4, marginRight: 20 }]}>

            <View style={isWideScreen ? wStyles.twoFieldRow : null}>
              <View style={isWideScreen ? { flex: 1, marginRight: 16 } : null}>
                <WebInput label="Unit Title" required icon="layers-outline" value={form.unitTitle} onChangeText={(v) => setForm((p) => ({ ...p, unitTitle: v }))} placeholder="e.g. Unit 3 - Sensors" focusKey="unit" focusedField={focusedField} setFocusedField={setFocusedField} />
              </View>
              <View style={isWideScreen ? { flex: 1 } : null}>
                <WebInput label="Assignment Title" required icon="document-text-outline" value={form.assignmentTitle} onChangeText={(v) => setForm((p) => ({ ...p, assignmentTitle: v }))} placeholder="e.g. Sensor Data Logger" focusKey="title" focusedField={focusedField} setFocusedField={setFocusedField} />
              </View>
            </View>

            <WebInput label="Description" icon="document-outline" value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Instructions, requirements, references..." multiline focusKey="desc" focusedField={focusedField} setFocusedField={setFocusedField} />

            <View style={isWideScreen ? wStyles.twoFieldRow : null}>
              <View style={[wStyles.fieldGroup, isWideScreen && { flex: 1, marginRight: 16 }]}>
                <Text style={wStyles.label}>Due Date <Text style={wStyles.req}>*</Text></Text>
                <View style={wStyles.inputWrap}>
                  <Ionicons name="calendar-outline" size={17} color="#94a3b8" />
                  {Platform.OS === "web" ? (
                    <input
                      type="date"
                      value={formatDateInputValue(dueDateValue)}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => handleWebDateInput(e.target.value, setDueDateValue, setForm)}
                      style={wStyles.dateInput}
                    />
                  ) : (
                    <TextInput style={wStyles.input} placeholder="Select due date" value={form.dueDate} editable={false} />
                  )}
                </View>
              </View>
              <View style={isWideScreen ? { flex: 1 } : null}>
                <WebInput label="Total Marks" required icon="trophy-outline" value={form.totalMarks} onChangeText={(v) => setForm((p) => ({ ...p, totalMarks: v }))} placeholder="e.g. 20" keyboardType="numeric" focusKey="marks" focusedField={focusedField} setFocusedField={setFocusedField} />
              </View>
            </View>

            <View style={wStyles.fieldGroup}>
              <Text style={wStyles.label}>Assign to Class <Text style={wStyles.req}>*</Text></Text>
              <View style={wStyles.classRow}>
                {CLASS_LIST.map((cls) => {
                  const active = selectedClasses.includes(cls);
                  return (
                    <TouchableOpacity key={cls} style={[wStyles.classChip, { borderColor: CLASS_COLORS[cls].selBg }, active && { backgroundColor: CLASS_COLORS[cls].selBg }]} onPress={() => toggleClass(cls)}>
                      {active && <Ionicons name="checkmark-circle" size={15} color="#fff" style={{ marginRight: 4 }} />}
                      <Text style={[wStyles.classChipText, { color: active ? "#fff" : CLASS_COLORS[cls].selBg }]}>{cls}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={wStyles.fieldGroup}>
              <Text style={wStyles.label}>Attachments</Text>
              <View style={wStyles.attachRow}>
                <TouchableOpacity style={wStyles.attachBtn} onPress={pickFiles}><Ionicons name="attach" size={17} color="#0f172a" /><Text style={wStyles.attachBtnText}>Pick Files</Text></TouchableOpacity>
                <TouchableOpacity style={wStyles.attachBtn} onPress={openCamera}><Ionicons name="camera-outline" size={17} color="#0f172a" /><Text style={wStyles.attachBtnText}>Camera</Text></TouchableOpacity>
              </View>
              {attachments.length > 0 && (
                <View style={wStyles.fileList}>
                  {attachments.map((f, i) => (
                    <View key={i} style={wStyles.fileChip}>
                      {f.isImage && f.base64 ? <Image source={{ uri: `data:image/jpeg;base64,${f.base64}` }} style={wStyles.fileThumb} /> : <Ionicons name={getFileIcon(f.mimeType)} size={15} color="#1d4ed8" />}
                      <Text style={wStyles.fileChipName} numberOfLines={1}>{f.name}</Text>
                      <TouchableOpacity onPress={() => removeAttachment(i)}><Ionicons name="close-circle" size={17} color="#ef4444" /></TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={[wStyles.createBtn, submitting && { opacity: 0.6 }]} onPress={handleCreate} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark-circle-outline" size={18} color="#fff" /><Text style={wStyles.createBtnText}>Create Assignment</Text></>}
            </TouchableOpacity>
          </View>

          {/* Right: tips */}
          <View style={[wStyles.tipsCard, isWideScreen && { flex: 1 }]}>
            <View style={wStyles.tipsHeader}>
              <Ionicons name="bulb-outline" size={18} color="#f59e0b" />
              <Text style={wStyles.tipsTitle}>Quick Tips</Text>
            </View>
            {[
              { icon: "calendar-outline",   color: "#2563eb", text: "Set a realistic due date so students have enough time." },
              { icon: "attach-outline",     color: "#8b5cf6", text: "Attach reference PDFs, images or Word documents." },
              { icon: "people-outline",     color: "#16a34a", text: "Select multiple classes if the assignment applies to all." },
              { icon: "trophy-outline",     color: "#f59e0b", text: "Total marks will be visible to students on their dashboard." },
              { icon: "document-outline",   color: "#0ea5e9", text: "Add a clear description with instructions and requirements." },
            ].map((t, i) => (
              <View key={i} style={wStyles.tipRow}>
                <View style={[wStyles.tipIconBox, { backgroundColor: `${t.color}15` }]}>
                  <Ionicons name={t.icon} size={16} color={t.color} />
                </View>
                <Text style={wStyles.tipText}>{t.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={wStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mStyles = StyleSheet.create({
  title:         { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 14 },
  label:         { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6, marginTop: 14 },
  req:           { color: "#ef4444" },
  input:         { backgroundColor: "#fff", borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#e2e8f0", color: "#0f172a" },
  classRow:      { flexDirection: "row", gap: 10, marginTop: 2 },
  classChip:     { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 2, backgroundColor: "#fff" },
  classChipText: { fontSize: 14, fontWeight: "700" },
  attachRow:     { flexDirection: "row", gap: 10, marginTop: 4 },
  attachBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0" },
  attachBtnText: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
  fileList:      { marginTop: 10, gap: 6 },
  fileChip:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#eff6ff", borderRadius: 8, padding: 8, borderWidth: 1, borderColor: "#bfdbfe" },
  fileChipName:  { flex: 1, fontSize: 12, color: "#1d4ed8" },
  fileThumb:     { width: 28, height: 28, borderRadius: 4 },
  createBtn:     { backgroundColor: "#0f172a", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 24, flexDirection: "row", justifyContent: "center" },
  createBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

const wStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1100 },
  pageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  pageTitle:   { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle:{ fontSize: 14, color: "#64748b", marginTop: 4 },
  headerIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#fef3c7", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#fde68a" },
  twoColLayout:  { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  oneColLayout:  { flexDirection: "column", marginBottom: 20 },
  twoFieldRow:   { flexDirection: "row" },
  formCard:    { backgroundColor: "#fff", borderRadius: 20, padding: 28, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, marginBottom: 16 },
  fieldGroup:  { marginBottom: 20 },
  label:       { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 },
  req:         { color: "#ef4444" },
  inputWrap:        { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: "#f8fafc" },
  inputWrapFocused: { borderColor: "#0f172a", backgroundColor: "#fff", shadowColor: "#0f172a", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  input:            { flex: 1, fontSize: 15, color: "#0f172a", marginLeft: 10, outlineStyle: "none", outlineWidth: 0 },
  dateInput:        { flex: 1, fontSize: 15, color: "#0f172a", marginLeft: 10, backgroundColor: "transparent", border: "none", outline: "none", width: "100%", minHeight: 20 },
  classRow:      { flexDirection: "row", gap: 12 },
  classChip:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 2, backgroundColor: "#fff" },
  classChipText: { fontSize: 14, fontWeight: "700" },
  attachRow:     { flexDirection: "row", gap: 12, marginBottom: 10 },
  attachBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0" },
  attachBtnText: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
  fileList:      { gap: 8 },
  fileChip:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#eff6ff", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#bfdbfe" },
  fileChipName:  { flex: 1, fontSize: 13, color: "#1d4ed8" },
  fileThumb:     { width: 32, height: 32, borderRadius: 6 },
  createBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#0f172a", borderRadius: 12, paddingVertical: 15, marginTop: 8 },
  createBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  tipsCard:    { backgroundColor: "#fff", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, marginBottom: 16 },
  tipsHeader:  { flexDirection: "row", alignItems: "center", marginBottom: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  tipsTitle:   { fontSize: 16, fontWeight: "700", color: "#0f172a", marginLeft: 8 },
  tipRow:      { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  tipIconBox:  { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12 },
  tipText:     { fontSize: 13, color: "#475569", lineHeight: 20, flex: 1 },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});