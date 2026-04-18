import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('emergency', {
            name: 'Emergency Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }
        
        try {
            const projectId = 
                Constants?.expoConfig?.extra?.eas?.projectId ?? 
                Constants?.easConfig?.projectId;
            
            if (!projectId) {
                console.warn('Local Mode: No Project ID. SOS alerts will still work locally.');
                return null;
            }
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        } catch (e) {
            console.log('Push token registration skipped:', e);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}

export const scheduleSOSNotification = async (distance: string) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "🚨 EMERGENCY NEARBY",
            body: `Someone is in need of assistance approximately ${distance} away. Tap to view on map.`,
            data: { screen: 'nearby' },
            sound: 'default',
            color: '#ef4444',
            priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null, // immediate
    });
};
