import React, { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';
import { scheduleSOSNotification } from '@/utils/notifications';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

// Haversine formula to calculate distance between two points in KM
function getDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const EMERGENCY_RADIUS_KM = 5;

export const SOSAlertListener: React.FC = () => {
    const { session, isAuthenticated } = useAuth();
    const router = useRouter();
    // Store cached location — updated continuously
    const cachedLocation = useRef<{ latitude: number; longitude: number } | null>(null);
    // Track notified alerts by "id+timestamp" to allow re-alerting if same person re-broadcasts
    const lastNotifiedKeys = useRef<Set<string>>(new Set());
    const locationWatcher = useRef<any>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        // ─── 1. Start continuous location watching ───────────────────────────
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('[SOSListener] Location permission denied.');
                return;
            }
            locationWatcher.current = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.Balanced, timeInterval: 15000 },
                (loc) => {
                    cachedLocation.current = {
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                    };
                }
            );
        })();

        // ─── 2. Notification tap → open Nearby Map ───────────────────────────
        const notifSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.screen === 'nearby') {
                router.push('/(patient)/nearby');
            }
        });

        // ─── 3. Realtime subscription for live SOS events ────────────────────
        const channel = supabase
            .channel('sos-alerts-v2')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
            }, (payload) => {
                const updated = payload.new as any;
                const previous = payload.old as any;

                // Ignore self
                if (updated.id === session?.user?.id) return;

                // SOS was JUST activated
                // We check if it's true AND if we haven't notified about this ID yet in this session
                if (updated.is_emergency_active === true && !lastNotifiedKeys.current.has(updated.id)) {
                    console.log('🚨 Real-time SOS event received from:', updated.full_name);
                    notifyIfNearby(updated, updated.id);
                }

                // SOS deactivated — clear from notified set so they can alert again in the future
                if (updated.is_emergency_active === false) {
                    lastNotifiedKeys.current.delete(updated.id);
                }
            })
            .subscribe((status) => {
                console.log('📡 SOS Realtime Status:', status);
            });

        // ─── 4. One-time check on mount for already-active alerts ─────────────
        checkExistingEmergencies();

        return () => {
            notifSubscription.remove();
            supabase.removeChannel(channel);
            locationWatcher.current?.remove();
        };
    }, [isAuthenticated]);

    // Uses CACHED location — no async wait, fires instantly
    const notifyIfNearby = async (alert: any, id: string) => {
        if (!alert.emergency_lat || !alert.emergency_lng) return;

        // Use cached location or skip
        const myLoc = cachedLocation.current;
        if (!myLoc) {
            console.warn('[SOSListener] No cached location yet, skipping distance check.');
            return;
        }

        const dist = getDistanceKM(
            myLoc.latitude, myLoc.longitude,
            Number(alert.emergency_lat), Number(alert.emergency_lng)
        );
        console.log(`[SOSListener] Distance to SOS: ${dist.toFixed(2)}km`);

        if (dist <= EMERGENCY_RADIUS_KM) {
            const distStr = dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`;
            // Add to notified set BEFORE async call to prevent race condition loops
            lastNotifiedKeys.current.add(id);
            await scheduleSOSNotification(distStr);
            console.log('✅ Notification sent!');
        }
    };

    // Initial check when app opens — finds already-active SOS alerts
    const checkExistingEmergencies = async () => {
        // Wait a moment for location watcher to get first fix
        await new Promise(r => setTimeout(r, 2000));

        const { data: sosAlerts } = await supabase
            .from('profiles')
            .select('id, full_name, emergency_lat, emergency_lng')
            .eq('is_emergency_active', true)
            .neq('id', session?.user?.id ?? '');

        if (!sosAlerts || sosAlerts.length === 0) return;

        for (const alert of sosAlerts) {
            if (lastNotifiedKeys.current.has(alert.id)) continue;
            await notifyIfNearby(alert, alert.id);
        }
    };

    return null;
};
