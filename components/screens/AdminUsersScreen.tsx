import { useTheme } from "@/context/ThemeContext";
import { Profile, supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminUsersScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data as Profile[]);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      Alert.alert(t("common.error", "Error"), err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayUsers = users.filter((u) => {
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search) ||
      false;
    return matchesRole && matchesSearch;
  });

  const renderUserItem = ({ item }: { item: Profile }) => {
    const dateStr = item.created_at
      ? new Date(item.created_at).toLocaleDateString()
      : "Unknown";
    return (
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.full_name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "?"}
          </Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.full_name || "No name"}</Text>
            <View
              style={[
                styles.roleBadge,
                item.role === "doctor"
                  ? styles.bgDoctor
                  : item.role === "admin"
                    ? styles.bgAdmin
                    : styles.bgPatient,
              ]}
            >
              <Text style={styles.roleText}>
                {t(`admin.users.role_${item.role}`, item.role)}
              </Text>
            </View>
          </View>
          <Text style={styles.subInfo}>{item.phone || "No phone"}</Text>
          <Text style={styles.dateInfo}>
            {t("admin.users.joined", "Joined")}: {dateStr}
          </Text>
        </View>
      </View>
    );
  };

  const roles = [
    { id: "all", label: t("admin.users.role_all", "All") },
    { id: "patient", label: t("admin.users.role_patient", "Patients") },
    { id: "doctor", label: t("admin.users.role_doctor", "Doctors") },
    { id: "admin", label: t("admin.users.role_admin", "Admins") },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t("admin.users.title", "Platform Users")}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={theme.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t("admin.users.search", "Search by name or email...")}
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          data={roles}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterChip,
                filterRole === item.id && styles.filterChipActive,
              ]}
              onPress={() => setFilterRole(item.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterRole === item.id && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
      ) : (
        <FlatList
          data={displayUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={theme.border} />
              <Text style={styles.emptyText}>
                {t("admin.users.no_users", "No users found.")}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    header: {
      paddingHorizontal: 24,
      paddingVertical: 20,
    },
    title: { fontSize: 24, fontWeight: "700", color: theme.text },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      marginHorizontal: 24,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, height: 44, fontSize: 15, color: theme.text },
    filtersWrapper: { marginBottom: 16 },
    filtersList: { paddingHorizontal: 24, gap: 8 },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterChipText: { fontSize: 14, fontWeight: "500", color: theme.text },
    filterChipTextActive: { color: "#fff" },
    list: { paddingHorizontal: 24, paddingBottom: 40 },
    userCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.primary + "1a",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    avatarText: { color: theme.primary, fontWeight: "700", fontSize: 16 },
    info: { flex: 1 },
    nameRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    name: { fontSize: 16, fontWeight: "600", color: theme.text, flex: 1 },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: theme.border,
    },
    bgPatient: { backgroundColor: theme.primary + "20" },
    bgDoctor: { backgroundColor: theme.success + "20" },
    bgAdmin: { backgroundColor: "#f59e0b20" },
    roleText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.text,
      textTransform: "uppercase",
    },
    subInfo: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
    dateInfo: { fontSize: 12, color: theme.border, marginTop: 4 },
    empty: { alignItems: "center", marginTop: 60, gap: 12 },
    emptyText: { color: theme.textMuted, fontSize: 15 },
  });
