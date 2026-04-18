import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AdminLayout() {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <Tabs 
            screenOptions={{ 
                headerShown: false, 
                tabBarActiveTintColor: theme.primary, 
                tabBarInactiveTintColor: theme.textMuted, 
                tabBarStyle: { 
                    backgroundColor: theme.card, 
                    borderTopColor: theme.border, 
                    borderTopWidth: 1 
                } 
            }}
        >
            <Tabs.Screen 
                name="stats" 
                options={{ 
                    title: t('admin.tabs.stats', 'Stats'), 
                    tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} /> 
                }} 
            />
            <Tabs.Screen 
                name="users" 
                options={{ 
                    title: t('admin.tabs.users', 'Users'), 
                    tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> 
                }} 
            />
            <Tabs.Screen 
                name="posts" 
                options={{ 
                    title: t('admin.tabs.posts', 'Posts'), 
                    tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} /> 
                }} 
            />
            <Tabs.Screen 
                name="map" 
                options={{ 
                    title: t('admin.tabs.map', 'Map'), 
                    tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} /> 
                }} 
            />
        </Tabs>
    );
}