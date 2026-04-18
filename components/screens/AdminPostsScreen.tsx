import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/supabase";
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

interface Post {
  id: string;
  title: string;
  body: string;
  target_role: string;
  created_at: string;
  author_id: string;
  author_name: string;
}

export default function AdminPostsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feed_posts")
        .select(
          `
                    id, title, body, target_role, created_at, author_id,
                    profiles:author_id(full_name)
                `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = data.map((item: any) => ({
        ...item,
        author_name: item.profiles?.full_name || "Unknown User",
      }));
      setPosts(formatted);
    } catch (err: any) {
      console.error("Error fetching posts:", err);
      Alert.alert(t("common.error", "Error"), err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t("admin.posts.delete_confirm_title", "Delete Post"),
      t(
        "admin.posts.delete_confirm_desc",
        "Are you sure you want to permanently delete this post?",
      ),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("common.delete", "Delete"),
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("feed_posts")
                .delete()
                .eq("id", id);
              if (error) throw error;
              setPosts((prev) => prev.filter((p) => p.id !== id));
            } catch (err: any) {
              Alert.alert(t("common.error", "Error"), err.message);
            }
          },
        },
      ],
    );
  };

  const displayPosts = posts.filter((p) =>
    (p.title + " " + p.body + " " + p.author_name)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const renderPostItem = ({ item }: { item: Post }) => {
    const dateStr = item.created_at
      ? new Date(item.created_at).toLocaleDateString()
      : "Unknown";

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.authorBadge}>
            <Ionicons
              name="person-circle-outline"
              size={32}
              color={theme.textMuted}
            />
            <View>
              <Text style={styles.authorName}>{item.author_name}</Text>
              <Text style={styles.dateInfo}>{dateStr}</Text>
            </View>
          </View>
          <Pressable
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={theme.danger || "#ef4444"}
            />
          </Pressable>
        </View>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postBody} numberOfLines={3}>
          {item.body}
        </Text>
        <View style={styles.footerInfo}>
          <Text style={styles.targetRole}>
            {t("admin.posts.target_role", "Target role")}: {item.target_role}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t("admin.posts.title", "Content Moderation")}
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
          placeholder={t("admin.posts.search", "Search posts...")}
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
      ) : (
        <FlatList
          data={displayPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPostItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={theme.border}
              />
              <Text style={styles.emptyText}>
                {t("admin.posts.no_posts", "No posts found.")}
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
    list: { paddingHorizontal: 24, paddingBottom: 40 },
    postCard: {
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    postHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    authorBadge: { flexDirection: "row", alignItems: "center", gap: 8 },
    authorName: { fontSize: 14, fontWeight: "600", color: theme.text },
    dateInfo: { fontSize: 12, color: theme.textMuted },
    deleteBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: (theme.danger || "#ef4444") + "1a",
    },
    postTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 6,
    },
    postBody: {
      fontSize: 14,
      color: theme.textMuted,
      lineHeight: 20,
      marginBottom: 12,
    },
    footerInfo: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 12,
      marginTop: 4,
    },
    targetRole: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.primary,
      textTransform: "uppercase",
    },
    empty: { alignItems: "center", marginTop: 60, gap: 12 },
    emptyText: { color: theme.textMuted, fontSize: 15 },
  });
