import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";

import { router, Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import API from "../src/services/api";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert("Missing Fields", "Please enter email and password");
        return;
      }

      setLoading(true);

      const res = await API.post("/auth/login", { email, password });
      const data = res.data;

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("role", data.user.role);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.photo) {
        await AsyncStorage.setItem("profileImage", data.user.photo);
      } else {
        await AsyncStorage.removeItem("profileImage");
      }

      Alert.alert("Welcome 🎉", "Login successful");

      if (data.user.role === "teacher") {
        router.replace("/(teacher)/dashboard");
      } else {
        router.replace("/(student)/home");
      }
    } catch (error) {
      console.log("Login Error:", error);
      const message =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        "Invalid email or password";
      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  // ─── MOBILE LAYOUT (unchanged) ───
  if (!isWeb) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={mobileStyles.container}>
          <View style={mobileStyles.header}>
            <Text style={mobileStyles.title}>ESDM</Text>
            <Text style={mobileStyles.subtitle}>Login to continue your journey</Text>
          </View>

          <View style={mobileStyles.card}>
            <View style={mobileStyles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#64748b" />
              <TextInput
                placeholder="Email address"
                style={mobileStyles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={mobileStyles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
              <TextInput
                placeholder="Password"
                style={mobileStyles.input}
                secureTextEntry={secure}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setSecure(!secure)}>
                <Ionicons
                  name={secure ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[mobileStyles.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={mobileStyles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <Link href="/register" style={mobileStyles.registerLink}>
              <Text style={mobileStyles.registerText}>
                Don't have an account?{" "}
                <Text style={mobileStyles.registerBold}>Register</Text>
              </Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ─── WEB LAYOUT ───
  return (
    <ScrollView
      style={webStyles.root}
      contentContainerStyle={webStyles.rootContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={isWideScreen ? webStyles.wrapperWide : webStyles.wrapperNarrow}>

        {/* LEFT PANEL — wide screens only */}
        {isWideScreen && (
          <View style={webStyles.leftPanel}>
            <View style={webStyles.blob1} />
            <View style={webStyles.blob2} />

            <View style={webStyles.logoBox}>
              <Ionicons name="school" size={32} color="#fff" />
            </View>
            <Text style={webStyles.brandName}>ESDM</Text>
            <Text style={webStyles.brandTagline}>Virtual Lab</Text>
            <Text style={webStyles.brandDesc}>
              A smarter way to learn, teach,{"\n"}and grow together.
            </Text>

            {[
              { icon: "book-outline", text: "Access study notes anytime" },
              { icon: "help-circle-outline", text: "Take quizzes & track scores" },
              { icon: "document-text-outline", text: "Submit assignments online" },
              { icon: "brush-outline", text: "Practice diagrams interactively" },
            ].map((f, i) => (
              <View key={i} style={webStyles.featureItem}>
                <View style={webStyles.featureIconBox}>
                  <Ionicons name={f.icon} size={15} color="#2563eb" />
                </View>
                <Text style={webStyles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* RIGHT PANEL */}
        <View style={isWideScreen ? webStyles.rightPanelWide : webStyles.rightPanelNarrow}>

          {!isWideScreen && (
            <View style={webStyles.mobileTopBar}>
              <View style={webStyles.mobileLogoBox}>
                <Ionicons name="school" size={20} color="#fff" />
              </View>
              <Text style={webStyles.mobileTopTitle}>ESDM Virtual Lab</Text>
            </View>
          )}

          <View style={webStyles.formBox}>
            <Text style={webStyles.formTitle}>Welcome back</Text>
            <Text style={webStyles.formSubtitle}>
              Sign in to your account to continue
            </Text>

            <Text style={webStyles.fieldLabel}>Email address</Text>
            <View style={webStyles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#94a3b8" />
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor="#94a3b8"
                style={webStyles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={webStyles.fieldLabel}>Password</Text>
            <View style={webStyles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                style={webStyles.input}
                secureTextEntry={secure}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setSecure(!secure)}>
                <Ionicons
                  name={secure ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[webStyles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={webStyles.loginBtnText}>Sign in</Text>
              )}
            </TouchableOpacity>

            <View style={webStyles.divider}>
              <View style={webStyles.dividerLine} />
              <Text style={webStyles.dividerText}>or</Text>
              <View style={webStyles.dividerLine} />
            </View>

            <View style={webStyles.registerRow}>
              <Text style={webStyles.registerText}>Don't have an account? </Text>
              <Link href="/register">
                <Text style={webStyles.registerLink}>Create one</Text>
              </Link>
            </View>
          </View>

          <Text style={webStyles.footer}>
            © 2025 ESDM Virtual Lab · All rights reserved
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─────────────── MOBILE STYLES ───────────────
const mobileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#64748b",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: "#f8fafc",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#0f172a",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  registerLink: {
    marginTop: 22,
  },
  registerText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
  },
  registerBold: {
    color: "#2563eb",
    fontWeight: "700",
  },
});

// ─────────────── WEB STYLES ───────────────
const webStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  rootContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 600,
  },

  // WRAPPERS
  wrapperWide: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 900,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  wrapperNarrow: {
    flexDirection: "column",
    width: "100%",
    maxWidth: 440,
    alignItems: "center",
  },

  // LEFT PANEL
  leftPanel: {
    width: "45%",
    backgroundColor: "#0f172a",
    padding: 44,
    justifyContent: "center",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#2563eb",
    opacity: 0.2,
    top: -60,
    right: -60,
  },
  blob2: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#7c3aed",
    opacity: 0.18,
    bottom: -40,
    left: -40,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  brandName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#ffffff",
  },
  brandTagline: {
    fontSize: 15,
    color: "#7c9aba",
    marginBottom: 12,
  },
  brandDesc: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 21,
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: "rgba(37,99,235,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureText: {
    fontSize: 13,
    color: "#cbd5e1",
    fontWeight: "500",
  },

  // RIGHT PANELS
  rightPanelWide: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    padding: 44,
  },
  rightPanelNarrow: {
    width: "100%",
    alignItems: "center",
    padding: 0,
  },

  // MOBILE WEB TOP BAR
  mobileTopBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  mobileLogoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  mobileTopTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },

  // FORM BOX
  formBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 32,
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "#f8fafc",
    marginBottom: 18,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    marginLeft: 10,
  },
  loginBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#2563eb",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  loginBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    fontSize: 13,
    color: "#94a3b8",
    marginHorizontal: 12,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    color: "#64748b",
  },
  registerLink: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "700",
  },
  footer: {
    marginTop: 20,
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
});