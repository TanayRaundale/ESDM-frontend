import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useFocusEffect } from "expo-router";

import { fetchStudentVideos } from "../../src/services/videoApi";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

const openVideo = async (url) => {
  try {
    if (isWeb) {
      Linking.openURL(url);
    } else {
      await WebBrowser.openBrowserAsync(url);
    }
  } catch {
    await Linking.openURL(url);
  }
};

// Extract YouTube video ID from URL
const getYoutubeThumbnail = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");
    let videoId = null;

    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0];
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      videoId = parsed.searchParams.get("v");
      if (!videoId) {
        const segments = parsed.pathname.split("/").filter(Boolean);
        if (segments[0] === "embed" || segments[0] === "shorts") {
          videoId = segments[1];
        }
      }
    }

    return videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;
  } catch {
    return null;
  }
};

export default function StudentVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVideos = async () => {
    try {
      const data = await fetchStudentVideos();
      setVideos(data);
    } catch (error) {
      const message =
        error?.response?.data?.message || "Unable to load video links";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadVideos();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // ─── MOBILE LAYOUT (unchanged) ───
  if (!isWeb) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadVideos();
            }}
          />
        }
      >
        <Text style={styles.heading}>Video Lessons</Text>
        <Text style={styles.subheading}>
          Watch the YouTube videos shared by your teacher.
        </Text>

        {videos.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No videos available for your class yet.
            </Text>
          </View>
        ) : (
          videos.map((video) => (
            <View style={styles.videoCard} key={video._id}>
              <View style={styles.videoTopRow}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                <View style={styles.batchBadge}>
                  <Text style={styles.batchBadgeText}>{video.targetBatch}</Text>
                </View>
              </View>

              {!!video.description && (
                <Text style={styles.videoDesc}>{video.description}</Text>
              )}

              <Text numberOfLines={1} style={styles.videoUrl}>
                {video.url}
              </Text>

              <TouchableOpacity
                style={styles.watchBtn}
                onPress={() => openVideo(video.url)}
              >
                <Ionicons name="play-circle-outline" size={18} color="#fff" />
                <Text style={styles.watchBtnText}>Watch Video</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  // ─── WEB LAYOUT ───
  return (
    <ScrollView
      style={webStyles.root}
      contentContainerStyle={webStyles.rootContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadVideos();
          }}
        />
      }
    >
      <View style={webStyles.inner}>

        {/* PAGE HEADER */}
        <View style={webStyles.pageHeader}>
          <View>
            <Text style={webStyles.pageTitle}>Video Lessons</Text>
            <Text style={webStyles.pageSubtitle}>
              Watch YouTube videos shared by your teacher
            </Text>
          </View>
          <View style={webStyles.countBadge}>
            <Ionicons name="play-circle-outline" size={16} color="#dc2626" />
            <Text style={webStyles.countBadgeText}>
              {videos.length} {videos.length === 1 ? "Video" : "Videos"}
            </Text>
          </View>
        </View>

        {/* EMPTY STATE */}
        {videos.length === 0 ? (
          <View style={webStyles.emptyBox}>
            <View style={webStyles.emptyIconBox}>
              <Ionicons name="logo-youtube" size={48} color="#cbd5e1" />
            </View>
            <Text style={webStyles.emptyTitle}>No videos yet</Text>
            <Text style={webStyles.emptyText}>
              Your teacher hasn't uploaded any videos for your class yet.
            </Text>
          </View>
        ) : (
          // VIDEO GRID
          <View style={isWideScreen ? webStyles.gridWide : webStyles.gridNarrow}>
            {videos.map((video) => (
              <WebVideoCard
                key={video._id}
                video={video}
                isWideScreen={isWideScreen}
              />
            ))}
          </View>
        )}

        <Text style={webStyles.footer}>
          © 2025 ESDM Virtual Lab · Student Portal
        </Text>
      </View>
    </ScrollView>
  );
}

/* ─── WEB VIDEO CARD ─── */
function WebVideoCard({ video, isWideScreen }) {
  const thumbnail = getYoutubeThumbnail(video.url);

  return (
    <View style={[webStyles.card, isWideScreen && webStyles.cardWide]}>
      {/* THUMBNAIL */}
      <View style={webStyles.thumbnailBox}>
        {thumbnail ? (
          <View style={webStyles.thumbnailWrapper}>
            {/* Using View with background color as thumbnail placeholder */}
            <View style={webStyles.thumbnailOverlay}>
              <View style={webStyles.playIconBox}>
                <Ionicons name="play" size={28} color="#fff" />
              </View>
            </View>
            <View style={[webStyles.thumbnailBg, { backgroundColor: "#0f172a" }]}>
              <Ionicons name="logo-youtube" size={40} color="#dc2626" />
            </View>
          </View>
        ) : (
          <View style={webStyles.thumbnailBg}>
            <Ionicons name="logo-youtube" size={40} color="#dc2626" />
          </View>
        )}

        {/* Batch badge over thumbnail */}
        <View style={webStyles.thumbnailBadge}>
          <Text style={webStyles.thumbnailBadgeText}>{video.targetBatch}</Text>
        </View>
      </View>

      {/* CARD BODY */}
      <View style={webStyles.cardBody}>
        <Text style={webStyles.cardTitle} numberOfLines={2}>
          {video.title}
        </Text>

        {!!video.description && (
          <Text style={webStyles.cardDesc} numberOfLines={2}>
            {video.description}
          </Text>
        )}

        <View style={webStyles.urlRow}>
          <Ionicons name="link-outline" size={13} color="#94a3b8" />
          <Text style={webStyles.urlText} numberOfLines={1}>
            {video.url}
          </Text>
        </View>

        <TouchableOpacity
          style={webStyles.watchBtn}
          onPress={() => openVideo(video.url)}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-youtube" size={16} color="#fff" />
          <Text style={webStyles.watchBtnText}>Watch on YouTube</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─────────────── MOBILE STYLES (unchanged) ─────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  subheading: {
    marginTop: 6,
    color: "#64748b",
    marginBottom: 16,
  },
  emptyBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyText: {
    color: "#64748b",
  },
  videoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  videoTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginRight: 8,
  },
  batchBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  batchBadgeText: {
    color: "#1d4ed8",
    fontWeight: "700",
    fontSize: 12,
  },
  videoDesc: {
    marginTop: 6,
    color: "#475569",
  },
  videoUrl: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 12,
  },
  watchBtn: {
    marginTop: 10,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  watchBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    marginLeft: 6,
  },
});

/* ─────────────── WEB STYLES ─────────────── */
const webStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  rootContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  inner: {
    width: "100%",
    maxWidth: 1100,
  },

  // PAGE HEADER
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#dc2626",
    marginLeft: 6,
  },

  // GRIDS
  gridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  gridNarrow: {
    flexDirection: "column",
    marginBottom: 24,
  },

  // CARD
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardWide: {
    width: "31%",
    marginRight: "2%",
  },

  // THUMBNAIL
  thumbnailBox: {
    height: 180,
    backgroundColor: "#0f172a",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  thumbnailWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailBg: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1e293b",
  },
  thumbnailOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  playIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  thumbnailBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(15,23,42,0.85)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 2,
  },
  thumbnailBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  // CARD BODY
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
    lineHeight: 22,
  },
  cardDesc: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 10,
  },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  urlText: {
    fontSize: 12,
    color: "#94a3b8",
    marginLeft: 4,
    flex: 1,
  },
  watchBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#dc2626",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  watchBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 8,
  },

  // EMPTY STATE
  emptyBox: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 48,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 24,
  },
  emptyIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
  },

  // FOOTER
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#94a3b8",
    paddingTop: 8,
  },
});