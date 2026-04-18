import Select from "@/components/Select";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  ActivityLevel,
  DiabetesType,
  Gender,
  InsulinRegimen,
  supabase,
} from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonalForm {
  full_name: string;
  phone: string;
  birth_date: Date | null;
  gender: Gender | null;
  weight_kg: string;
  height_cm: string;
  wilaya: string;
  commune: string;
  avatar_url: string | null;
}

interface DiabetesForm {
  diabetes_type: DiabetesType | null;
  diagnosis_year: string;
  hba1c: string;
  target_glucose_min: string;
  target_glucose_max: string;
  insulin_regimen: InsulinRegimen | null;
  uses_cgm: boolean;
  activity_level: ActivityLevel | null;
  has_hypertension: boolean;
  has_dyslipidemia: boolean;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

interface DoctorForm {
  specialization: string;
  medical_license: string;
  hospital_name: string;
  experience_years: string;
  bio: string;
}

// ─── Option sets ──────────────────────────────────────────────────────────────

const GENDER_OPTIONS: { labelKey: string; value: Gender }[] = [
  { labelKey: "profile_setup.male", value: "male" },
  { labelKey: "profile_setup.female", value: "female" },
];

const SPECIALIZATION_OPTIONS = [
  "endocrinologist",
  "diabetologist",
  "general_practitioner",
  "internal_medicine",
  "cardiologist",
  "nutritionist",
  "pediatrician",
  "other",
];

const DIABETES_TYPES: { labelKey: string; value: DiabetesType; descKey: string }[] = [
  { labelKey: "enums.diabetes_type.type1", value: "type1", descKey: "enums.diabetes_desc.type1" },
  { labelKey: "enums.diabetes_type.type2", value: "type2", descKey: "enums.diabetes_desc.type2" },
  { labelKey: "enums.diabetes_type.gestational", value: "gestational", descKey: "enums.diabetes_desc.gestational" },
  { labelKey: "enums.diabetes_type.prediabetes", value: "prediabetes", descKey: "enums.diabetes_desc.prediabetes" },
  { labelKey: "enums.diabetes_type.other", value: "other", descKey: "enums.diabetes_desc.other" },
];

const INSULIN_OPTIONS: { labelKey: string; value: InsulinRegimen }[] = [
  { labelKey: "enums.insulin_regimen.none", value: "none" },
  { labelKey: "enums.insulin_regimen.basal_only", value: "basal_only" },
  { labelKey: "enums.insulin_regimen.basal_bolus", value: "basal_bolus" },
  { labelKey: "enums.insulin_regimen.pump", value: "pump" },
  { labelKey: "enums.insulin_regimen.premixed", value: "premixed" },
];

const ACTIVITY_OPTIONS: {
  labelKey: string;
  value: ActivityLevel;
  emoji: string;
}[] = [
    { labelKey: "enums.activity_level.sedentary", value: "sedentary", emoji: "🛋️" },
    { labelKey: "enums.activity_level.light", value: "light", emoji: "🚶" },
    { labelKey: "enums.activity_level.moderate", value: "moderate", emoji: "🚴" },
    { labelKey: "enums.activity_level.active", value: "active", emoji: "🏃" },
    { labelKey: "enums.activity_level.very_active", value: "very_active", emoji: "🏋️" },
  ];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function FieldLabel({ text }: { text: string }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function StyledInput(props: React.ComponentProps<typeof TextInput>) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <TextInput
      style={styles.input}
      placeholderTextColor={theme.textMuted}
      {...props}
    />
  );
}

function ChipGroup<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: { label?: string; labelKey?: string; value: T }[];
  value: T | null;
  onSelect: (v: T) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
            {o.labelKey ? t(o.labelKey) : o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Pressable
        style={[styles.toggle, value && styles.toggleOn]}
        onPress={onToggle}
      >
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </Pressable>
    </View>
  );
}

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current && styles.dotActive,
            i < current && styles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TOTAL_STEPS = 2;

export default function ProfileSetupScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { session, refreshProfile, role } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Locations State
  const [wilayas, setWilayas] = useState<string[]>([]);
  const [communes, setCommunes] = useState<string[]>([]);
  const [fetchingLocations, setFetchingLocations] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [personal, setPersonal] = useState<PersonalForm>({
    full_name: "",
    phone: "",
    birth_date: null,
    gender: null,
    weight_kg: "",
    height_cm: "",
    wilaya: "",
    commune: "",
    avatar_url: null,
  });

  const [diabetes, setDiabetes] = useState<DiabetesForm>({
    diabetes_type: null,
    diagnosis_year: "",
    hba1c: "",
    target_glucose_min: "80",
    target_glucose_max: "180",
    insulin_regimen: null,
    uses_cgm: false,
    activity_level: null,
    has_hypertension: false,
    has_dyslipidemia: false,
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const [doctor, setDoctor] = useState<DoctorForm>({
    specialization: "",
    medical_license: "",
    hospital_name: "",
    experience_years: "",
    bio: "",
  });

  // Fetch unique Wilayas on mount
  useEffect(() => {
    const fetchWilayas = async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("admin_name")
        .order("admin_name");

      console.log("fetchWilayas result:", { count: data?.length, error });
      if (data && !error) {
        const unique = Array.from(
          new Set(data.map((d) => d.admin_name)),
        ).sort();
        console.log("Unique wilayas count:", unique.length);
        setWilayas(unique);
      } else if (error) {
        console.error("Error fetching wilayas:", error);
      }
    };
    fetchWilayas();
  }, []);

  // Fetch Communes when Wilaya changes
  useEffect(() => {
    const fetchCommunes = async () => {
      if (!personal.wilaya) {
        setCommunes([]);
        return;
      }
      setFetchingLocations(true);
      console.log("Fetching communes for wilaya:", `"${personal.wilaya}"`);
      const { data, error } = await supabase
        .from("locations")
        .select("city")
        .eq("admin_name", personal.wilaya.trim())
        .order("city", { ascending: true });

      console.log("fetchCommunes result:", { count: data?.length, error });
      if (data && !error) {
        setCommunes(data.map((d) => d.city));
      } else if (error) {
        console.error("Error fetching communes:", error);
      }
      setFetchingLocations(false);
    };
    fetchCommunes();
  }, [personal.wilaya]);

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
        setPersonal((p) => ({ ...p, avatar_url: publicUrl }));
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

      // 1. Read file as Base64 and convert to Buffer (Most robust method)
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      const arrayBuffer = Buffer.from(base64, "base64");

      // 2. Upload to Supabase as ArrayBuffer
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, arrayBuffer, {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (error) throw error;

      // 3. Get Public URL with cache busting
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setUploadingImage(false);
      return `${publicUrl}?t=${Date.now()}`;
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert(
        t("profile_setup.upload_failed", "Upload Failed"),
        t(
          "profile_setup.upload_error",
          "There was an error saving your image.",
        ),
      );
      setUploadingImage(false);
      return null;
    }
  };

  const animateTransition = (cb: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      cb();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const goNext = () => {
    // Validate step 0
    if (step === 0) {
      if (!personal.full_name.trim()) {
        Alert.alert(
          t("profile_setup.required", "Required"),
          t("profile_setup.enter_full_name", "Please enter your full name."),
        );
        return;
      }
      if (!personal.birth_date) {
        Alert.alert(
          t("profile_setup.required", "Required"),
          t(
            "profile_setup.select_birth_date",
            "Please select your birth date.",
          ),
        );
        return;
      }
      if (!personal.gender) {
        Alert.alert(
          t("profile_setup.required", "Required"),
          t("profile_setup.select_gender", "Please select your gender."),
        );
        return;
      }
      if (!personal.wilaya) {
        Alert.alert(
          t("profile_setup.required", "Required"),
          t("profile_setup.select_wilaya", "Please select your wilaya."),
        );
        return;
      }
      if (!personal.commune) {
        Alert.alert(
          t("profile_setup.required", "Required"),
          t("profile_setup.select_commune", "Please select your commune."),
        );
        return;
      }
    }
    animateTransition(() => setStep((s) => s + 1));
  };

  const goBack = () => animateTransition(() => setStep((s) => s - 1));

  const handleSave = async () => {
    if (role === "patient" && !diabetes.diabetes_type) {
      Alert.alert(
        t("profile_setup.required", "Required"),
        t(
          "profile_setup.select_diabetes_type",
          "Please select your diabetes type.",
        ),
      );
      return;
    }
    if (
      role === "doctor" &&
      (!doctor.specialization || !doctor.medical_license)
    ) {
      Alert.alert(
        t("profile_setup.required", "Required"),
        t(
          "profile_setup.select_specialization",
          "Please provide your specialization and medical license.",
        ),
      );
      return;
    }
    if (!session?.user?.id) return;

    setSaving(true);
    const commonData = {
      id: session.user.id,
      role: role || "patient",
      full_name: personal.full_name.trim() || null,
      phone: personal.phone.trim() || null,
      birth_date: personal.birth_date?.toISOString().split("T")[0] ?? null,
      gender: personal.gender,
      wilaya: personal.wilaya || null,
      commune: personal.commune.trim() || null,
      avatar_url: personal.avatar_url || null,
      profile_complete: true,
      updated_at: new Date().toISOString(),
    };

    let roleData = {};
    if (role === "patient") {
      roleData = {
        weight_kg: personal.weight_kg ? parseFloat(personal.weight_kg) : null,
        height_cm: personal.height_cm ? parseFloat(personal.height_cm) : null,
        diabetes_type: diabetes.diabetes_type,
        diagnosis_year: diabetes.diagnosis_year
          ? parseInt(diabetes.diagnosis_year)
          : null,
        hba1c: diabetes.hba1c ? parseFloat(diabetes.hba1c) : null,
        target_glucose_min: diabetes.target_glucose_min
          ? parseInt(diabetes.target_glucose_min)
          : null,
        target_glucose_max: diabetes.target_glucose_max
          ? parseInt(diabetes.target_glucose_max)
          : null,
        insulin_regimen: diabetes.insulin_regimen,
        uses_cgm: diabetes.uses_cgm,
        activity_level: diabetes.activity_level,
        has_hypertension: diabetes.has_hypertension,
        has_dyslipidemia: diabetes.has_dyslipidemia,
        emergency_contact_name: diabetes.emergency_contact_name.trim() || null,
        emergency_contact_phone:
          diabetes.emergency_contact_phone.trim() || null,
      };
    } else if (role === "doctor") {
      roleData = {
        specialization: doctor.specialization,
        medical_license: doctor.medical_license.trim(),
        hospital_name: doctor.hospital_name.trim() || null,
        experience_years: doctor.experience_years
          ? parseInt(doctor.experience_years)
          : null,
        bio: doctor.bio.trim() || null,
      };
    }

    const { error } = await supabase.from("profiles").upsert({
      ...commonData,
      ...roleData,
    });

    setSaving(false);

    if (error) {
      Alert.alert(t("common.error", "Error"), error.message);
      return;
    }

    await refreshProfile();
    if (role === "doctor") {
      router.replace("/(doctor)/feed");
    } else {
      router.replace("/(patient)/feed");
    }
  };

  // Format birth date display
  const birthDateLabel = personal.birth_date
    ? personal.birth_date.toLocaleDateString(t("common.locale", { defaultValue: "en-GB" }), {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    : t("profile_setup.select_date", "Select date");

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {step === 0
              ? t("profile_setup.personal_info")
              : role === "doctor"
                ? t("profile_setup.professional_info")
                : t("profile_setup.diabetes_info")}
          </Text>
          <Text style={styles.headerSub}>
            {t("profile_setup.step_progress", { current: step + 1, total: TOTAL_STEPS })}
          </Text>
        </View>
        <StepDots current={step} total={TOTAL_STEPS} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 ? (
            /* ── Step 1: Personal ─────────────────────────────────── */
            <View style={styles.formCard}>
              <SectionLabel
                text={t("profile_setup.basic_details", "BASIC DETAILS")}
              />

              <View style={styles.avatarContainer}>
                <Pressable onPress={pickImage} style={styles.avatarWrapper}>
                  {personal.avatar_url ? (
                    <Image
                      source={{ uri: personal.avatar_url }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons
                        name="camera-outline"
                        size={32}
                        color="#94a3b8"
                      />
                    </View>
                  )}
                  {uploadingImage && (
                    <View style={styles.uploadOverlay}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                  <View style={styles.addIcon}>
                    <Ionicons name="add" size={16} color="#fff" />
                  </View>
                </Pressable>
                <Text style={styles.avatarHint}>
                  {t(
                    "profile_setup.photo_hint",
                    "Professional photo recommended",
                  )}
                </Text>
              </View>

              <FieldLabel
                text={t("profile_setup.full_name_label")}
              />
              <StyledInput
                placeholder={t("profile_setup.name_placeholder")}
                value={personal.full_name}
                onChangeText={(v) =>
                  setPersonal((p) => ({ ...p, full_name: v }))
                }
              />

              <FieldLabel text={t("profile_setup.phone_label")} />
              <StyledInput
                placeholder={t("profile_setup.phone_placeholder")}
                keyboardType="phone-pad"
                value={personal.phone}
                onChangeText={(v) => setPersonal((p) => ({ ...p, phone: v }))}
              />

              <FieldLabel
                text={t("profile_setup.birth_date_label")}
              />
              <Pressable
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={
                    personal.birth_date
                      ? styles.dateText
                      : styles.datePlaceholder
                  }
                >
                  {birthDateLabel}
                </Text>
                <Text style={styles.dateIcon}>📅</Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={personal.birth_date ?? new Date(1990, 0, 1)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={new Date()}
                  onChange={(_, date) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (date) setPersonal((p) => ({ ...p, birth_date: date }));
                  }}
                  textColor="#111"
                />
              )}

              <FieldLabel text={t("profile_setup.gender_label")} />
              <ChipGroup
                options={GENDER_OPTIONS}
                value={personal.gender}
                onSelect={(v) => setPersonal((p) => ({ ...p, gender: v }))}
              />

              {role === "patient" && (
                <>
                  <SectionLabel
                    text={t("profile_setup.body_measurements")}
                  />
                  <View style={styles.row2}>
                    <View style={styles.col2}>
                      <FieldLabel
                        text={t("profile_setup.weight_label")}
                      />
                      <StyledInput
                        placeholder={t("profile_setup.weight_placeholder")}
                        keyboardType="decimal-pad"
                        value={personal.weight_kg}
                        onChangeText={(v) =>
                          setPersonal((p) => ({ ...p, weight_kg: v }))
                        }
                      />
                    </View>
                    <View style={styles.col2}>
                      <FieldLabel
                        text={t("profile_setup.height_label")}
                      />
                      <StyledInput
                        placeholder={t("profile_setup.height_placeholder")}
                        keyboardType="decimal-pad"
                        value={personal.height_cm}
                        onChangeText={(v) =>
                          setPersonal((p) => ({ ...p, height_cm: v }))
                        }
                      />
                    </View>
                  </View>

                  {/* BMI hint */}
                  {personal.weight_kg && personal.height_cm && (
                    <View style={styles.bmiPill}>
                      <Text style={styles.bmiText}>
                        {t("profile_setup.bmi_label")}:{" "}
                        {(
                          parseFloat(personal.weight_kg) /
                          Math.pow(parseFloat(personal.height_cm) / 100, 2)
                        ).toFixed(1)}
                      </Text>
                    </View>
                  )}
                </>
              )}

              <SectionLabel text={t("profile_setup.location", "LOCATION")} />

              <Select
                label={t("profile_setup.wilaya_label")}
                placeholder={t("profile_setup.wilaya_placeholder")}
                options={wilayas}
                value={personal.wilaya}
                onSelect={(w) => {
                  setPersonal((p) => ({ ...p, wilaya: w, commune: "" }));
                }}
              />

              <Select
                label={t("profile_setup.commune_label")}
                placeholder={
                  personal.wilaya
                    ? t("profile_setup.commune_placeholder")
                    : t("profile_setup.commune_error")
                }
                options={communes}
                value={personal.commune}
                onSelect={(v) => setPersonal((p) => ({ ...p, commune: v }))}
                error={
                  !personal.wilaya ? t("profile_setup.commune_error") : undefined
                }
              />
            </View>
          ) : role === "doctor" ? (
            /* ── Step 2: Doctor Professional Info ─────────────────── */
            <View style={styles.formCard}>
              <SectionLabel
                text={t("profile_setup.credentials", "CREDENTIALS")}
              />

              <Select
                label={t("profile_setup.specialization_label")}
                placeholder={t("profile_setup.specialization_placeholder")}
                options={SPECIALIZATION_OPTIONS.map(opt => ({ label: t(`enums.specialization.${opt}`), value: opt }))}
                value={doctor.specialization}
                onSelect={(v) =>
                  setDoctor((d) => ({ ...d, specialization: v }))
                }
              />

              <FieldLabel text={t("profile_setup.medical_license_label")} />
              <StyledInput
                placeholder={t("profile_setup.medical_license_placeholder")}
                value={doctor.medical_license}
                onChangeText={(v) =>
                  setDoctor((d) => ({ ...d, medical_license: v }))
                }
              />

              <FieldLabel text={t("profile_setup.hospital_label")} />
              <StyledInput
                placeholder={t("profile_setup.hospital_placeholder")}
                value={doctor.hospital_name}
                onChangeText={(v) =>
                  setDoctor((d) => ({ ...d, hospital_name: v }))
                }
              />

              <FieldLabel text={t("profile_setup.experience_label")} />
              <StyledInput
                placeholder={t("profile_setup.experience_placeholder")}
                keyboardType="number-pad"
                value={doctor.experience_years}
                onChangeText={(v) =>
                  setDoctor((d) => ({ ...d, experience_years: v }))
                }
              />

              <SectionLabel
                text={t("profile_setup.professional_bio")}
              />
              <StyledInput
                placeholder={t("profile_setup.bio_placeholder")}
                multiline
                numberOfLines={4}
                style={[
                  styles.input,
                  { height: 100, textAlignVertical: "top" },
                ]}
                value={doctor.bio}
                onChangeText={(v) => setDoctor((d) => ({ ...d, bio: v }))}
              />
            </View>
          ) : (
            /* ── Step 2: Diabetes ─────────────────────────────────── */
            <View style={styles.formCard}>
              <SectionLabel text={t("profile_setup.diagnosis")} />

              <FieldLabel text={t("profile_setup.diabetes_type_label")} />
              <View style={styles.typeGrid}>
                {DIABETES_TYPES.map((type) => (
                  <Pressable
                    key={type.value}
                    style={[
                      styles.typeCard,
                      diabetes.diabetes_type === type.value &&
                      styles.typeCardActive,
                    ]}
                    onPress={() =>
                      setDiabetes((d) => ({ ...d, diabetes_type: type.value }))
                    }
                  >
                    <Text
                      style={[
                        styles.typeCardTitle,
                        diabetes.diabetes_type === type.value &&
                        styles.typeCardTitleActive,
                      ]}
                    >
                      {t(type.labelKey)}
                    </Text>
                    <Text style={styles.typeCardDesc}>{t(type.descKey)}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.row2}>
                <View style={styles.col2}>
                  <FieldLabel text={t("profile_setup.diagnosis_year_label")} />
                  <StyledInput
                    placeholder={t("profile_setup.diagnosis_year_placeholder")}
                    keyboardType="number-pad"
                    maxLength={4}
                    value={diabetes.diagnosis_year}
                    onChangeText={(v) =>
                      setDiabetes((d) => ({ ...d, diagnosis_year: v }))
                    }
                  />
                </View>
                <View style={styles.col2}>
                  <FieldLabel text={t("profile_setup.hba1c_label")} />
                  <StyledInput
                    placeholder={t("profile_setup.hba1c_placeholder")}
                    keyboardType="decimal-pad"
                    value={diabetes.hba1c}
                    onChangeText={(v) =>
                      setDiabetes((d) => ({ ...d, hba1c: v }))
                    }
                  />
                </View>
              </View>

              <SectionLabel
                text={t("profile_setup.glucose_targets")}
              />
              <View style={styles.row2}>
                <View style={styles.col2}>
                  <FieldLabel text={t("profile_setup.min_label")} />
                  <StyledInput
                    placeholder={t("profile_setup.min_placeholder")}
                    keyboardType="number-pad"
                    value={diabetes.target_glucose_min}
                    onChangeText={(v) =>
                      setDiabetes((d) => ({ ...d, target_glucose_min: v }))
                    }
                  />
                </View>
                <View style={styles.col2}>
                  <FieldLabel text={t("profile_setup.max_label")} />
                  <StyledInput
                    placeholder={t("profile_setup.max_placeholder")}
                    keyboardType="number-pad"
                    value={diabetes.target_glucose_max}
                    onChangeText={(v) =>
                      setDiabetes((d) => ({ ...d, target_glucose_max: v }))
                    }
                  />
                </View>
              </View>

              <SectionLabel text={t("profile_setup.treatment")} />

              <FieldLabel text={t("profile_setup.insulin_regimen_label")} />
              <ChipGroup
                options={INSULIN_OPTIONS}
                value={diabetes.insulin_regimen}
                onSelect={(v) =>
                  setDiabetes((d) => ({ ...d, insulin_regimen: v }))
                }
              />

              <ToggleRow
                label={t("profile_setup.uses_cgm_label")}
                value={diabetes.uses_cgm}
                onToggle={() =>
                  setDiabetes((d) => ({ ...d, uses_cgm: !d.uses_cgm }))
                }
              />

              <SectionLabel
                text={t("profile_setup.lifestyle")}
              />

              <FieldLabel text={t("profile_setup.activity_level_label")} />
              <View style={styles.activityGrid}>
                {ACTIVITY_OPTIONS.map((a) => (
                  <Pressable
                    key={a.value}
                    style={[
                      styles.activityCard,
                      diabetes.activity_level === a.value &&
                      styles.activityCardActive,
                    ]}
                    onPress={() =>
                      setDiabetes((d) => ({ ...d, activity_level: a.value }))
                    }
                  >
                    <Text style={styles.activityEmoji}>{a.emoji}</Text>
                    <Text
                      style={[
                        styles.activityLabel,
                        diabetes.activity_level === a.value &&
                        styles.chipTextActive,
                      ]}
                    >
                      {t(a.labelKey)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <ToggleRow
                label={t("profile_setup.hypertension_label")}
                value={diabetes.has_hypertension}
                onToggle={() =>
                  setDiabetes((d) => ({
                    ...d,
                    has_hypertension: !d.has_hypertension,
                  }))
                }
              />
              <ToggleRow
                label={t("profile_setup.dyslipidemia_label")}
                value={diabetes.has_dyslipidemia}
                onToggle={() =>
                  setDiabetes((d) => ({
                    ...d,
                    has_dyslipidemia: !d.has_dyslipidemia,
                  }))
                }
              />

              <SectionLabel
                text={t("profile_setup.emergency_contact")}
              />

              <FieldLabel text={t("profile_setup.contact_name_label")} />
              <StyledInput
                placeholder={t("profile_setup.family_friend_placeholder")}
                value={diabetes.emergency_contact_name}
                onChangeText={(v) =>
                  setDiabetes((d) => ({ ...d, emergency_contact_name: v }))
                }
              />

              <FieldLabel text={t("profile_setup.contact_phone_label")} />
              <StyledInput
                placeholder={t("profile_setup.phone_placeholder")}
                keyboardType="phone-pad"
                value={diabetes.emergency_contact_phone}
                onChangeText={(v) =>
                  setDiabetes((d) => ({ ...d, emergency_contact_phone: v }))
                }
              />
            </View>
          )}

          <View style={styles.buttonRow}>
            {step > 0 && (
              <Pressable style={styles.btnBack} onPress={goBack}>
                <Text style={styles.btnBackText}>← {t("profile_setup.back")}</Text>
              </Pressable>
            )}
            {step < TOTAL_STEPS - 1 ? (
              <Pressable
                style={[styles.btnPrimary, step > 0 && { flex: 1 }]}
                onPress={goNext}
              >
                <Text style={styles.btnPrimaryText}>{t("profile_setup.continue")} →</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.btnPrimary,
                  styles.btnSave,
                  saving && styles.btnDisabled,
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnPrimaryText}>{t("profile_setup.save_continue")}</Text>
                )}
              </Pressable>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: theme.text },
    headerSub: { fontSize: 12, color: theme.textMuted, marginTop: 2 },

    avatarContainer: { alignItems: "center", marginBottom: 24 },
    avatarWrapper: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "visible",
    },
    avatarImage: { width: "100%", height: "100%", borderRadius: 50 },
    avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
    uploadOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.4)",
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
    },
    addIcon: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: theme.primary,
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 3,
      borderColor: theme.card,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarHint: { fontSize: 12, color: theme.textMuted, marginTop: 10 },

    dotsRow: { flexDirection: "row", gap: 6 },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.border,
    },
    dotActive: { backgroundColor: theme.primary, width: 20 },
    dotDone: { backgroundColor: theme.primary + "80" },

    scrollContent: { padding: 16, paddingBottom: 40 },

    formCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      gap: 12,
      marginBottom: 16,
      shadowColor: theme.dark ? "#000" : "#000",
      shadowOpacity: theme.dark ? 0.3 : 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: theme.dark ? 4 : 2,
    },

    sectionLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.textMuted,
      letterSpacing: 1.2,
      marginTop: 8,
      marginBottom: 0,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.secondary,
      marginBottom: 4,
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
    dateIcon: { fontSize: 16 },

    row2: { flexDirection: "row", gap: 12 },
    col2: { flex: 1 },

    bmiPill: {
      alignSelf: "flex-start",
      backgroundColor: theme.success + "20",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    bmiText: { fontSize: 12, color: theme.success, fontWeight: "600" },

    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    chipActive: {
      backgroundColor: theme.primary + "20",
      borderColor: theme.primary,
    },
    chipText: { fontSize: 13, color: theme.textMuted, fontWeight: "500" },
    chipTextActive: { color: theme.primary, fontWeight: "600" },

    typeGrid: { gap: 8 },
    typeCard: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 12,
      backgroundColor: theme.background,
    },
    typeCardActive: {
      backgroundColor: theme.primary + "20",
      borderColor: theme.primary,
    },
    typeCardTitle: { fontSize: 14, fontWeight: "600", color: theme.text },
    typeCardTitleActive: { color: theme.primary },
    typeCardDesc: { fontSize: 11, color: theme.textMuted, marginTop: 2 },

    activityGrid: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
    activityCard: {
      flex: 1,
      minWidth: 60,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    activityCardActive: {
      backgroundColor: theme.primary + "20",
      borderColor: theme.primary,
    },
    activityEmoji: { fontSize: 20, marginBottom: 4 },
    activityLabel: {
      fontSize: 10,
      color: theme.textMuted,
      fontWeight: "500",
      textAlign: "center",
    },

    toggleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 4,
    },
    toggleLabel: { fontSize: 13, color: theme.text, flex: 1, marginRight: 12 },
    toggle: {
      width: 44,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.border,
      padding: 2,
      justifyContent: "center",
    },
    toggleOn: { backgroundColor: theme.primary },
    toggleThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#fff",
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    toggleThumbOn: { alignSelf: "flex-end" },

    buttonRow: { flexDirection: "row", gap: 12 },
    btnBack: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      backgroundColor: theme.card,
    },
    btnBackText: { fontSize: 15, color: theme.textMuted, fontWeight: "600" },
    btnPrimary: {
      flex: 2,
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    btnSave: { flex: 1 },
    btnDisabled: { opacity: 0.6 },
    btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  });
