import Select from "@/components/Select";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { Gender, supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Shared option sets ──────────────────────────────────────

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const SPECIALIZATION_OPTIONS = [
  "Endocrinologist",
  "Diabetologist",
  "General Practitioner",
  "Internal Medicine",
  "Cardiologist",
  "Nutritionist",
  "Pediatrician",
  "Other",
];

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  styles,
}: {
  icon: string;
  title: string;
  styles: any;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function FieldLabel({ text, styles }: { text: string; styles: any }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function InfoRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string | null | undefined;
  styles: any;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

function ChipGroup<T extends string>({
  options,
  value,
  onSelect,
  styles,
}: {
  options: { label: string; value: T }[];
  value: T | null;
  onSelect: (v: T) => void;
  styles: any;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          style={[styles.chip, value === o.value && styles.chipActive]}
          onPress={() => onSelect(o.value)}
        >
          <Text
            style={[
              styles.chipText,
              value === o.value && styles.chipTextActive,
            ]}
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DoctorProfileScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { session, profile, refreshProfile, logout } = useAuth();
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ── local editable state (mirrors profile) ────────────────────────────────
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    birth_date: null as Date | null,
    gender: null as Gender | null,
    wilaya: "",
    commune: "",
    specialization: "",
    medical_license: "",
    hospital_name: "",
    experience_years: "",
    bio: "",
    avatar_url: null as string | null,
    work_lat: null as number | null,
    work_lng: null as number | null,
  });

  const [wilayas, setWilayas] = useState<string[]>([]);
  const [communes, setCommunes] = useState<string[]>([]);
  const [fetchingLocations, setFetchingLocations] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch unique Wilayas on mount
  useEffect(() => {
    const fetchWilayas = async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("admin_name")
        .order("admin_name");

      if (data && !error) {
        const unique = Array.from(
          new Set(data.map((d) => d.admin_name)),
        ).sort();
        setWilayas(unique);
      }
    };
    fetchWilayas();
  }, []);

  // Fetch Communes when Wilaya changes
  useEffect(() => {
    const fetchCommunes = async () => {
      if (!form.wilaya) {
        setCommunes([]);
        return;
      }
      setFetchingLocations(true);
      const wilayaName = form.wilaya.trim();

      const { data, error } = await supabase
        .from("locations")
        .select("city")
        .ilike("admin_name", wilayaName)
        .order("city");

      if (data && !error) {
        setCommunes(data.map((d) => d.city));
      }
      setFetchingLocations(false);
    };
    fetchCommunes();
  }, [form.wilaya]);

  // Sync form from profile
  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      birth_date: profile.birth_date ? new Date(profile.birth_date) : null,
      gender: profile.gender ?? null,
      wilaya: profile.wilaya ?? "",
      commune: profile.commune ?? "",
      specialization: profile.specialization ?? "",
      medical_license: profile.medical_license ?? "",
      hospital_name: profile.hospital_name ?? "",
      experience_years: profile.experience_years?.toString() ?? "",
      bio: profile.bio ?? "",
      avatar_url: profile.avatar_url ?? null,
      work_lat: profile.work_lat ?? null,
      work_lng: profile.work_lng ?? null,
    });
  }, [profile]);

  const cancelEdit = () => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        birth_date: profile.birth_date ? new Date(profile.birth_date) : null,
        gender: profile.gender ?? null,
        wilaya: profile.wilaya ?? "",
        commune: profile.commune ?? "",
        specialization: profile.specialization ?? "",
        medical_license: profile.medical_license ?? "",
        hospital_name: profile.hospital_name ?? "",
        experience_years: profile.experience_years?.toString() ?? "",
        bio: profile.bio ?? "",
        avatar_url: profile.avatar_url ?? null,
        work_lat: profile.work_lat ?? null,
        work_lng: profile.work_lng ?? null,
      });
    }
    setEditMode(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      const publicUrl = await uploadImage(result.assets[0].uri);
      if (publicUrl) {
        setForm((f) => ({ ...f, avatar_url: publicUrl }));
      }
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      if (!session?.user?.id) return null;
      setUploadingImage(true);

      const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${session.user.id}-${Date.now()}.${ext}`;
      const filePath = `${session.user.id}/${fileName}`;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      const arrayBuffer = Buffer.from(base64, "base64");

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, arrayBuffer, {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setUploadingImage(false);
      return `${publicUrl}?t=${Date.now()}`;
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Upload Failed", "There was an error saving your image.");
      setUploadingImage(false);
      return null;
    }
  };

  const setLocationToCurrent = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("common.error", "Error"),
          t(
            "doctor.profile.location_permission",
            "Allow location access to set your workplace.",
          ),
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setForm((f) => ({
        ...f,
        work_lat: loc.coords.latitude,
        work_lng: loc.coords.longitude,
      }));
      Alert.alert(
        t("common.success", "Success"),
        t(
          "doctor.profile.location_success",
          "Work location set to your current position.",
        ),
      );
    } catch (err) {
      Alert.alert(
        t("common.error", "Error"),
        t("doctor.profile.location_error", "Could not fetch current location."),
      );
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim() || null,
        phone: form.phone.trim() || null,
        birth_date: form.birth_date?.toISOString().split("T")[0] ?? null,
        gender: form.gender,
        wilaya: form.wilaya || null,
        commune: form.commune.trim() || null,
        specialization: form.specialization || null,
        medical_license: form.medical_license.trim() || null,
        hospital_name: form.hospital_name.trim() || null,
        experience_years: form.experience_years
          ? parseInt(form.experience_years)
          : null,
        bio: form.bio.trim() || null,
        avatar_url: form.avatar_url || null,
        work_lat: form.work_lat,
        work_lng: form.work_lng,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    setSaving(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    await refreshProfile();
    setEditMode(false);
  };

  const initials = (profile?.full_name ?? "D")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const birthDateLabel = form.birth_date
    ? form.birth_date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : t("doctor.profile.not_set", "Not set");

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Top bar ───────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>
          {t("doctor.profile.title", "My Profile")}
        </Text>
        <View style={styles.topBarActions}>
          {editMode ? (
            <>
              <Pressable style={styles.btnCancel} onPress={cancelEdit}>
                <Text style={styles.btnCancelText}>
                  {t("common.cancel", "Cancel")}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.btnSave, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnSaveText}>
                    {t("common.save", "Save")}
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <View style={styles.topBarActionsRight}>
              <Pressable
                style={styles.btnEdit}
                onPress={() => setEditMode(true)}
              >
                <Text style={styles.btnEditText}>
                  {t("common.edit", "✏️ Edit")}
                </Text>
              </Pressable>

              <Pressable
                style={styles.btnSettings}
                onPress={() => router.push("/(doctor)/settings")}
              >
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={theme.text}
                />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar card ───────────────────────────────────────── */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarSection}>
            <Pressable
              onPress={editMode ? pickImage : undefined}
              style={[styles.avatar, editMode && styles.avatarEditable]}
            >
              {form.avatar_url ? (
                <Image
                  source={{ uri: form.avatar_url }}
                  style={styles.avatarImg}
                />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}

              {editMode && (
                <View style={styles.avatarOverlay}>
                  {uploadingImage ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="camera" size={20} color="#fff" />
                  )}
                </View>
              )}
            </Pressable>
          </View>

          <Text style={styles.avatarName}>
            {profile?.full_name ?? t("common.doctor", "Doctor")}
          </Text>
          <Text style={styles.avatarSub}>
            {profile?.specialization ??
              t(
                "doctor.profile.specialization_not_set",
                "Specialization Not Set",
              )}
          </Text>

          {profile?.hospital_name && (
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>
                  {profile.experience_years ?? 0}{" "}
                  {t("doctor.profile.yrs", "yrs")}
                </Text>
                <Text style={styles.statLabel}>
                  {t("doctor.profile.exp", "Exp")}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Professional Info ─────────────────────────────────── */}
        <View style={styles.card}>
          <SectionHeader
            icon="🎓"
            title={t(
              "doctor.profile.professional_details",
              "Professional Details",
            )}
            styles={styles}
          />

          {editMode ? (
            <>
              <Select
                label={t("doctor.profile.specialization", "Specialization *")}
                placeholder={t(
                  "doctor.profile.choose_specialty",
                  "Choose specialty",
                )}
                options={SPECIALIZATION_OPTIONS}
                value={form.specialization}
                onSelect={(v) => setForm((f) => ({ ...f, specialization: v }))}
              />

              <FieldLabel
                text={t("doctor.profile.medical_license", "Medical License ID")}
                styles={styles}
              />
              <TextInput
                style={styles.input}
                placeholderTextColor={theme.textMuted}
                placeholder={t(
                  "doctor.profile.license_number",
                  "License number",
                )}
                value={form.medical_license}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, medical_license: v }))
                }
              />

              <FieldLabel
                text={t("doctor.profile.workplace", "Current Workplace")}
                styles={styles}
              />
              <TextInput
                style={styles.input}
                placeholderTextColor={theme.textMuted}
                placeholder={t(
                  "doctor.profile.workplace_placeholder",
                  "Hospital/Clinic name",
                )}
                value={form.hospital_name}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, hospital_name: v }))
                }
              />

              <FieldLabel
                text={t(
                  "doctor.profile.experience_years",
                  "Years of Experience",
                )}
                styles={styles}
              />
              <TextInput
                style={styles.input}
                placeholderTextColor={theme.textMuted}
                placeholder={t(
                  "doctor.profile.experience_placeholder",
                  "e.g. 10",
                )}
                keyboardType="number-pad"
                value={form.experience_years}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, experience_years: v }))
                }
              />

              <FieldLabel
                text={t("doctor.profile.bio", "Professional Bio")}
                styles={styles}
              />
              <TextInput
                style={[
                  styles.input,
                  { height: 100, textAlignVertical: "top" },
                ]}
                placeholderTextColor={theme.textMuted}
                placeholder={t(
                  "doctor.profile.bio_placeholder",
                  "Describe your background...",
                )}
                multiline
                numberOfLines={4}
                value={form.bio}
                onChangeText={(v) => setForm((f) => ({ ...f, bio: v }))}
              />

              <SectionHeader
                icon="📍"
                title={t("doctor.profile.work_location", "Work Location")}
                styles={styles}
              />
              <View style={styles.locationSection}>
                <Text style={styles.locationDesc}>
                  Set your clinic or hospital location so patients can find you
                  on the map.
                </Text>
                <Pressable
                  style={styles.locationBtn}
                  onPress={setLocationToCurrent}
                >
                  <Ionicons name="location" size={20} color="#fff" />
                  <Text style={styles.locationBtnText}>
                    {t(
                      "doctor.profile.set_current_position",
                      "Set to Current Position",
                    )}
                  </Text>
                </Pressable>
                <View style={styles.row2}>
                  <View style={styles.col2}>
                    <FieldLabel
                      text={t("doctor.profile.latitude", "Latitude")}
                      styles={styles}
                    />
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={form.work_lat?.toString() || ""}
                      onChangeText={(v) =>
                        setForm((f) => ({
                          ...f,
                          work_lat: parseFloat(v) || null,
                        }))
                      }
                    />
                  </View>
                  <View style={styles.col2}>
                    <FieldLabel
                      text={t("doctor.profile.longitude", "Longitude")}
                      styles={styles}
                    />
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={form.work_lng?.toString() || ""}
                      onChangeText={(v) =>
                        setForm((f) => ({
                          ...f,
                          work_lng: parseFloat(v) || null,
                        }))
                      }
                    />
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
              <InfoRow
                label={t("doctor.profile.specialty_label", "Specialty")}
                value={profile?.specialization}
                styles={styles}
              />
              <InfoRow
                label={t("doctor.profile.license_label", "License")}
                value={profile?.medical_license}
                styles={styles}
              />
              <InfoRow
                label={t("doctor.profile.workplace_label", "Workplace")}
                value={profile?.hospital_name}
                styles={styles}
              />
              <InfoRow
                label={t("doctor.profile.experience_label", "Experience")}
                value={
                  profile?.experience_years
                    ? `${profile.experience_years} years`
                    : null
                }
                styles={styles}
              />
              <View style={styles.bioSection}>
                <FieldLabel text="Bio" styles={styles} />
                <Text style={styles.bioText}>
                  {profile?.bio ||
                    t("doctor.profile.no_bio", "No bio provided")}
                </Text>
              </View>
              <InfoRow
                label={t("doctor.profile.work_location", "Work Location")}
                value={
                  profile?.work_lat
                    ? `${profile.work_lat.toFixed(4)}, ${profile.work_lng?.toFixed(4)}`
                    : t("doctor.profile.not_set", "Not set")
                }
                styles={styles}
              />
            </>
          )}
        </View>

        {/* ── Personal Info ─────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionHeader
            icon="👤"
            title={t("doctor.profile.personal_info", "Personal Information")}
            styles={styles}
          />

          {editMode ? (
            <>
              <FieldLabel
                text={t("doctor.profile.full_name", "Full Name")}
                styles={styles}
              />
              <TextInput
                style={styles.input}
                placeholderTextColor={theme.textMuted}
                placeholder="Ahmed Benali"
                value={form.full_name}
                onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))}
              />

              <FieldLabel
                text={t("doctor.profile.phone", "Phone")}
                styles={styles}
              />
              <TextInput
                style={styles.input}
                placeholderTextColor={theme.textMuted}
                placeholder="+213 555 000 000"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              />

              <FieldLabel
                text={t("doctor.profile.dob", "Date of Birth")}
                styles={styles}
              />
              <Pressable
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={
                    form.birth_date ? styles.dateText : styles.datePlaceholder
                  }
                >
                  {birthDateLabel}
                </Text>
                <Text>📅</Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={form.birth_date ?? new Date(1990, 0, 1)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={new Date()}
                  onChange={(_, date) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (date) setForm((f) => ({ ...f, birth_date: date }));
                  }}
                />
              )}

              <FieldLabel
                text={t("doctor.profile.gender", "Gender")}
                styles={styles}
              />
              <ChipGroup
                options={GENDER_OPTIONS}
                value={form.gender}
                onSelect={(v) => setForm((f) => ({ ...f, gender: v }))}
                styles={styles}
              />

              <Select
                label={t("doctor.profile.wilaya", "Wilaya *")}
                placeholder={t(
                  "doctor.profile.select_wilaya",
                  "Select province",
                )}
                options={wilayas}
                value={form.wilaya}
                onSelect={(w) => {
                  setForm((f) => ({ ...f, wilaya: w, commune: "" }));
                }}
              />

              <Select
                label={t("doctor.profile.commune", "Commune *")}
                placeholder={
                  form.wilaya
                    ? t("doctor.profile.select_commune", "Select commune")
                    : t(
                        "doctor.profile.select_wilaya_first",
                        "First select a wilaya",
                      )
                }
                options={communes}
                value={form.commune}
                onSelect={(v) => setForm((f) => ({ ...f, commune: v }))}
                error={
                  !form.wilaya ? "Please select a wilaya first" : undefined
                }
              />
            </>
          ) : (
            <>
              <InfoRow
                label={t("doctor.profile.full_name", "Full Name")}
                value={profile?.full_name}
                styles={styles}
              />
              <InfoRow
                label={t("doctor.profile.phone", "Phone")}
                value={profile?.phone}
                styles={styles}
              />
              <InfoRow
                label={t("doctor.profile.dob", "Date of Birth")}
                value={
                  birthDateLabel !== t("doctor.profile.not_set", "Not set")
                    ? birthDateLabel
                    : null
                }
                styles={styles}
              />
              <InfoRow
                label={t("doctor.profile.gender", "Gender")}
                value={
                  profile?.gender
                    ? profile.gender.charAt(0).toUpperCase() +
                      profile.gender.slice(1)
                    : null
                }
                styles={styles}
              />
              <InfoRow
                label={t("doctor.profile.wilaya", "Wilaya *")}
                value={profile?.wilaya}
                styles={styles}
              />
              <InfoRow
                label={t("doctor.profile.commune", "Commune *")}
                value={profile?.commune}
                styles={styles}
              />
            </>
          )}
        </View>

        {/* ── Logout ───────────────────────────────────────────────── */}
        {!editMode && (
          <Pressable
            style={styles.btnLogout}
            onPress={() =>
              Alert.alert(
                t("common.sign_out", "Sign Out"),
                t(
                  "common.confirm_sign_out",
                  "Are you sure you want to sign out?",
                ),
                [
                  { text: t("common.cancel", "Cancel"), style: "cancel" },
                  {
                    text: t("common.sign_out", "Sign Out"),
                    style: "destructive",
                    onPress: logout,
                  },
                ],
              )
            }
          >
            <Text style={styles.btnLogoutText}>
              {t("common.sign_out", "Sign Out")}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },

    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    topBarTitle: { fontSize: 18, fontWeight: "700", color: theme.text },
    topBarActions: { flexDirection: "row", gap: 8 },
    topBarActionsRight: { flexDirection: "row", alignItems: "center", gap: 12 },

    btnEdit: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: theme.primary + "1a",
    },
    btnEditText: { fontSize: 13, color: theme.primary, fontWeight: "600" },

    btnSettings: {
      padding: 4,
      marginLeft: 4,
    },

    btnCancel: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    btnCancelText: { fontSize: 13, color: theme.secondary, fontWeight: "600" },

    btnSave: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: theme.primary,
      minWidth: 60,
      alignItems: "center",
    },
    btnSaveText: { fontSize: 13, color: "#fff", fontWeight: "700" },
    btnDisabled: { opacity: 0.6 },

    scroll: { padding: 16, paddingBottom: 48 },

    avatarCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      marginBottom: 16,
      shadowColor: theme.textMuted,
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    avatarSection: {
      alignItems: "center",
      marginBottom: 12,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      borderWidth: 3,
      borderColor: theme.card,
      shadowColor: theme.textMuted,
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
      overflow: "hidden",
    },
    avatarEditable: {
      borderColor: theme.primary + "33",
    },
    avatarImg: {
      width: "100%",
      height: "100%",
    },
    avatarOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.3)",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 24, fontWeight: "700", color: "#fff" },
    avatarName: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 2,
    },
    avatarSub: { fontSize: 13, color: theme.secondary, marginBottom: 16 },
    statsRow: { flexDirection: "row", gap: 12 },
    statPill: {
      alignItems: "center",
      backgroundColor: theme.primary + "1a",
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    statValue: { fontSize: 16, fontWeight: "700", color: theme.primary },
    statLabel: { fontSize: 10, color: theme.secondary, marginTop: 2 },

    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      gap: 12,
      marginBottom: 16,
      shadowColor: theme.textMuted,
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    sectionIcon: { fontSize: 18 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: theme.text },

    fieldLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.secondary,
      marginBottom: 4,
    },

    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    infoLabel: { fontSize: 13, color: theme.textMuted, fontWeight: "500" },
    infoValue: {
      fontSize: 13,
      color: theme.text,
      fontWeight: "600",
      maxWidth: "55%",
      textAlign: "right",
    },

    input: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      color: theme.text,
    },

    dateButton: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dateText: { fontSize: 14, color: theme.text },
    datePlaceholder: { fontSize: 14, color: theme.textMuted },

    row2: { flexDirection: "row", gap: 12 },
    col2: { flex: 1 },

    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    chipActive: {
      backgroundColor: theme.primary + "1a",
      borderColor: theme.primary + "33",
    },
    chipText: { fontSize: 12, color: theme.secondary, fontWeight: "500" },
    chipTextActive: { color: theme.primary, fontWeight: "600" },

    bioSection: { marginTop: 4 },
    bioText: { fontSize: 13, color: "#334155", lineHeight: 20, marginTop: 4 },

    btnLogout: {
      marginTop: 8,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#fecaca",
      backgroundColor: "#fff5f5",
      alignItems: "center",
    },
    btnLogoutText: { fontSize: 15, color: "#dc2626", fontWeight: "600" },
    locationSection: { paddingVertical: 8 },
    locationDesc: {
      fontSize: 13,
      color: "#64748b",
      marginBottom: 12,
      lineHeight: 18,
    },
    locationBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#00008B",
      borderRadius: 10,
      paddingVertical: 12,
      gap: 8,
      marginBottom: 16,
    },
    locationBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  });
