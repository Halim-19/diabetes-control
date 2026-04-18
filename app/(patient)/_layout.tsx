import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function PatientLayout() {
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
      <Tabs.Screen name="feed" options={{ title: t('patient.feed.title', 'Feed'), tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="tracker" options={{ title: t('patient.tracker.title', 'Tracker'), tabBarIcon: ({ color, size }) => <Ionicons name="fitness-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="doctor" options={{ title: t('patient.doctor.title', 'Doctor'), tabBarIcon: ({ color, size }) => <Ionicons name="medkit-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="nearby" options={{ title: t('patient.nearby.title', 'Nearby'), tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('patient.profile.title', 'Profile'), tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />


      {/* Hide tracker sub-routes from tabs */}
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="tracker/log-activity" options={{ href: null }} />
      <Tabs.Screen name="tracker/log-glucose" options={{ href: null }} />
      <Tabs.Screen name="tracker/log-nutrition" options={{ href: null }} />
      <Tabs.Screen name="tracker/log-wellbeing" options={{ href: null }} />
      <Tabs.Screen name="tracker/ai-assistant" options={{ href: null }} />
      <Tabs.Screen name="emergency" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="health-profile" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}