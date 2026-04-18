import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/utils/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
    ActivityIndicator, Alert, Animated, Dimensions, FlatList, KeyboardAvoidingView,
    Linking, Modal, Platform, Pressable, RefreshControl, ScrollView,
    StyleSheet, Text, TextInput, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_W } = Dimensions.get('window');

const POST_TILE = (SCREEN_W - 3) / 3;

type FeedPost = {
    id: string;
    title: string;
    body: string;
    media_type: string;
    media_url: string | null;
    tags: string[];
    likes_count: number;
    created_at: string;
};

type TabType = 'posts' | 'liked';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: number }) {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <View style={styles.statPill}>
            <Text style={styles.statValue}>{value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function timeAgo(iso: string, t: any) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return t('common.done'); // just now
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}


// ─── Post Detail Modal ────────────────────────────────────────────────────────

const PostDetailModal = React.memo(({
    post,
    isOwner,
    onClose,
    onEdit,
    onDelete,
}: {
    post: FeedPost | null;
    isOwner: boolean;
    onClose: () => void;
    onEdit: (post: FeedPost) => void;
    onDelete: (id: string) => void;
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { t } = useTranslation();
    const [likers, setLikers] = useState<{ full_name: string; avatar_url: string | null }[]>([]);
    const [fetchingLikers, setFetchingLikers] = useState(false);

    useEffect(() => {
        if (post) {
            fetchLikers();
        }
    }, [post?.id]);

    const fetchLikers = async () => {
        if (!post) return;
        setFetchingLikers(true);
        try {
            const { data, error } = await supabase
                .from('post_likes')
                .select('profiles(full_name, avatar_url)')
                .eq('post_id', post.id)
                .limit(10);

            if (data) {
                const profiles = data.map((d: any) => d.profiles).filter(Boolean);
                setLikers(profiles);
            }
        } catch (err) {
            console.error('Error fetching likers:', err);
        } finally {
            setFetchingLikers(false);
        }
    };

    if (!post) return null;

    const handleDelete = () => {
        Alert.alert(t('common.delete'), t('patient.tracker.empty_charts.glucose'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: () => { onClose(); onDelete(post.id); } },
        ]);
    };


    return (
        <Modal visible={!!post} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.detailSafe}>
                {/* Header */}
                <View style={styles.detailHeader}>
                    <Pressable onPress={onClose} style={styles.detailCloseBtn}>
                        <Ionicons name="close" size={22} color={theme.text} />
                    </Pressable>
                    <Text style={styles.detailHeaderTitle} numberOfLines={1}>{post.title || 'Post'}</Text>
                    {isOwner ? (
                        <View style={styles.detailActions}>
                            <Pressable onPress={() => { onClose(); onEdit(post); }} style={styles.detailActionBtn}>
                                <Ionicons name="create-outline" size={22} color={theme.primary} />
                            </Pressable>
                            <Pressable onPress={handleDelete} style={styles.detailActionBtn}>
                                <Ionicons name="trash-outline" size={22} color={theme.danger} />
                            </Pressable>
                        </View>
                    ) : (
                        <View style={{ width: 80 }} />
                    )}
                </View>

                <ScrollView style={styles.detailBody} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Media */}
                    {post.media_type === 'image' && post.media_url && (
                        <Image source={{ uri: post.media_url }} style={styles.detailImage} contentFit="cover" />
                    )}
                    {post.media_type === 'youtube' && post.media_url && (
                        <Pressable style={styles.detailYoutubeCard} onPress={() => Linking.openURL(post.media_url!)}>
                            <Ionicons name="logo-youtube" size={36} color={theme.danger} />
                            <Text style={styles.detailYoutubeText}>Open on YouTube</Text>
                            <Ionicons name="open-outline" size={16} color={theme.textMuted} />
                        </Pressable>
                    )}
                    {post.media_type === 'link' && post.media_url && (
                        <Pressable style={styles.detailLinkCard} onPress={() => Linking.openURL(post.media_url!)}>
                            <Ionicons name="link" size={18} color={theme.primary} />
                            <Text style={styles.detailLinkText} numberOfLines={2}>{post.media_url}</Text>
                            <Ionicons name="open-outline" size={14} color={theme.textMuted} />
                        </Pressable>
                    )}

                    {/* Body */}
                    {post.title ? <Text style={styles.detailTitle}>{post.title}</Text> : null}
                    <Text style={styles.detailBody2}>{post.body}</Text>

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                        <View style={styles.detailTagRow}>
                            {post.tags.map(t => (
                                <View key={t} style={styles.detailTag}>
                                    <Text style={styles.detailTagText}>#{t}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text style={styles.detailTimestamp}>{timeAgo(post.created_at, t)}</Text>

                    {/* Liked by Section */}
                    {likers.length > 0 && (
                        <View style={styles.likersSection}>
                            <Text style={styles.likersTitle}>Liked by</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.likersList}>
                                {likers.map((l, idx) => (
                                    <View key={idx} style={styles.likerPill}>
                                        {l.avatar_url ? (
                                            <Image source={{ uri: l.avatar_url }} style={styles.likerAvatar} />
                                        ) : (
                                            <View style={[styles.likerAvatar, styles.likerAvatarFallback]}>
                                                <Text style={styles.likerAvatarText}>{l.full_name?.substring(0, 1).toUpperCase()}</Text>
                                            </View>
                                        )}
                                        <Text style={styles.likerName} numberOfLines={1}>{l.full_name}</Text>
                                    </View>
                                ))}
                                {post.likes_count > likers.length && (
                                    <Text style={styles.moreLikers}>+ {post.likes_count - likers.length} others</Text>
                                )}
                            </ScrollView>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
});

// ─── Edit Post Modal ──────────────────────────────────────────────────────────

const EditPostModal = React.memo(({
    post,
    onClose,
    onSaved,
}: {
    post: FeedPost | null;
    onClose: () => void;
    onSaved: (updated: FeedPost) => void;
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [tagsText, setTagsText] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (post) {
            setTitle(post.title || '');
            setBody(post.body || '');
            setTagsText(post.tags?.join(', ') || '');
        }
    }, [post]);

    const handleSave = async () => {
        if (!post) return;
        if (!body.trim()) { Alert.alert('Error', 'Post body cannot be empty.'); return; }
        
        // Parse tags: split by comma or space, remove empty, deduplicate
        const newTags = Array.from(new Set(
            tagsText
                .split(/[ ,]+/)
                .map(t => t.replace(/#/g, '').trim())
                .filter(t => t.length > 0)
        ));

        setSaving(true);
        const { error } = await supabase
            .from('feed_posts')
            .update({ 
                title: title.trim(), 
                body: body.trim(),
                tags: newTags 
            })
            .eq('id', post.id);

        setSaving(false);
        if (error) { Alert.alert('Error', error.message); return; }
        onSaved({ ...post, title: title.trim(), body: body.trim(), tags: newTags });
        onClose();
    };

    if (!post) return null;

    return (
        <Modal visible={!!post} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <SafeAreaView style={styles.detailSafe}>
                    {/* Header */}
                    <View style={styles.detailHeader}>
                        <Pressable onPress={onClose} style={styles.detailCloseBtn}>
                            <Text style={styles.editCancelText}>Cancel</Text>
                        </Pressable>
                        <Text style={styles.detailHeaderTitle}>Edit Post</Text>
                        <Pressable onPress={handleSave} disabled={saving} style={styles.editSaveBtn}>
                            {saving
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Text style={styles.editSaveText}>Save</Text>
                            }
                        </Pressable>
                    </View>

                    <ScrollView style={{ flex: 1, padding: 20 }} keyboardShouldPersistTaps="handled">
                        <Text style={styles.editFieldLabel}>Title</Text>
                        <TextInput
                            style={styles.editInput}
                            placeholder="Post title (optional)"
                            placeholderTextColor={theme.textMuted}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={120}
                        />
                        <Text style={styles.editFieldLabel}>Content</Text>
                        <TextInput
                            style={[styles.editInput, styles.editBodyInput]}
                            placeholder="What's on your mind?"
                            placeholderTextColor={theme.textMuted}
                            value={body}
                            onChangeText={setBody}
                            multiline
                            textAlignVertical="top"
                        />
                        <Text style={styles.editFieldLabel}>Tags (comma separated)</Text>
                        <TextInput
                            style={styles.editInput}
                            placeholder="Diet, Exercise, Success..."
                            placeholderTextColor={theme.textMuted}
                            value={tagsText}
                            onChangeText={setTagsText}
                        />
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
});

// ─── Post Grid Tile ───────────────────────────────────────────────────────────

const PostTile = React.memo(({ post, onPress }: { post: FeedPost; onPress: (p: FeedPost) => void }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const hasImage = post.media_type === 'image' && post.media_url;
    const hasYoutube = post.media_type === 'youtube';

    return (
        <Pressable style={styles.tile} onPress={() => onPress(post)}>
            {hasImage ? (
                <Image source={{ uri: post.media_url! }} style={styles.tileImage} contentFit="cover" />
            ) : hasYoutube ? (
                <View style={[styles.tileImage, styles.tileFallback]}>
                    <Ionicons name="logo-youtube" size={28} color={theme.danger} />
                </View>
            ) : (
                <View style={[styles.tileImage, styles.tileFallbackText]}>
                    <Text style={styles.tileFallbackBody} numberOfLines={4}>{post.body}</Text>
                </View>
            )}
            <View style={styles.tileOverlay}>
                <Ionicons name="heart" size={12} color="#fff" />
                <Text style={styles.tileOverlayText}>{post.likes_count}</Text>
            </View>
        </Pressable>
    );
});

// ─── Profile Header ───────────────────────────────────────────────────────────

const ProfileHeader = React.memo(({ profile, session, stats, activeTab, switchTab, tabUnderline, router }: any) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { t } = useTranslation();
    const avatarText = (profile?.full_name || session?.user?.email || 'U').substring(0, 2).toUpperCase();

    return (
        <View>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <Text style={styles.username}>
                    @{(profile?.full_name || session?.user?.email || 'user').toLowerCase().replace(/\s+/g, '_')}
                </Text>
                <Pressable onPress={() => router.push('/(patient)/settings')} style={styles.settingsBtn}>
                    <Ionicons name="menu-outline" size={26} color={theme.text} />
                </Pressable>
            </View>

            {/* Avatar + Stats */}
            <View style={styles.heroSection}>
                <View style={styles.avatarWrapper}>
                    {profile?.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarFallback]}>
                            <Text style={styles.avatarText}>{avatarText}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.statsRow}>
                    <StatPill label="Posts" value={stats.posts} />
                    <StatPill label="Likes" value={stats.likes} />
                    <StatPill label="Liked" value={stats.liked} />
                </View>
            </View>

            {/* Name & Bio */}
            <View style={styles.bioSection}>
                <Text style={styles.displayName}>{profile?.full_name || 'User'}</Text>
                {profile?.diabetes_type && (
                    <View style={styles.badgeRow}>
                        <View style={styles.diabetesBadge}>
                            <Text style={styles.diabetesBadgeText}>
                                {profile.diabetes_type === 'type1' ? 'Type 1' :
                                    profile.diabetes_type === 'type2' ? 'Type 2' :
                                        profile.diabetes_type.charAt(0).toUpperCase() + profile.diabetes_type.slice(1)} Diabetes
                            </Text>
                        </View>
                    </View>
                )}
                <Text style={styles.bioText} numberOfLines={2}>
                    {profile?.wilaya ? `📍 ${profile.wilaya}` : ''}
                    {profile?.diagnosis_year ? `  · Since ${profile.diagnosis_year}` : ''}
                </Text>
            </View>

            {/* Edit Profile Button */}
            <Pressable style={styles.editBtn} onPress={() => router.push('/(patient)/settings')}>
                <Text style={styles.editBtnText}>{t('patient.profile.title')}</Text>
            </Pressable>


            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <Pressable style={styles.tabItem} onPress={() => switchTab('posts')}>
                    <MaterialCommunityIcons name="grid" size={22} color={activeTab === 'posts' ? theme.text : theme.textMuted} />
                </Pressable>
                <Pressable style={styles.tabItem} onPress={() => switchTab('liked')}>
                    <Ionicons
                        name={activeTab === 'liked' ? 'heart' : 'heart-outline'}
                        size={22}
                        color={activeTab === 'liked' ? theme.danger : theme.textMuted}
                    />
                </Pressable>
                <Animated.View style={[
                    styles.tabUnderline,
                    { left: tabUnderline.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] }) }
                ]} />
            </View>
        </View>
    );
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatientProfileScreen() {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { t } = useTranslation();
    const { session, profile } = useAuth();
    const router = useRouter();


    const [myPosts, setMyPosts] = useState<FeedPost[]>([]);
    const [likedPosts, setLikedPosts] = useState<FeedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('posts');
    const [stats, setStats] = useState({ posts: 0, likes: 0, liked: 0 });
    const tabUnderline = useRef(new Animated.Value(0)).current;

    // Modal state
    const [viewPost, setViewPost] = useState<FeedPost | null>(null);
    const [editPost, setEditPost] = useState<FeedPost | null>(null);

    const userId = session?.user?.id;

    const fetchData = useCallback(async () => {
        if (!userId) return;
        try {
            const { data: postsData } = await supabase
                .from('feed_posts')
                .select('id, title, body, media_type, media_url, tags, created_at')
                .eq('author_id', userId)
                .order('created_at', { ascending: false });

            const { data: likedIds } = await supabase
                .from('post_likes').select('post_id').eq('user_id', userId);

            const likedPostIds = likedIds?.map(l => l.post_id) ?? [];

            let likedPostsData: any[] = [];
            if (likedPostIds.length > 0) {
                const { data: liked } = await supabase
                    .from('feed_posts')
                    .select('id, title, body, media_type, media_url, tags, created_at')
                    .in('id', likedPostIds)
                    .order('created_at', { ascending: false });
                likedPostsData = liked ?? [];
            }
            // Step 5: Fetch counts for all displayed posts
            const allPostIds = [...(postsData?.map(p => p.id) || []), ...likedPostIds];
            let counts: Record<string, number> = {};
            let totalLikesOnMyPosts = 0;
            
            if (allPostIds.length > 0) {
                const { data: cData } = await supabase
                    .from('post_likes')
                    .select('post_id');
                
                cData?.forEach(row => {
                    counts[row.post_id] = (counts[row.post_id] || 0) + 1;
                });

                // Calculate total likes on MY posts specifically for the stats header
                postsData?.forEach(p => {
                    totalLikesOnMyPosts += (counts[p.id] || 0);
                });
            }

            const mapPost = (p: any): FeedPost => ({
                id: p.id, title: p.title ?? '', body: p.body,
                media_type: p.media_type ?? 'none', media_url: p.media_url ?? null,
                tags: p.tags ?? [], likes_count: counts[p.id] || 0, created_at: p.created_at,
            });

            setMyPosts((postsData ?? []).map(mapPost));
            setLikedPosts(likedPostsData.map(mapPost));
            setStats({ 
                posts: postsData?.length ?? 0, 
                likes: totalLikesOnMyPosts, 
                liked: likedPostIds.length 
            });
        } catch (err) {
            console.error('[Profile] fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const switchTab = (tab: TabType) => {
        setActiveTab(tab);
        Animated.spring(tabUnderline, { toValue: tab === 'posts' ? 0 : 1, useNativeDriver: false }).start();
    };

    const handleDeletePost = async (id: string) => {
        const { error } = await supabase.from('feed_posts').delete().eq('id', id);
        if (error) { Alert.alert('Error', error.message); return; }
        setMyPosts(prev => prev.filter(p => p.id !== id));
        setStats(prev => ({ ...prev, posts: prev.posts - 1 }));
    };

    const handlePostSaved = (updated: FeedPost) => {
        setMyPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
    };

    const displayPosts = activeTab === 'posts' ? myPosts : likedPosts;

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <FlatList
                data={displayPosts}
                keyExtractor={item => item.id}
                numColumns={3}
                ListHeaderComponent={
                    <ProfileHeader
                        profile={profile}
                        session={session}
                        stats={stats}
                        activeTab={activeTab}
                        switchTab={switchTab}
                        tabUnderline={tabUnderline}
                        router={router}
                    />
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={theme.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name={activeTab === 'posts' ? 'create-outline' : 'heart-outline'} size={48} color={theme.border} />
                        <Text style={styles.emptyTitle}>{activeTab === 'posts' ? t('patient.feed.empty') : t('patient.feed.empty')}</Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === 'posts' ? t('patient.feed.empty') : t('patient.feed.empty')}
                        </Text>
                    </View>
                }

                renderItem={({ item }) => (
                    <PostTile post={item} onPress={setViewPost} />
                )}
                columnWrapperStyle={styles.gridRow}
                showsVerticalScrollIndicator={false}
            />

            {/* Post Detail Modal */}
            <PostDetailModal
                post={viewPost}
                isOwner={viewPost?.id ? myPosts.some(p => p.id === viewPost.id) : false}
                onClose={() => setViewPost(null)}
                onEdit={(p) => { setViewPost(null); setEditPost(p); }}
                onDelete={handleDeletePost}
            />

            {/* Edit Post Modal */}
            <EditPostModal
                post={editPost}
                onClose={() => setEditPost(null)}
                onSaved={handlePostSaved}
            />
        </SafeAreaView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },

    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    username: { fontSize: 17, fontWeight: '700', color: theme.text },
    settingsBtn: { padding: 4 },

    heroSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
    avatarWrapper: { marginRight: 20 },
    avatar: { width: 86, height: 86, borderRadius: 43 },
    avatarFallback: { backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },

    statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
    statPill: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '800', color: theme.text },
    statLabel: { fontSize: 12, color: theme.textMuted, marginTop: 2 },

    bioSection: { paddingHorizontal: 16, paddingBottom: 12 },
    displayName: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 4 },
    badgeRow: { flexDirection: 'row', marginBottom: 6 },
    diabetesBadge: { backgroundColor: theme.primary + '1a', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: theme.primary + '33' },
    diabetesBadgeText: { fontSize: 12, color: theme.primary, fontWeight: '600' },
    bioText: { fontSize: 13, color: theme.textMuted, lineHeight: 18 },

    editBtn: { marginHorizontal: 16, marginBottom: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: theme.border, alignItems: 'center', backgroundColor: theme.background },
    editBtnText: { fontSize: 14, fontWeight: '700', color: theme.text },

    tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.border, position: 'relative' },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
    tabUnderline: { position: 'absolute', bottom: 0, width: '50%', height: 2, backgroundColor: theme.text },

    gridRow: { gap: 1.5 },
    tile: { width: POST_TILE, height: POST_TILE, position: 'relative', marginBottom: 1.5 },
    tileImage: { width: '100%', height: '100%' },
    tileFallback: { backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center' },
    tileFallbackText: { backgroundColor: theme.background, padding: 8, justifyContent: 'center' },
    tileFallbackBody: { fontSize: 11, color: theme.textMuted, lineHeight: 15 },
    tileOverlay: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
    tileOverlayText: { color: '#fff', fontSize: 11, fontWeight: '700', textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },

    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: theme.text, marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: theme.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },

    // ─── Post Detail Modal ─────────────────────────────────────────────────────
    detailSafe: { flex: 1, backgroundColor: theme.background },
    detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
    detailCloseBtn: { width: 80, alignItems: 'flex-start' },
    detailHeaderTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: theme.text, textAlign: 'center' },
    detailActions: { flexDirection: 'row', width: 80, justifyContent: 'flex-end', gap: 4 },
    detailActionBtn: { padding: 6 },

    detailBody: { flex: 1 },
    detailImage: { width: '100%', height: 260 },
    detailTitle: { fontSize: 18, fontWeight: '700', color: theme.text, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    detailBody2: { fontSize: 15, color: theme.secondary, lineHeight: 22, paddingHorizontal: 16, paddingBottom: 12 },
    detailTimestamp: { fontSize: 12, color: theme.textMuted, paddingHorizontal: 16, paddingTop: 8 },

    detailTagRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
    detailTag: { backgroundColor: theme.primary + '1a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    detailTagText: { fontSize: 12, color: theme.primary, fontWeight: '600' },

    detailYoutubeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16, padding: 16, backgroundColor: theme.danger + '1a', borderRadius: 12, borderWidth: 1, borderColor: theme.danger + '33' },
    detailYoutubeText: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.text },
    detailLinkCard: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 14, backgroundColor: theme.primary + '1a', borderRadius: 12, borderWidth: 1, borderColor: theme.primary + '33' },
    detailLinkText: { flex: 1, fontSize: 13, color: theme.primary },

    // ─── Edit Post Modal ───────────────────────────────────────────────────────
    editCancelText: { fontSize: 15, color: theme.textMuted, fontWeight: '600' },
    editSaveBtn: { backgroundColor: theme.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7, minWidth: 60, alignItems: 'center' },
    editSaveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    editFieldLabel: { fontSize: 12, fontWeight: '600', color: theme.secondary, marginBottom: 8, marginTop: 16 },
    editInput: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text },
    editBodyInput: { minHeight: 180, textAlignVertical: 'top', paddingTop: 12 },

    // ─── Likers Styles ────────────────────────────────────────────────────────
    likersSection: { marginTop: 20, borderTopWidth: 1, borderTopColor: theme.border, paddingVertical: 16 },
    likersTitle: { fontSize: 14, fontWeight: '700', color: theme.text, paddingHorizontal: 16, marginBottom: 12 },
    likersList: { paddingHorizontal: 16, gap: 12 },
    likerPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: theme.border, gap: 8 },
    likerAvatar: { width: 24, height: 24, borderRadius: 12 },
    likerAvatarFallback: { backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
    likerAvatarText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    likerName: { fontSize: 13, color: theme.text, fontWeight: '600', maxWidth: 100 },
    moreLikers: { fontSize: 12, color: theme.textMuted, alignSelf: 'center', marginLeft: 4 },
});
