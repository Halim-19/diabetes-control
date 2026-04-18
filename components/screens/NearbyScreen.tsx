import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Linking,
  Pressable,
} from "react-native";
import { useTranslation } from "react-i18next";

import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/utils/supabase";
import { useTheme } from "@/context/ThemeContext";

type Facility = {
  id: string;
  title: string;
  type: "doctor" | "pharmacy" | "hospital" | "sos";
  coordinate: { latitude: number; longitude: number };
  description: string;
  phone?: string;
};

// Generates fake mock data around a given coordinate
const generateMockFacilities = (lat: number, lng: number): Facility[] => {
  return [
    {
      id: "p1",
      title: "City Central Pharmacy",
      type: "pharmacy",
      coordinate: { latitude: lat - 0.003, longitude: lng - 0.008 },
      description: "Insulin and supplies in stock.",
    },
    {
      id: "h1",
      title: "General Memorial Hospital",
      type: "hospital",
      coordinate: { latitude: lat - 0.012, longitude: lng + 0.002 },
      description: "24/7 Emergency Care",
    },
    {
      id: "p2",
      title: "Green Cross Pharmacy",
      type: "pharmacy",
      coordinate: { latitude: lat + 0.002, longitude: lng + 0.012 },
      description: "Open 24/7",
    },
  ];
};

export default function NearbyScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      let coords = { latitude: 36.7538, longitude: 3.0588 }; // Default Algiers

      if (status === "granted") {
        try {
          let loc = await Location.getCurrentPositionAsync({});
          coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setLocation(loc);
        } catch (err) {
          console.error("Location error:", err);
          setErrorMsg(t("common.error"));
        }
      } else {
        setErrorMsg(t("common.error"));
        setLocation({
          coords: {
            ...coords,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as any);
      }

      // Fetch real doctors
      const { data: doctorsData, error: dbError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, role, work_lat, work_lng, specialization, hospital_name, phone",
        )
        .eq("role", "doctor")
        .not("work_lat", "is", null);

      // Fetch active Community SOS alerts
      const { data: sosData, error: sosError } = await supabase
        .from("profiles")
        .select("id, full_name, emergency_lat, emergency_lng, phone")
        .eq("is_emergency_active", true);

      if (dbError)
        console.error("[Nearby] Doctor fetch error:", dbError.message);
      if (sosError)
        console.error("[Nearby] SOS fetch error:", sosError.message);

      const realDocs: Facility[] = (doctorsData || []).map((d) => ({
        id: d.id,
        title: `Dr. ${d.full_name}`,
        type: "doctor",
        coordinate: { latitude: d.work_lat, longitude: d.work_lng },
        description:
          d.specialization || d.hospital_name || t("patient.doctor.title"),
        phone: d.phone,
      }));

      const communitySOS: Facility[] = (sosData || []).map((s) => ({
        id: s.id,
        title: t("patient.nearby.sos_title"),
        type: "sos",
        coordinate: {
          latitude: Number(s.emergency_lat),
          longitude: Number(s.emergency_lng),
        },
        description: t("patient.nearby.sos_desc"),
        phone: s.phone,
      }));

      const mocks = generateMockFacilities(coords.latitude, coords.longitude);
      setFacilities([...realDocs, ...communitySOS, ...mocks]);
      setLoading(false);
    })();

    // Realtime subscription for SOS alerts and Doctor updates
    const channel = supabase
      .channel("nearby-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          const updatedProfile = payload.new as any;
          const oldProfile = payload.old as any;

          setFacilities((current) => {
            // Remove if no longer relevant (e.g. SOS deactivated)
            if (
              updatedProfile.is_emergency_active === false ||
              payload.eventType === "DELETE"
            ) {
              return current.filter(
                (f) => f.id !== (updatedProfile.id || oldProfile.id),
              );
            }

            // For Updates or Inserts
            const isSOS = updatedProfile.is_emergency_active === true;
            const isDoctor =
              updatedProfile.role === "doctor" && updatedProfile.work_lat;

            if (!isSOS && !isDoctor) {
              return current.filter((f) => f.id !== updatedProfile.id);
            }

            const newFacility: Facility = isSOS
              ? {
                  id: updatedProfile.id,
                  title: t("patient.nearby.sos_title"),
                  type: "sos",
                  coordinate: {
                    latitude: Number(updatedProfile.emergency_lat),
                    longitude: Number(updatedProfile.emergency_lng),
                  },
                  description: t("patient.nearby.sos_desc"),
                  phone: updatedProfile.phone,
                }
              : {
                  id: updatedProfile.id,
                  title: `Dr. ${updatedProfile.full_name}`,
                  type: "doctor",
                  coordinate: {
                    latitude: updatedProfile.work_lat,
                    longitude: updatedProfile.work_lng,
                  },
                  description:
                    updatedProfile.specialization ||
                    updatedProfile.hospital_name ||
                    t("patient.doctor.title"),
                  phone: updatedProfile.phone,
                };

            const exists = current.find((f) => f.id === newFacility.id);
            if (exists) {
              return current.map((f) =>
                f.id === newFacility.id ? newFacility : f,
              );
            } else {
              return [newFacility, ...current];
            }
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = (phone: string) => {
    const message = t("patient.nearby.sos_desc");
    Linking.openURL(`sms:${phone}?body=${encodeURIComponent(message)}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>{t("common.search")}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t("common.no_data")}</Text>
      </View>
    );
  }

  const getPinColor = (type: string) => {
    switch (type) {
      case "doctor":
        return theme.primary;
      case "pharmacy":
        return theme.success;
      case "hospital":
        return theme.danger;
      case "sos":
        return "#7c3aed"; // Keep specific SOS color or use a theme accent
      default:
        return theme.textMuted;
    }
  };

  const getIconName = (type: string) => {
    switch (type) {
      case "doctor":
        return "medkit";
      case "pharmacy":
        return "bandage";
      case "hospital":
        return "business";
      case "sos":
        return "warning";
      default:
        return "help";
    }
  };

  return (
    <View style={styles.container}>
      {errorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorMsg}</Text>
        </View>
      )}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        userInterfaceStyle={theme.dark ? "dark" : "light"}
      >
        {facilities.map((fac) => (
          <Marker
            key={fac.id}
            coordinate={fac.coordinate}
            pinColor={getPinColor(fac.type)}
          >
            <Callout style={styles.callout} tooltip={false}>
              <View style={styles.calloutContainer}>
                <View style={styles.calloutHeader}>
                  <Ionicons
                    name={getIconName(fac.type) as any}
                    size={16}
                    color={getPinColor(fac.type)}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.calloutType,
                        { color: getPinColor(fac.type) },
                      ]}
                    >
                      {fac.type.toUpperCase()}
                    </Text>
                    <Text style={styles.calloutTitle}>{fac.title}</Text>
                  </View>
                </View>

                <Text style={styles.calloutDesc}>{fac.description}</Text>

                {fac.phone && (
                  <View style={styles.calloutActions}>
                    <Text style={styles.contactHint}>
                      {t("patient.doctor.contact")}
                    </Text>
                    <View style={styles.btnRow}>
                      <Pressable
                        style={styles.calloutBtn}
                        onPress={() => handleCall(fac.phone!)}
                      >
                        <Ionicons name="call" size={14} color={theme.primary} />
                        <Text style={styles.calloutBtnText}>
                          {t("patient.doctor.contact")}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.calloutBtn}
                        onPress={() => handleSMS(fac.phone!)}
                      >
                        <Ionicons
                          name="chatbubble"
                          size={14}
                          color={theme.primary}
                        />
                        <Text style={styles.calloutBtnText}>SMS</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.legendWrapper}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: theme.primary }]}
            />
            <Text style={styles.legendText}>{t("patient.doctor.title")}</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: theme.danger }]}
            />
            <Text style={styles.legendText}>{t("patient.nearby.title")}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#7c3aed" }]} />
            <Text style={styles.legendText}>
              {t("patient.nearby.sos_title")}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    loadingText: { marginTop: 12, fontSize: 16, color: theme.textMuted },
    errorText: { fontSize: 16, color: theme.danger },
    container: { flex: 1, backgroundColor: theme.background },
    map: { width: "100%", height: "100%" },
    errorBanner: {
      position: "absolute",
      top: 50,
      left: 16,
      right: 16,
      backgroundColor: theme.danger + "1a",
      padding: 12,
      borderRadius: 8,
      zIndex: 10,
      borderWidth: 1,
      borderColor: theme.danger + "33",
    },
    errorBannerText: { color: theme.danger, fontSize: 13, textAlign: "center" },

    calloutContainer: {
      width: 220,
      backgroundColor: theme.card,
      padding: 8,
      borderRadius: 12,
    },
    callout: {},
    calloutHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 4,
    },
    calloutType: { fontSize: 10, fontWeight: "700" },
    calloutTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 2,
    },
    calloutDesc: { fontSize: 12, color: theme.textMuted, marginBottom: 8 },
    calloutActions: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 8,
      marginTop: 4,
    },
    contactHint: {
      fontSize: 9,
      fontWeight: "700",
      color: theme.secondary,
      marginBottom: 6,
    },
    btnRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
    calloutBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.primary + "1a",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.primary + "33",
    },
    calloutBtnText: { fontSize: 11, fontWeight: "600", color: theme.primary },

    legendWrapper: {
      position: "absolute",
      bottom: 32,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    legend: {
      flexDirection: "row",
      backgroundColor: theme.card,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
      gap: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11, fontWeight: "500", color: theme.text },
  });
