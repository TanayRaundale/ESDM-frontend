import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

// ✅ FIXED: use /legacy — the regular import silently fails on newer Expo
import * as FileSystem from "expo-file-system/legacy";

import { createAssignment } from "../../src/services/assignmentApi";

const CLASS_LIST = ["SY9", "SY10", "SY11"];
const CLASS_COLORS = {
  SY9:  { selBg: "#1d4ed8", selText: "#fff" },
  SY10: { selBg: "#065f46", selText: "#fff" },
  SY11: { selBg: "#5b21b6", selText: "#fff" },
};

const getFileIcon = (mimeType = "") => {
  if (mimeType.startsWith("image/"))                            return "image-outline";
  if (mimeType === "application/pdf")                           return "document-text-outline";
  if (mimeType.includes("word"))                                return "document-outline";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "grid-outline";
  return "attach-outline";
};

const formatDateDisplay = (date) => {
  const dd   = String(date.getDate()).padStart(2, "0");
  const mm   = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// ✅ Read file as base64 with proper error logging
const readFileAsBase64 = async (uri) => {
  try {
    // Ensure the file exists before reading
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      console.warn("File does not exist:", uri);
      return "";
    }
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log("Read base64 success, length:", b64.length);
    return b64;
  } catch (err) {
    console.error("readFileAsBase64 failed:", err);
    return "";
  }
};

export default function CreateAssignmentScreen() {
  const router = useRouter();
  const [submitting, setSubmitting]       = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDateValue, setDueDateValue]   = useState(null);
  const [form, setForm] = useState({
    unitTitle: "",
    assignmentTitle: "",
    description: "",
    dueDate: "",
    totalMarks: "",
  });
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [attachments, setAttachments]         = useState([]);

  const toggleClass = (cls) =>
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const picked = result.assets.map((f) => ({
        name:     f.name,
        mimeType: f.mimeType || "application/octet-stream",
        uri:      f.uri,
        isImage:  false,
        base64:   null, // will be read on submit
      }));
      setAttachments((prev) => [...prev, ...picked]);
    } catch (err) {
      console.error("pickFiles error:", err);
      Alert.alert("Error", "Could not pick files");
    }
  };

  const openCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission Denied", "Camera access is required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled) {
      const asset = result.assets[0];
      setAttachments((prev) => [
        ...prev,
        {
          name:     `photo_${Date.now()}.jpg`,
          mimeType: "image/jpeg",
          uri:      asset.uri,
          base64:   asset.base64, // ✅ camera already provides base64
          isImage:  true,
        },
      ]);
    }
  };

  const pickFromGallery = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission Denied", "Gallery access is required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      const picked = result.assets.map((asset) => ({
        name:     `image_${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
        uri:      asset.uri,
        base64:   asset.base64, // ✅ gallery also provides base64
        isImage:  true,
      }));
      setAttachments((prev) => [...prev, ...picked]);
    }
  };

  const removeAttachment = (i) =>
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));

  const onDueDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event?.type === "dismissed" || !selectedDate) return;
    setDueDateValue(selectedDate);
    setForm((prev) => ({ ...prev, dueDate: formatDateDisplay(selectedDate) }));
  };

  const handleCreate = async () => {
    const { unitTitle, assignmentTitle, dueDate, totalMarks } = form;
    if (!unitTitle.trim() || !assignmentTitle.trim() || !dueDate.trim() || !totalMarks) {
      Alert.alert("Missing Fields", "Please fill all required (*) fields");
      return;
    }
    if (!selectedClasses.length) {
      Alert.alert("Missing Fields", "Please select at least one class");
      return;
    }
    if (!dueDateValue) {
      Alert.alert("Missing Fields", "Please select due date from calendar");
      return;
    }

    try {
      setSubmitting(true);

      // ✅ Process attachments — read base64 from URI for document picker files
      const processed = await Promise.all(
        attachments.map(async (f) => {
          // Camera / gallery photos already have base64
          if (f.base64 && f.base64.length > 10) {
            console.log(`Using pre-loaded base64 for: ${f.name}`);
            return { name: f.name, mimeType: f.mimeType, data: f.base64 };
          }

          // Document picker files — read from URI
          if (f.uri) {
            console.log(`Reading base64 from URI for: ${f.name}`);
            const b64 = await readFileAsBase64(f.uri);
            if (!b64 || b64.length < 10) {
              console.warn(`Empty base64 for file: ${f.name}`);
              Alert.alert(
                "File Warning",
                `Could not read "${f.name}". It may not have been attached properly.`
              );
            }
            return { name: f.name, mimeType: f.mimeType, data: b64 };
          }

          return { name: f.name, mimeType: f.mimeType, data: "" };
        })
      );

      // Log for debugging
      processed.forEach((f) => {
        console.log(`Processed: ${f.name} | mimeType: ${f.mimeType} | data length: ${f.data?.length}`);
      });

      await createAssignment({
        unitTitle:        form.unitTitle.trim(),
        assignmentTitle:  form.assignmentTitle.trim(),
        description:      form.description.trim(),
        dueDate:          dueDateValue.toISOString(),
        totalMarks:       Number(form.totalMarks),
        classes:          selectedClasses,
        attachments:      processed,
      });

      Alert.alert("Success ✅", "Assignment created successfully", [
        { text: "OK", onPress: () => router.replace("/(teacher)/add-assignment") },
      ]);
    } catch (err) {
      console.error("Create assignment error:", err);
      Alert.alert("Error", err?.response?.data?.message ?? "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Create Assignment</Text>

        {/* Unit Title */}
        <Text style={styles.label}>Unit Title <Text style={styles.req}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Unit 3 - Sensors"
          value={form.unitTitle}
          onChangeText={(v) => setForm((p) => ({ ...p, unitTitle: v }))}
        />

        {/* Assignment Title */}
        <Text style={styles.label}>Assignment Title <Text style={styles.req}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Sensor Data Logger"
          value={form.assignmentTitle}
          onChangeText={(v) => setForm((p) => ({ ...p, assignmentTitle: v }))}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Instructions, requirements, references..."
          value={form.description}
          onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Due Date */}
        <Text style={styles.label}>Due Date <Text style={styles.req}>*</Text></Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
          <View style={styles.dueDateRow}>
            <Ionicons name="calendar-outline" size={18} color="#64748b" />
            <Text style={[styles.dueDateText, !form.dueDate && styles.dueDatePlaceholder]}>
              {form.dueDate || "Select due date"}
            </Text>
          </View>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dueDateValue || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()}
            onChange={onDueDateChange}
          />
        )}

        {/* Total Marks */}
        <Text style={styles.label}>Total Marks <Text style={styles.req}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 20"
          value={form.totalMarks}
          onChangeText={(v) => setForm((p) => ({ ...p, totalMarks: v }))}
          keyboardType="numeric"
        />

        {/* Class Selector */}
        <Text style={styles.label}>Assign to Class <Text style={styles.req}>*</Text></Text>
        <View style={styles.classRow}>
          {CLASS_LIST.map((cls) => {
            const active = selectedClasses.includes(cls);
            const c = CLASS_COLORS[cls];
            return (
              <TouchableOpacity
                key={cls}
                style={[styles.classChip, { borderColor: c.selBg }, active && { backgroundColor: c.selBg }]}
                onPress={() => toggleClass(cls)}
              >
                <Text style={[styles.classChipText, { color: active ? c.selText : c.selBg }]}>{cls}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Attachments */}
        <Text style={styles.label}>Attachments</Text>
        <View style={styles.attachRow}>
          <TouchableOpacity style={styles.attachBtn} onPress={pickFiles}>
            <Ionicons name="document-attach-outline" size={17} color="#0f172a" />
            <Text style={styles.attachBtnText}>Files</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachBtn} onPress={pickFromGallery}>
            <Ionicons name="images-outline" size={17} color="#0f172a" />
            <Text style={styles.attachBtnText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachBtn} onPress={openCamera}>
            <Ionicons name="camera-outline" size={17} color="#0f172a" />
            <Text style={styles.attachBtnText}>Camera</Text>
          </TouchableOpacity>
        </View>

        {/* File list */}
        {attachments.length > 0 && (
          <View style={styles.fileList}>
            {attachments.map((f, i) => (
              <View key={i} style={styles.fileChip}>
                {f.isImage && (f.base64 || f.uri) ? (
                  <Image
                    source={{ uri: f.base64 ? `data:image/jpeg;base64,${f.base64}` : f.uri }}
                    style={styles.fileThumb}
                  />
                ) : (
                  <Ionicons name={getFileIcon(f.mimeType)} size={15} color="#1d4ed8" />
                )}
                <Text style={styles.fileChipName} numberOfLines={1}>{f.name}</Text>
                {/* ✅ Show if base64 is ready */}
                {f.base64 && f.base64.length > 10 && (
                  <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
                )}
                <TouchableOpacity onPress={() => removeAttachment(i)}>
                  <Ionicons name="close-circle" size={17} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.createBtn, submitting && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={submitting}
        >
          {submitting ? (
            <View style={styles.submitRow}>
              <ActivityIndicator color="#fff" />
              <Text style={[styles.createBtnText, { marginLeft: 8 }]}>Uploading...</Text>
            </View>
          ) : (
            <Text style={styles.createBtnText}>Create Assignment</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 28 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content:   { padding: 16, paddingBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 14 },

  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6, marginTop: 14 },
  req:   { color: "#ef4444" },

  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    color: "#0f172a",
  },
  dueDateRow: { flexDirection: "row", alignItems: "center" },
  dueDateText: { fontSize: 14, color: "#0f172a", marginLeft: 8 },
  dueDatePlaceholder: { color: "#94a3b8" },
  textArea: { height: 100, textAlignVertical: "top" },

  classRow: { flexDirection: "row", marginTop: 2 },
  classChip: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20, borderWidth: 2,
    backgroundColor: "#fff", marginRight: 10,
  },
  classChipText: { fontSize: 14, fontWeight: "700" },

  attachRow: { flexDirection: "row", marginTop: 4 },
  attachBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0",
    marginRight: 8,
  },
  attachBtnText: { fontSize: 13, fontWeight: "600", color: "#0f172a", marginLeft: 5 },

  fileList: { marginTop: 10 },
  fileChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#eff6ff", borderRadius: 8,
    padding: 8, borderWidth: 1, borderColor: "#bfdbfe",
    marginBottom: 6,
  },
  fileChipName: { flex: 1, fontSize: 12, color: "#1d4ed8", marginLeft: 6 },
  fileThumb:    { width: 28, height: 28, borderRadius: 4 },

  createBtn: {
    backgroundColor: "#0f172a", borderRadius: 12,
    paddingVertical: 15, alignItems: "center", marginTop: 24,
  },
  createBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  submitRow:     { flexDirection: "row", alignItems: "center" },
});