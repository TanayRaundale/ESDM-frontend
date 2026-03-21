import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../src/services/api";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isWideScreen = isWeb && width >= 768;

export default function Profile() {
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profile, setProfile] = useState({
    photo: null, name: "", email: "",
    phone: "", address: "", year: "", department: "",
  });

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await API.get("/profile/me", { headers: { Authorization: `Bearer ${token}` } });
      setProfile(res.data);
      if (res.data.photo) await AsyncStorage.setItem("profileImage", res.data.photo);
    } catch {
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true, quality: 0.5, allowsEditing: true, aspect: [1, 1],
    });
    if (!result.canceled) {
      const base64Image = result.assets[0].base64;
      setProfile((prev) => ({ ...prev, photo: base64Image }));
      await AsyncStorage.setItem("profileImage", base64Image);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");
      await API.put("/profile/update", {
        photo: profile.photo, name: profile.name,
        phone: profile.phone, address: profile.address,
        year: profile.year, department: profile.department,
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (profile.photo) await AsyncStorage.setItem("profileImage", profile.photo);
      Alert.alert("Success", "Profile updated successfully");
      setEdit(false);
    } catch {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    const { oldPassword, newPassword, confirmPassword } = passwordForm;
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill previous, new and confirm password");
      return;
    }
    if (newPassword.length < 6) { Alert.alert("Invalid Password", "New password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { Alert.alert("Mismatch", "Passwords do not match"); return; }
    try {
      setPasswordSaving(true);
      const token = await AsyncStorage.getItem("token");
      const res = await API.put("/profile/change-password", { oldPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert("Success", res?.data?.message || "Password changed successfully");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.msg || "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // ─── MOBILE LAYOUT (unchanged) ───
  if (!isWeb) {
    return (
      <ScrollView style={mobileStyles.container} showsVerticalScrollIndicator={false}>
        <View style={mobileStyles.header}>
          <TouchableOpacity onPress={edit ? pickImage : undefined}>
            {profile.photo ? (
              <Image source={{ uri: `data:image/jpeg;base64,${profile.photo}` }} style={mobileStyles.avatar} />
            ) : (
              <View style={mobileStyles.avatarPlaceholder}>
                <Ionicons name="person" size={60} color="#94a3b8" />
              </View>
            )}
            {edit && (
              <View style={mobileStyles.cameraIcon}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={mobileStyles.name}>{profile.name}</Text>
          <Text style={mobileStyles.email}>{profile.email}</Text>
        </View>

        <View style={mobileStyles.card}>
          <ProfileField label="Phone" value={profile.phone} editable={edit} onChange={(v) => setProfile({ ...profile, phone: v })} />
          <ProfileField label="Address" value={profile.address} editable={edit} multiline onChange={(v) => setProfile({ ...profile, address: v })} />
          <ProfileField label="Year" value={profile.year} editable={edit} onChange={(v) => setProfile({ ...profile, year: v })} />
          <ProfileField label="Department" value={profile.department} editable={edit} onChange={(v) => setProfile({ ...profile, department: v })} />

          {edit ? (
            <TouchableOpacity style={mobileStyles.saveBtn} onPress={saveProfile} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="save-outline" size={20} color="#fff" /><Text style={mobileStyles.btnText}>Save Changes</Text></>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={mobileStyles.editBtn} onPress={() => setEdit(true)}>
              <Ionicons name="create-outline" size={20} color="#2563eb" />
              <Text style={mobileStyles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          )}

          <View style={mobileStyles.passwordSection}>
            <Text style={mobileStyles.passwordTitle}>Change Password</Text>
            <ProfileField label="Previous Password" value={passwordForm.oldPassword} editable onChange={(v) => setPasswordForm((p) => ({ ...p, oldPassword: v }))} secureTextEntry />
            <ProfileField label="New Password" value={passwordForm.newPassword} editable onChange={(v) => setPasswordForm((p) => ({ ...p, newPassword: v }))} secureTextEntry />
            <ProfileField label="Confirm New Password" value={passwordForm.confirmPassword} editable onChange={(v) => setPasswordForm((p) => ({ ...p, confirmPassword: v }))} secureTextEntry />
            <TouchableOpacity style={[mobileStyles.changePasswordBtn, passwordSaving && { opacity: 0.7 }]} onPress={changePassword} disabled={passwordSaving}>
              {passwordSaving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="key-outline" size={18} color="#fff" /><Text style={mobileStyles.changePasswordText}>Update Password</Text></>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ─── WEB LAYOUT ───
  return (
    <ScrollView style={webStyles.root} contentContainerStyle={webStyles.rootContent} showsVerticalScrollIndicator={false}>
      <View style={webStyles.inner}>

        {/* PROFILE HEADER CARD */}
        <View style={webStyles.profileHeaderCard}>
          <View style={webStyles.profileHeaderBg} />
          <View style={webStyles.profileHeaderContent}>
            <TouchableOpacity onPress={edit ? pickImage : undefined} style={webStyles.avatarWrap}>
              {profile.photo ? (
                <Image source={{ uri: `data:image/jpeg;base64,${profile.photo}` }} style={webStyles.avatar} />
              ) : (
                <View style={webStyles.avatarPlaceholder}>
                  <Ionicons name="person" size={52} color="#94a3b8" />
                </View>
              )}
              {edit && (
                <View style={webStyles.cameraBtn}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <View style={webStyles.profileHeaderInfo}>
              <Text style={webStyles.profileName}>{profile.name}</Text>
              <Text style={webStyles.profileEmail}>{profile.email}</Text>
              <View style={webStyles.roleBadge}>
                <Ionicons name="school-outline" size={13} color="#2563eb" />
                <Text style={webStyles.roleBadgeText}>Student</Text>
              </View>
            </View>
            <View style={webStyles.headerActions}>
              {edit ? (
                <TouchableOpacity style={webStyles.saveBtnHeader} onPress={saveProfile} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                    <><Ionicons name="save-outline" size={16} color="#fff" /><Text style={webStyles.saveBtnHeaderText}>Save Changes</Text></>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={webStyles.editBtnHeader} onPress={() => setEdit(true)}>
                  <Ionicons name="create-outline" size={16} color="#2563eb" />
                  <Text style={webStyles.editBtnHeaderText}>Edit Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* TWO COLUMN LAYOUT */}
        <View style={isWideScreen ? webStyles.twoColLayout : webStyles.oneColLayout}>

          {/* LEFT — PROFILE DETAILS */}
          <View style={isWideScreen ? webStyles.leftCol : webStyles.fullCol}>
            <View style={webStyles.section}>
              <View style={webStyles.sectionHeader}>
                <Ionicons name="person-outline" size={18} color="#2563eb" />
                <Text style={webStyles.sectionTitle}>Personal Information</Text>
              </View>

              <WebField label="Phone" value={profile.phone} editable={edit} icon="call-outline" onChange={(v) => setProfile({ ...profile, phone: v })} />
              <WebField label="Address" value={profile.address} editable={edit} icon="location-outline" multiline onChange={(v) => setProfile({ ...profile, address: v })} />
              <WebField label="Year" value={profile.year} editable={edit} icon="calendar-outline" onChange={(v) => setProfile({ ...profile, year: v })} />
              <WebField label="Department" value={profile.department} editable={edit} icon="business-outline" onChange={(v) => setProfile({ ...profile, department: v })} />
            </View>
          </View>

          {/* RIGHT — CHANGE PASSWORD */}
          <View style={isWideScreen ? webStyles.rightCol : webStyles.fullCol}>
            <View style={webStyles.section}>
              <View style={webStyles.sectionHeader}>
                <Ionicons name="lock-closed-outline" size={18} color="#7c3aed" />
                <Text style={webStyles.sectionTitle}>Change Password</Text>
              </View>

              <WebField label="Current Password" value={passwordForm.oldPassword} editable icon="lock-closed-outline" secureTextEntry onChange={(v) => setPasswordForm((p) => ({ ...p, oldPassword: v }))} />
              <WebField label="New Password" value={passwordForm.newPassword} editable icon="lock-open-outline" secureTextEntry onChange={(v) => setPasswordForm((p) => ({ ...p, newPassword: v }))} />
              <WebField label="Confirm New Password" value={passwordForm.confirmPassword} editable icon="checkmark-circle-outline" secureTextEntry onChange={(v) => setPasswordForm((p) => ({ ...p, confirmPassword: v }))} />

              <TouchableOpacity
                style={[webStyles.updatePasswordBtn, passwordSaving && { opacity: 0.7 }]}
                onPress={changePassword}
                disabled={passwordSaving}
              >
                {passwordSaving ? <ActivityIndicator color="#fff" size="small" /> : (
                  <><Ionicons name="key-outline" size={18} color="#fff" /><Text style={webStyles.updatePasswordBtnText}>Update Password</Text></>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={webStyles.footer}>© 2025 ESDM Virtual Lab · Student Portal</Text>
      </View>
    </ScrollView>
  );
}

/* ─── SHARED INPUT COMPONENTS ─── */
function ProfileField({ label, value, editable, onChange, multiline, secureTextEntry = false }) {
  return (
    <View style={mobileStyles.inputGroup}>
      <Text style={mobileStyles.label}>{label}</Text>
      <TextInput
        value={value} editable={editable} multiline={multiline}
        secureTextEntry={secureTextEntry} onChangeText={onChange}
        placeholder={`Enter ${label}`}
        style={[mobileStyles.input, !editable && mobileStyles.disabledInput, multiline && { height: 80 }]}
      />
    </View>
  );
}

function WebField({ label, value, editable, onChange, multiline, secureTextEntry = false, icon }) {
  return (
    <View style={webStyles.fieldGroup}>
      <Text style={webStyles.fieldLabel}>{label}</Text>
      <View style={[webStyles.fieldInputWrap, !editable && webStyles.fieldInputDisabled]}>
        <Ionicons name={icon} size={17} color="#94a3b8" />
        <TextInput
          value={value || ""} editable={editable} multiline={multiline}
          secureTextEntry={secureTextEntry} onChangeText={onChange}
          placeholder={editable ? `Enter ${label}` : "Not set"}
          placeholderTextColor="#94a3b8"
          style={[webStyles.fieldInput, multiline && { height: 80, textAlignVertical: "top" }]}
        />
      </View>
    </View>
  );
}

/* ─────────────── MOBILE STYLES ─────────────── */
const mobileStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  header: { alignItems: "center", paddingVertical: 30, backgroundColor: "#2563eb", borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: "#fff" },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },
  cameraIcon: { position: "absolute", bottom: 0, right: 10, backgroundColor: "#2563eb", padding: 6, borderRadius: 20 },
  name: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 10 },
  email: { color: "#c7d2fe", fontSize: 14, marginTop: 4 },
  card: { backgroundColor: "#fff", margin: 16, padding: 20, borderRadius: 20, elevation: 6 },
  inputGroup: { marginBottom: 16 },
  label: { color: "#64748b", marginBottom: 6, fontWeight: "600" },
  input: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e2e8f0", fontSize: 15 },
  disabledInput: { backgroundColor: "#f1f5f9", color: "#94a3b8" },
  editBtn: { marginTop: 10, borderWidth: 1, borderColor: "#2563eb", borderRadius: 14, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  editText: { color: "#2563eb", fontWeight: "700", marginLeft: 8 },
  saveBtn: { marginTop: 10, backgroundColor: "#16a34a", borderRadius: 14, paddingVertical: 16, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15, marginLeft: 8 },
  passwordSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  passwordTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  changePasswordBtn: { marginTop: 6, backgroundColor: "#0f172a", borderRadius: 12, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  changePasswordText: { color: "#fff", fontSize: 14, fontWeight: "700", marginLeft: 8 },
});

/* ─────────────── WEB STYLES ─────────────── */
const webStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  rootContent: { flexGrow: 1, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  inner: { width: "100%", maxWidth: 1000 },

  // PROFILE HEADER CARD
  profileHeaderCard: { backgroundColor: "#fff", borderRadius: 20, marginBottom: 24, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  profileHeaderBg: { height: 80, backgroundColor: "#2563eb" },
  profileHeaderContent: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 24, paddingBottom: 20, marginTop: -40 },
  avatarWrap: { position: "relative" },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: "#fff" },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#e2e8f0", borderWidth: 4, borderColor: "#fff", justifyContent: "center", alignItems: "center" },
  cameraBtn: { position: "absolute", bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  profileHeaderInfo: { flex: 1, marginLeft: 16, paddingBottom: 4 },
  profileName: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  profileEmail: { fontSize: 13, color: "#64748b", marginTop: 2 },
  roleBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#eff6ff", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginTop: 8, borderWidth: 1, borderColor: "#bfdbfe" },
  roleBadgeText: { fontSize: 12, fontWeight: "700", color: "#2563eb", marginLeft: 4 },
  headerActions: { paddingBottom: 4 },
  editBtnHeader: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#2563eb", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  editBtnHeaderText: { color: "#2563eb", fontWeight: "700", marginLeft: 6 },
  saveBtnHeader: { flexDirection: "row", alignItems: "center", backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  saveBtnHeaderText: { color: "#fff", fontWeight: "700", marginLeft: 6 },

  // LAYOUT
  twoColLayout: { flexDirection: "row", alignItems: "flex-start" },
  oneColLayout: { flexDirection: "column" },
  leftCol: { flex: 1, marginRight: 16 },
  rightCol: { flex: 1 },
  fullCol: { marginBottom: 16 },

  // SECTION
  section: { backgroundColor: "#fff", borderRadius: 18, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginLeft: 8 },

  // FIELD
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  fieldInputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#f8fafc" },
  fieldInputDisabled: { backgroundColor: "#f1f5f9" },
  fieldInput: { flex: 1, fontSize: 15, color: "#0f172a", marginLeft: 10 },

  updatePasswordBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a", borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  updatePasswordBtnText: { color: "#fff", fontWeight: "700", marginLeft: 8 },

  footer: { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});