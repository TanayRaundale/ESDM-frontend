import { View, Text, Image, StyleSheet, Animated, Dimensions, Platform } from "react-native";
import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

export default function Splash() {
  const router = useRouter();

  // Animation values
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.3)).current;
  const logoRotate  = useRef(new Animated.Value(0)).current;
  const textSlide   = useRef(new Animated.Value(50)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 1000, useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, tension: 50, friction: 7, useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1, duration: 1000, useNativeDriver: true,
      }),
    ]).start();

    // Text slide up
    Animated.timing(textSlide, {
      toValue: 0, duration: 800, delay: 500, useNativeDriver: true,
    }).start();

    // Pulse dots
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Progress bar
    Animated.timing(progressAnim, {
      toValue: 1, duration: 2500, useNativeDriver: false,
    }).start();

    // Navigate after delay
    const timer = setTimeout(async () => {
      if (!isWeb) await SplashScreen.hideAsync();
      router.replace("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // ─── WEB LAYOUT ───
  if (isWeb) {
    return (
      <LinearGradient
        colors={["#1e40af", "#2563eb", "#3b82f6"]}
        style={webStyles.root}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative blobs */}
        <View style={webStyles.blob1} />
        <View style={webStyles.blob2} />
        <View style={webStyles.blob3} />
        <View style={webStyles.blob4} />

        {/* Center card */}
        <Animated.View
          style={[
            webStyles.card,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Logo icon box */}
          <Animated.View
            style={[
              webStyles.logoBox,
              { transform: [{ rotate: spin }] },
            ]}
          >
            <Ionicons name="school" size={52} color="#fff" />
          </Animated.View>

          {/* Title */}
          <Animated.View style={{ transform: [{ translateY: textSlide }], opacity: fadeAnim }}>
            <Text style={webStyles.title}>ESDM Virtual Lab</Text>
            <Text style={webStyles.subtitle}>Empowering Digital Learning</Text>
          </Animated.View>

          {/* Divider */}
          <View style={webStyles.divider} />

          {/* Feature pills */}
          <Animated.View style={[webStyles.pillRow, { opacity: fadeAnim }]}>
            {[
              { icon: "book-outline",          label: "Study Notes"   },
              { icon: "help-circle-outline",   label: "Quizzes"       },
              { icon: "document-text-outline", label: "Assignments"   },
              { icon: "brush-outline",         label: "Diagrams"      },
            ].map((item, i) => (
              <View key={i} style={webStyles.pill}>
                <Ionicons name={item.icon} size={14} color="#bfdbfe" />
                <Text style={webStyles.pillText}>{item.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Dots loader */}
          <Animated.View
            style={[
              webStyles.dotsRow,
              { opacity: fadeAnim, transform: [{ scale: pulseAnim }] },
            ]}
          >
            {[0.9, 0.6, 0.35].map((op, i) => (
              <View key={i} style={[webStyles.dot, { opacity: op }]} />
            ))}
          </Animated.View>

          {/* Progress bar */}
          <View style={webStyles.progressBar}>
            <Animated.View style={[webStyles.progressFill, { width: progressWidth }]} />
          </View>

          <Text style={webStyles.loadingText}>Loading your workspace...</Text>
        </Animated.View>

        {/* Bottom footer */}
        <Animated.Text style={[webStyles.footer, { opacity: fadeAnim }]}>
          © 2025 ESDM Virtual Lab · All rights reserved
        </Animated.Text>
      </LinearGradient>
    );
  }

  // ─── MOBILE LAYOUT (unchanged) ───
  return (
    <LinearGradient
      colors={["#1e40af", "#2563eb", "#3b82f6"]}
      style={mobileStyles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={mobileStyles.circle1} />
      <View style={mobileStyles.circle2} />
      <View style={mobileStyles.circle3} />

      <Animated.View
        style={[
          mobileStyles.logoContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { rotate: spin }] },
        ]}
      >
        <Image
          source={require("../assets/images/logo.jpg")}
          style={mobileStyles.logo}
        />
      </Animated.View>

      <Animated.View
        style={[
          mobileStyles.loaderContainer,
          { opacity: fadeAnim, transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={mobileStyles.loader}>
          <View style={mobileStyles.loaderDot} />
          <View style={[mobileStyles.loaderDot, mobileStyles.loaderDotDelay1]} />
          <View style={[mobileStyles.loaderDot, mobileStyles.loaderDotDelay2]} />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          mobileStyles.textContainer,
          { opacity: fadeAnim, transform: [{ translateY: textSlide }] },
        ]}
      >
        <Text style={mobileStyles.title}>ESDM Virtual Lab</Text>
        <Text style={mobileStyles.subtitle}>Empowering Digital Learning</Text>
      </Animated.View>

      <Animated.View style={[mobileStyles.progressContainer, { opacity: fadeAnim }]}>
        <View style={mobileStyles.progressBar}>
          <Animated.View style={[mobileStyles.progressFill, { width: progressWidth }]} />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

/* ─────────────── WEB STYLES ─────────────── */
const webStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    minHeight: 600,
  },

  // Decorative blobs
  blob1: {
    position: "absolute", width: 400, height: 400, borderRadius: 200,
    backgroundColor: "rgba(255,255,255,0.07)", top: -120, right: -80,
  },
  blob2: {
    position: "absolute", width: 280, height: 280, borderRadius: 140,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: -60, left: -60,
  },
  blob3: {
    position: "absolute", width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)", top: "35%", right: 60,
  },
  blob4: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.04)", bottom: "25%", left: 80,
  },

  // Center card
  card: {
    width: "100%",
    maxWidth: 440,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 32,
    paddingVertical: 48,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
  },

  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 0.3,
  },

  divider: {
    width: 60,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 1,
    marginVertical: 24,
  },

  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 28,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  pillText: {
    fontSize: 12,
    color: "#bfdbfe",
    fontWeight: "600",
    marginLeft: 5,
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ffffff",
    marginHorizontal: 5,
  },

  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 2,
  },

  loadingText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5,
  },

  footer: {
    position: "absolute",
    bottom: 24,
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
});

/* ─────────────── MOBILE STYLES (unchanged) ─────────────── */
const mobileStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  circle1: {
    position: "absolute", width: 300, height: 300, borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.1)", top: -100, right: -100,
  },
  circle2: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)", bottom: -50, left: -50,
  },
  circle3: {
    position: "absolute", width: 150, height: 150, borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.05)", top: height * 0.3, right: 30,
  },
  logoContainer: {
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 180, height: 180, borderRadius: 30,
    borderWidth: 4, borderColor: "rgba(255,255,255,0.3)",
  },
  loaderContainer: { marginVertical: 30 },
  loader: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  loaderDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#ffffff", marginHorizontal: 6, opacity: 0.9,
  },
  loaderDotDelay1: { opacity: 0.7 },
  loaderDotDelay2: { opacity: 0.5 },
  textContainer: { alignItems: "center", marginTop: 10 },
  title: {
    fontSize: 28, fontWeight: "bold", color: "#ffffff", letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 8, letterSpacing: 0.5 },
  progressContainer: { position: "absolute", bottom: 60, width: width * 0.7 },
  progressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#ffffff", borderRadius: 2 },
});