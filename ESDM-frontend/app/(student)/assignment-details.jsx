import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Dimensions,
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";

// ✅ Only import WebView on native
let WebView = null;
if (Platform.OS !== "web") {
  WebView = require("react-native-webview").WebView;
}

import { fetchStudentAssignmentById } from "../../src/services/assignmentApi";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const CLASS_COLORS = {
  SY9:  { bg: "#dbeafe", text: "#1d4ed8" },
  SY10: { bg: "#d1fae5", text: "#065f46" },
  SY11: { bg: "#ede9fe", text: "#5b21b6" },
};

// ─── Detect mime type from name if mimeType is generic ───
const guessMime = (file) => {
  const raw  = String(file?.mimeType || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();

  if (raw && raw !== "application/octet-stream") return raw;

  // Guess from file extension
  if (name.endsWith(".pdf"))  return "application/pdf";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png"))  return "image/png";
  if (name.endsWith(".gif"))  return "image/gif";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "application/msword";
  if (name.endsWith(".ppt") || name.endsWith(".pptx")) return "application/vnd.ms-powerpoint";
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "application/vnd.ms-excel";

  return raw || "application/octet-stream";
};

const getMimeInfo = (file) => {
  const m = guessMime(file);
  if (m.includes("pdf"))                                 return { icon: "document-text-outline", color: "#ef4444", bg: "#fef2f2", label: "PDF"   };
  if (m.startsWith("image/"))                            return { icon: "image-outline",          color: "#8b5cf6", bg: "#f5f3ff", label: "Image" };
  if (m.includes("word") || m.includes("msword"))        return { icon: "document-outline",       color: "#2563eb", bg: "#eff6ff", label: "Word"  };
  if (m.includes("spreadsheet") || m.includes("excel"))  return { icon: "grid-outline",           color: "#16a34a", bg: "#f0fdf4", label: "Excel" };
  if (m.includes("presentation") || m.includes("powerpoint")) return { icon: "easel-outline",    color: "#f59e0b", bg: "#fffbeb", label: "PPT"   };
  return                                                        { icon: "attach-outline",          color: "#64748b", bg: "#f8fafc", label: "File"  };
};

export default function StudentAssignmentDetails() {
  const { id } = useLocalSearchParams();
  const [assignment, setAssignment]             = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [downloadingIndex, setDownloadingIndex] = useState(-1);
  const [previewVisible, setPreviewVisible]     = useState(false);
  const [previewFile, setPreviewFile]           = useState(null);
  const [previewTitle, setPreviewTitle]         = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchStudentAssignmentById(id);
        setAssignment(data);
      } catch (error) {
        Alert.alert("Error", error?.response?.data?.message || "Failed to load assignment details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ─── Build preview URI ───
  const getPreviewUri = (file) => {
    const mime = guessMime(file);
    if (file?.data && String(file.data).length > 10) {
      return `data:${mime};base64,${file.data}`;
    }
    if (file?.fileUrl) return file.fileUrl;
    return null;
  };

  // ─── Open preview — ALWAYS show for any file ───
  const openPreview = (file, index) => {
    const mime  = guessMime(file);
    const isPdf   = mime.includes("pdf");
    const isImage = mime.startsWith("image/");
    const uri     = getPreviewUri(file);

    // No content at all
    if (!uri) {
      Alert.alert(
        "No Content",
        "This file has no previewable content. The teacher may not have uploaded the actual file data."
      );
      return;
    }

    // Web — open in new tab
    if (isWeb) {
      if (uri.startsWith("data:") && (isPdf || isImage)) {
        try {
          const b64   = uri.split(",")[1];
          const chars = atob(b64);
          const bytes = new Uint8Array(chars.length);
          for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
          const blob  = new Blob([bytes], { type: mime });
          const url   = URL.createObjectURL(blob);
          window.open(url, "_blank");
          setTimeout(() => URL.revokeObjectURL(url), 30000);
        } catch {
          window.open(uri, "_blank");
        }
        return;
      }

      if (uri.startsWith("http")) {
        // For non-pdf/image URLs use Google Docs viewer
        if (!isPdf && !isImage) {
          window.open(`https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(uri)}`, "_blank");
        } else {
          window.open(uri, "_blank");
        }
        return;
      }

      // Fallback — try direct open
      window.open(uri, "_blank");
      return;
    }

    // Mobile — open in modal
    setPreviewTitle(file?.name || `File ${index + 1}`);
    setPreviewFile(file);
    setPreviewVisible(true);
  };

  // ─── Download ───
  const downloadFile = async (file, index) => {
    try {
      setDownloadingIndex(index);
      const mime = guessMime(file);
      const ext  = mime.includes("pdf") ? "pdf"
                 : mime.includes("word") || mime.includes("msword") ? "docx"
                 : mime.includes("presentation") || mime.includes("powerpoint") ? "pptx"
                 : mime.includes("spreadsheet") || mime.includes("excel") ? "xlsx"
                 : mime.startsWith("image/jpeg") ? "jpg"
                 : mime.startsWith("image/png") ? "png"
                 : "bin";
      const base = String(file?.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
      const name = base.includes(".") ? base : `${base}.${ext}`;

      if (isWeb) {
        const trigger = (blob) => {
          const url = URL.createObjectURL(blob);
          const a   = document.createElement("a");
          a.href = url; a.download = name;
          document.body.appendChild(a); a.click();
          document.body.removeChild(a); URL.revokeObjectURL(url);
        };

        if (file?.data && String(file.data).length > 10) {
          const chars = atob(String(file.data).replace(/\s/g, ""));
          const bytes = new Uint8Array(chars.length);
          for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
          trigger(new Blob([bytes], { type: mime }));
        } else if (file?.fileUrl) {
          const res = await fetch(file.fileUrl);
          if (!res.ok) throw new Error("Fetch failed");
          trigger(await res.blob());
        } else {
          throw new Error("No file content available");
        }
        Alert.alert("Downloaded", "File download started in your browser");
        return;
      }

      const dir  = `${FileSystem.documentDirectory}assignments/`;
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const path = `${dir}${Date.now()}_${name}`;

      if (file?.data && String(file.data).length > 10) {
        await FileSystem.writeAsStringAsync(path, file.data, { encoding: FileSystem.EncodingType.Base64 });
      } else if (file?.fileUrl) {
        await FileSystem.downloadAsync(file.fileUrl, path);
      } else {
        throw new Error("No file content available");
      }
      Alert.alert("Downloaded", "Saved to app storage");
    } catch (err) {
      Alert.alert("Download Failed", err?.message || "Unable to save file");
    } finally {
      setDownloadingIndex(-1);
    }
  };

  if (loading) {
    return <View style={shared.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  if (!assignment) {
    return (
      <View style={shared.centered}>
        <Ionicons name="alert-circle-outline" size={54} color="#ef4444" />
        <Text style={shared.errorText}>Assignment not found</Text>
      </View>
    );
  }

  const dueDate     = new Date(assignment.dueDate);
  const isOverdue   = dueDate < new Date();
  const attachments = assignment.attachments || [];

  // ─── MOBILE PREVIEW MODAL ───
  const MobilePreviewModal = () => {
    if (!previewFile) return null;
    const mime    = guessMime(previewFile);
    const isImage = mime.startsWith("image/");
    const isPdf   = mime.includes("pdf");
    const uri     = getPreviewUri(previewFile);

    return (
      <Modal visible={previewVisible} animationType="slide" onRequestClose={() => setPreviewVisible(false)}>
        <View style={mobileStyles.previewContainer}>
          {/* Header */}
          <View style={mobileStyles.previewHeader}>
            <TouchableOpacity onPress={() => setPreviewVisible(false)} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
            </TouchableOpacity>
            <Text style={mobileStyles.previewTitle} numberOfLines={1}>{previewTitle}</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* ✅ Image — use RN Image (reliable for base64) */}
          {isImage && uri ? (
            <ScrollView
              style={{ flex: 1, backgroundColor: "#0f172a" }}
              contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 16 }}
            >
              <Image
                source={{ uri }}
                style={{ width: width - 32, height: (width - 32) * 1.3 }}
                resizeMode="contain"
              />
            </ScrollView>

          /* ✅ PDF — WebView with HTML embed wrapper */
          ) : isPdf && uri && WebView ? (
            <WebView
              style={{ flex: 1 }}
              originWhitelist={["*"]}
              source={
                uri.startsWith("data:")
                  ? {
                      html: `<!DOCTYPE html><html><head>
                        <meta name="viewport" content="width=device-width,initial-scale=1">
                        <style>*{margin:0;padding:0}body{background:#1e293b;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center}embed{width:100%;height:100%}</style>
                        </head><body><embed src="${uri}" type="application/pdf" width="100%" height="100%"/></body></html>`,
                    }
                  : { uri }
              }
              startInLoadingState
              renderLoading={() => (
                <View style={shared.centered}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={{ marginTop: 10, color: "#64748b" }}>Loading PDF...</Text>
                </View>
              )}
              onError={() => {
                setPreviewVisible(false);
                Alert.alert("Preview Failed", "Could not render this PDF. Please download it instead.");
              }}
            />

          /* ✅ Other file types — Google Docs viewer via WebView */
          ) : uri && WebView && !uri.startsWith("data:") ? (
            <WebView
              style={{ flex: 1 }}
              source={{ uri: `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(uri)}` }}
              startInLoadingState
              renderLoading={() => (
                <View style={shared.centered}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={{ marginTop: 10, color: "#64748b" }}>Loading preview...</Text>
                </View>
              )}
            />

          /* No preview available */
          ) : (
            <View style={shared.centered}>
              <Ionicons name="document-outline" size={56} color="#cbd5e1" />
              <Text style={{ marginTop: 12, color: "#475569", fontSize: 16, fontWeight: "700" }}>
                Preview Not Available
              </Text>
              <Text style={{ marginTop: 6, color: "#94a3b8", fontSize: 13, textAlign: "center", paddingHorizontal: 32 }}>
                This file type cannot be previewed inline.{"\n"}Please use the Download button.
              </Text>
            </View>
          )}
        </View>
      </Modal>
    );
  };

  // ─── ATTACHMENT ROW ───
  const AttachmentRow = ({ file, index, webMode }) => {
    const { icon, color, bg, label } = getMimeInfo(file);
    const hasContent = (file?.data && String(file.data).length > 10) || !!file?.fileUrl;

    return (
      <View style={webMode ? webStyles.fileRow : mobileStyles.fileRow}>
        {/* Icon */}
        <View style={[webMode ? webStyles.fileIconBox : mobileStyles.fileIconBox, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={webMode ? 22 : 18} color={color} />
        </View>

        {/* Name + type */}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={webMode ? webStyles.fileName : mobileStyles.fileName} numberOfLines={1}>
            {file.name || `File ${index + 1}`}
          </Text>
          <Text style={webMode ? webStyles.fileLabel : mobileStyles.fileLabel}>{label}</Text>
        </View>

        {/* ✅ ALWAYS show View button if there's any content */}
        {hasContent && (
          <TouchableOpacity
            style={webMode ? webStyles.viewBtn : mobileStyles.viewBtn}
            onPress={() => openPreview(file, index)}
          >
            <Ionicons name="eye-outline" size={15} color="#2563eb" />
            <Text style={webMode ? webStyles.viewBtnText : mobileStyles.viewBtnText}>
              {isWeb ? "Open" : "View"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Download button */}
        {hasContent && (
          <TouchableOpacity
            style={webMode ? webStyles.downloadBtn : mobileStyles.downloadBtn}
            onPress={() => downloadFile(file, index)}
            disabled={downloadingIndex === index}
          >
            {downloadingIndex === index
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Ionicons name="download-outline" size={15} color="#fff" />
                  <Text style={webMode ? webStyles.downloadBtnText : mobileStyles.downloadBtnText}>Save</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {/* If no content at all */}
        {!hasContent && (
          <View style={webMode ? webStyles.noContentBadge : mobileStyles.noContentBadge}>
            <Text style={webMode ? webStyles.noContentText : mobileStyles.noContentText}>No data</Text>
          </View>
        )}
      </View>
    );
  };

  // ─── MOBILE LAYOUT ───
  if (!isWeb) {
    return (
      <>
        <ScrollView style={mobileStyles.container} contentContainerStyle={mobileStyles.content}>
          <View style={mobileStyles.headerCard}>
            <Text style={mobileStyles.title}>{assignment.assignmentTitle}</Text>
            <Text style={mobileStyles.subTitle}>{assignment.unitTitle}</Text>
            <View style={mobileStyles.badgeRow}>
              {(assignment.classes || []).map((c) => (
                <View key={c} style={[mobileStyles.badge, { backgroundColor: CLASS_COLORS[c]?.bg || "#f1f5f9" }]}>
                  <Text style={[mobileStyles.badgeText, { color: CLASS_COLORS[c]?.text || "#475569" }]}>{c}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={mobileStyles.infoCard}>
            <View style={mobileStyles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={isOverdue ? "#ef4444" : "#2563eb"} />
              <Text style={mobileStyles.infoLabel}>Due Date</Text>
              <Text style={[mobileStyles.infoValue, isOverdue && { color: "#ef4444" }]}>
                {dueDate.toLocaleDateString("en-IN")}
              </Text>
            </View>
            <View style={mobileStyles.infoRow}>
              <Ionicons name="trophy-outline" size={18} color="#2563eb" />
              <Text style={mobileStyles.infoLabel}>Total Marks</Text>
              <Text style={mobileStyles.infoValue}>{assignment.totalMarks}</Text>
            </View>
          </View>

          <View style={mobileStyles.section}>
            <Text style={mobileStyles.sectionTitle}>Description</Text>
            <Text style={mobileStyles.descText}>{assignment.description || "No description provided"}</Text>
          </View>

          <View style={mobileStyles.section}>
            <Text style={mobileStyles.sectionTitle}>Attachments</Text>
            {attachments.length === 0
              ? <Text style={mobileStyles.emptyText}>No files attached by teacher</Text>
              : attachments.map((file, index) => (
                  <AttachmentRow key={index} file={file} index={index} webMode={false} />
                ))
            }
          </View>
        </ScrollView>
        <MobilePreviewModal />
      </>
    );
  }

  // ─── WEB LAYOUT ───
  return (
    <ScrollView style={webStyles.root} contentContainerStyle={webStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={webStyles.inner}>

        {/* HEADER */}
        <View style={webStyles.headerCard}>
          <View style={webStyles.headerLeft}>
            <View style={webStyles.headerIconBox}>
              <Ionicons name="document-text" size={28} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={webStyles.title}>{assignment.assignmentTitle}</Text>
              <Text style={webStyles.subTitle}>{assignment.unitTitle}</Text>
              <View style={webStyles.badgeRow}>
                {(assignment.classes || []).map((c) => (
                  <View key={c} style={[webStyles.badge, { backgroundColor: CLASS_COLORS[c]?.bg || "#f1f5f9" }]}>
                    <Text style={[webStyles.badgeText, { color: CLASS_COLORS[c]?.text || "#475569" }]}>{c}</Text>
                  </View>
                ))}
                {isOverdue && (
                  <View style={webStyles.overdueBadge}>
                    <Text style={webStyles.overdueBadgeText}>Overdue</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* INFO + DESC ROW */}
        <View style={isWideScreen ? webStyles.twoColRow : webStyles.oneColRow}>
          <View style={isWideScreen ? webStyles.infoGrid : webStyles.infoGridFull}>
            {[
              { icon: "calendar-outline", label: "Due Date",  value: dueDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }), color: isOverdue ? "#ef4444" : "#2563eb" },
              { icon: "trophy-outline",   label: "Marks",     value: String(assignment.totalMarks), color: "#f59e0b" },
              { icon: "attach-outline",   label: "Files",     value: String(attachments.length),    color: "#16a34a" },
            ].map((item, i) => (
              <View key={i} style={webStyles.infoCard}>
                <Ionicons name={item.icon} size={22} color={item.color} />
                <Text style={webStyles.infoLabel}>{item.label}</Text>
                <Text style={[webStyles.infoValue, { color: item.color }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View style={isWideScreen ? webStyles.descCardWide : webStyles.descCardFull}>
            <View style={webStyles.sectionHeader}>
              <Ionicons name="document-outline" size={18} color="#2563eb" />
              <Text style={webStyles.sectionTitle}>Description</Text>
            </View>
            <Text style={webStyles.descText}>
              {assignment.description || "No description provided by the teacher."}
            </Text>
          </View>
        </View>

        {/* ATTACHMENTS */}
        <View style={webStyles.attachmentsCard}>
          <View style={webStyles.sectionHeader}>
            <Ionicons name="attach-outline" size={18} color="#2563eb" />
            <Text style={webStyles.sectionTitle}>Attachments</Text>
            <View style={webStyles.countPill}>
              <Text style={webStyles.countPillText}>{attachments.length} files</Text>
            </View>
          </View>

          {attachments.length > 0 && (
            <View style={webStyles.previewNote}>
              <Ionicons name="information-circle-outline" size={16} color="#2563eb" />
              <Text style={webStyles.previewNoteText}>
                Click "Open" to preview files in a new browser tab.
              </Text>
            </View>
          )}

          {attachments.length === 0 ? (
            <View style={webStyles.emptyAttach}>
              <Ionicons name="folder-open-outline" size={40} color="#cbd5e1" />
              <Text style={webStyles.emptyAttachText}>No files attached</Text>
            </View>
          ) : (
            <View style={webStyles.fileList}>
              {attachments.map((file, index) => (
                <AttachmentRow key={index} file={file} index={index} webMode={true} />
              ))}
            </View>
          )}
        </View>

        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Student Portal</Text>
      </View>
    </ScrollView>
  );
}

/* ─────────────── SHARED ─────────────── */
const shared = StyleSheet.create({
  centered:  { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  errorText: { marginTop: 12, fontSize: 16, color: "#ef4444", fontWeight: "700" },
});

/* ─────────────── MOBILE STYLES ─────────────── */
const mobileStyles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#f8fafc" },
  content:      { padding: 16, paddingBottom: 24 },
  headerCard:   { backgroundColor: "#0f172a", borderRadius: 16, padding: 16, marginBottom: 12 },
  title:        { color: "#fff", fontSize: 20, fontWeight: "800" },
  subTitle:     { color: "#cbd5e1", fontSize: 13, marginTop: 4 },
  badgeRow:     { marginTop: 12, flexDirection: "row" },
  badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 14, marginRight: 6 },
  badgeText:    { fontSize: 11, fontWeight: "700" },
  infoCard:     { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  infoRow:      { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  infoLabel:    { color: "#64748b", fontSize: 13, flex: 1, marginLeft: 8 },
  infoValue:    { color: "#0f172a", fontSize: 13, fontWeight: "700" },
  section:      { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 10 },
  descText:     { fontSize: 13, lineHeight: 20, color: "#334155" },
  emptyText:    { color: "#64748b", fontSize: 13 },
  fileRow:      { flexDirection: "row", alignItems: "center", marginBottom: 12, backgroundColor: "#f8fafc", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  fileIconBox:  { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  fileName:     { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  fileLabel:    { marginTop: 2, fontSize: 11, color: "#64748b" },
  viewBtn:      { borderWidth: 1, borderColor: "#2563eb", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, flexDirection: "row", alignItems: "center", backgroundColor: "#eff6ff", marginLeft: 6 },
  viewBtnText:  { color: "#2563eb", fontWeight: "700", fontSize: 12, marginLeft: 4 },
  downloadBtn:  { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, flexDirection: "row", alignItems: "center", marginLeft: 6 },
  downloadBtnText: { color: "#fff", fontWeight: "700", fontSize: 12, marginLeft: 4 },
  noContentBadge: { backgroundColor: "#f1f5f9", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 6 },
  noContentText:  { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  previewContainer: { flex: 1, backgroundColor: "#fff" },
  previewHeader: { paddingTop: 52, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", flexDirection: "row", alignItems: "center" },
  previewTitle:  { flex: 1, fontSize: 15, fontWeight: "700", color: "#0f172a", marginLeft: 10 },
});

/* ─────────────── WEB STYLES ─────────────── */
const webStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1000 },
  headerCard:  { backgroundColor: "#0f172a", borderRadius: 20, padding: 24, marginBottom: 20, shadowColor: "#0f172a", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  headerLeft:  { flexDirection: "row", alignItems: "flex-start" },
  headerIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(245,158,11,0.15)", justifyContent: "center", alignItems: "center", marginRight: 16 },
  title:       { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },
  subTitle:    { fontSize: 14, color: "#94a3b8", marginBottom: 12 },
  badgeRow:    { flexDirection: "row", flexWrap: "wrap" },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 6 },
  badgeText:   { fontSize: 12, fontWeight: "700" },
  overdueBadge:     { backgroundColor: "#fee2e2", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  overdueBadgeText: { fontSize: 12, fontWeight: "700", color: "#ef4444" },
  twoColRow:    { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  oneColRow:    { flexDirection: "column", marginBottom: 16 },
  infoGrid:     { width: 200, marginRight: 16 },
  infoGridFull: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  infoCard:     { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  infoLabel:    { fontSize: 11, color: "#94a3b8", marginTop: 8, fontWeight: "600", textTransform: "uppercase" },
  infoValue:    { fontSize: 17, fontWeight: "800", color: "#0f172a", marginTop: 4 },
  descCardWide: { flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#e2e8f0" },
  descCardFull: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  sectionHeader:{ flexDirection: "row", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a", marginLeft: 8, flex: 1 },
  descText:     { fontSize: 14, lineHeight: 22, color: "#334155" },
  attachmentsCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#e2e8f0" },
  countPill:    { backgroundColor: "#f1f5f9", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  countPillText:{ fontSize: 12, fontWeight: "700", color: "#475569" },
  previewNote:  { flexDirection: "row", alignItems: "center", backgroundColor: "#eff6ff", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#bfdbfe" },
  previewNoteText: { fontSize: 13, color: "#2563eb", marginLeft: 8, fontWeight: "500", flex: 1 },
  fileList:     { marginTop: 4 },
  fileRow:      { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  fileIconBox:  { width: 44, height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  fileName:     { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  fileLabel:    { marginTop: 2, fontSize: 12, color: "#64748b" },
  viewBtn:      { borderWidth: 1.5, borderColor: "#2563eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, flexDirection: "row", alignItems: "center", backgroundColor: "#eff6ff", marginLeft: 8 },
  viewBtnText:  { color: "#2563eb", fontWeight: "700", fontSize: 13, marginLeft: 4 },
  downloadBtn:  { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, flexDirection: "row", alignItems: "center", marginLeft: 8 },
  downloadBtnText: { color: "#fff", fontWeight: "700", fontSize: 13, marginLeft: 4 },
  noContentBadge: { backgroundColor: "#f1f5f9", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 },
  noContentText:  { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  emptyAttach:  { alignItems: "center", paddingVertical: 32 },
  emptyAttachText: { fontSize: 14, color: "#94a3b8", marginTop: 10 },
  footer:       { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});