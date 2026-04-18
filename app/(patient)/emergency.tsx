import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmergencyScreen() {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { t } = useTranslation();
    const { session, profile } = useAuth();

    const router = useRouter();
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [updating, setUpdating] = useState(false);
    const locationInterval = useRef<any>(null);

    useEffect(() => {
        // Continuous pulse animation for emergency feel
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        return () => {
            if (locationInterval.current) clearInterval(locationInterval.current);
            // Auto-disable emergency on unmount for safety
            if (session?.user?.id) {
                supabase.from('profiles').update({ is_emergency_active: false }).eq('id', session.user.id);
            }
        };
    }, []);

    const toggleBroadcast = async () => {
        if (!session?.user?.id) return;

        if (isBroadcasting) {
            // Stop broadcasting
            if (locationInterval.current) clearInterval(locationInterval.current);
            locationInterval.current = null;
            setIsBroadcasting(false);
            await supabase.from('profiles').update({ is_emergency_active: false }).eq('id', session.user.id);
        } else {
            // Start broadcasting
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('common.error'), t('patient.sos.no_contact_warning'));
                return;
            }

            setIsBroadcasting(true);
            updateLocation();
            locationInterval.current = setInterval(updateLocation, 10000); // Every 10 seconds
        }
    };

    const updateLocation = async () => {
        if (!session?.user?.id) return;
        setUpdating(true);
        try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { error } = await supabase.from('profiles').update({
                is_emergency_active: true,
                emergency_lat: loc.coords.latitude,
                emergency_lng: loc.coords.longitude,
                updated_at: new Date().toISOString(),
            }).eq('id', session.user.id);

            if (error) console.error('[Emergency] Broadcast error:', error.message);
        } catch (err) {
            console.error('[Emergency] Location fetch error:', err);
        } finally {
            setUpdating(false);
        }
    };

    const handleCall = () => {
        const phone = profile?.emergency_contact_phone;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const handleSMS = () => {
        const phone = profile?.emergency_contact_phone;
        if (phone) {
            const message = t('patient.sos.broadcast_message', { name: profile?.full_name || t('auth.signup.roles.patient') });
            const url = Platform.OS === 'ios'
                ? `sms:${phone}&body=${encodeURIComponent(message)}`
                : `sms:${phone}?body=${encodeURIComponent(message)}`;
            Linking.openURL(url);
        }
    };

    const handleNearby = () => {
        router.push('/(patient)/nearby');
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="close" size={32} color="#fff" />
                    </Pressable>
                    <Text style={styles.headerTitle}>{t('patient.sos.title')}</Text>
                </View>

                <View style={styles.pulseContainer}>
                    <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
                    <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: 0.6 }]} />
                    <Ionicons name="warning" size={80} color="#fff" />
                </View>

                <ScrollView
                    style={styles.contentScroll}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.instruction}>
                        {t('patient.sos.instruction')}
                    </Text>

                    {profile?.emergency_contact_phone ? (
                        <View style={styles.actions}>
                            {/* Call */}
                            <Pressable style={[styles.mainBtn, styles.callBtn]} onPress={handleCall}>
                                <View style={styles.iconWrap}>
                                    <Ionicons name="call" size={28} color="#fff" />
                                </View>
                                <View style={styles.btnTextContainer}>
                                    <Text style={styles.btnTitle}>{t('patient.sos.call_contact')}</Text>
                                    <Text style={styles.btnSubtitle}>
                                        {profile.emergency_contact_name || t('auth.signup.roles.patient')}: {profile.emergency_contact_phone}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
                            </Pressable>

                            {/* SMS */}
                            <Pressable style={[styles.mainBtn, styles.smsBtn]} onPress={handleSMS}>
                                <View style={styles.iconWrap}>
                                    <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
                                </View>
                                <View style={styles.btnTextContainer}>
                                    <Text style={styles.btnTitle}>{t('patient.sos.send_sms')}</Text>
                                    <Text style={styles.btnSubtitle}>{t('patient.sos.sms_subtitle')}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
                            </Pressable>

                            {/* Broadcast */}
                            <Pressable
                                style={[styles.mainBtn, isBroadcasting ? styles.broadcastActive : styles.broadcastBtn]}
                                onPress={toggleBroadcast}
                                disabled={updating}
                            >
                                <View style={[styles.iconWrap, isBroadcasting && styles.iconWrapActive]}>
                                    <Ionicons name={isBroadcasting ? "radio-outline" : "share-social"} size={28} color="#fff" />
                                </View>
                                <View style={styles.btnTextContainer}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={styles.btnTitle}>
                                            {isBroadcasting ? t('patient.sos.broadcasting') : t('patient.sos.broadcast')}
                                        </Text>
                                        {updating && <ActivityIndicator size="small" color="#fff" />}
                                    </View>
                                    <Text style={styles.btnSubtitle}>
                                        {isBroadcasting ? t('patient.sos.broadcasting_subtitle') : t('patient.sos.broadcast_subtitle')}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={24} color="#fecaca" />
                            <Text style={styles.errorText}>
                                {t('patient.sos.no_contact_warning')}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.divider}>{t('patient.sos.or_divider')}</Text>

                    {/* Nearby Help */}
                    <Pressable style={[styles.mainBtn, styles.nearbyBtn]} onPress={handleNearby}>
                        <View style={[styles.iconWrap, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="medical" size={28} color={theme.primary} />
                        </View>
                        <View style={styles.btnTextContainer}>
                            <Text style={[styles.btnTitle, { color: theme.primary }]}>{t('patient.sos.nearby')}</Text>
                            <Text style={[styles.btnSubtitle, { color: theme.textMuted }]}>{t('patient.sos.nearby_subtitle')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </Pressable>

                    <View style={styles.footer}>
                        <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} style={{ marginBottom: 4 }} />
                        <Text style={styles.footerText}>
                            {t('patient.sos.danger_text')}
                        </Text>
                    </View>

                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.danger },
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
    backBtn: { padding: 8 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginLeft: 16 },
    pulseContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 32, height: 160 },
    pulseRing: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    pulseCircle: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    contentScroll: {
        flex: 1,
        backgroundColor: theme.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 48,
    },
    instruction: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.text,
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 24,
    },
    actions: { gap: 12 },
    mainBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapActive: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    callBtn: { backgroundColor: '#b91c1c' },
    smsBtn: { backgroundColor: '#ea580c' },
    broadcastBtn: { backgroundColor: '#7c3aed' },
    broadcastActive: { backgroundColor: '#6d28d9', borderWidth: 2, borderColor: '#ddd6fe' },
    nearbyBtn: {
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
    },
    btnTextContainer: { flex: 1 },
    btnTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 2 },
    btnSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.75)' },
    divider: {
        textAlign: 'center',
        color: theme.textMuted,
        fontSize: 13,
        fontWeight: '700',
        marginVertical: 20,
        letterSpacing: 1,
    },
    errorBox: {
        backgroundColor: theme.danger + '20',
        borderWidth: 1,
        borderColor: theme.danger + '40',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    errorText: { flex: 1, color: theme.danger, fontSize: 14, fontWeight: '600', lineHeight: 20 },
    footer: { marginTop: 36, paddingBottom: 20, alignItems: 'center' },
    footerText: { fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 20 },
});
