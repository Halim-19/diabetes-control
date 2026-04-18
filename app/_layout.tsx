import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import '@/utils/i18n';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { ActivityIndicator, View, LogBox } from 'react-native';

// Ignore the SDK 54 notification warnings in Expo Go
LogBox.ignoreLogs(['expo-notifications: Android Push notifications', 'shouldShowAlert is deprecated']);

function RootNavigation() {
    const { isAuthenticated, isLoading, role, profileComplete } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const { theme } = useTheme();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inProfileSetup = segments[1] === 'profileSetup';

        if (!isAuthenticated) {
            // Not logged in → send to login
            if (!inAuthGroup) router.replace('/(auth)/login');
            return;
        }

        // Logged in but profile record missing (very rare)
        if (isAuthenticated && !role && !inAuthGroup) {
            router.replace('/(auth)/login');
            return;
        }

        // Logged in as patient or doctor with incomplete profile → force profile setup
        if ((role === 'patient' || role === 'doctor') && !profileComplete && !inProfileSetup) {
            router.replace('/(auth)/profileSetup');
            return;
        }

        // Logged in and profile complete → send out of auth screens
        if (isAuthenticated && inAuthGroup && !inProfileSetup) {
            if (role === 'patient') router.replace('/(patient)/feed');
            else if (role === 'doctor') router.replace('/(doctor)/feed');
            else if (role === 'admin') router.replace('/(admin)/stats');
        }
    }, [isAuthenticated, isLoading, role, profileComplete, segments, router]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (<Slot />);
}

import { SOSAlertListener } from '@/components/SOSAlertListener';

export default function RootLayout() {
    return (
        <LanguageProvider>
            <ThemeProvider>
                <AuthProvider>
                    <SOSAlertListener />
                    <RootNavigation />
                </AuthProvider>
            </ThemeProvider>
        </LanguageProvider>
    );
}
