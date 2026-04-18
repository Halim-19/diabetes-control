import { useAuth, UserRole } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function SignUp() {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { t } = useTranslation();
    const { signUp } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
    const [loading, setLoading] = useState(false);

    const ROLES: { label: string; value: UserRole }[] = [
        { label: t('auth.signup.roles.patient'), value: 'patient' },
        { label: t('auth.signup.roles.doctor'), value: 'doctor' },
    ];

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert(t('common.error'), t('auth.login.error_missing'));
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert(t('common.error'), 'Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            Alert.alert(t('common.error'), 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        const { error } = await signUp(email, password, selectedRole);
        setLoading(false);

        if (error) {
            Alert.alert(t('auth.signup.signup_btn') + ' ' + t('common.error'), error);
            return;
        }

        Alert.alert(
            t('common.success'),
            'Account created. You can now sign in with your credentials.',
            [{ text: t('auth.signup.login'), onPress: () => router.replace('/(auth)/login') }]
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.title}>{t('auth.signup.title')}</Text>
                <Text style={styles.subtitle}>{t('auth.signup.subtitle')}</Text>

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
                            placeholder="At least 6 characters"
                            placeholderTextColor={theme.textMuted}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                    <View>
                        <Text style={styles.label}>{t('auth.signup.signup_btn').toUpperCase()}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Repeat password"
                            placeholderTextColor={theme.textMuted}
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>
                </View>

                <Pressable style={[styles.btnPrimary, loading && styles.btnDisabled]} onPress={handleSignUp} disabled={loading}>
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.btnPrimaryText}>{t('auth.signup.signup_btn')}</Text>
                    }
                </Pressable>

                <Pressable onPress={() => router.back()}>
                    <Text style={styles.ghostText}>
                        {t('auth.signup.has_account')}{' '}
                        <Text style={styles.ghostLink}>{t('auth.signup.login')}</Text>
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}


const createStyles = (theme: any) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    container: { flex: 1, paddingHorizontal: 28, paddingTop: 32 },
    title: { fontSize: 22, fontWeight: '600', color: theme.text, marginBottom: 4 },
    subtitle: { fontSize: 13, color: theme.textMuted, marginBottom: 24 },
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