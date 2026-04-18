import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INSTRUCTIONS = [
  {
    id: "1",
    title: "Morning Medication",
    body: "Take 1 tablet of Metformin 500mg with breakfast. Do not skip meals.",
    tag: "Medication",
    urgent: true,
  },
  {
    id: "2",
    title: "Daily Walk",
    body: "Walk at least 30 minutes at a moderate pace. Track your steps in the Tracker tab.",
    tag: "Exercise",
    urgent: false,
  },
  {
    id: "3",
    title: "Blood Pressure Log",
    body: "Measure and record your blood pressure twice daily — morning and evening.",
    tag: "Monitoring",
    urgent: false,
  },
  {
    id: "4",
    title: "Diet Reminder",
    body: "Avoid high-sodium foods. Follow the low-carb meal plan provided by your nutritionist.",
    tag: "Diet",
    urgent: false,
  },
];

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Medication: { bg: "#fef9c3", text: "#a16207" },
  Exercise: { bg: "#dcfce7", text: "#166534" },
  Monitoring: { bg: "#eff6ff", text: "#1d4ed8" },
  Diet: { bg: "#fce7f3", text: "#9d174d" },
};

export default function InstructionsScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>
          {t("patient.instructions.title", "Instructions")}
        </Text>
        <Text style={styles.pageSubtitle}>
          {t("patient.instructions.subtitle", "Guidelines from your care team")}
        </Text>

        {INSTRUCTIONS.map((item) => {
          const tagColor = TAG_COLORS[item.tag] ?? {
            bg: "#f3f4f6",
            text: "#374151",
          };
          const isOpen = expanded === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.card, item.urgent && styles.cardUrgent]}
              onPress={() => setExpanded(isOpen ? null : item.id)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  {item.urgent && <View style={styles.urgentDot} />}
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: tagColor.bg }]}>
                  <Text style={[styles.tagText, { color: tagColor.text }]}>
                    {item.tag}
                  </Text>
                </View>
              </View>
              {isOpen && <Text style={styles.cardBody}>{item.body}</Text>}
            </Pressable>
          );
        })}
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
    marginBottom: 4,
  },
  pageSubtitle: { fontSize: 13, color: "#aaa", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    padding: 14,
    marginBottom: 10,
  },
  cardUrgent: {
    borderColor: "#fca5a5",
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  urgentDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  cardTitle: { fontSize: 14, fontWeight: "500", color: "#111", flex: 1 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: "500" },
  cardBody: { marginTop: 10, fontSize: 13, color: "#555", lineHeight: 20 },
});
