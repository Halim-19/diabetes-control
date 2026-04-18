import React, { useState, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "react-i18next";

const FILTERS = ["All", "Running", "Yoga", "Cycling"];
const ACTIVITIES = [
  { icon: "🏃", name: "Morning Run", meta: "5 km · 28 min" },
  { icon: "🧘", name: "Yoga Flow", meta: "20 min · Beginner" },
  { icon: "🚴", name: "City Ride", meta: "12 km · 45 min" },
  { icon: "🏊", name: "Swim Session", meta: "1 km · 35 min" },
  { icon: "🏋️", name: "Strength", meta: "45 min · Intermediate" },
];

export default function ExploreScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = ACTIVITIES.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>
          {t("patient.explore.title", "Explore")}
        </Text>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t("patient.explore.search", "Search activities...")}
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              style={[styles.chip, activeFilter === f && styles.chipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[
                  styles.chipText,
                  activeFilter === f && styles.chipTextActive,
                ]}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {filtered.map((item) => (
            <View key={item.name} style={styles.activityCard}>
              <View style={styles.thumb}>
                <Text style={styles.thumbIcon}>{item.icon}</Text>
              </View>
              <View>
                <Text style={styles.activityName}>{item.name}</Text>
                <Text style={styles.activityMeta}>{item.meta}</Text>
              </View>
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
    pageTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 16,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
      marginBottom: 14,
    },
    searchIcon: { fontSize: 16, color: theme.textMuted },
    searchInput: { flex: 1, fontSize: 14, color: theme.text },
    chipRow: { marginBottom: 20 },
    chip: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
      marginRight: 8,
    },
    chipActive: {
      backgroundColor: theme.primary + "1a",
      borderColor: theme.primary,
    },
    chipText: { fontSize: 13, color: theme.textMuted },
    chipTextActive: { color: theme.primary, fontWeight: "500" },
    list: { gap: 10 },
    activityCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    thumb: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: theme.primary + "1a",
      alignItems: "center",
      justifyContent: "center",
    },
    thumbIcon: { fontSize: 20 },
    activityName: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
      marginBottom: 2,
    },
    activityMeta: { fontSize: 12, color: theme.textMuted },
  });
