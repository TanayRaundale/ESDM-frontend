import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Image, Platform, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { createTeacherDiagram } from "../../src/services/diagramApi";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const BATCH_OPTIONS = ["SY9", "SY10", "SY11", "All"];

const initialLinks = {
  drawio:     "https://app.diagrams.net/",
  creately:   "https://creately.com/diagram-type/uml/",
  lucidchart: "https://www.lucidchart.com/pages/",
};

function WebInput({ label, required, icon, value, onChangeText, placeholder, focusKey, focusedField, setFocusedField }) {
  const focused = focusedField === focusKey;
  return (
    <View style={cdStyles.fieldGroup}>
      <Text style={cdStyles.label}>{label}{required && <Text style={cdStyles.req}> *</Text>}</Text>
      <View style={[cdStyles.inputWrap, focused && cdStyles.inputWrapFocused]}>
        {icon && <Ionicons name={icon} size={17} color={focused ? "#1d4ed8" : "#94a3b8"} />}
        <TextInput
          style={cdStyles.input}
          placeholder={placeholder || `Enter ${label}`}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          onFocus={() => setFocusedField(focusKey)}
          onBlur={() => setFocusedField(null)}
        />
      </View>
    </View>
  );
}

export default function CreateDiagram() {
  const router = useRouter();
  const [title, setTitle]           = useState("");
  const [subject, setSubject]       = useState("");
  const [description, setDescription] = useState("");
  const [targetBatch, setTargetBatch] = useState("All");
  const [links, setLinks]           = useState(initialLinks);
  const [imageData, setImageData]   = useState("");
  const [imageMimeType, setImageMimeType] = useState("image/jpeg");
  const [saving, setSaving]         = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Permission Needed", "Allow gallery access to upload diagram image"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8, base64: true });
    if (!result.canceled) {
      setImageData(result.assets[0].base64 || "");
      setImageMimeType(result.assets[0].mimeType || "image/jpeg");
    }
  };

  const onCreate = async () => {
    if (!title.trim() || !subject.trim() || !imageData) { Alert.alert("Missing Fields", "Title, subject and image are required."); return; }
    try {
      setSaving(true);
      await createTeacherDiagram({ title: title.trim(), subject: subject.trim(), description: description.trim(), imageData, imageMimeType, targetBatch, practiceLinks: links });
      Alert.alert("Success", "Diagram uploaded successfully.", [{ text: "OK", onPress: () => router.replace("/(teacher)/diagrams") }]);
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.message || "Unable to upload diagram");
    } finally { setSaving(false); }
  };

  if (!isWeb) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc" }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <Text style={mStyles.title}>Add Diagram</Text>
        <Text style={mStyles.subtitle}>Upload diagram details and practice links for students.</Text>
        <Text style={mStyles.label}>Diagram Title</Text>
        <TextInput style={mStyles.input} placeholder="e.g. UML Class Diagram" value={title} onChangeText={setTitle} />
        <Text style={mStyles.label}>Subject</Text>
        <TextInput style={mStyles.input} placeholder="e.g. Software Engineering" value={subject} onChangeText={setSubject} />
        <Text style={mStyles.label}>Description</Text>
        <TextInput style={[mStyles.input, { minHeight: 90, textAlignVertical: "top" }]} placeholder="Key points or exercise steps" multiline value={description} onChangeText={setDescription} />
        <Text style={mStyles.label}>Target Batch</Text>
        <View style={mStyles.batchRow}>
          {BATCH_OPTIONS.map((b) => (
            <TouchableOpacity key={b} style={[mStyles.batchChip, targetBatch === b && mStyles.batchChipActive]} onPress={() => setTargetBatch(b)}>
              <Text style={[mStyles.batchText, targetBatch === b && mStyles.batchTextActive]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={mStyles.label}>Diagram Image</Text>
        <TouchableOpacity style={mStyles.imagePicker} onPress={pickImage}>
          <Ionicons name="image-outline" size={20} color="#1d4ed8" />
          <Text style={mStyles.imagePickerText}>{imageData ? "Change Image" : "Choose Diagram Image"}</Text>
        </TouchableOpacity>
        {!!imageData && <Image source={{ uri: `data:${imageMimeType};base64,${imageData}` }} style={mStyles.previewImage} resizeMode="cover" />}
        <Text style={mStyles.label}>Draw.io Link</Text>
        <TextInput style={mStyles.input} autoCapitalize="none" value={links.drawio} onChangeText={(v) => setLinks((p) => ({ ...p, drawio: v }))} />
        <Text style={mStyles.label}>Creately Link</Text>
        <TextInput style={mStyles.input} autoCapitalize="none" value={links.creately} onChangeText={(v) => setLinks((p) => ({ ...p, creately: v }))} />
        <Text style={mStyles.label}>Lucidchart Link</Text>
        <TextInput style={mStyles.input} autoCapitalize="none" value={links.lucidchart} onChangeText={(v) => setLinks((p) => ({ ...p, lucidchart: v }))} />
        <TouchableOpacity style={[mStyles.btn, saving && { opacity: 0.7 }]} onPress={onCreate} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={mStyles.btnText}>Upload Diagram</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={cdStyles.root} contentContainerStyle={cdStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={cdStyles.inner}>

        <View style={cdStyles.pageHeader}>
          <View>
            <Text style={cdStyles.pageTitle}>Add Diagram</Text>
            <Text style={cdStyles.pageSubtitle}>Upload a diagram and set practice links for students</Text>
          </View>
          <View style={cdStyles.headerIconBox}>
            <Ionicons name="images-outline" size={26} color="#1d4ed8" />
          </View>
        </View>

        <View style={isWideScreen ? cdStyles.twoColLayout : cdStyles.oneColLayout}>

          {/* Left col */}
          <View style={[cdStyles.formCard, isWideScreen && { flex: 1, marginRight: 20 }]}>
            <View style={isWideScreen ? cdStyles.twoFieldRow : null}>
              <View style={isWideScreen ? { flex: 1, marginRight: 16 } : null}>
                <WebInput label="Diagram Title" required icon="images-outline" value={title} onChangeText={setTitle} placeholder="e.g. UML Class Diagram" focusKey="title" focusedField={focusedField} setFocusedField={setFocusedField} />
              </View>
              <View style={isWideScreen ? { flex: 1 } : null}>
                <WebInput label="Subject" required icon="school-outline" value={subject} onChangeText={setSubject} placeholder="e.g. Software Engineering" focusKey="subject" focusedField={focusedField} setFocusedField={setFocusedField} />
              </View>
            </View>

            <View style={cdStyles.fieldGroup}>
              <Text style={cdStyles.label}>Description</Text>
              <View style={[cdStyles.inputWrap, focusedField === "desc" && cdStyles.inputWrapFocused, { alignItems: "flex-start" }]}>
                <Ionicons name="document-text-outline" size={17} color={focusedField === "desc" ? "#1d4ed8" : "#94a3b8"} style={{ marginTop: 3 }} />
                <TextInput style={[cdStyles.input, { minHeight: 80, textAlignVertical: "top" }]}
                  placeholder="Key points or exercise steps..." placeholderTextColor="#94a3b8"
                  value={description} onChangeText={setDescription} multiline
                  onFocus={() => setFocusedField("desc")} onBlur={() => setFocusedField(null)} />
              </View>
            </View>

            {/* Batch */}
            <View style={cdStyles.fieldGroup}>
              <Text style={cdStyles.label}>Target Batch <Text style={cdStyles.req}>*</Text></Text>
              <View style={cdStyles.batchRow}>
                {BATCH_OPTIONS.map((b) => (
                  <TouchableOpacity key={b} style={[cdStyles.batchChip, targetBatch === b && cdStyles.batchChipActive]} onPress={() => setTargetBatch(b)}>
                    {targetBatch === b && <Ionicons name="checkmark-circle" size={15} color="#fff" style={{ marginRight: 4 }} />}
                    <Text style={[cdStyles.batchChipText, targetBatch === b && cdStyles.batchChipTextActive]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Image Upload */}
            <View style={cdStyles.fieldGroup}>
              <Text style={cdStyles.label}>Diagram Image <Text style={cdStyles.req}>*</Text></Text>
              <TouchableOpacity style={[cdStyles.imagePickerBtn, imageData && cdStyles.imagePickerBtnSuccess]} onPress={pickImage}>
                <View style={[cdStyles.imageIconBox, { backgroundColor: imageData ? "#eff6ff" : "#f1f5f9" }]}>
                  <Ionicons name={imageData ? "image" : "image-outline"} size={24} color={imageData ? "#1d4ed8" : "#94a3b8"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[cdStyles.imagePickerTitle, imageData && { color: "#1d4ed8" }]}>{imageData ? "Image Selected" : "Choose Diagram Image"}</Text>
                  <Text style={cdStyles.imagePickerSub}>{imageData ? "Tap to change image" : "PNG, JPG, JPEG supported"}</Text>
                </View>
                <Ionicons name={imageData ? "checkmark-circle" : "cloud-upload-outline"} size={20} color={imageData ? "#1d4ed8" : "#94a3b8"} />
              </TouchableOpacity>
              {!!imageData && (
                <Image source={{ uri: `data:${imageMimeType};base64,${imageData}` }} style={cdStyles.imagePreview} resizeMode="cover" />
              )}
            </View>
          </View>

          {/* Right col: practice links */}
          <View style={[cdStyles.formCard, isWideScreen && { flex: 1 }]}>
            <View style={cdStyles.sectionHeader}>
              <Ionicons name="link-outline" size={18} color="#1d4ed8" />
              <Text style={cdStyles.sectionTitle}>Practice Links</Text>
            </View>

            {[
              { key: "drawio",     label: "Draw.io",     icon: "color-wand-outline", color: "#f97316" },
              { key: "creately",   label: "Creately",    icon: "shapes-outline",     color: "#8b5cf6" },
              { key: "lucidchart", label: "Lucidchart",  icon: "git-network-outline",color: "#0ea5e9" },
            ].map(({ key, label, icon, color }) => {
              const focused = focusedField === key;
              return (
                <View key={key} style={cdStyles.fieldGroup}>
                  <View style={cdStyles.linkLabelRow}>
                    <View style={[cdStyles.linkIconBox, { backgroundColor: `${color}15` }]}>
                      <Ionicons name={icon} size={15} color={color} />
                    </View>
                    <Text style={cdStyles.label}>{label} URL</Text>
                  </View>
                  <View style={[cdStyles.inputWrap, focused && cdStyles.inputWrapFocused]}>
                    <Ionicons name="link-outline" size={17} color={focused ? "#1d4ed8" : "#94a3b8"} />
                    <TextInput
                      style={cdStyles.input}
                      value={links[key]}
                      onChangeText={(v) => setLinks((p) => ({ ...p, [key]: v }))}
                      autoCapitalize="none"
                      placeholderTextColor="#94a3b8"
                      onFocus={() => setFocusedField(key)}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              );
            })}

            <TouchableOpacity style={[cdStyles.submitBtn, saving && { opacity: 0.7 }]} onPress={onCreate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="cloud-upload-outline" size={18} color="#fff" /><Text style={cdStyles.submitBtnText}>Upload Diagram</Text></>}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={cdStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
    </ScrollView>
  );
}

const mStyles = StyleSheet.create({
  title:    { fontSize: 23, fontWeight: "800", color: "#0f172a" },
  subtitle: { marginTop: 5, color: "#64748b", marginBottom: 14 },
  label:    { marginTop: 10, marginBottom: 6, fontWeight: "700", color: "#334155" },
  input:    { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 12 },
  batchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  batchChip:{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "#e2e8f0" },
  batchChipActive: { backgroundColor: "#1d4ed8" },
  batchText:{ color: "#334155", fontWeight: "700" },
  batchTextActive: { color: "#fff" },
  imagePicker: { backgroundColor: "#eff6ff", borderRadius: 10, borderWidth: 1, borderColor: "#bfdbfe", paddingVertical: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  imagePickerText: { color: "#1d4ed8", fontWeight: "700" },
  previewImage: { width: "100%", height: 180, borderRadius: 12, marginTop: 10 },
  btn:      { backgroundColor: "#2563eb", borderRadius: 10, marginTop: 16, paddingVertical: 12, alignItems: "center" },
  btnText:  { color: "#fff", fontWeight: "800" },
});

const cdStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1100 },
  pageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  pageTitle:   { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle:{ fontSize: 14, color: "#64748b", marginTop: 4 },
  headerIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#dbeafe", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#bfdbfe" },
  twoColLayout:{ flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  oneColLayout:{ flexDirection: "column", marginBottom: 20 },
  twoFieldRow: { flexDirection: "row" },
  formCard:    { backgroundColor: "#fff", borderRadius: 20, padding: 28, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  sectionTitle:  { fontSize: 16, fontWeight: "700", color: "#0f172a", marginLeft: 8 },
  fieldGroup:  { marginBottom: 20 },
  label:       { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 },
  req:         { color: "#ef4444" },
  inputWrap:        { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: "#f8fafc" },
  inputWrapFocused: { borderColor: "#1d4ed8", backgroundColor: "#fff", shadowColor: "#1d4ed8", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  input:            { flex: 1, fontSize: 15, color: "#0f172a", marginLeft: 10, outlineStyle: "none", outlineWidth: 0 },
  batchRow:    { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  batchChip:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: "#f1f5f9", borderWidth: 1.5, borderColor: "#e2e8f0" },
  batchChipActive: { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8" },
  batchChipText:   { fontSize: 14, fontWeight: "700", color: "#475569" },
  batchChipTextActive: { color: "#fff" },
  imagePickerBtn:     { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 14, borderWidth: 1.5, borderColor: "#e2e8f0", padding: 16, gap: 14 },
  imagePickerBtnSuccess: { borderColor: "#bfdbfe", backgroundColor: "#eff6ff" },
  imageIconBox:       { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  imagePickerTitle:   { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  imagePickerSub:     { fontSize: 12, color: "#64748b", marginTop: 2 },
  imagePreview:       { width: "100%", height: 200, borderRadius: 14, marginTop: 14 },
  linkLabelRow:       { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  linkIconBox:        { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 },
  submitBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1d4ed8", borderRadius: 12, paddingVertical: 15, marginTop: 8 },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});