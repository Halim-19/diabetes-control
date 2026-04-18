import { useTheme } from "@/context/ThemeContext";
import { Profile, supabase } from "@/utils/supabase";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";

const INITIAL_REGION = {
  latitude: 36.7525, // default to Algiers roughly
  longitude: 3.04197,
  latitudeDelta: 5.0, // wide zoom explicitly
  longitudeDelta: 5.0,
};

export default function AdminMapScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [emergencies, setEmergencies] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      // Fetch doctors with work location
      const { data: docsData, error: docsError } = await supabase
        .from("profiles")
        .select("id, full_name, role, work_lat, work_lng")
        .eq("role", "doctor")
        .not("work_lat", "is", null)
        .not("work_lng", "is", null);

      if (docsError) throw docsError;
      setDoctors(docsData as Profile[]);

      // Fetch active emergencies
      const { data: emerData, error: emerError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone, is_emergency_active, emergency_lat, emergency_lng",
        )
        .eq("is_emergency_active", true)
        .not("emergency_lat", "is", null)
        .not("emergency_lng", "is", null);

      if (emerError) throw emerError;
      setEmergencies(emerData as Profile[]);
    } catch (err: any) {
      console.error("Error fetching map data:", err);
      Alert.alert(t("common.error", "Error"), err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>
          {t("admin.map.title", "Incident Map")}
        </Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: theme.primary }]}
            />
            <Text style={styles.legendText}>
              {t("admin.map.active_doctors", "Active Doctors")} (
              {doctors.length})
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.danger || "#ef4444" },
              ]}
            />
            <Text style={styles.legendText}>
              {t("admin.map.emergencies", "Emergencies")} ({emergencies.length})
            </Text>
          </View>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation={false}
        userInterfaceStyle={theme.dark ? "dark" : "light"}
      >
        {/* Doctors Markers */}
        {doctors.map((doc) =>
          doc.work_lat && doc.work_lng ? (
            <Marker
              key={`doc-${doc.id}`}
              coordinate={{ latitude: doc.work_lat, longitude: doc.work_lng }}
              pinColor={theme.primary}
            >
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{doc.full_name}</Text>
                  <Text style={styles.calloutDesc}>
                    {t("admin.map.doctor", "Doctor Facility")}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ) : null,
        )}

        {/* Emergency Markers */}
        {emergencies.map((em) =>
          em.emergency_lat && em.emergency_lng ? (
            <Marker
              key={`em-${em.id}`}
              coordinate={{
                latitude: em.emergency_lat,
                longitude: em.emergency_lng,
              }}
              pinColor={theme.danger || "#ef4444"}
            >
              <Callout tooltip>
                <View
                  style={[
                    styles.callout,
                    { borderColor: theme.danger || "#ef4444" },
                  ]}
                >
                  <Text
                    style={[
                      styles.calloutTitle,
                      { color: theme.danger || "#ef4444" },
                    ]}
                  >
                    {t("admin.map.sos_alert", "SOS Alert")}
                  </Text>
                  <Text style={styles.calloutDesc}>{em.full_name}</Text>
                  <Text style={styles.calloutDesc}>
                    {em.phone || "No phone"}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ) : null,
        )}
      </MapView>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    map: { flex: 1 },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(255,255,255,0.7)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    headerOverlay: {
      position: "absolute",
      top: Platform.OS === "ios" ? 50 : 30, // rough safe area padding
      left: 16,
      right: 16,
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
      zIndex: 5,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 8,
    },
    legend: { flexDirection: "row", gap: 16 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 13, color: theme.textMuted },
    callout: {
      backgroundColor: theme.card,
      padding: 12,
      borderRadius: 8,
      minWidth: 140,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    calloutTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 4,
    },
    calloutDesc: { fontSize: 12, color: theme.textMuted },
  });
