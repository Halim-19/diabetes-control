import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useWellbeingLogs } from "@/hooks/useTracking";
import {
  HYPER_SYMPTOMS,
  HYPO_SYMPTOMS,
  MOOD_OPTIONS,
  MoodType,
  SLEEP_QUALITY_OPTIONS,
  SleepQuality,
} from "@/types/tracking";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getColors = (theme: any) => ({
  bg: theme.background,
  surface: theme.card,
  border: theme.border,
  text: theme.text,
  sub: theme.secondary,
  muted: theme.textMuted,
  blue: theme.primary,
  blueBg: theme.primary + "1a",
  green: theme.success,
  amber: "#b45309",
  red: theme.danger,
  violet: "#7c3aed",
  violetBg: "#f5f3ff",
});

function SectionLabel({ text }: { text: string }) {
  const { theme } = useTheme();
  const C = useMemo(() => getColors(theme), [theme]);
  const s = useMemo(() => createStyles(C), [C]);
  return <Text style={s.sectionLabel}>{text}</Text>;
}
function Input(props: React.ComponentProps<typeof TextInput>) {
  const { theme } = useTheme();
  const C = useMemo(() => getColors(theme), [theme]);
  const s = useMemo(() => createStyles(C), [C]);
  return (
    <TextInput
      style={s.input}
      placeholderTextColor={C.muted}
      selectionColor={C.violet}
      {...props}
    />
  );
}

export default function LogWellbeingScreen() {
  const { theme } = useTheme();
  const C = useMemo(() => getColors(theme), [theme]);
  const s = useMemo(() => createStyles(C), [C]);

  const moodColor: Record<string, string> = {
    great: C.green,
    good: C.blue,
    neutral: C.amber,
    tired: C.amber,
    stressed: C.red,
    anxious: C.red,
  };

  const { t } = useTranslation();
  const { session } = useAuth();

  const patientId = session?.user?.id;
  const router = useRouter();
  const { logs, save, remove, fetchToday } = useWellbeingLogs(patientId);
  const [saving, setSaving] = useState(false);

  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<MoodType | null>(null);
  const [sleepHours, setSleep] = useState("");
  const [sleepQuality, setSQ] = useState<SleepQuality | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchToday();
  }, []);

  const toggle = (id: string) =>
    setSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const handleSave = async () => {
    setSaving(true);
    const { error } = await save({
      symptoms,
      mood,
      sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
      sleep_quality: sleepQuality,
      stress_level: stress,
      notes,
    });
    setSaving(false);
    if (error) {
      Alert.alert("Error", error);
      return;
    }
    setSymptoms([]);
    setMood(null);
    setSleep("");
    setSQ(null);
    setStress(null);
    setNotes("");
  };

  const handleDelete = (id: string) =>
    Alert.alert("Delete entry", "Remove this entry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove(id) },
    ]);

  const handleBack = () => {
    router.replace("/(patient)/tracker");
  };
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable onPress={handleBack}>
          <Text style={s.backText}>{t("common.back")}</Text>
        </Pressable>
        <Text style={s.headerTitle}>
          {t("patient.tracker.rings.wellbeing")}
        </Text>
        <View style={{ width: 52 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Mood */}
          <View style={s.card}>
            <SectionLabel text={t("common.mood")} />
            <View style={s.moodGrid}>
              {MOOD_OPTIONS.map((m) => {
                const active = mood === m.value;
                const col = moodColor[m.value];
                return (
                  <Pressable
                    key={m.value}
                    style={[
                      s.moodChip,
                      active && {
                        borderColor: col,
                        backgroundColor: col + "12",
                      },
                    ]}
                    onPress={() => setMood(m.value)}
                  >
                    <Text
                      style={[
                        s.moodChipText,
                        active && { color: col, fontWeight: "600" },
                      ]}
                    >
                      {m.emoji} {t(`patient.tracker.mood.${m.value}`, m.label)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Symptoms */}
          <View style={s.card}>
            <SectionLabel text={t("common.hypo_symptoms")} />
            <View style={s.symptomGrid}>
              {HYPO_SYMPTOMS.map((sym) => (
                <Pressable
                  key={sym.id}
                  style={[
                    s.symptomChip,
                    symptoms.includes(sym.id) && {
                      borderColor: C.amber,
                      backgroundColor: "#fef3c7",
                    },
                  ]}
                  onPress={() => toggle(sym.id)}
                >
                  <Text
                    style={[
                      s.symptomText,
                      symptoms.includes(sym.id) && {
                        color: C.amber,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {sym.emoji}{" "}
                    {t(`patient.tracker.hypo_symptoms.${sym.id}`, sym.label)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={s.divider} />
            <SectionLabel text={t("common.hyper_symptoms")} />
            <View style={s.symptomGrid}>
              {HYPER_SYMPTOMS.map((sym) => (
                <Pressable
                  key={sym.id}
                  style={[
                    s.symptomChip,
                    symptoms.includes(sym.id) && {
                      borderColor: C.red,
                      backgroundColor: "#fef2f2",
                    },
                  ]}
                  onPress={() => toggle(sym.id)}
                >
                  <Text
                    style={[
                      s.symptomText,
                      symptoms.includes(sym.id) && {
                        color: C.red,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {sym.emoji}{" "}
                    {t(`patient.tracker.hyper_symptoms.${sym.id}`, sym.label)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Sleep */}
          <View style={s.card}>
            <SectionLabel text={t("patient.tracker.units.sleep")} />
            <View style={s.row2}>
              <View style={s.col}>
                <Text style={s.fieldLabel}>{t("common.hours_slept")}</Text>
                <Input
                  placeholder="e.g. 7.5"
                  keyboardType="decimal-pad"
                  value={sleepHours}
                  onChangeText={setSleep}
                />
              </View>
              <View style={s.col}>
                <Text style={s.fieldLabel}>{t("common.quality")}</Text>
                <View style={s.qualityRow}>
                  {SLEEP_QUALITY_OPTIONS.map((q) => (
                    <Pressable
                      key={q.value}
                      style={[
                        s.qualityChip,
                        sleepQuality === q.value && {
                          borderColor: q.color,
                          backgroundColor: q.color + "15",
                        },
                      ]}
                      onPress={() => setSQ(q.value)}
                    >
                      <Text
                        style={[
                          s.qualityText,
                          sleepQuality === q.value && {
                            color: q.color,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {t(`patient.tracker.sleep_quality.${q.value}`, q.label)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Stress */}
          <View style={s.card}>
            <SectionLabel text={t("common.stress_level")} />
            <View style={s.stressRow}>
              <Text style={s.stressEndLabel}>
                {t("common.low", "Low")}
              </Text>

              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  style={[
                    s.stressBtn,
                    stress === n && {
                      backgroundColor: C.violet,
                      borderColor: C.violet,
                    },
                  ]}
                  onPress={() => setStress(stress === n ? null : n)}
                >
                  <Text
                    style={[s.stressBtnText, stress === n && { color: "#fff" }]}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
              <Text style={s.stressEndLabel}>
                {t("common.high", "High")}
              </Text>
            </View>
          </View>

          {/* Notes */}
          <View style={s.card}>
            <SectionLabel text={t("common.notes")} />
            <Input
              placeholder={t("patient.feed.ai_consult.placeholder")}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
              style={[s.input, { height: 56, textAlignVertical: "top" }]}
            />
          </View>

          <Pressable
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>{t("common.save")}</Text>
            )}
          </Pressable>

          {logs.length > 0 && (
            <View style={s.card}>
              <SectionLabel text={`Today's entries (${logs.length})`} />
              {logs.map((row: any) => {
                const mo = MOOD_OPTIONS.find((m) => m.value === row.mood);
                const time = new Date(row.logged_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const col = moodColor[row.mood] ?? C.muted;
                return (
                  <View key={row.id} style={s.logRow}>
                    <View style={[s.logDot, { backgroundColor: col }]} />
                    <View style={s.logInfo}>
                      <Text style={s.logVal}>
                        {mo
                          ? `${mo.emoji} ${t(`patient.tracker.mood.${row.mood}`, mo.label)}`
                          : "Logged"}
                      </Text>
                      <Text style={s.logMeta}>
                        {row.sleep_hours
                          ? `${row.sleep_hours}h ${t("patient.tracker.units.sleep", "sleep").toLowerCase()}`
                          : ""}
                        {row.symptoms?.length
                          ? ` · ${row.symptoms.length} ${t("common.symptoms").toLowerCase()}`
                          : ""}
                        {row.stress_level
                          ? ` · ${t("common.stress_level")} ${row.stress_level}/5`
                          : ""}
                        {" · "}
                        {time}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleDelete(row.id)}
                      style={s.deleteBtn}
                    >
                      <Text style={s.deleteBtnText}>×</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (C: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: C.surface,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    backText: { fontSize: 15, color: C.violet, fontWeight: "500" },
    headerTitle: { fontSize: 16, fontWeight: "700", color: C.text },
    scroll: { padding: 16, gap: 12, paddingBottom: 48 },

    card: {
      backgroundColor: C.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: C.border,
      gap: 10,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: C.sub,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: "500",
      color: C.sub,
      marginBottom: 4,
    },
    input: {
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 9,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: C.text,
    },

    divider: { height: 1, backgroundColor: C.border },

    moodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    moodChip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bg,
    },
    moodChipText: { fontSize: 13, color: C.sub },

    symptomGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    symptomChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bg,
    },
    symptomText: { fontSize: 12, color: C.sub },

    row2: { flexDirection: "row", gap: 10 },
    col: { flex: 1 },
    qualityRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 4,
    },
    qualityChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bg,
    },
    qualityText: { fontSize: 11, color: C.sub },

    stressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    stressEndLabel: { fontSize: 12, color: C.muted },
    stressBtn: {
      flex: 1,
      height: 40,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    stressBtnText: { fontSize: 14, fontWeight: "700", color: C.sub },

    saveBtn: {
      backgroundColor: C.violet,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
    },
    saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

    logRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    logDot: { width: 8, height: 8, borderRadius: 4 },
    logInfo: { flex: 1 },
    logVal: { fontSize: 13, fontWeight: "600", color: C.text },
    logMeta: { fontSize: 11, color: C.muted, marginTop: 1 },
    deleteBtn: { paddingHorizontal: 6, paddingVertical: 4 },
    deleteBtnText: { fontSize: 18, color: C.muted, lineHeight: 18 },
  });
