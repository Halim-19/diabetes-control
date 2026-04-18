import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { t } from "i18next";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATS = [
  {
    label: t("doctor.stats.total_patients", "Total Patients"),
    value: "1,284",
    change: "+12 this week",
    up: true,
  },
  {
    label: t("doctor.stats.active_doctors", "Active Doctors"),
    value: "48",
    change: "+2 this month",
    up: true,
  },
  {
    label: t("doctor.stats.avg_steps", "Avg Daily Steps"),
    value: "7,340",
    change: "-3% vs last week",
    up: false,
  },
  {
    label: t("doctor.stats.instructions_sent", "Instructions Sent"),
    value: "342",
    change: "+28 today",
    up: true,
  },
];

const ACTIVITY = [
  { time: "09:14", event: "Dr. Mitchell updated instructions for J. Doe" },
  { time: "08:52", event: "New patient registered: Amina Yusuf" },
  { time: "08:31", event: "Appointment confirmed: T. Lee · Apr 14" },
  { time: "Yesterday", event: "3 critical alerts flagged for review" },
];

export default function StatsScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>
              {t("doctor.stats.title", "Admin Stats")}
            </Text>
            <Text style={styles.pageSubtitle}>
              {t("doctor.stats.subtitle", "Platform overview")} · Apr 9
            </Text>
          </View>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>
              {t("doctor.stats.logout", "Log out")}
            </Text>
          </Pressable>
        </View>

        {/* Metric grid */}
        <View style={styles.grid}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{s.label}</Text>
              <Text style={styles.metricValue}>{s.value}</Text>
              <Text
                style={[
                  styles.metricChange,
                  { color: s.up ? theme.success : theme.danger },
                ]}
              >
                {s.change}
              </Text>
            </View>
          ))}
        </View>

        {/* Activity feed */}
        <Text style={styles.sectionLabel}>
          {t("doctor.stats.recent_activity", "RECENT ACTIVITY")}
        </Text>
        <View style={styles.card}>
          {ACTIVITY.map((a, i) => (
            <View
              key={i}
              style={[
                styles.activityRow,
                i < ACTIVITY.length - 1 && styles.activityBorder,
              ]}
            >
              <Text style={styles.activityTime}>{a.time}</Text>
              <Text style={styles.activityEvent}>{a.event}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
    },
    pageTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 2,
    },
    pageSubtitle: { fontSize: 12, color: theme.textMuted },
    logoutBtn: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.danger + "40",
    },
    logoutText: { color: theme.danger, fontSize: 12, fontWeight: "500" },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
    metricCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      width: "47%",
    },
    metricLabel: { fontSize: 11, color: theme.textMuted, marginBottom: 6 },
    metricValue: {
      fontSize: 22,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    metricChange: { fontSize: 11 },
    sectionLabel: {
      fontSize: 10,
      fontWeight: "500",
      color: theme.textMuted,
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 16,
    },
    activityRow: { paddingVertical: 14 },
    activityBorder: { borderBottomWidth: 1, borderBottomColor: theme.border },
    activityTime: { fontSize: 11, color: theme.textMuted, marginBottom: 3 },
    activityEvent: { fontSize: 13, color: theme.secondary, lineHeight: 18 },
  });
