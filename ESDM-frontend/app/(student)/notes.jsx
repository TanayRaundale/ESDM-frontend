import { useState, useCallback, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert, Platform, Dimensions } from "react-native";
import API from "../../src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const UNIT_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899", "#22c55e"];

export default function StudentNotes() {
  const [selectedNote, setSelectedNote] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("All");

  const downloadFile = async (fileUrl, fileName = "document") => {
    try {
      // On web — open in new tab
      if (isWeb) {
        await Linking.openURL(fileUrl);
        return;
      }
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const fileUri = `${FileSystem.documentDirectory}${cleanFileName}`;
      const result = await FileSystem.downloadAsync(fileUrl, fileUri);
      if (result.status === 404) {
        const fallbackUrl = fileUrl.includes("/raw/upload/")
          ? fileUrl.replace("/raw/upload/", "/image/upload/")
          : fileUrl.replace("/image/upload/", "/raw/upload/");
        const secondResult = await FileSystem.downloadAsync(fallbackUrl, fileUri);
        if (secondResult.status === 200) { await Sharing.shareAsync(secondResult.uri); return; }
      }
      if (result.status === 200) { await Sharing.shareAsync(result.uri); }
      else { Alert.alert("Download Error", `Server returned status ${result.status}`); }
    } catch (err) {
      console.log("Download crash:", err);
      Alert.alert("Error", "Could not complete download.");
    }
  };

  const fetchNotes = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await API.get("/notes/recent", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(res.data);
      setFilteredNotes(res.data);
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchNotes(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchNotes(); };

  useEffect(() => {
    let filtered = notes;
    if (selectedUnit !== "All") {
      filtered = filtered.filter((note) => note.unitNumber.toString() === selectedUnit);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.topic.toLowerCase().includes(query) ||
          note.unit.toLowerCase().includes(query)
      );
    }
    setFilteredNotes(filtered);
  }, [searchQuery, selectedUnit, notes]);

  const uniqueUnits = ["All", ...new Set(notes.map((n) => n.unitNumber.toString()))].sort((a, b) => {
    if (a === "All") return -1;
    if (b === "All") return 1;
    return parseInt(a) - parseInt(b);
  });

  const openPreview = async (note) => {
    if (!note.files?.length) return;
    if (note.files.length === 1) {
      if (isWeb) { window.open(note.files[0].fileUrl, "_blank"); }
      else { await WebBrowser.openBrowserAsync(note.files[0].fileUrl); }
    } else {
      setSelectedNote(note);
      setModalVisible(true);
    }
  };

  const trackDownload = async (noteId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await API.post(`/notes/${noteId}/track-download`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { console.log("Track download error:", err); }
  };

  const getFileIcon = (ext) => {
    if (ext === "pdf") return { icon: "document-text", color: "#ef4444" };
    if (ext === "doc" || ext === "docx") return { icon: "document", color: "#2563eb" };
    if (ext === "ppt" || ext === "pptx") return { icon: "easel", color: "#f59e0b" };
    if (["jpg", "jpeg", "png"].includes(ext)) return { icon: "image", color: "#22c55e" };
    return { icon: "document-text", color: "#3b82f6" };
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // ─── FILE PICKER MODAL (shared between web + mobile) ───
  const FileModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
      <View style={sharedStyles.modalOverlay}>
        <View style={[sharedStyles.modalContainer, isWeb && sharedStyles.modalContainerWeb]}>
          <View style={sharedStyles.modalHeader}>
            <View>
              <Text style={sharedStyles.modalTitle}>{selectedNote?.topic}</Text>
              <Text style={sharedStyles.modalSubtitle}>Select a file to open</Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close-circle" size={32} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <View style={sharedStyles.fileList}>
            {selectedNote?.files?.map((file, index) => {
              const ext = file.fileName?.split(".").pop()?.toLowerCase();
              const { icon, color } = getFileIcon(ext);
              return (
                <TouchableOpacity
                  key={index}
                  style={sharedStyles.fileOption}
                  onPress={async () => {
                    setModalVisible(false);
                    if (isWeb) { window.open(file.fileUrl, "_blank"); }
                    else { await WebBrowser.openBrowserAsync(file.fileUrl); }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[sharedStyles.fileIconCircle, { backgroundColor: `${color}15` }]}>
                    <Ionicons name={icon} size={22} color={color} />
                  </View>
                  <View style={sharedStyles.fileDetails}>
                    <Text style={sharedStyles.fileName} numberOfLines={1}>
                      {file.fileName || `File ${index + 1}`}
                    </Text>
                    <Text style={sharedStyles.fileType}>{ext?.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => downloadFile(file.fileUrl, file.fileName)}>
                    <Ionicons name="download-outline" size={22} color="#64748b" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={sharedStyles.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={sharedStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ─── MOBILE LAYOUT (unchanged) ───
  if (!isWeb) {
    const NoteCard = ({ item }) => {
      const gradientColor = UNIT_COLORS[item.unitNumber % UNIT_COLORS.length];
      return (
        <View style={mobileStyles.cardWrapper}>
          <TouchableOpacity
            style={mobileStyles.card}
            onPress={() => { trackDownload(item._id); openPreview(item); }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[`${gradientColor}15`, `${gradientColor}05`]}
              style={mobileStyles.cardGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={[mobileStyles.unitBadge, { backgroundColor: gradientColor }]}>
                <Ionicons name="layers" size={12} color="#fff" />
                <Text style={mobileStyles.unitBadgeText}>Unit {item.unitNumber}</Text>
              </View>
              <View style={mobileStyles.cardContent}>
                <Text style={mobileStyles.topic} numberOfLines={2}>{item.topic}</Text>
                <Text style={mobileStyles.unitName} numberOfLines={1}>{item.unit}</Text>
                <View style={mobileStyles.metaRow}>
                  <View style={mobileStyles.metaItem}>
                    <Ionicons name="document-text-outline" size={14} color="#64748b" />
                    <Text style={mobileStyles.metaText}>
                      {item.files?.length || 0} {item.files?.length === 1 ? "file" : "files"}
                    </Text>
                  </View>
                  {item.uploadedAt && (
                    <View style={mobileStyles.metaItem}>
                      <Ionicons name="time-outline" size={14} color="#64748b" />
                      <Text style={mobileStyles.metaText}>
                        {new Date(item.uploadedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={[mobileStyles.downloadIcon, { backgroundColor: `${gradientColor}20` }]}>
                <Ionicons name="download-outline" size={20} color={gradientColor} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <View style={mobileStyles.container}>
        <View style={mobileStyles.header}>
          <LinearGradient colors={["#3b82f6", "#2563eb"]} style={mobileStyles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={mobileStyles.headerTop}>
              <View>
                <Text style={mobileStyles.headerTitle}>Study Notes</Text>
                <Text style={mobileStyles.headerSub}>Access all class materials</Text>
              </View>
              <View style={mobileStyles.notesCount}>
                <Text style={mobileStyles.notesCountText}>{filteredNotes.length}</Text>
              </View>
            </View>
            <View style={mobileStyles.searchBar}>
              <Ionicons name="search" size={20} color="#64748b" />
              <TextInput
                style={mobileStyles.searchInput}
                placeholder="Search by topic or unit..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>

        <View style={mobileStyles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mobileStyles.filterScroll}>
            {uniqueUnits.map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[mobileStyles.filterPill, selectedUnit === unit && mobileStyles.filterPillActive]}
                onPress={() => setSelectedUnit(unit)}
              >
                <Text style={[mobileStyles.filterText, selectedUnit === unit && mobileStyles.filterTextActive]}>
                  {unit === "All" ? "All Units" : `Unit ${unit}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <NoteCard item={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
          ListEmptyComponent={
            <View style={mobileStyles.emptyContainer}>
              <View style={mobileStyles.emptyIconCircle}>
                <Ionicons name="documents-outline" size={48} color="#cbd5e1" />
              </View>
              <Text style={mobileStyles.emptyText}>
                {searchQuery || selectedUnit !== "All" ? "No notes found" : "No notes available"}
              </Text>
              <Text style={mobileStyles.emptySubText}>
                {searchQuery || selectedUnit !== "All" ? "Try adjusting your filters" : "New notes will appear here when uploaded"}
              </Text>
            </View>
          }
          contentContainerStyle={mobileStyles.listContent}
          showsVerticalScrollIndicator={false}
        />
        <FileModal />
      </View>
    );
  }

  // ─── WEB LAYOUT ───
  return (
    <ScrollView
      style={webStyles.root}
      contentContainerStyle={webStyles.rootContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={webStyles.inner}>

        {/* GRADIENT HEADER */}
        <LinearGradient
          colors={["#1e40af", "#2563eb", "#3b82f6"]}
          style={webStyles.pageHeader}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={webStyles.headerBlob1} />
          <View style={webStyles.headerBlob2} />
          <View style={webStyles.headerContent}>
            <View>
              <Text style={webStyles.pageTitle}>Study Notes</Text>
              <Text style={webStyles.pageSubtitle}>Access all class materials in one place</Text>
            </View>
            <View style={webStyles.countBadge}>
              <Text style={webStyles.countBadgeText}>{filteredNotes.length}</Text>
              <Text style={webStyles.countBadgeLabel}>notes</Text>
            </View>
          </View>

          {/* SEARCH */}
          <View style={webStyles.searchBar}>
            <Ionicons name="search" size={18} color="#64748b" />
            <TextInput
              style={webStyles.searchInput}
              placeholder="Search by topic or unit..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* FILTER PILLS */}
        <View style={webStyles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={webStyles.filterScroll}>
            {uniqueUnits.map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[webStyles.filterPill, selectedUnit === unit && webStyles.filterPillActive]}
                onPress={() => setSelectedUnit(unit)}
              >
                <Text style={[webStyles.filterText, selectedUnit === unit && webStyles.filterTextActive]}>
                  {unit === "All" ? "All Units" : `Unit ${unit}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* NOTES GRID */}
        {filteredNotes.length === 0 ? (
          <View style={webStyles.emptyBox}>
            <View style={webStyles.emptyIconBox}>
              <Ionicons name="documents-outline" size={48} color="#cbd5e1" />
            </View>
            <Text style={webStyles.emptyTitle}>
              {searchQuery || selectedUnit !== "All" ? "No notes found" : "No notes available"}
            </Text>
            <Text style={webStyles.emptyText}>
              {searchQuery || selectedUnit !== "All" ? "Try adjusting your filters" : "Notes uploaded by your teacher will appear here"}
            </Text>
          </View>
        ) : (
          <View style={isWideScreen ? webStyles.gridWide : webStyles.gridNarrow}>
            {filteredNotes.map((item) => {
              const gradientColor = UNIT_COLORS[item.unitNumber % UNIT_COLORS.length];
              return (
                <TouchableOpacity
                  key={item._id}
                  style={[webStyles.card, isWideScreen && webStyles.cardWide]}
                  onPress={() => { trackDownload(item._id); openPreview(item); }}
                  activeOpacity={0.85}
                >
                  {/* COLOR BAR */}
                  <View style={[webStyles.cardBar, { backgroundColor: gradientColor }]} />

                  <View style={webStyles.cardBody}>
                    {/* UNIT BADGE */}
                    <View style={[webStyles.unitBadge, { backgroundColor: `${gradientColor}15` }]}>
                      <Ionicons name="layers-outline" size={13} color={gradientColor} />
                      <Text style={[webStyles.unitBadgeText, { color: gradientColor }]}>
                        Unit {item.unitNumber}
                      </Text>
                    </View>

                    <Text style={webStyles.cardTitle} numberOfLines={2}>{item.topic}</Text>
                    <Text style={webStyles.cardUnit} numberOfLines={1}>{item.unit}</Text>

                    <View style={webStyles.cardMeta}>
                      <View style={webStyles.metaItem}>
                        <Ionicons name="document-text-outline" size={13} color="#64748b" />
                        <Text style={webStyles.metaText}>
                          {item.files?.length || 0} {item.files?.length === 1 ? "file" : "files"}
                        </Text>
                      </View>
                      {item.createdAt && (
                        <View style={webStyles.metaItem}>
                          <Ionicons name="time-outline" size={13} color="#64748b" />
                          <Text style={webStyles.metaText}>
                            {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={[webStyles.openBtn, { backgroundColor: `${gradientColor}15` }]}>
                      <Ionicons name="download-outline" size={16} color={gradientColor} />
                      <Text style={[webStyles.openBtnText, { color: gradientColor }]}>Open Notes</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Student Portal</Text>
      </View>

      <FileModal />
    </ScrollView>
  );
}

/* ─────────────── SHARED MODAL STYLES ─────────────── */
const sharedStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  modalContainerWeb: {
    borderRadius: 20, margin: 20,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 20,
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: "#64748b" },
  fileList: { marginBottom: 16 },
  fileOption: {
    flexDirection: "row", alignItems: "center",
    padding: 14, backgroundColor: "#f8fafc",
    borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 10,
  },
  fileIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  fileDetails: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: "600", color: "#1e293b", marginBottom: 2 },
  fileType: { fontSize: 11, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase" },
  cancelButton: {
    paddingVertical: 14, alignItems: "center",
    borderRadius: 14, backgroundColor: "#fee2e2", marginTop: 8,
  },
  cancelButtonText: { fontSize: 15, fontWeight: "700", color: "#dc2626" },
});

/* ─────────────── MOBILE STYLES ─────────────── */
const mobileStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  headerGradient: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#fff", letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: "#bfdbfe", marginTop: 2 },
  notesCount: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  notesCountText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 15, color: "#1e293b", marginLeft: 10 },
  filterContainer: { backgroundColor: "#fff", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  filterScroll: { paddingHorizontal: 20 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0", marginRight: 8 },
  filterPillActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  filterTextActive: { color: "#fff" },
  listContent: { padding: 16, paddingBottom: 100 },
  cardWrapper: { marginBottom: 12 },
  card: { borderRadius: 16, overflow: "hidden", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  cardGradient: { padding: 16, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "#f1f5f9", position: "relative" },
  unitBadge: { position: "absolute", top: 16, right: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  unitBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff", textTransform: "uppercase", letterSpacing: 0.5, marginLeft: 4 },
  cardContent: { paddingRight: 90 },
  topic: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 4, lineHeight: 22 },
  unitName: { fontSize: 13, color: "#64748b", marginBottom: 12 },
  metaRow: { flexDirection: "row" },
  metaItem: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  metaText: { fontSize: 12, color: "#64748b", marginLeft: 5 },
  downloadIcon: { position: "absolute", bottom: 16, right: 16, width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: "700", color: "#475569", marginTop: 8 },
  emptySubText: { fontSize: 14, color: "#94a3b8", marginTop: 4, textAlign: "center", paddingHorizontal: 40 },
});

/* ─────────────── WEB STYLES ─────────────── */
const webStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingBottom: 32 },
  inner: { width: "100%", maxWidth: 1100, paddingHorizontal: 24 },

  // GRADIENT HEADER
  pageHeader: {
    width: "100%", maxWidth: 1100,
    borderRadius: 0, padding: 32,
    marginBottom: 0, overflow: "hidden",
    position: "relative",
  },
  headerBlob1: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.08)", top: -60, right: -40 },
  headerBlob2: { position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.06)", bottom: -40, left: 60 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#fff" },
  pageSubtitle: { fontSize: 14, color: "#bfdbfe", marginTop: 4 },
  countBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  countBadgeText: { fontSize: 26, fontWeight: "800", color: "#fff" },
  countBadgeLabel: { fontSize: 12, color: "#bfdbfe", marginTop: 2 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13 },
  searchInput: { flex: 1, fontSize: 15, color: "#1e293b", marginLeft: 10 },

  // FILTERS
  filterRow: { backgroundColor: "#fff", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", marginBottom: 24, width: "100%", maxWidth: 1100 },
  filterScroll: { paddingHorizontal: 24 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0", marginRight: 8 },
  filterPillActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  filterTextActive: { color: "#fff" },

  // GRIDS
  gridWide: { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  gridNarrow: { flexDirection: "column", marginBottom: 24 },

  // NOTE CARD
  card: {
    backgroundColor: "#fff", borderRadius: 18,
    overflow: "hidden", marginBottom: 20,
    borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#0f172a", shadowOpacity: 0.06,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardWide: { width: "31.5%", marginRight: "2%" },
  cardBar: { height: 4, width: "100%" },
  cardBody: { padding: 18 },
  unitBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginBottom: 12 },
  unitBadgeText: { fontSize: 12, fontWeight: "700", marginLeft: 5 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 4, lineHeight: 22 },
  cardUnit: { fontSize: 13, color: "#64748b", marginBottom: 12 },
  cardMeta: { flexDirection: "row", marginBottom: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  metaText: { fontSize: 12, color: "#64748b", marginLeft: 5 },
  openBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10 },
  openBtnText: { fontSize: 13, fontWeight: "700", marginLeft: 6 },

  // EMPTY
  emptyBox: { backgroundColor: "#fff", borderRadius: 20, padding: 48, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 24 },
  emptyIconBox: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#334155", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#94a3b8", textAlign: "center" },

  footer: { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8, paddingBottom: 16 },
});