import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { categorizeAndTagPost, generateAiConsultation } from "@/utils/ai";
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import YoutubeIframe from "react-native-youtube-iframe";
import { useTranslation } from "react-i18next";

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaType = "image" | "youtube" | "link" | "none";

type FeedPost = {
  id: string;
  author_id: string;
  author_name: string;
  author_role: "patient" | "doctor" | "admin" | "ai";
  author_avatar: string | null;
  title: string;
  body: string;
  media_type: MediaType;
  media_url: string | null;
  tags: string[];
  likes_count: number;
  is_liked: boolean;
  created_at: string;
  is_ai?: boolean;
  target_user_id?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractYoutubeId(url: string): string | null {
  const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function detectMediaType(url: string): MediaType {
  if (!url.trim()) return "none";
  if (extractYoutubeId(url)) return "youtube";
  if (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url)) return "image";
  if (url.startsWith("http")) return "link";
  return "none";
}

function timeAgo(dateStr: string, t: any): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("common.just_now", { defaultValue: "Just now" });
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function scorePost(
  post: FeedPost,
  interestTags: string[],
  searchQuery: string,
): number {
  let score = 0;
  const ageH = (Date.now() - new Date(post.created_at).getTime()) / 3600000;
  if (ageH < 24) score += 5;
  if (post.author_role === "doctor") score += 3;
  post.tags?.forEach((tag) => {
    if (interestTags.includes(tag)) score += 10;
  });
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    if (post.body.toLowerCase().includes(q)) score += 5;
    if (post.title.toLowerCase().includes(q)) score += 8;
    if (post.tags?.some((t) => t.toLowerCase().includes(q))) score += 6;
  }
  return score;
}

// ─── Tag Chip ─────────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Diet: { bg: "#dcfce7", text: "#15803d" },
  Exercise: { bg: "#dbeafe", text: "#1d4ed8" },
  Medication: { bg: "#fef9c3", text: "#854d0e" },
  Monitoring: { bg: "#f3e8ff", text: "#7e22ce" },
  Success: { bg: "#fce7f3", text: "#be185d" },
  Motivation: { bg: "#ffedd5", text: "#c2410c" },
  Question: { bg: "#e0f2fe", text: "#0369a1" },
  "AI Advice": { bg: "#eff6ff", text: "#2563eb" },
  Other: { bg: "#f1f5f9", text: "#475569" },
};

const TagChip = ({ tag }: { tag: string }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const color = TAG_COLORS[tag] ?? TAG_COLORS.Other;
  return (
    <View style={[styles.tagChip, { backgroundColor: color.bg }]}>
      <Text style={[styles.tagText, { color: color.text }]}>#{tag}</Text>
    </View>
  );
};

// ─── Post Card ────────────────────────────────────────────────────────────────

const PostCard = React.memo(
  ({
    post,
    onLike,
  }: {
    post: FeedPost;
    onLike: (id: string, liked: boolean) => void;
  }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { t } = useTranslation();
    const isDoctor = post.author_role === "doctor";

    const isAI = post.is_ai === true;
    const likeScale = useRef(new Animated.Value(1)).current;
    const youtubeId =
      post.media_type === "youtube" && post.media_url
        ? extractYoutubeId(post.media_url)
        : null;

    const handleLike = () => {
      Animated.sequence([
        Animated.timing(likeScale, {
          toValue: 1.4,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(likeScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
      onLike(post.id, post.is_liked);
    };

    return (
      <View style={[styles.postCard, isAI && styles.aiPostCard]}>
        <View style={styles.postHeader}>
          <View
            style={[
              styles.avatar,
              isDoctor && styles.avatarDoctor,
              isAI && styles.avatarAI,
            ]}
          >
            {post.author_avatar ? (
              <Image source={post.author_avatar} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>
                {isAI
                  ? "✦"
                  : (post.author_name || "U").substring(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>{post.author_name}</Text>
              {isDoctor && (
                <View style={styles.docBadge}>
                  <Ionicons name="shield-checkmark" size={10} color="#2563eb" />
                  <Text style={styles.docBadgeText}>
                    {t("auth.signup.roles.doctor")}
                  </Text>
                </View>
              )}
              {isAI && (
                <View style={styles.aiBadge}>
                  <Ionicons name="sparkles" size={10} color="#7c3aed" />
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              )}
            </View>
            <Text style={styles.timestamp}>{timeAgo(post.created_at, t)}</Text>
          </View>
        </View>

        {post.title ? <Text style={styles.postTitle}>{post.title}</Text> : null}
        <Text style={styles.postContent}>{post.body}</Text>

        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {post.tags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </View>
        )}

        {youtubeId && (
          <View style={styles.mediaContainer}>
            <YoutubeIframe height={200} videoId={youtubeId} />
          </View>
        )}
        {post.media_type === "image" && post.media_url && (
          <View style={styles.mediaContainer}>
            <Image
              source={post.media_url}
              style={styles.postImage}
              contentFit="cover"
            />
          </View>
        )}
        {post.media_type === "link" && post.media_url && (
          <Pressable
            style={styles.linkCard}
            onPress={() => Linking.openURL(post.media_url!)}
          >
            <Ionicons name="link" size={16} color="#2563eb" />
            <Text style={styles.linkText} numberOfLines={1}>
              {post.media_url}
            </Text>
            <Ionicons name="open-outline" size={14} color="#94a3b8" />
          </Pressable>
        )}

        <View style={styles.postFooter}>
          <Pressable style={styles.actionBtn} onPress={handleLike}>
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Ionicons
                name={post.is_liked ? "heart" : "heart-outline"}
                size={20}
                color={post.is_liked ? theme.danger : theme.textMuted}
              />
            </Animated.View>
            <Text
              style={[
                styles.actionText,
                post.is_liked && { color: theme.danger },
              ]}
            >
              {post.likes_count}
            </Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Ionicons
              name="chatbubble-outline"
              size={18}
              color={theme.textMuted}
            />
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Ionicons
              name="share-social-outline"
              size={18}
              color={theme.textMuted}
            />
          </Pressable>
        </View>
      </View>
    );
  },
);

// ─── Create Post Modal ────────────────────────────────────────────────────────

const AVAILABLE_TAGS = [
  "Diet",
  "Exercise",
  "Medication",
  "Monitoring",
  "Success",
  "Motivation",
  "Question",
  "Other",
];

const CreatePostModal = ({
  visible,
  onClose,
  onPost,
}: {
  visible: boolean;
  onClose: () => void;
  onPost: () => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();
  const { session } = useAuth();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [step, setStep] = useState<"compose" | "media" | "tags">("compose");

  const detectedMediaType = selectedImage ? "image" : detectMediaType(mediaUrl);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("common.error"), t("common.error"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setMediaUrl("");
    }
  };

  const handleAutoTag = async () => {
    if (!body.trim()) return;
    setTagging(true);
    try {
      setSelectedTags(await categorizeAndTagPost(body));
    } catch {
      setSelectedTags(["Other"]);
    }
    setTagging(false);
    setStep("tags");
  };

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const handlePost = async () => {
    if (!body.trim()) {
      Alert.alert(t("common.error"), t("common.error"));
      return;
    }
    setPosting(true);

    try {
      let finalMediaUrl: string | null =
        selectedImage || mediaUrl.trim() || null;
      let finalMediaType: MediaType = "none";

      if (selectedImage) {
        const filename = `feed/${session!.user.id}-${Date.now()}.jpg`;
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("feed-images")
          .upload(filename, blob, { contentType: "image/jpeg", upsert: true });
        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from("feed-images")
            .getPublicUrl(filename);
          finalMediaUrl = urlData.publicUrl;
        }
        finalMediaType = "image";
      } else if (mediaUrl.trim()) {
        finalMediaType = detectMediaType(mediaUrl.trim());
      }

      const { error } = await supabase.from("feed_posts").insert({
        author_id: session!.user.id,
        title: title.trim(),
        body: body.trim(),
        tags: selectedTags.length > 0 ? selectedTags : ["Other"],
        media_type: finalMediaType,
        media_url: finalMediaUrl,
      });
      if (error) throw error;

      setTitle("");
      setBody("");
      setMediaUrl("");
      setSelectedImage(null);
      setSelectedTags([]);
      setStep("compose");
      onPost();
      onClose();
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.message || t("common.error"));
    }
    setPosting(false);
  };

  const handleClose = () => {
    setTitle("");
    setBody("");
    setMediaUrl("");
    setSelectedImage(null);
    setSelectedTags([]);
    setStep("compose");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={handleClose}>
              <Text style={styles.modalCancel}>{t("common.cancel")}</Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {step === "compose"
                ? t("patient.feed.tabs.for_you")
                : step === "media"
                  ? t("common.map")
                  : t("patient.feed.tabs.community")}
            </Text>

            {step === "compose" ? (
              <Pressable
                onPress={handleAutoTag}
                disabled={!body.trim() || tagging}
              >
                <Text
                  style={[
                    styles.modalNext,
                    (!body.trim() || tagging) && { opacity: 0.4 },
                  ]}
                >
                  {tagging ? t("common.loading") : t("common.done")}
                </Text>
              </Pressable>
            ) : step === "media" ? (
              <Pressable onPress={() => setStep("tags")}>
                <Text style={styles.modalNext}>{t("common.done")}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={handlePost} disabled={posting}>
                {posting ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <Text style={styles.modalPost}>{t("common.save")}</Text>
                )}
              </Pressable>
            )}
          </View>

          {step === "compose" && (
            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              <TextInput
                style={styles.inputTitle}
                placeholder={t("patient.feed.ai_consult.title")}
                placeholderTextColor={theme.textMuted}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <TextInput
                style={styles.inputBody}
                placeholder={t("patient.feed.ai_consult.placeholder")}
                placeholderTextColor={theme.textMuted}
                value={body}
                onChangeText={setBody}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              <Pressable
                style={styles.addMediaBtn}
                onPress={() => setStep("media")}
              >
                <Ionicons
                  name="image-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text style={styles.addMediaText}>
                  {selectedImage || mediaUrl
                    ? t("common.success")
                    : t("common.done")}
                </Text>
              </Pressable>
            </ScrollView>
          )}

          {step === "media" && (
            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable style={styles.imagePickerBtn} onPress={pickImage}>
                {selectedImage ? (
                  <Image
                    source={selectedImage}
                    style={styles.previewImage}
                    contentFit="cover"
                  />
                ) : (
                  <>
                    <Ionicons name="image" size={40} color={theme.primary} />
                    <Text style={styles.imagePickerText}>
                      {t("common.done")}
                    </Text>
                  </>
                )}
              </Pressable>
              {selectedImage && (
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => setSelectedImage(null)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  <Text style={{ color: "#ef4444", marginLeft: 4 }}>
                    {t("common.delete")}
                  </Text>
                </Pressable>
              )}
              <Text style={styles.orDivider}>{t("common.timing")}</Text>
              <TextInput
                style={styles.inputUrl}
                placeholder="https://youtube.com/watch?v=... or any URL"
                placeholderTextColor={theme.textMuted}
                value={mediaUrl}
                onChangeText={(text) => {
                  setMediaUrl(text);
                  setSelectedImage(null);
                }}
                autoCapitalize="none"
                keyboardType="url"
              />
              {mediaUrl.trim() !== "" && (
                <View style={styles.urlPreview}>
                  <Ionicons
                    name={
                      detectedMediaType === "youtube" ? "logo-youtube" : "link"
                    }
                    size={18}
                    color={
                      detectedMediaType === "youtube"
                        ? theme.danger
                        : theme.primary
                    }
                  />
                  <Text style={styles.urlPreviewText}>
                    {t("common.done")}:{" "}
                    {detectedMediaType === "youtube"
                      ? "YouTube Video"
                      : detectedMediaType === "link"
                        ? "Website Link"
                        : "Unknown URL"}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {step === "tags" && (
            <ScrollView style={styles.modalBody}>
              <Text style={styles.tagsHint}>
                {selectedTags.length > 0 ? t("common.done") : t("common.done")}
              </Text>

              <View style={styles.tagGrid}>
                {AVAILABLE_TAGS.map((tag) => {
                  const color = TAG_COLORS[tag];
                  const selected = selectedTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      style={[
                        styles.tagOption,
                        {
                          backgroundColor: selected
                            ? color.bg
                            : theme.background,
                          borderColor: selected ? color.text : theme.border,
                        },
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      {selected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={color.text}
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.tagOptionText,
                          { color: selected ? color.text : theme.secondary },
                        ]}
                      >
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Ad Banner ────────────────────────────────────────────────────────────────

const AdBanner = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();
  return (
    <View style={styles.adCard}>
      <View style={styles.adBadge}>
        <Text style={styles.adBadgeText}>{t("patient.feed.sponsored")}</Text>
      </View>

      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&w=600&q=80",
        }}
        style={styles.adImage}
        contentFit="cover"
      />
      <View style={styles.adContent}>
        <Text style={styles.adTitle}>Advanced Glucose Monitor Pro</Text>
        <Text style={styles.adDesc}>
          Get real-time insights without finger pricks. Order now for 20% off.
        </Text>
        <Pressable style={styles.adButton}>
          <Text style={styles.adButtonText}>{t("common.reading")}</Text>
        </Pressable>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t, i18n } = useTranslation();
  const { session, profile, logout } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"community" | "ai">("community");
  const [aiQuestion, setAiQuestion] = useState("");
  const [generating, setGenerating] = useState(false);

  const interestTagsRef = useRef<string[]>([]);
  const searchTimeout = useRef<any>(null);

  const fetchPosts = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      let data: any[] | null = null;

      if (activeTab === "ai") {
        // Fetch private AI consultation posts
        const { data: aiData, error: aiError } = await supabase
          .from("feed_posts")
          .select("*")
          .eq("is_ai", true)
          .eq("target_user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(50);
        // Silently ignore missing column error (DB not migrated yet)
        data = aiError?.code === "42703" ? [] : aiData || [];
      } else {
        // Fetch community posts - handles both is_ai = false AND missing column
        const { data: commData, error: commError } = await supabase
          .from("feed_posts")
          .select("*")
          .or("is_ai.eq.false,is_ai.is.null")
          .order("created_at", { ascending: false })
          .limit(50);

        if (commError?.code === "42703") {
          // Column doesn't exist - fetch everything
          const { data: allData } = await supabase
            .from("feed_posts")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);
          data = allData || [];
        } else {
          data = commData || [];
        }
      }

      if (!data) return;

      // Fetch author profiles
      const authorIds = [...new Set(data.map((p) => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url")
        .in("id", authorIds);
      const profileMap: Record<string, any> = {};
      profiles?.forEach((p) => {
        profileMap[p.id] = p;
      });

      // Fetch likes
      const userId = session.user.id;
      const { data: liked } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId);
      const likedIds = new Set(liked?.map((l) => l.post_id) || []);

      const { data: likeCounts } = await supabase
        .from("post_likes")
        .select("post_id");
      const countMap: Record<string, number> = {};
      likeCounts?.forEach((l) => {
        countMap[l.post_id] = (countMap[l.post_id] || 0) + 1;
      });

      const mapped: FeedPost[] = data.map((p: any) => {
        const author = profileMap[p.author_id];
        return {
          id: p.id,
          author_id: p.author_id,
          author_name: p.is_ai
            ? t("patient.feed.ai_consult.ask")
            : author?.full_name || t("patient.profile.bio_placeholder"),
          author_role: p.is_ai ? "ai" : author?.role || "patient",
          author_avatar: p.is_ai ? null : author?.avatar_url || null,

          title: p.title || "",
          body: p.body,
          media_type: p.media_type || "none",
          media_url: p.media_url || null,
          tags: p.tags || [],
          likes_count: countMap[p.id] || 0,
          is_liked: likedIds.has(p.id),
          created_at: p.created_at,
          is_ai: p.is_ai,
          target_user_id: p.target_user_id,
        };
      });

      if (activeTab === "community") {
        const likedPostData = data.filter((p) => likedIds.has(p.id));
        const tagCount: Record<string, number> = {};
        likedPostData.forEach((p) => {
          (p.tags || []).forEach((t: string) => {
            tagCount[t] = (tagCount[t] || 0) + 1;
          });
        });
        interestTagsRef.current = Object.entries(tagCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag]) => tag);
        mapped.sort(
          (a, b) =>
            scorePost(b, interestTagsRef.current, searchQuery) -
            scorePost(a, interestTagsRef.current, searchQuery),
        );
      }

      setPosts(mapped);
    } catch (err) {
      console.error("[Feed] Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, activeTab, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleLike = useCallback(
    async (postId: string, isLiked: boolean) => {
      if (!session?.user?.id) return;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_liked: !isLiked,
                likes_count: p.likes_count + (isLiked ? -1 : 1),
              }
            : p,
        ),
      );
      if (isLiked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("user_id", session.user.id)
          .eq("post_id", postId);
      } else {
        await supabase
          .from("post_likes")
          .insert({ user_id: session.user.id, post_id: postId });
      }
    },
    [session],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/(auth)/login");
  }, [logout, router]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(async () => {
        if (text.trim() && session?.user?.id) {
          await supabase
            .from("user_searches")
            .insert({ user_id: session.user.id, query: text.trim() });
        }
      }, 1500);
    },
    [session],
  );

  const handleAskAi = useCallback(async () => {
    if (!aiQuestion.trim() || !session?.user?.id) return;
    Keyboard.dismiss();
    setGenerating(true);
    try {
      const [glucoseRes, nutritionRes, activityRes] = await Promise.all([
        supabase
          .from("measurements")
          .select("value, unit, recorded_at")
          .eq("patient_id", session.user.id)
          .eq("type", "glucose")
          .order("recorded_at", { ascending: false })
          .limit(10),
        supabase
          .from("nutrition_logs")
          .select("meal_type, carb_level, description, logged_at")
          .eq("patient_id", session.user.id)
          .order("logged_at", { ascending: false })
          .limit(5),
        supabase
          .from("activity_logs")
          .select("activity_type, intensity, duration_mins")
          .eq("patient_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      const gLogs =
        glucoseRes.data?.map(
          (g) =>
            `${g.value} ${g.unit} at ${new Date(g.recorded_at).toLocaleString()}`,
        ) || [];
      const nLogs =
        nutritionRes.data?.map(
          (n) => `${n.meal_type}: ${n.description} (${n.carb_level} carb)`,
        ) || [];
      const aLogs =
        activityRes.data?.map(
          (a) => `${a.activity_type} (${a.intensity}) for ${a.duration_mins}m`,
        ) || [];
      const response = await generateAiConsultation({
        question: aiQuestion.trim(),
        profile: profile || {},
        glucoseLogs: gLogs,
        nutritionLogs: nLogs,
        activityLogs: aLogs,
        language: i18n.language,
      });
      const { error: saveError } = await supabase.from("feed_posts").insert({
        author_id: session.user.id,
        title: response.title,
        body: response.body,
        media_type: response.media_type,
        media_url: response.media_url,
        is_ai: true,
        target_user_id: session.user.id,
        tags: ["AI Advice"],
      });
      if (saveError) {
        // Missing column = DB migration not run yet
        if (
          saveError.code === "42703" ||
          saveError.message?.includes("is_ai")
        ) {
          Alert.alert(t("common.error"), t("common.error"), [
            { text: t("common.ok") },
          ]);
          return;
        }
        throw saveError;
      }

      setAiQuestion("");
      fetchPosts();
      Alert.alert(t("common.success"), t("common.success"));
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message || t("common.error"));
    } finally {
      setGenerating(false);
    }
  }, [aiQuestion, session, profile, fetchPosts]);

  const displayPosts =
    searchQuery.trim() && activeTab === "community"
      ? posts.filter(
          (p) =>
            p.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.tags?.some((t) =>
              t.toLowerCase().includes(searchQuery.toLowerCase()),
            ) ||
            p.author_name.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : posts;

  const listHeader = React.useMemo(
    () => (
      <View style={styles.listHeader}>
        <View style={[styles.headerRow, { paddingHorizontal: 16 }]}>
          <View>
            <Text style={styles.greeting}>
              {activeTab === "ai"
                ? t("patient.feed.tabs.ai_consult")
                : t("patient.feed.tabs.for_you")}
            </Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString(
                t("common.locale", { defaultValue: "en" }),
                { weekday: "long", month: "long", day: "numeric" },
              )}
            </Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={theme.danger} />
          </Pressable>
        </View>

        {activeTab === "community" && (
          <View style={[styles.searchBar, { marginHorizontal: 16 }]}>
            <Ionicons name="search" size={20} color={theme.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholderTextColor={theme.textMuted}
              placeholder={t("patient.feed.tabs.community")}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        )}

        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === "community" && styles.activeTab]}
            onPress={() => setActiveTab("community")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "community" && styles.activeTabText,
              ]}
            >
              {t("patient.feed.tabs.community")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "ai" && styles.activeTab]}
            onPress={() => setActiveTab("ai")}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons
                name="sparkles"
                size={16}
                color={activeTab === "ai" ? "#7c3aed" : theme.textMuted}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "ai" && styles.activeTabText,
                ]}
              >
                {t("patient.feed.tabs.ai_consult")}
              </Text>
            </View>
          </Pressable>
        </View>

        {activeTab === "community" && interestTagsRef.current.length > 0 && (
          <View
            style={[
              styles.interestsRow,
              { paddingHorizontal: 16, marginTop: 8 },
            ]}
          >
            <Text style={styles.interestsLabel}>
              {t("patient.health_profile.sections.personal")}:
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {interestTagsRef.current.map((t) => (
                <TagChip key={t} tag={t} />
              ))}
            </ScrollView>
          </View>
        )}

        {activeTab === "ai" && (
          <View style={styles.aiInputBox}>
            <Text style={styles.aiBoxTitle}>
              ✦ {t("patient.feed.ai_consult.title")}
            </Text>
            <Text style={styles.aiBoxDesc}>
              {t("patient.feed.ai_consult.placeholder")}
            </Text>
            <View style={styles.aiInputRow}>
              <TextInput
                style={styles.aiInput}
                placeholder="e.g. Why was my glucose high this morning?"
                placeholderTextColor={theme.textMuted}
                value={aiQuestion}
                onChangeText={setAiQuestion}
                multiline
              />
              <Pressable
                style={[
                  styles.aiAskBtn,
                  (!aiQuestion.trim() || generating) && { opacity: 0.5 },
                ]}
                onPress={handleAskAi}
                disabled={!aiQuestion.trim() || generating}
              >
                {generating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>
    ),
    [
      activeTab,
      searchQuery,
      aiQuestion,
      generating,
      handleLogout,
      handleSearch,
      handleAskAi,
    ],
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 12, color: theme.textMuted }}>
          {t("common.loading")}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={displayPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        renderItem={({ item, index }) => (
          <>
            <PostCard post={item} onLike={handleLike} />
            {activeTab === "community" && index === 2 && <AdBanner />}
          </>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Ionicons
              name={
                activeTab === "ai" ? "sparkles-outline" : "newspaper-outline"
              }
              size={52}
              color={theme.border}
            />
            <Text
              style={{ color: theme.textMuted, marginTop: 12, fontSize: 16 }}
            >
              {activeTab === "ai"
                ? t("patient.feed.empty")
                : t("patient.feed.empty")}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchPosts();
            }}
            tintColor={theme.primary}
          />
        }
      />
      {activeTab === "community" && (
        <Pressable style={styles.fab} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      )}
      <CreatePostModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onPost={fetchPosts}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    scroll: { paddingHorizontal: 16, paddingBottom: 100 },

    listHeader: { paddingTop: 8, paddingBottom: 16 },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    greeting: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.5,
    },
    date: { fontSize: 13, color: theme.secondary, marginTop: 2 },
    logoutBtn: {
      padding: 8,
      backgroundColor: theme.danger + "1a",
      borderRadius: 10,
    },

    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 12,
    },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: theme.text },

    interestsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    interestsLabel: {
      fontSize: 12,
      color: theme.secondary,
      fontWeight: "600",
      flexShrink: 0,
    },

    // Tabs
    tabContainer: {
      flexDirection: "row",
      backgroundColor: theme.card,
      padding: 4,
      marginHorizontal: 16,
      marginBottom: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 10,
    },
    activeTab: { backgroundColor: theme.background, elevation: 1 },
    tabText: { fontSize: 14, fontWeight: "600", color: theme.secondary },
    activeTabText: { color: theme.primary },

    // AI Input Box
    aiInputBox: {
      backgroundColor: "#faf5ff",
      marginHorizontal: 16,
      marginTop: 12,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#e9d5ff",
    },
    aiBoxTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: "#6d28d9",
      marginBottom: 4,
    },
    aiBoxDesc: {
      fontSize: 12,
      color: "#7c3aed",
      marginBottom: 12,
      lineHeight: 18,
      opacity: 0.8,
    },
    aiInputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
    aiInput: {
      flex: 1,
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.text,
      borderWidth: 1,
      borderColor: "#ddd6fe",
      maxHeight: 100,
    },
    aiAskBtn: {
      backgroundColor: "#7c3aed",
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      elevation: 3,
    },

    // Post Card
    postCard: {
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.textMuted,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 3,
    },
    aiPostCard: {
      borderLeftWidth: 3,
      borderLeftColor: "#7c3aed",
      backgroundColor: theme.card,
    },
    postHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      overflow: "hidden",
    },
    avatarImg: { width: 44, height: 44, borderRadius: 22 },
    avatarDoctor: { backgroundColor: theme.primary },
    avatarAI: { backgroundColor: "#6d28d9" },
    avatarText: { color: "#fff", fontWeight: "800", fontSize: 15 },
    authorInfo: { flex: 1 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    authorName: { fontSize: 15, fontWeight: "700", color: theme.text },
    docBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: theme.primary + "1a",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    docBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.primary,
      textTransform: "uppercase",
    },
    aiBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: "#ede9fe",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    aiBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#7c3aed",
      textTransform: "uppercase",
    },
    timestamp: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    postTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 4,
    },
    postContent: {
      fontSize: 15,
      color: theme.secondary,
      lineHeight: 22,
      marginBottom: 12,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 12,
    },
    tagChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    tagText: { fontSize: 11, fontWeight: "700" },
    mediaContainer: {
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 12,
      backgroundColor: theme.background,
    },
    postImage: { width: "100%", height: 220, borderRadius: 12 },
    linkCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.primary + "1a",
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.primary + "33",
    },
    linkText: { flex: 1, color: theme.primary, fontSize: 13 },
    postFooter: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 12,
      gap: 24,
    },
    actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
    actionText: { fontSize: 14, color: theme.textMuted, fontWeight: "600" },

    // Ad Banner
    adCard: {
      backgroundColor: theme.card,
      borderRadius: 18,
      overflow: "hidden",
      marginBottom: 16,
      elevation: 2,
    },
    adBadge: {
      position: "absolute",
      top: 12,
      left: 12,
      backgroundColor: "#000a",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      zIndex: 10,
    },
    adBadgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    adImage: { width: "100%", height: 160 },
    adContent: { padding: 16 },
    adTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 4,
    },
    adDesc: {
      fontSize: 14,
      color: theme.secondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    adButton: {
      backgroundColor: theme.primary + "1a",
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
    },
    adButtonText: { color: theme.primary, fontSize: 14, fontWeight: "700" },

    // FAB
    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 10,
    },

    // Create Post Modal
    modal: { flex: 1, backgroundColor: theme.background },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: { fontSize: 17, fontWeight: "700", color: theme.text },
    modalCancel: { fontSize: 16, color: theme.secondary },
    modalNext: { fontSize: 16, color: theme.primary, fontWeight: "700" },
    modalPost: {
      fontSize: 16,
      color: "#fff",
      fontWeight: "700",
      backgroundColor: theme.primary,
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 10,
    },
    modalBody: { flex: 1, padding: 20 },
    inputTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 12,
      marginBottom: 16,
    },
    inputBody: {
      fontSize: 16,
      color: theme.text,
      lineHeight: 24,
      minHeight: 160,
      marginBottom: 20,
    },
    addMediaBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.primary + "1a",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary + "33",
    },
    addMediaText: { color: theme.primary, fontSize: 15, fontWeight: "600" },
    imagePickerBtn: {
      height: 200,
      backgroundColor: theme.card,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: theme.border,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      overflow: "hidden",
    },
    previewImage: { width: "100%", height: "100%" },
    imagePickerText: { color: theme.textMuted, marginTop: 8, fontSize: 15 },
    removeBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      paddingVertical: 10,
    },
    orDivider: {
      textAlign: "center",
      color: theme.textMuted,
      fontSize: 13,
      marginVertical: 16,
    },
    inputUrl: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
    },
    urlPreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
      backgroundColor: theme.primary + "1a",
      padding: 12,
      borderRadius: 10,
    },
    urlPreviewText: { color: theme.primary, fontSize: 14, fontWeight: "600" },
    tagsHint: {
      fontSize: 14,
      color: theme.secondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    tagOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
    },
    tagOptionText: { fontSize: 14, fontWeight: "600" },
  });
