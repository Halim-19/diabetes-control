import { useAuth, UserRole } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { t } = useTranslation();
    const router = useRouter();
    const { login, logout } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
    const [loading, setLoading] = useState(false);

    const ROLES: { label: string; value: UserRole }[] = [
        { label: t('auth.signup.roles.patient'), value: 'patient' },
        { label: t('auth.signup.roles.doctor'), value: 'doctor' },
        { label: 'Admin', value: 'admin' },
    ];

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(t('common.error'), t('auth.login.error_missing'));
            return;
        }

        setLoading(true);
        const { error, userRole } = await login(email, password);

        if (error) {
            setLoading(false);
            Alert.alert(t('auth.login.login_btn') + ' ' + t('common.error'), error);
            return;
        }

        if (userRole && userRole !== selectedRole) {
            await logout();
            setLoading(false);
            Alert.alert(t('common.error'), t('auth.login.subtitle')); // Fallback for role mismatch
            return;
        }

        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <View style={styles.logoMark}>
                    <Text style={styles.logoText}>A</Text>
                </View>
                <Text style={styles.title}>{t('auth.login.title')}</Text>
                <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

                <Text style={styles.label}>{t('auth.signup.role')}</Text>
                <View style={styles.roleRow}>
                    {ROLES.map((r) => (
                        <Pressable
                            key={r.value}
                            style={[styles.roleChip, selectedRole === r.value && styles.roleChipActive]}
                            onPress={() => setSelectedRole(r.value)}
                        >
                            <Text style={[styles.roleChipText, selectedRole === r.value && styles.roleChipTextActive]}>
                                {r.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <View style={styles.fieldGroup}>
                    <View>
                        <Text style={styles.label}>{t('auth.login.email')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="you@example.com"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                    <View>
                        <Text style={styles.label}>{t('auth.login.password')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor={theme.textMuted}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                </View>

                <Pressable style={[styles.btnPrimary, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.btnPrimaryText}>{t('auth.login.login_btn')}</Text>
                    }
                </Pressable>

                <Pressable onPress={() => router.push('/(auth)/signUp')}>
                    <Text style={styles.ghostText}>
                        {t('auth.login.no_account')}{' '}
                        <Text style={styles.ghostLink}>{t('auth.login.sign_up')}</Text>
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}


const createStyles = (theme: any) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    container: { flex: 1, paddingHorizontal: 28, paddingTop: 60 },
    logoMark: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: theme.primary,
        alignItems: 'center', justifyContent: 'center', marginBottom: 20, alignSelf: 'center',
    },
    logoText: { color: "#fff", fontSize: 20, fontWeight: '600' },
    title: { fontSize: 22, fontWeight: '600', color: theme.text, textAlign: 'center', marginBottom: 4 },
    subtitle: { fontSize: 13, color: theme.textMuted, textAlign: 'center', marginBottom: 28 },
    label: { fontSize: 10, fontWeight: '500', color: theme.textMuted, letterSpacing: 0.8, marginBottom: 8 },
    roleRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    roleChip: {
        flex: 1, paddingVertical: 8, borderRadius: 8,
        borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, alignItems: 'center',
    },
    roleChipActive: { backgroundColor: theme.primary + '1a', borderColor: theme.primary },
    roleChipText: { fontSize: 13, color: theme.textMuted, fontWeight: '500' },
    roleChipTextActive: { color: theme.primary },
    fieldGroup: { gap: 16, marginBottom: 24 },
    input: {
        backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border,
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: theme.text,
    },
    btnPrimary: {
        backgroundColor: theme.primary, borderRadius: 10,
        paddingVertical: 14, alignItems: 'center', marginBottom: 16,
    },
    btnDisabled: { opacity: 0.6 },
    btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    ghostText: { textAlign: 'center', fontSize: 13, color: theme.textMuted },
    ghostLink: { color: theme.primary, fontWeight: '500' },
});