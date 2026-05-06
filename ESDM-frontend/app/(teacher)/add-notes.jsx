import { useState, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import API from "../../src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, ScrollView,
  Platform, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";

const { width } = Dimensions.get("window");
const isWeb        = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const UNIT_COLORS = ["#3b82f6","#8b5cf6","#06b6d4","#f59e0b","#ec4899"];

export default function NotesHome() {
  const router = useRouter();
  const [selectedNote, setSelectedNote] = useState(null);
  const [modalVisible, setModalVisible]  = useState(false);
  const [notes, setNotes]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const fetchNotes = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res   = await API.get("/notes/recent", { headers: { Authorization: `Bearer ${token}` } });
      setNotes(res.data);
    } catch (err) { console.log("Fetch error:", err); }
    finally       { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchNotes(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchNotes(); };

  const openPreview = async (note) => {
    if (!note.files?.length) return;
    if (note.files.length === 1) {
      if (isWeb) { window.open(note.files[0].fileUrl, "_blank"); }
      else { await WebBrowser.openBrowserAsync(note.files[0].fileUrl); }
    } else {
      setSelectedNote(note); setModalVisible(true);
    }
  };

  // Shared file modal
  const FileModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
      <View style={shared.modalOverlay}>
        <View style={[shared.modalContainer, isWeb && shared.modalContainerWeb]}>
          <View style={shared.modalHeader}>
            <Text style={shared.modalTitle}>{selectedNote?.topic}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close-circle" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <View style={shared.fileList}>
            {selectedNote?.files?.map((file, i) => (
              <TouchableOpacity key={i} style={shared.fileOption}
                onPress={async () => { setModalVisible(false); if (isWeb) { window.open(file.fileUrl, "_blank"); } else { await WebBrowser.openBrowserAsync(file.fileUrl); } }}>
                <View style={shared.fileIconCircle}>
                  <Ionicons name="document-text" size={20} color="#3b82f6" />
                </View>
                <Text style={shared.fileName} numberOfLines={1}>{file.fileName || `File ${i + 1}`}</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={shared.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={shared.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ─── MOBILE ───
  if (!isWeb) {
    const NoteCard = ({ item, index }) => {
      const color = UNIT_COLORS[Number(item.unitNumber) % UNIT_COLORS.length];
      return (
        <View style={mobileStyles.cardWrapper}>
          <TouchableOpacity style={mobileStyles.card} onPress={() => openPreview(item)} activeOpacity={0.7}>
            <LinearGradient colors={[`${color}15`, `${color}05`]} style={mobileStyles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={[mobileStyles.unitBadge, { backgroundColor: color }]}>
                <Text style={mobileStyles.unitBadgeText}>Unit {item.unitNumber}</Text>
              </View>
              <View style={mobileStyles.cardContent}>
                <Text style={mobileStyles.topic} numberOfLines={2}>{item.topic}</Text>
                <Text style={mobileStyles.unitName} numberOfLines={1}>{item.unit}</Text>
                <View style={mobileStyles.metaRow}>
                  <View style={mobileStyles.metaItem}>
                    <Ionicons name="people-outline" size={14} color="#64748b" />
                    <Text style={mobileStyles.metaText}>{item.classes?.join(", ")}</Text>
                  </View>
                  <View style={mobileStyles.metaItem}>
                    <Ionicons name="document-text-outline" size={14} color="#64748b" />
                    <Text style={mobileStyles.metaText}>{item.files?.length || 0} files</Text>
                  </View>
                </View>
              </View>
              <View style={[mobileStyles.viewIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name="eye-outline" size={22} color={color} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <View style={mobileStyles.container}>
        <View style={mobileStyles.header}>
          <Text style={mobileStyles.headerTitle}>Class Notes</Text>
          <Text style={mobileStyles.headerSub}>Access all uploaded study materials</Text>
        </View>
        {loading ? (
          <View style={mobileStyles.loadingContainer}><ActivityIndicator size="large" color="#3b82f6" /></View>
        ) : (
          <FlatList data={notes} keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => <NoteCard item={item} index={index} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
            ListEmptyComponent={
              <View style={mobileStyles.emptyContainer}>
                <Ionicons name="documents-outline" size={64} color="#cbd5e1" />
                <Text style={mobileStyles.emptyText}>No notes uploaded yet</Text>
              </View>
            }
            contentContainerStyle={mobileStyles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
        <FileModal />
        <TouchableOpacity style={mobileStyles.fab} onPress={() => router.push("/(teacher)/upload-notes")} activeOpacity={0.8}>
          <LinearGradient colors={["#3b82f6","#2563eb"]} style={mobileStyles.fabGradient}>
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── WEB ───
  return (
    <ScrollView style={webStyles.root} contentContainerStyle={webStyles.rootContent} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={webStyles.inner}>

        <View style={webStyles.pageHeader}>
          <View>
            <Text style={webStyles.pageTitle}>Class Notes</Text>
            <Text style={webStyles.pageSubtitle}>Manage and preview all uploaded study materials</Text>
          </View>
          <View style={webStyles.headerRight}>
            <View style={webStyles.countBadge}>
              <Text style={webStyles.countBadgeText}>{notes.length} notes</Text>
            </View>
            <TouchableOpacity style={webStyles.uploadBtn} onPress={() => router.push("/(teacher)/upload-notes")}>
              <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
              <Text style={webStyles.uploadBtnText}>Upload Notes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 40 }}><ActivityIndicator size="large" color="#3b82f6" /></View>
        ) : notes.length === 0 ? (
          <View style={webStyles.emptyBox}>
            <View style={webStyles.emptyIconBox}><Ionicons name="documents-outline" size={48} color="#cbd5e1" /></View>
            <Text style={webStyles.emptyTitle}>No notes uploaded yet</Text>
            <Text style={webStyles.emptyText}>Start by uploading your first note</Text>
            <TouchableOpacity style={webStyles.emptyBtn} onPress={() => router.push("/(teacher)/upload-notes")}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={webStyles.emptyBtnText}>Upload Notes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={isWideScreen ? webStyles.gridWide : webStyles.gridNarrow}>
            {notes.map((item, index) => {
              const color = UNIT_COLORS[Number(item.unitNumber) % UNIT_COLORS.length];
              return (
                <TouchableOpacity key={item._id}
                  style={[webStyles.card, isWideScreen && webStyles.cardWide]}
                  onPress={() => openPreview(item)} activeOpacity={0.85}>
                  <View style={[webStyles.cardBar, { backgroundColor: color }]} />
                  <View style={webStyles.cardBody}>
                    <View style={[webStyles.unitBadge, { backgroundColor: `${color}15` }]}>
                      <Ionicons name="layers-outline" size={13} color={color} />
                      <Text style={[webStyles.unitBadgeText, { color }]}>Unit {item.unitNumber}</Text>
                    </View>
                    <Text style={webStyles.cardTitle} numberOfLines={2}>{item.topic}</Text>
                    <Text style={webStyles.cardUnit} numberOfLines={1}>{item.unit}</Text>
                    <View style={webStyles.cardMeta}>
                      <View style={webStyles.metaItem}>
                        <Ionicons name="people-outline" size={13} color="#64748b" />
                        <Text style={webStyles.metaText}>{item.classes?.join(", ")}</Text>
                      </View>
                      <View style={webStyles.metaItem}>
                        <Ionicons name="document-text-outline" size={13} color="#64748b" />
                        <Text style={webStyles.metaText}>{item.files?.length || 0} files</Text>
                      </View>
                    </View>
                    <View style={[webStyles.openBtn, { backgroundColor: `${color}15` }]}>
                      <Ionicons name="eye-outline" size={15} color={color} />
                      <Text style={[webStyles.openBtnText, { color }]}>Preview</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Teacher Portal</Text>
      </View>
      <FileModal />
    </ScrollView>
  );
}

const shared = StyleSheet.create({
  modalOverlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContainer:  { width: "100%", maxWidth: 400, backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  modalContainerWeb: { shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  modalHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle:      { fontSize: 17, fontWeight: "700", color: "#1e293b", flex: 1 },
  fileList:        { marginBottom: 12 },
  fileOption:      { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 8 },
  fileIconCircle:  { width: 36, height: 36, borderRadius: 18, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center", marginRight: 12 },
  fileName:        { flex: 1, fontSize: 14, fontWeight: "600", color: "#334155" },
  cancelButton:    { paddingVertical: 12, alignItems: "center", borderRadius: 12, backgroundColor: "#fee2e2" },
  cancelButtonText:{ fontSize: 14, fontWeight: "700", color: "#dc2626" },
});

const mobileStyles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#f8fafc" },
  header:          { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  headerTitle:     { fontSize: 24, fontWeight: "700", color: "#1e293b" },
  headerSub:       { fontSize: 13, color: "#64748b", marginTop: 2 },
  loadingContainer:{ flex: 1, justifyContent: "center", alignItems: "center" },
  listContent:     { padding: 16, paddingBottom: 100 },
  cardWrapper:     { marginBottom: 12 },
  card:            { borderRadius: 16, overflow: "hidden", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  cardGradient:    { padding: 16, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "#f1f5f9", position: "relative" },
  unitBadge:       { position: "absolute", top: 16, right: 16, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  unitBadgeText:   { fontSize: 11, fontWeight: "700", color: "#fff", textTransform: "uppercase" },
  cardContent:     { paddingRight: 80 },
  topic:           { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  unitName:        { fontSize: 13, color: "#64748b", marginBottom: 12 },
  metaRow:         { flexDirection: "row" },
  metaItem:        { flexDirection: "row", alignItems: "center", marginRight: 16 },
  metaText:        { fontSize: 12, color: "#64748b", marginLeft: 5 },
  viewIcon:        { position: "absolute", bottom: 16, right: 16, width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  emptyContainer:  { alignItems: "center", paddingVertical: 80 },
  emptyText:       { fontSize: 16, fontWeight: "600", color: "#475569", marginTop: 16 },
  fab:             { position: "absolute", bottom: 25, right: 20, borderRadius: 30 },
  fabGradient:     { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center" },
});

const webStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner:       { width: "100%", maxWidth: 1100 },
  pageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  pageTitle:   { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  pageSubtitle:{ fontSize: 14, color: "#64748b", marginTop: 4 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  countBadge:  { backgroundColor: "#f1f5f9", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  countBadgeText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  uploadBtn:   { flexDirection: "row", alignItems: "center", backgroundColor: "#3b82f6", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  uploadBtnText: { fontSize: 14, fontWeight: "700", color: "#fff", marginLeft: 6 },
  gridWide:    { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  gridNarrow:  { flexDirection: "column", marginBottom: 24 },
  card:        { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", marginBottom: 20, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  cardWide:    { width: "31.5%", marginRight: "2%" },
  cardBar:     { height: 4, width: "100%" },
  cardBody:    { padding: 18 },
  unitBadge:   { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginBottom: 12 },
  unitBadgeText: { fontSize: 12, fontWeight: "700", marginLeft: 5 },
  cardTitle:   { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  cardUnit:    { fontSize: 13, color: "#64748b", marginBottom: 12 },
  cardMeta:    { flexDirection: "row", marginBottom: 14 },
  metaItem:    { flexDirection: "row", alignItems: "center", marginRight: 16 },
  metaText:    { fontSize: 12, color: "#64748b", marginLeft: 5 },
  openBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10 },
  openBtnText: { fontSize: 13, fontWeight: "700", marginLeft: 6 },
  emptyBox:    { backgroundColor: "#fff", borderRadius: 20, padding: 48, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  emptyIconBox:{ width: 90, height: 90, borderRadius: 45, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle:  { fontSize: 20, fontWeight: "800", color: "#334155", marginBottom: 8 },
  emptyText:   { fontSize: 14, color: "#94a3b8", textAlign: "center", marginBottom: 20 },
  emptyBtn:    { flexDirection: "row", alignItems: "center", backgroundColor: "#3b82f6", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText:{ fontSize: 14, fontWeight: "700", color: "#fff", marginLeft: 6 },
  footer:      { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});