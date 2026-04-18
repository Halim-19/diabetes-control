import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

const WEEKLY = [
  { day: "Mon", steps: 8000, max: 10000 },
  { day: "Tue", steps: 6000, max: 10000 },
  { day: "Wed", steps: 9000, max: 10000 },
  { day: "Thu", steps: 6842, max: 10000 },
];

export default function TrackerScreen() {
  const goalPercent = Math.round((6842 / 10000) * 100);
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>
          {t("patient.tracker.title", "Tracker")}
        </Text>

        <View style={styles.ringCard}>
          <View style={styles.ring}>
            <Text style={styles.ringVal}>{goalPercent}%</Text>
            <Text style={styles.ringLabel}>
              {t("patient.tracker.of_goal", "of goal")}
            </Text>
          </View>
          <Text style={styles.ringCaption}>
            6,842 / 10,000 {t("patient.tracker.steps_today", "steps today")}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>
          {t("patient.tracker.weekly_overview", "WEEKLY OVERVIEW")}
        </Text>
        <View style={styles.card}>
          {WEEKLY.map((item, i) => (
            <View
              key={item.day}
              style={[
                styles.weekRow,
                i < WEEKLY.length - 1 && styles.weekBorder,
              ]}
            >
              <Text style={styles.weekDay}>{item.day}</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(item.steps / item.max) * 100}%` as any },
                  ]}
                />
              </View>
              <Text style={styles.weekVal}>
                {(item.steps / 1000).toFixed(0)}k
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9f9f7" },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  pageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginBottom: 20,
  },
  ringCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  ring: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 6,
    borderColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  ringVal: { fontSize: 22, fontWeight: "600", color: "#111" },
  ringLabel: { fontSize: 10, color: "#aaa" },
  ringCaption: { fontSize: 13, color: "#888" },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#aaa",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    paddingHorizontal: 16,
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  weekBorder: { borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  weekDay: { fontSize: 13, color: "#555", width: 32 },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#2563eb", borderRadius: 4 },
  weekVal: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "500",
    width: 28,
    textAlign: "right",
  },
});
