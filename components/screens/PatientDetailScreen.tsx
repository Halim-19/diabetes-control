import {
  useActivityLogs,
  useGlucoseLogs,
  useNutritionLogs,
  useWellbeingLogs,
} from "@/hooks/useTracking";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "react-i18next";
import { getGlucoseStatus } from "@/types/tracking";
import { AIPatientReview, generatePatientReview } from "@/utils/ai";
import { Profile, supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import Markdown from "react-native-markdown-display";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PatientDetailScreenProps {
  id: string;
}

export default function PatientDetailScreen({ id }: PatientDetailScreenProps) {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const aiMarkdownStyles = useMemo(() => createMarkdownStyles(theme), [theme]);
  const router = useRouter();
  const [patient, setPatient] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "glucose" | "nutrition" | "activity" | "wellbeing" | "notes" | "ai"
  >("glucose");
  const [notes, setNotes] = useState<any[]>([]);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // AI States
  const [aiReview, setAiReview] = useState<AIPatientReview | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const { language } = useLanguage();
  const { t } = useTranslation();

  const { logs: glucoseLogs, fetchPeriod: fetchGlucose } = useGlucoseLogs(id);
  const { logs: nutritionLogs, fetchPeriod: fetchNutrition } =
    useNutritionLogs(id);
  const { logs: activityLogs, fetchPeriod: fetchActivity } =
    useActivityLogs(id);
  const { logs: wellbeingLogs, fetchPeriod: fetchWellbeing } =
    useWellbeingLogs(id);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      setPatient(data);

      await Promise.all([
        fetchGlucose("month"),
        fetchNutrition("month"),
        fetchActivity("month"),
        fetchWellbeing("month"),
        fetchNotes(),
      ]);
      setLoading(false);
    }
    loadData();
  }, [id]);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("doctor_notes")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false });
    if (data) setNotes(data);
  };

  const handleSendNote = async () => {
    if (!newNote.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSavingNote(true);
    try {
      const { error } = await supabase.from("doctor_notes").insert({
        doctor_id: user.id,
        patient_id: id,
        body: newNote.trim(),
      });

      if (error) throw error;

      setNewNote("");
      setNoteModalVisible(false);
      fetchNotes();
      Alert.alert(
        t("common.success", "Success"),
        t("doctor.detail.note_sent", "Note sent to patient."),
      );
    } catch (err) {
      Alert.alert(
        t("common.error", "Error"),
        t("doctor.detail.note_error", "Could not save note."),
      );
    } finally {
      setSavingNote(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!patient) return;
    setGeneratingAI(true);
    try {
      // Format data for AI
      const gLogs = glucoseLogs
        .map((l) => {
          const v = JSON.parse(l.value);
          return `${new Date(l.recorded_at).toLocaleDateString()} - ${v.glucose_value} ${v.unit} (${v.timing})`;
        })
        .join("\n");
      const nLogs = nutritionLogs
        .map(
          (l) =>
            `${new Date(l.logged_at!).toLocaleDateString()} - ${l.meal_type}: ${l.description} (${l.carb_grams}g carbs)`,
        )
        .join("\n");
      const aLogs = activityLogs
        .map(
          (l) =>
            `${new Date(l.logged_at!).toLocaleDateString()} - ${l.activity_type}: ${l.duration_min}m (${l.intensity})`,
        )
        .join("\n");
      const wLogs = wellbeingLogs
        .map(
          (l) =>
            `${new Date(l.logged_at!).toLocaleDateString()} - Mood: ${l.mood}, Sleep: ${l.sleep_hours}h`,
        )
        .join("\n");

      const review = await generatePatientReview({
        patientName: patient.full_name || "Patient",
        glucoseLogs: gLogs,
        nutritionLogs: nLogs,
        activityLogs: aLogs,
        wellbeingLogs: wLogs,
        targets: `Glucose: ${patient.target_glucose_min}-${patient.target_glucose_max}, A1c: ${patient.hba1c}%`,
        language,
      });
      setAiReview(review);
    } catch (err: any) {
      Alert.alert("AI Error", err.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  const useSuggestedNote = (text: string) => {
    setNewNote(text);
    setNoteModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.error}>
        <Text style={{ color: theme.secondary }}>
          {t("doctor.detail.not_found", "Patient not found.")}
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{t("common.back", "Go Back")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace("/(doctor)/patients")}
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={styles.name}>{patient.full_name}</Text>
          <Text style={styles.meta}>
            {patient.diabetes_type?.replace("_", " ")} · {patient.gender}
          </Text>
        </View>
        <Pressable style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Highlights Card */}
        <View style={styles.highlights}>
          <View style={styles.highlightItem}>
            <Text style={styles.highlightLabel}>
              {t("doctor.detail.highlights.a1c", "A1c")}
            </Text>
            <Text style={styles.highlightValue}>{patient.hba1c || "--"}%</Text>
          </View>
          <View style={styles.highlightItem}>
            <Text style={styles.highlightLabel}>
              {t("doctor.detail.highlights.weight", "Weight")}
            </Text>
            <Text style={styles.highlightValue}>
              {patient.weight_kg || "--"}kg
            </Text>
          </View>
          <View style={styles.highlightItem}>
            <Text style={styles.highlightLabel}>
              {t("doctor.detail.highlights.target", "Target")}
            </Text>
            <Text style={styles.highlightValue}>
              {patient.target_glucose_min}-{patient.target_glucose_max}
            </Text>
          </View>
        </View>

        {/* Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabs}
          contentContainerStyle={styles.tabsContent}
        >
          {(
            [
              "glucose",
              "nutrition",
              "activity",
              "wellbeing",
              "notes",
              "ai",
            ] as const
          ).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <View style={styles.tabRow}>
                {tab === "ai" && (
                  <Ionicons
                    name="sparkles"
                    size={12}
                    color={activeTab === "ai" ? "#6366f1" : theme.textMuted}
                  />
                )}
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                    tab === "ai" && activeTab === tab && { color: "#6366f1" },
                  ]}
                >
                  {t(
                    `doctor.detail.tabs.${tab}`,
                    tab === "ai"
                      ? "AI Review"
                      : tab.charAt(0).toUpperCase() + tab.slice(1),
                  )}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === "glucose" && (
            <View style={styles.list}>
              {glucoseLogs.length === 0 ? (
                <Text style={styles.empty}>
                  {t("doctor.detail.no_logs", "No logs found for this month.")}
                </Text>
              ) : (
                glucoseLogs.map((log) => {
                  const entry = JSON.parse(log.value);
                  const status = getGlucoseStatus(
                    entry.glucose_value,
                    entry.unit,
                    patient.target_glucose_min || 80,
                    patient.target_glucose_max || 180,
                  );
                  return (
                    <View key={log.id} style={styles.logCard}>
                      <View style={styles.logHeader}>
                        <Text style={styles.logTime}>
                          {new Date(log.recorded_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: status.bg },
                          ]}
                        >
                          <Text
                            style={[styles.statusText, { color: status.color }]}
                          >
                            {status.label}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.logBody}>
                        <Text style={styles.glucoseVal}>
                          {entry.glucose_value}{" "}
                          <Text style={styles.unit}>{entry.unit}</Text>
                        </Text>
                        {entry.timing && (
                          <Text style={styles.timing}>
                            {entry.timing.replace("_", " ")}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {activeTab === "nutrition" && (
            <View style={styles.list}>
              {nutritionLogs.length === 0 ? (
                <Text style={styles.empty}>
                  {t("doctor.detail.no_logs", "No logs found.")}
                </Text>
              ) : (
                nutritionLogs.map((log) => (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logHeader}>
                      <Text style={styles.logTime}>
                        {new Date(log.logged_at!).toLocaleDateString()}
                      </Text>
                      <Text style={styles.mealType}>{log.meal_type}</Text>
                    </View>
                    <Text style={styles.logDesc}>{log.description}</Text>
                    <View style={styles.nutriMeta}>
                      <Text style={styles.metaText}>
                        {log.carb_grams}g carbs
                      </Text>
                      <Text style={styles.metaText}>
                        {log.water_glasses} glasses water
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === "activity" && (
            <View style={styles.list}>
              {activityLogs.length === 0 ? (
                <Text style={styles.empty}>
                  {t("doctor.detail.no_activity", "No activity logs.")}
                </Text>
              ) : (
                activityLogs.map((log) => (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logHeader}>
                      <Text style={styles.logTime}>
                        {new Date(log.logged_at!).toLocaleDateString()}
                      </Text>
                      <Text style={styles.intensityTag}>{log.intensity}</Text>
                    </View>
                    <Text style={styles.activityName}>{log.activity_type}</Text>
                    <Text style={styles.duration}>
                      {log.duration_min} mins · {log.calories_burned} cal
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === "wellbeing" && (
            <View style={styles.list}>
              {wellbeingLogs.length === 0 ? (
                <Text style={styles.empty}>
                  {t("doctor.detail.no_wellbeing", "No wellbeing logs.")}
                </Text>
              ) : (
                wellbeingLogs.map((log) => (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logHeader}>
                      <Text style={styles.logTime}>
                        {new Date(log.logged_at!).toLocaleDateString()}
                      </Text>
                      <Text style={styles.mood}>{log.mood}</Text>
                    </View>
                    <Text style={styles.sleep}>
                      Sleep: {log.sleep_hours}h ({log.sleep_quality})
                    </Text>
                    {log.symptoms.length > 0 && (
                      <View style={styles.symptoms}>
                        {log.symptoms.map((s) => (
                          <Text key={s} style={styles.symptomTag}>
                            {s}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
          {activeTab === "notes" && (
            <View style={styles.list}>
              <Pressable
                style={styles.addNoteBtn}
                onPress={() => setNoteModalVisible(true)}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.addNoteBtnText}>
                  {t("doctor.detail.send_note", "Send New Note")}
                </Text>
              </Pressable>

              {notes.length === 0 ? (
                <Text style={styles.empty}>
                  {t("doctor.detail.no_notes", "No notes recorded yet.")}
                </Text>
              ) : (
                notes.map((note) => (
                  <View key={note.id} style={styles.logCard}>
                    <Text style={styles.noteDate}>
                      {new Date(note.created_at).toLocaleDateString([], {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                    <Text style={styles.noteBody}>{note.body}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === "ai" && (
            <View style={styles.aiContainer}>
              {generatingAI ? (
                <View style={styles.aiLoading}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.aiLoadingText}>
                    {t(
                      "doctor.detail.ai_review.analyzing",
                      "Analyzing patient trends...",
                    )}
                  </Text>
                </View>
              ) : aiReview ? (
                <View>
                  <View style={styles.aiCard}>
                    <View style={styles.aiHeader}>
                      <Ionicons name="sparkles" size={20} color="#6366f1" />
                      <Text style={styles.aiTitle}>
                        {t("doctor.detail.ai_review.title", "Clinical Summary")}
                      </Text>
                    </View>
                    <Markdown style={aiMarkdownStyles}>
                      {aiReview.resume}
                    </Markdown>
                  </View>

                  <Text style={styles.suggestTitle}>
                    {t(
                      "doctor.detail.ai_review.suggested_feedback",
                      "SUGGESTED FEEDBACK",
                    )}
                  </Text>
                  {aiReview.suggestions.map((s, idx) => (
                    <Pressable
                      key={idx}
                      style={styles.suggestionItem}
                      onPress={() => useSuggestedNote(s)}
                    >
                      <Text style={styles.suggestionText}>{s}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={theme.textMuted}
                      />
                    </Pressable>
                  ))}

                  <Pressable
                    style={styles.aiRefreshBtn}
                    onPress={handleGenerateAI}
                  >
                    <Text style={styles.aiRefreshText}>
                      {t(
                        "doctor.detail.ai_review.refresh",
                        "Refresh AI Review",
                      )}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.aiEmpty}>
                  <View style={styles.aiIconCircle}>
                    <Ionicons name="sparkles" size={40} color="#6366f1" />
                  </View>
                  <Text style={styles.aiEmptyTitle}>
                    {t(
                      "doctor.detail.ai_review.assistant_title",
                      "AI Patient Assistant",
                    )}
                  </Text>
                  <Text style={styles.aiEmptyDesc}>
                    {t(
                      "doctor.detail.ai_review.assistant_desc",
                      "Get a professional medical summary and suggested notes for this patient based on their recent tracking logs.",
                    )}
                  </Text>
                  <Pressable
                    style={styles.generateBtn}
                    onPress={handleGenerateAI}
                  >
                    <Text style={styles.generateBtnText}>
                      {t("doctor.detail.ai_review.generate", "Generate Review")}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={noteModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("doctor.detail.new_note_title", "New Medical Note")}
              </Text>
              <Pressable onPress={() => setNoteModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </Pressable>
            </View>
            <Pressable
              style={[styles.sendBtn, !newNote.trim() && styles.disabledBtn]}
              onPress={handleSendNote}
              disabled={savingNote || !newNote.trim()}
            >
              {savingNote ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>
                  {t("doctor.detail.send_note", "Send Note")}
                </Text>
              )}
            </Pressable>

            <TextInput
              style={styles.noteInput}
              placeholder={t(
                "doctor.detail.note_placeholder",
                "Type your notes or instructions for the patient...",
              )}
              multiline
              autoFocus
              value={newNote}
              onChangeText={setNewNote}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    loading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    error: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: { alignItems: "center" },
    name: { fontSize: 18, fontWeight: "700", color: theme.text },
    meta: { fontSize: 13, color: theme.secondary, marginTop: 2 },
    iconBtn: { padding: 8 },
    backBtn: {
      marginTop: 16,
      padding: 10,
      backgroundColor: theme.primary,
      borderRadius: 8,
    },
    backText: { color: "#fff" },
    scroll: { paddingBottom: 40 },
    highlights: {
      flexDirection: "row",
      backgroundColor: theme.card,
      margin: 20,
      borderRadius: 16,
      padding: 16,
      justifyContent: "space-around",
      borderWidth: 1,
      borderColor: theme.border,
    },
    highlightItem: { alignItems: "center" },
    highlightLabel: { fontSize: 12, color: theme.secondary, marginBottom: 4 },
    highlightValue: { fontSize: 16, fontWeight: "600", color: theme.text },
    tabs: { borderBottomWidth: 1, borderBottomColor: theme.border },
    tabsContent: { paddingHorizontal: 20 },
    tab: {
      paddingVertical: 14,
      marginRight: 24,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    activeTab: { borderBottomColor: theme.primary },
    tabText: { fontSize: 14, fontWeight: "500", color: theme.secondary },
    activeTabText: { color: theme.primary, fontWeight: "600" },
    content: { padding: 20 },
    list: { gap: 12 },
    logCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      shadowColor: theme.textMuted,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    logHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    logTime: { fontSize: 11, color: theme.secondary, fontWeight: "500" },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    statusText: { fontSize: 10, fontWeight: "600" },
    logBody: { flexDirection: "row", alignItems: "baseline", gap: 8 },
    glucoseVal: { fontSize: 24, fontWeight: "700", color: theme.text },
    unit: { fontSize: 14, color: theme.secondary, fontWeight: "400" },
    timing: { fontSize: 13, color: theme.secondary },
    mealType: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.primary,
      textTransform: "uppercase",
    },
    logDesc: { fontSize: 14, color: theme.text, marginBottom: 8 },
    nutriMeta: { flexDirection: "row", gap: 12 },
    metaText: { fontSize: 12, color: theme.secondary },
    intensityTag: {
      fontSize: 10,
      fontWeight: "600",
      color: "#ea580c",
      backgroundColor: theme.primary + "1a",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    activityName: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    duration: { fontSize: 13, color: theme.secondary },
    mood: { fontSize: 20 },
    sleep: { fontSize: 14, color: theme.text, marginTop: 4 },
    symptoms: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
    symptomTag: {
      fontSize: 11,
      color: theme.secondary,
      backgroundColor: theme.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    wellbeingLogs: { gap: 12 },
    addNoteBtn: {
      backgroundColor: theme.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
      borderRadius: 12,
      gap: 8,
      marginBottom: 16,
    },
    addNoteBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    noteDate: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: "600",
      marginBottom: 6,
    },
    noteBody: { fontSize: 15, color: theme.text, lineHeight: 22 },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      height: "90%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: "700", color: theme.text },
    noteInput: {
      flex: 1,
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      textAlignVertical: "top",
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 20,
    },
    sendBtn: {
      backgroundColor: theme.primary,
      height: 54,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      marginBottom: 20,
    },
    disabledBtn: { backgroundColor: theme.border },
    sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    empty: {
      textAlign: "center",
      color: theme.textMuted,
      marginTop: 20,
      fontSize: 14,
    },
    tabRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    aiContainer: { paddingBottom: 20 },
    aiLoading: { padding: 60, alignItems: "center" },
    aiLoadingText: { marginTop: 16, color: theme.secondary, fontWeight: "500" },
    aiCard: {
      backgroundColor: theme.primary + "11",
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.primary + "33",
      marginBottom: 24,
    },
    aiHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    aiTitle: { fontSize: 18, fontWeight: "700", color: theme.primary },
    suggestTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.textMuted,
      letterSpacing: 1,
      marginBottom: 12,
    },
    suggestionItem: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    suggestionText: {
      flex: 1,
      fontSize: 14,
      color: theme.secondary,
      fontWeight: "500",
      lineHeight: 20,
    },
    aiEmpty: { alignItems: "center", paddingVertical: 40 },
    aiIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary + "1a",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    aiEmptyTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 8,
    },
    aiEmptyDesc: {
      fontSize: 15,
      color: theme.secondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 30,
      paddingHorizontal: 20,
    },
    generateBtn: {
      backgroundColor: "#6366f1",
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
    },
    generateBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    aiRefreshBtn: { marginTop: 20, alignItems: "center" },
    aiRefreshText: { color: "#6366f1", fontWeight: "600" },
  });

const createMarkdownStyles = (theme: any): any => ({
  body: { fontSize: 15, color: theme.text, lineHeight: 22 },
  strong: { fontWeight: "700", color: theme.text },
  bullet_list: { marginTop: 8 },
  list_item: { marginBottom: 6 },
});
