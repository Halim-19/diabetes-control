import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DoctorSettingsScreen() {
    const { theme, mode, setMode } = useTheme();
    const { language, setLanguage } = useLanguage();
    const { t } = useTranslation();
    const router = useRouter();
    
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [notifs, setNotifs] = useState(true);

    const s = useMemo(() => createStyles(theme), [theme]);

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
            <View style={s.header}>
                <Pressable onPress={() => router.replace('/(doctor)/profile')} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={s.headerTitle}>{t('settings.title')}</Text>
            </View>
            <ScrollView contentContainerStyle={s.scroll}>
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('settings.preferences')}</Text>

                    <View style={s.settingItem}>
                        <View style={s.settingRow}>
                            <Ionicons name="notifications-outline" size={20} color={theme.textMuted} style={s.settingIcon} />
                            <Text style={s.settingLabel}>{t('settings.push_notifications')}</Text>
                        </View>
                        <Switch value={notifs} onValueChange={setNotifs} trackColor={{ true: theme.primary }} />
                    </View>

                    <Pressable style={s.settingItem} onPress={() => setShowLanguageModal(true)}>
                        <View style={s.settingRow}>
                            <Ionicons name="language-outline" size={20} color={theme.textMuted} style={s.settingIcon} />
                            <Text style={s.settingLabel}>{t('settings.language')}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: theme.textMuted, marginRight: 8 }}>{languages.find(l => l.code === language)?.label}</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.border} />
                        </View>
                    </Pressable>

                    <View style={s.appearanceContainer}>
                        <Text style={s.appearanceTitle}>{t('settings.appearance')}</Text>
                        <View style={s.themePicker}>
                            {themes.map((tItem) => (
                                <Pressable
                                    key={tItem.code}
                                    onPress={() => setMode(tItem.code as any)}
                                    style={[
                                        s.themeOption,
                                        mode === tItem.code && s.themeOptionActive
                                    ]}
                                >
                                    <Ionicons name={tItem.icon as any} size={20} color={mode === tItem.code ? theme.primary : theme.textMuted} />
                                    <Text style={[s.themeLabel, mode === tItem.code && s.themeLabelActive]}>{tItem.label}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('settings.support')}</Text>

                    <Pressable style={s.settingItem}>
                        <View style={s.settingRow}>
                            <Ionicons name="help-circle-outline" size={20} color={theme.textMuted} style={s.settingIcon} />
                            <Text style={s.settingLabel}>{t('settings.help_center')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.border} />
                    </Pressable>

                    <Pressable style={s.settingItem}>
                        <View style={s.settingRow}>
                            <Ionicons name="document-text-outline" size={20} color={theme.textMuted} style={s.settingIcon} />
                            <Text style={s.settingLabel}>{t('settings.terms_of_service')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.border} />
                    </Pressable>
                </View>
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
        </SafeAreaView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
    headerTitle: { fontSize: 22, fontWeight: '700', color: theme.text },
    scroll: { padding: 20 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 4 },
    settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 8, borderRadius: 12, shadowColor: theme.text, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    settingRow: { flexDirection: 'row', alignItems: 'center' },
    settingIcon: { marginRight: 12 },
    settingLabel: { fontSize: 16, color: theme.text, fontWeight: '500' },
    backBtn: { padding: 4 },

    appearanceContainer: { backgroundColor: theme.card, padding: 16, borderRadius: 12, marginTop: 8 },
    appearanceTitle: { fontSize: 13, fontWeight: '600', color: theme.textMuted, marginBottom: 12 },
    themePicker: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    themeOption: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
    themeOptionActive: { borderColor: theme.primary, backgroundColor: theme.primary + '10' },
    themeLabel: { fontSize: 12, marginTop: 4, color: theme.textMuted },
    themeLabelActive: { color: theme.primary, fontWeight: '600' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomSheet: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
    langRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
    langRowActive: { backgroundColor: theme.primary + '05' },
    langLabel: { fontSize: 16, color: theme.text, flex: 1 },
    langLabelActive: { color: theme.primary, fontWeight: '700' },
});

