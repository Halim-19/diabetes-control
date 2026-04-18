import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Buffer } from 'buffer';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
    Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Edit Account Modal ───────────────────────────────────────────────────────

const EditAccountModal = ({
    visible, onClose, currentEmail
}: { visible: boolean; onClose: () => void; currentEmail: string }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const s = useMemo(() => createStyles(theme), [theme]);
    
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSave = async () => {
        if (newEmail && !/\S+@\S+\.\S+/.test(newEmail)) {
            Alert.alert('Invalid email', 'Please enter a valid email address.');
            return;
        }
        if (newPassword && newPassword.length < 6) {
            Alert.alert('Weak password', 'Password must be at least 6 characters.');
            return;
        }
        if (newPassword && newPassword !== confirmPassword) {
            Alert.alert(t('common.error'), t('common.error')); // Password mismatch
            return;
        }

        setLoading(true);
        try {
            const updates: any = {};
            if (newEmail) updates.email = newEmail;
            if (newPassword) updates.password = newPassword;

            if (Object.keys(updates).length === 0) {
                Alert.alert('Nothing to change', 'Enter a new email or password.');
                return;
            }

            const { error } = await supabase.auth.updateUser(updates);
            if (error) throw error;

            Alert.alert(
                'Updated!',
                newEmail
                    ? 'Check your new email inbox to confirm the change.'
                    : 'Password updated successfully.',
                [{ text: 'OK', onPress: onClose }]
            );
            setNewEmail(''); setNewPassword(''); setConfirmPassword('');
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Something went wrong.');
        }
        setLoading(false);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <SafeAreaView style={s.modal}>
                    <View style={s.modalHeader}>
                        <Pressable onPress={onClose}>
                            <Text style={s.modalCancel}>{t('common.cancel')}</Text>
                        </Pressable>
                        <Text style={s.modalTitle}>{t('settings.change_email_password')}</Text>
                        <Pressable onPress={handleSave} disabled={loading}>
                            {loading ? <ActivityIndicator color={theme.primary} /> : <Text style={s.modalSave}>{t('common.save')}</Text>}
                        </Pressable>
                    </View>


                    <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
                        {/* Current email display */}
                        <View style={s.currentEmailCard}>
                            <Ionicons name="mail" size={18} color={theme.primary} />
                            <View style={{ marginLeft: 10, flex: 1 }}>
                                <Text style={s.currentEmailLabel}>{t('settings.current_email')}</Text>
                                <Text style={s.currentEmailValue}>{currentEmail}</Text>
                            </View>
                        </View>

                        {/* Change Email */}
                        <Text style={s.fieldSection}>{t('settings.change_email')}</Text>
                        <View style={s.inputRow}>
                            <Ionicons name="mail-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                            <TextInput
                                style={s.input}
                                placeholder={t('settings.new_email')}
                                placeholderTextColor={theme.textMuted}
                                value={newEmail}
                                onChangeText={setNewEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Change Password */}
                        <Text style={s.fieldSection}>{t('settings.change_password')}</Text>
                        <View style={s.inputRow}>
                            <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                            <TextInput
                                style={s.input}
                                placeholder={t('settings.new_password')}
                                placeholderTextColor={theme.textMuted}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showPass}
                            />
                            <Pressable onPress={() => setShowPass(!showPass)}>
                                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textMuted} />
                            </Pressable>
                        </View>
                        <View style={s.inputRow}>
                            <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                            <TextInput
                                style={s.input}
                                placeholder={t('settings.confirm_password')}
                                placeholderTextColor={theme.textMuted}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPass}
                            />
                        </View>

                        <Text style={s.hint}>
                            📩 {t('settings.email_hint')}
                        </Text>
                    </ScrollView>

                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ─── Edit Profile Info Modal ──────────────────────────────────────────────────

const EditProfileModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const { t } = useTranslation();
    const { profile, session, refreshProfile } = useAuth();
    const { theme } = useTheme();
    const s = useMemo(() => createStyles(theme), [theme]);

    const [fullName, setFullName] = useState(profile?.full_name ?? '');
    const [phone, setPhone] = useState(profile?.phone ?? '');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const pickAvatar = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            quality: 0.7,
            base64: true,               // get base64 directly — avoids Android content:// URI issues
            mediaTypes: ['images'],
        });
        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
            setAvatarBase64(result.assets[0].base64 ?? null);
        }
    };

    const handleSave = async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            let avatarUrl = profile?.avatar_url ?? null;

            if (avatarBase64) {
                // Use base64 from ImagePicker directly — avoids Android content:// URI issues
                const ext = avatarUri?.split('.').pop()?.toLowerCase() || 'jpg';
                const filename = `${session.user.id}/${Date.now()}.${ext}`;
                const bytes = Buffer.from(avatarBase64, 'base64');

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filename, bytes, {
                        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                        upsert: true,
                    });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filename);
                avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
            }

            const { error } = await supabase.from('profiles').update({
                full_name: fullName.trim(),
                phone: phone.trim(),
                avatar_url: avatarUrl,
            }).eq('id', session.user.id);

            if (error) throw error;
            await refreshProfile?.();
            onClose();
        } catch (err: any) {
            Alert.alert('Upload Error', err?.message || 'Update failed.');
        }
        setLoading(false);
    };

    const avatarSrc = avatarUri || profile?.avatar_url;
    const avatarText = (fullName || 'U').substring(0, 2).toUpperCase();

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <SafeAreaView style={s.modal}>
                    <View style={s.modalHeader}>
                        <Pressable onPress={onClose}><Text style={s.modalCancel}>{t('common.cancel')}</Text></Pressable>
                        <Text style={s.modalTitle}>{t('settings.edit_profile')}</Text>
                        <Pressable onPress={handleSave} disabled={loading}>
                            {loading ? <ActivityIndicator color={theme.primary} /> : <Text style={s.modalSave}>{t('common.save')}</Text>}
                        </Pressable>
                    </View>


                    <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
                        {/* Avatar Picker */}
                        <Pressable style={s.avatarPicker} onPress={pickAvatar}>
                            {avatarSrc ? (
                                <Image source={{ uri: avatarSrc }} style={s.avatarPreview} />
                            ) : (
                                <View style={[s.avatarPreview, s.avatarFallback]}>
                                    <Text style={s.avatarFallbackText}>{avatarText}</Text>
                                </View>
                            )}
                            <View style={s.avatarEditBadge}>
                                <Ionicons name="camera" size={14} color="#fff" />
                            </View>
                        </Pressable>

                        <Text style={s.fieldSection}>{t('patient.health_profile.fields.full_name')}</Text>
                        <View style={s.inputRow}>
                            <Ionicons name="person-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                            <TextInput
                                style={s.input}
                                placeholder={t('settings.full_name_placeholder')}
                                placeholderTextColor={theme.textMuted}
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                        <Text style={s.fieldSection}>{t('patient.health_profile.fields.phone')}</Text>
                        <View style={s.inputRow}>
                            <Ionicons name="call-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                            <TextInput
                                style={s.input}
                                placeholder={t('settings.phone_placeholder')}
                                placeholderTextColor={theme.textMuted}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <Text style={s.hint}>{t('settings.bio_hint')}</Text>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ─── Settings Row ─────────────────────────────────────────────────────────────

const SettingRow = ({
    icon, label, color, onPress, rightElement, danger = false, theme
}: {
    icon: string; label: string; color?: string; onPress?: () => void;
    rightElement?: React.ReactNode; danger?: boolean; theme: any;
}) => (
    <Pressable style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', padding: 14 },
        pressed && { backgroundColor: theme.background + '80' }
    ]} onPress={onPress}>
        <View style={[{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 }, { backgroundColor: danger ? theme.danger + '20' : theme.background }]}>
            <Ionicons name={icon as any} size={18} color={danger ? theme.danger : (color ?? theme.text)} />
        </View>
        <Text style={[{ fontSize: 15, fontWeight: '500' }, { color: danger ? theme.danger : theme.text }]}>{label}</Text>
        <View style={{ flex: 1 }} />
        {rightElement ?? <Ionicons name="chevron-forward" size={16} color={theme.border} />}
    </Pressable>
);

// ─── Main Settings Screen ────────────────────────────────────────────────────

export default function SettingsScreen() {
    const { session, profile, logout } = useAuth();
    const { theme, mode, setMode, isDark } = useTheme();
    const { language, setLanguage } = useLanguage();
    const { t } = useTranslation();
    const router = useRouter();
    
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [notifs, setNotifs] = useState(true);

    const s = useMemo(() => createStyles(theme), [theme]);

    const handleSignOut = () => {
        Alert.alert(t('common.sign_out'), t('common.confirm_sign_out'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.sign_out'), style: 'destructive',
                onPress: async () => {
                    await logout();
                    router.replace('/(auth)/login');
                }
            }
        ]);
    };

    const avatarSrc = profile?.avatar_url;
    const avatarText = (profile?.full_name || 'U').substring(0, 2).toUpperCase();

    const languages = [
        { code: 'en', label: t('languages.en'), icon: '🇺🇸' },
        { code: 'fr', label: t('languages.fr'), icon: '🇫🇷' },
        { code: 'ar', label: t('languages.ar'), icon: '🇩🇿' },
    ];

    const themes = [
        { code: 'light', label: t('settings.theme.light'), icon: 'sunny-outline' },
        { code: 'dark', label: t('settings.theme.dark'), icon: 'moon-outline' },
        { code: 'system', label: t('settings.theme.system'), icon: 'settings-outline' },
    ];

    return (
        <SafeAreaView style={s.safe}>
            {/* Header */}
            <View style={s.header}>
                <Pressable onPress={() => router.replace('/(patient)/profile')} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </Pressable>
                <Text style={s.headerTitle}>{t('settings.title')}</Text>
                <View style={{ width: 30 }} />
            </View>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <Pressable style={s.profileCard} onPress={() => setShowProfileModal(true)}>
                    {avatarSrc ? (
                        <Image source={{ uri: avatarSrc }} style={s.profileAvatar} />
                    ) : (
                        <View style={[s.profileAvatar, s.avatarFallback]}>
                            <Text style={s.avatarFallbackText}>{avatarText}</Text>
                        </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={s.profileName}>{profile?.full_name || t('common.done')}</Text>
                        <Text style={s.profileEmail}>{session?.user?.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </Pressable>


                {/* Account */}
                <Text style={s.sectionLabel}>{t('settings.account')}</Text>
                <View style={s.group}>
                    <SettingRow theme={theme} icon="person-circle-outline" label={t('settings.edit_profile')} onPress={() => setShowProfileModal(true)} />
                    <View style={s.divider} />
                    <SettingRow theme={theme} icon="heart-circle-outline" label={t('settings.edit_health_profile')} color={theme.primary} onPress={() => router.push('/(patient)/health-profile')} />
                    <View style={s.divider} />
                    <SettingRow theme={theme} icon="key-outline" label={t('settings.change_email_password')} onPress={() => setShowAccountModal(true)} />
                </View>

                {/* Preferences */}
                <Text style={s.sectionLabel}>{t('settings.preferences')}</Text>
                <View style={s.group}>
                    <SettingRow
                        theme={theme}
                        icon="notifications-outline" label={t('settings.push_notifications')}
                        rightElement={<Switch value={notifs} onValueChange={setNotifs} trackColor={{ true: theme.primary }} />}
                    />
                    <View style={s.divider} />
                    <SettingRow
                        theme={theme}
                        icon="language-outline" label={t('settings.language')}
                        rightElement={
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ color: theme.textMuted, marginRight: 8 }}>{languages.find(l => l.code === language)?.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color={theme.border} />
                            </View>
                        }
                        onPress={() => setShowLanguageModal(true)}
                    />
                    <View style={s.divider} />
                    <SettingRow
                        theme={theme}
                        icon="color-palette-outline" label={t('settings.appearance')}
                        rightElement={
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ color: theme.textMuted, marginRight: 8 }}>{t(`settings.theme.${mode}`)}</Text>
                                <Ionicons name="chevron-forward" size={16} color={theme.border} />
                            </View>
                        }
                    />
                    <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: theme.background }}>
                        {themes.map((tItem) => (
                            <Pressable
                                key={tItem.code}
                                onPress={() => setMode(tItem.code as any)}
                                style={{
                                    alignItems: 'center',
                                    padding: 8,
                                    borderRadius: 12,
                                    backgroundColor: mode === tItem.code ? theme.card : 'transparent',
                                    borderWidth: 1,
                                    borderColor: mode === tItem.code ? theme.primary : 'transparent',
                                    width: '30%'
                                }}
                            >
                                <Ionicons name={tItem.icon as any} size={20} color={mode === tItem.code ? theme.primary : theme.textMuted} />
                                <Text style={{ fontSize: 11, marginTop: 4, color: mode === tItem.code ? theme.primary : theme.textMuted }}>{tItem.label}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Support */}
                <Text style={s.sectionLabel}>{t('settings.support')}</Text>
                <View style={s.group}>
                    <SettingRow theme={theme} icon="help-circle-outline" label={t('settings.help_center')} />
                    <View style={s.divider} />
                    <SettingRow theme={theme} icon="document-text-outline" label={t('settings.terms_of_service')} />
                    <View style={s.divider} />
                    <SettingRow theme={theme} icon="shield-checkmark-outline" label={t('settings.privacy_policy')} />
                </View>

                {/* Danger Zone */}
                <Text style={s.sectionLabel}>{t('settings.account')}</Text>
                <View style={s.group}>
                    <SettingRow theme={theme} icon="log-out-outline" label={t('common.sign_out')} onPress={handleSignOut} danger />
                </View>

                <Text style={s.versionText}>DiabControl v1.0.0</Text>
            </ScrollView>

            {/* Language Modal */}
            <Modal visible={showLanguageModal} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.bottomSheet}>
                        <View style={s.sheetHeader}>
                            <Text style={s.sheetTitle}>{t('settings.language')}</Text>
                            <Pressable onPress={() => setShowLanguageModal(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </Pressable>
                        </View>
                        {languages.map((lang) => (
                            <Pressable 
                                key={lang.code} 
                                style={[s.langRow, language === lang.code && s.langRowActive]}
                                onPress={async () => {
                                    await setLanguage(lang.code as any);
                                    setShowLanguageModal(false);
                                }}
                            >
                                <Text style={{ fontSize: 24, marginRight: 12 }}>{lang.icon}</Text>
                                <Text style={[s.langLabel, language === lang.code && s.langLabelActive]}>{lang.label}</Text>
                                {language === lang.code && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                            </Pressable>
                        ))}
                    </View>
                </View>
            </Modal>

            <EditAccountModal
                visible={showAccountModal}
                onClose={() => setShowAccountModal(false)}
                currentEmail={session?.user?.email ?? ''}
            />
            <EditProfileModal
                visible={showProfileModal}
                onClose={() => setShowProfileModal(false)}
            />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (theme: any) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },

    scroll: { padding: 16, paddingBottom: 40 },

    profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: theme.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
    profileAvatar: { width: 56, height: 56, borderRadius: 28 },
    avatarFallback: { backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
    avatarFallbackText: { color: '#fff', fontSize: 20, fontWeight: '800' },
    profileName: { fontSize: 16, fontWeight: '700', color: theme.text },
    profileEmail: { fontSize: 13, color: theme.textMuted, marginTop: 2 },

    sectionLabel: { fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4, marginTop: 8 },
    group: { backgroundColor: theme.card, borderRadius: 16, overflow: 'hidden', marginBottom: 16, shadowColor: theme.text, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },

    divider: { height: 1, backgroundColor: theme.border, marginLeft: 62 },

    versionText: { textAlign: 'center', color: theme.textMuted, fontSize: 12, marginTop: 16 },

    // Modal
    modal: { flex: 1, backgroundColor: theme.background },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.card },
    modalTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
    modalCancel: { fontSize: 16, color: theme.textMuted },
    modalSave: { fontSize: 16, color: theme.primary, fontWeight: '700' },
    modalBody: { flex: 1, padding: 20 },

    currentEmailCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '10', borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.primary + '30' },
    currentEmailLabel: { fontSize: 11, color: theme.textMuted, fontWeight: '600', textTransform: 'uppercase' },
    currentEmailValue: { fontSize: 15, color: theme.text, fontWeight: '600', marginTop: 2 },

    fieldSection: { fontSize: 13, fontWeight: '700', color: theme.textMuted, marginBottom: 10, marginTop: 20 },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: theme.border, marginBottom: 10 },
    input: { flex: 1, fontSize: 15, color: theme.text },
    hint: { fontSize: 12, color: theme.textMuted, marginTop: 16, lineHeight: 18 },

    // Avatar Picker
    avatarPicker: { alignSelf: 'center', marginBottom: 24, position: 'relative' },
    avatarPreview: { width: 90, height: 90, borderRadius: 45 },
    avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.card },

    // Language Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomSheet: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
    langRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
    langRowActive: { backgroundColor: theme.primary + '05' },
    langLabel: { fontSize: 16, color: theme.text, flex: 1 },
    langLabelActive: { color: theme.primary, fontWeight: '700' },
});
