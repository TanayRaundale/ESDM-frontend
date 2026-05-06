import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import API from "../../src/services/api";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const CLASS_OPTIONS = ["SY9", "SY10", "SY11"];

const getFileIcon = (fileName) => {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext === "pdf")                      return { icon: "document-text",   color: "#ef4444" };
  if (ext === "doc" || ext === "docx")    return { icon: "document",        color: "#2563eb" };
  if (ext === "ppt" || ext === "pptx")    return { icon: "easel",           color: "#f59e0b" };
  if (["jpg","jpeg","png"].includes(ext)) return { icon: "image",           color: "#22c55e" };
  return { icon: "document-attach", color: "#64748b" };
};

// Web-only styled input field with focus ring on wrapper
function WebField({ label, required, icon, value, onChangeText, placeholder, keyboardType, multiline }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={webStyles.fieldGroup}>
      <Text style={webStyles.label}>
        {label} {required && <Text style={webStyles.req}>*</Text>}
      </Text>
      <View style={[webStyles.inputWrap, focused && webStyles.inputWrapFocused, multiline && { alignItems: "flex-start", paddingVertical: 12 }]}>
        {icon && <Ionicons name={icon} size={17} color={focused ? "#3b82f6" : "#94a3b8"} style={multiline && { marginTop: 2 }} />}
        <TextInput
          style={[webStyles.input, multiline && { minHeight: 80, textAlignVertical: "top" }]}
          placeholder={placeholder || `Enter ${label}`}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

export default function UploadNotes() {
  const router = useRouter();
  const [unitNumber, setUnitNumber] = useState("");
  const [unit, setUnit]             = useState("");
  const [topic, setTopic]           = useState("");
  const [classes, setClasses]       = useState([]);
  const [files, setFiles]           = useState([]);
  const [loading, setLoading]       = useState(false);

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true,
        type: ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation"] });
      if (!result.canceled) setFiles((prev) => [...prev, ...result.assets]);
    } catch (err) { console.log("File pick error:", err); }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert("Permission needed", "Allow camera access"); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) {
      const photo = result.assets[0];
      setFiles((prev) => [...prev, { uri: photo.uri, name: `photo-${Date.now()}.jpg`, mimeType: "image/jpeg", size: photo.fileSize || 0 }]);
    }
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const toggleClass = (cls) => setClasses((prev) => prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]);

  const uploadNotes = async () => {
    if (!unitNumber || !unit || !topic || classes.length === 0 || files.length === 0) {
      Alert.alert("Missing Fields", "Please fill all required fields and upload at least one file"); return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("unitNumber", unitNumber);
      formData.append("unit", unit);
      formData.append("topic", topic);
      formData.append("classes", JSON.stringify(classes));
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        formData.append("files", { uri: file.uri, name: file.name || `file-${i}`, type: file.mimeType || file.type || "application/octet-stream" });
      }
      const token = await AsyncStorage.getItem("token");
      await API.post("/notes/add", formData, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
      Alert.alert("Success", "Notes uploaded successfully", [{ text: "OK", onPress: () => router.back() }]);
      setUnitNumber(""); setUnit(""); setTopic(""); setClasses([]); setFiles([]);
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Upload failed");
    } finally { setLoading(false); }
  };

  // ── file list (shared between mobile & web) ──────────────────
  const fileList = files.length > 0 && (
    <View style={isWeb ? webStyles.fileListContainer : mobileStyles.fileListContainer}>
      <Text style={isWeb ? webStyles.fileListTitle : mobileStyles.fileListTitle}>
        Uploaded Files ({files.length})
      </Text>
      {files.map((file, index) => {
        const { icon, color } = getFileIcon(file.name);
        return (
          <View key={index} style={isWeb ? webStyles.fileItem : mobileStyles.fileItem}>
            <View style={[isWeb ? webStyles.fileIconCircle : mobileStyles.fileIconCircle, { backgroundColor: `${color}15` }]}>
              <Ionicons name={icon} size={18} color={color} />
            </View>
            <View style={isWeb ? webStyles.fileInfo : mobileStyles.fileInfo}>
              <Text style={isWeb ? webStyles.fileName : mobileStyles.fileName} numberOfLines={1}>{file.name}</Text>
              <Text style={isWeb ? webStyles.fileSize : mobileStyles.fileSize}>{((file.size || 0) / 1024).toFixed(1)} KB</Text>
            </View>
            <TouchableOpacity onPress={() => removeFile(index)}>
              <Ionicons name="close-circle" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  // ── MOBILE ───────────────────────────────────────────────────
  if (!isWeb) {
    return (
      <ScrollView style={mobileStyles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#3b82f6","#2563eb"]} style={mobileStyles.headerGradient}>
          <Ionicons name="cloud-upload" size={48} color="#fff" />
          <Text style={mobileStyles.headerTitle}>Upload Notes</Text>
          <Text style={mobileStyles.headerSub}>Share study materials with your students</Text>
        </LinearGradient>

        <View style={mobileStyles.formContainer}>
          <View style={mobileStyles.inputGroup}>
            <Text style={mobileStyles.label}>Unit Number <Text style={mobileStyles.required}>*</Text></Text>
            <View style={mobileStyles.inputWrapper}>
              <TextInput style={mobileStyles.input} placeholder="e.g. 1, 2, 3" keyboardType="numeric" value={unitNumber} onChangeText={setUnitNumber} placeholderTextColor="#94a3b8" />
            </View>
          </View>

          <View style={mobileStyles.inputGroup}>
            <Text style={mobileStyles.label}>Unit Name <Text style={mobileStyles.required}>*</Text></Text>
            <View style={mobileStyles.inputWrapper}>
              <TextInput style={mobileStyles.input} placeholder="Enter unit name" value={unit} onChangeText={setUnit} placeholderTextColor="#94a3b8" />
            </View>
          </View>

          <View style={mobileStyles.inputGroup}>
            <Text style={mobileStyles.label}>Topic <Text style={mobileStyles.required}>*</Text></Text>
            <View style={mobileStyles.inputWrapper}>
              <TextInput style={mobileStyles.input} placeholder="Enter topic" value={topic} onChangeText={setTopic} placeholderTextColor="#94a3b8" />
            </View>
          </View>

          <View style={mobileStyles.inputGroup}>
            <Text style={mobileStyles.label}>Select Classes <Text style={mobileStyles.required}>*</Text></Text>
            <View style={mobileStyles.classRow}>
              {CLASS_OPTIONS.map((cls) => (
                <TouchableOpacity key={cls} onPress={() => toggleClass(cls)}
                  style={[mobileStyles.classBtn, classes.includes(cls) && mobileStyles.classActive]}>
                  {classes.includes(cls) && <Ionicons name="checkmark-circle" size={15} color="#fff" style={{ marginRight: 4 }} />}
                  <Text style={[mobileStyles.classText, classes.includes(cls) && mobileStyles.classTextActive]}>{cls}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={mobileStyles.inputGroup}>
            <Text style={mobileStyles.label}>Upload Files <Text style={mobileStyles.required}>*</Text></Text>
            <View style={mobileStyles.uploadButtons}>
              <TouchableOpacity style={mobileStyles.uploadBtn} onPress={pickFiles}>
                <View style={[mobileStyles.uploadIconCircle, { backgroundColor: "#eff6ff" }]}>
                  <Ionicons name="cloud-upload-outline" size={22} color="#3b82f6" />
                </View>
                <Text style={mobileStyles.uploadBtnText}>Choose Files</Text>
              </TouchableOpacity>
              <TouchableOpacity style={mobileStyles.uploadBtn} onPress={takePhoto}>
                <View style={[mobileStyles.uploadIconCircle, { backgroundColor: "#f0fdf4" }]}>
                  <Ionicons name="camera-outline" size={22} color="#22c55e" />
                </View>
                <Text style={mobileStyles.uploadBtnText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {fileList}

          <TouchableOpacity style={[mobileStyles.submitBtn, loading && { opacity: 0.6 }]} onPress={uploadNotes} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={mobileStyles.submitText}>Publish Notes</Text></>
            )}
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ── WEB ──────────────────────────────────────────────────────
  return (
    <ScrollView style={webStyles.root} contentContainerStyle={webStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={webStyles.inner}>

        <View style={webStyles.pageHeader}>
          <View>
            <Text style={webStyles.pageTitle}>Upload Notes</Text>
            <Text style={webStyles.pageSubtitle}>Share study materials with your students</Text>
          </View>
          <View style={webStyles.headerIconBox}>
            <Ionicons name="cloud-upload-outline" size={26} color="#3b82f6" />
          </View>
        </View>

        <View style={webStyles.formCard}>

          {/* Unit Number + Unit Name */}
          <View style={isWideScreen ? webStyles.twoFieldRow : null}>
            <View style={isWideScreen ? { flex: 1, marginRight: 16 } : null}>
              <WebField label="Unit Number" required icon="layers-outline"
                value={unitNumber} onChangeText={setUnitNumber} placeholder="e.g. 1, 2, 3" keyboardType="numeric" />
            </View>
            <View style={isWideScreen ? { flex: 1 } : null}>
              <WebField label="Unit Name" required icon="book-outline"
                value={unit} onChangeText={setUnit} placeholder="Enter unit name" />
            </View>
          </View>

          {/* Topic */}
          <WebField label="Topic" required icon="text-outline"
            value={topic} onChangeText={setTopic} placeholder="Enter topic" />

          {/* Classes */}
          <View style={webStyles.fieldGroup}>
            <Text style={webStyles.label}>Select Classes <Text style={webStyles.req}>*</Text></Text>
            <View style={webStyles.classRow}>
              {CLASS_OPTIONS.map((cls) => (
                <TouchableOpacity key={cls} onPress={() => toggleClass(cls)}
                  style={[webStyles.classBtn, classes.includes(cls) && webStyles.classActive]}>
                  {classes.includes(cls) && <Ionicons name="checkmark-circle" size={15} color="#fff" style={{ marginRight: 4 }} />}
                  <Text style={[webStyles.classText, classes.includes(cls) && webStyles.classTextActive]}>{cls}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Upload */}
          <View style={webStyles.fieldGroup}>
            <Text style={webStyles.label}>Upload Files <Text style={webStyles.req}>*</Text></Text>
            <View style={webStyles.uploadRow}>
              <TouchableOpacity style={webStyles.uploadBtn} onPress={pickFiles}>
                <View style={[webStyles.uploadIconBox, { backgroundColor: "#eff6ff" }]}>
                  <Ionicons name="cloud-upload-outline" size={22} color="#3b82f6" />
                </View>
                <Text style={webStyles.uploadBtnText}>Choose Files</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.uploadBtn} onPress={takePhoto}>
                <View style={[webStyles.uploadIconBox, { backgroundColor: "#f0fdf4" }]}>
                  <Ionicons name="camera-outline" size={22} color="#22c55e" />
                </View>
                <Text style={webStyles.uploadBtnText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {fileList}

          <TouchableOpacity style={[webStyles.submitBtn, loading && { opacity: 0.6 }]} onPress={uploadNotes} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={webStyles.submitBtnText}>Publish Notes</Text></>
            )}
          </TouchableOpacity>

        </View>

        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mobileStyles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#f8fafc" },
  headerGradient:  { paddingTop: 40, paddingBottom: 30, paddingHorizontal: 20, alignItems: "center", borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle:     { fontSize: 26, fontWeight: "700", color: "#fff", marginTop: 12 },
  headerSub:       { fontSize: 14, color: "#bfdbfe", marginTop: 4 },
  formContainer:   { padding: 20 },
  inputGroup:      { marginBottom: 20 },
  label:           { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 },
  required:        { color: "#ef4444" },
  inputWrapper:    { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 14 },
  input:           { flex: 1, paddingVertical: 14, fontSize: 15, color: "#1e293b" },
  classRow:        { flexDirection: "row", gap: 10 },
  classBtn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: "#fff", borderWidth: 2, borderColor: "#e2e8f0" },
  classActive:     { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  classText:       { fontSize: 14, fontWeight: "600", color: "#64748b" },
  classTextActive: { color: "#fff" },
  uploadButtons:   { flexDirection: "row", gap: 12 },
  uploadBtn:       { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  uploadIconCircle:{ width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  uploadBtnText:   { fontSize: 13, fontWeight: "600", color: "#475569" },
  fileListContainer:{ backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 8 },
  fileListTitle:   { fontSize: 14, fontWeight: "700", color: "#1e293b", marginBottom: 12 },
  fileItem:        { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  fileIconCircle:  { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center", marginRight: 12 },
  fileInfo:        { flex: 1 },
  fileName:        { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  fileSize:        { fontSize: 12, color: "#94a3b8" },
  submitBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#3b82f6", borderRadius: 16, paddingVertical: 16, marginTop: 8 },
  submitText:      { fontSize: 16, fontWeight: "700", color: "#fff" },
});

const webStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 800 },
  pageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  pageTitle:   { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle:{ fontSize: 14, color: "#64748b", marginTop: 4 },
  headerIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#bfdbfe" },
  formCard:    { backgroundColor: "#fff", borderRadius: 20, padding: 32, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 14, elevation: 4, marginBottom: 16 },
  twoFieldRow: { flexDirection: "row" },
  fieldGroup:  { marginBottom: 20 },
  label:       { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 },
  req:         { color: "#ef4444" },
  inputWrap:        { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: "#f8fafc" },
  inputWrapFocused: { borderColor: "#3b82f6", backgroundColor: "#fff", shadowColor: "#3b82f6", shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  input:            { flex: 1, fontSize: 15, color: "#0f172a", marginLeft: 10, outlineStyle: "none", outlineWidth: 0 },
  classRow:    { flexDirection: "row", gap: 12 },
  classBtn:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: "#f8fafc", borderWidth: 2, borderColor: "#e2e8f0" },
  classActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  classText:   { fontSize: 14, fontWeight: "600", color: "#64748b" },
  classTextActive: { color: "#fff" },
  uploadRow:   { flexDirection: "row", gap: 16 },
  uploadBtn:   { flex: 1, backgroundColor: "#f8fafc", borderRadius: 14, padding: 18, alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0" },
  uploadIconBox: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  uploadBtnText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  fileListContainer: { backgroundColor: "#f8fafc", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 8 },
  fileListTitle:     { fontSize: 14, fontWeight: "700", color: "#1e293b", marginBottom: 12 },
  fileItem:    { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  fileIconCircle:{ width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center", marginRight: 12 },
  fileInfo:    { flex: 1 },
  fileName:    { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  fileSize:    { fontSize: 12, color: "#94a3b8" },
  submitBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#3b82f6", borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});