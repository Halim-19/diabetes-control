import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function DoctorLayout() {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: theme.textMuted,
            tabBarStyle: {
                backgroundColor: theme.card,
                borderTopColor: theme.border,
                borderTopWidth: 1
            }
        }}>
            <Tabs.Screen name="feed" options={{ title: t('doctor.tabs.feed', 'Feed'), tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" size={size} color={color} /> }} />
            <Tabs.Screen name="patients/index" options={{ title: t('doctor.tabs.patients', 'Patients'), tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }} />
            {/* <Tabs.Screen name="explore" options={{ title: t('doctor.tabs.explore', 'Explore'), tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} /> }} /> */}
            <Tabs.Screen name="nearby" options={{ title: t('doctor.tabs.nearby', 'Nearby'), tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} /> }} />
            <Tabs.Screen name="profile" options={{ title: t('doctor.tabs.profile', 'Profile'), tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />

            {/* hide from tab bar */}
            <Tabs.Screen name="settings" options={{ href: null }} />
            <Tabs.Screen name="instructions" options={{ href: null }} />
            <Tabs.Screen name="patients/[id]" options={{ href: null }} />

        </Tabs>
    );
}
