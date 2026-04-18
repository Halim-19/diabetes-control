import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";

import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DoctorScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchDoctorInfo();
    }
  }, [profile]);

  const fetchDoctorInfo = async () => {
    const patientId = profile?.id;
    if (!patientId) return;

    try {
      setLoading(true);

      // 1. Get linked doctor
      const { data: link, error: linkErr } = await supabase
        .from("doctor_patient")
        .select(
          `
                    id,
                    status,
                    profiles!doctor_id (*)
                `,
        )
        .eq("patient_id", patientId)
        .maybeSingle();

      if (linkErr || !link) {
        setDoctorData(null);
        setLoading(false);
        fetchAvailableDoctors(); // Load available doctors if none linked
        return;
      }

      const isPending = link.status === "pending";
      const doctor: any = Array.isArray(link.profiles)
        ? link.profiles[0]
        : link.profiles;

      if (!doctor) {
        setDoctorData(null);
        setLoading(false);
        return;
      }

      setDoctorData({ ...doctor, linkStatus: link.status });

      if (isPending) {
        setLoading(false);
        return;
      }

      // 2. Fetch notes
      const { data: notesData, error: notesErr } = await supabase
        .from("doctor_notes")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (notesErr) {
        console.error(
          "[DoctorNotes] Fetch error:",
          notesErr.message,
          notesErr.details,
        );
      }

      if (notesData) setNotes(notesData);

      // 3. Fetch appointments
      const { data: apptsData } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .eq("doctor_id", doctor.id)
        .gt("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(1);

      if (apptsData && apptsData.length > 0) {
        setAppointments(apptsData);
      }
    } catch (err) {
      console.error("Error fetching doctor info:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDoctors = async () => {
    try {
      setSearching(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      let coords = userLocation;
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        coords = loc.coords;
        setUserLocation(coords);
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "doctor")
        .not("work_lat", "is", null);

      if (error) {
        console.error(
          "[DoctorSearch] Supabase error:",
          error.message,
          error.details,
        );
        throw error;
      }

      setAllDoctors(data || []);
    } catch (err: any) {
      console.error("[DoctorSearch] Local error:", err.message || err);
    } finally {
      setSearching(false);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sortedDoctors = useMemo(() => {
    let filtered = allDoctors;
    if (searchQuery) {
      filtered = filtered.filter(
        (d) =>
          d.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.specialization?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (userLocation) {
      return [...filtered].sort((a, b) => {
        const distA = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          a.work_lat,
          a.work_lng,
        );
        const distB = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          b.work_lat,
          b.work_lng,
        );
        return distA - distB;
      });
    }
    return filtered;
  }, [allDoctors, searchQuery, userLocation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!doctorData) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.pageTitle}>{t("patient.doctor.title")}</Text>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={theme.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t("patient.doctor.filter")}
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={theme.border} />
              </Pressable>
            )}
          </View>

          <Text style={styles.sectionLabel}>
            {allDoctors.length === 0 && !searching
              ? t("common.no_data")
              : t("patient.doctor.active_count", {
                  count: sortedDoctors.length,
                })}
          </Text>

          {searching && allDoctors.length === 0 ? (
            <ActivityIndicator
              style={{ marginTop: 40 }}
              color={theme.primary}
            />
          ) : (
            sortedDoctors.map((doc) => {
              const distance = userLocation
                ? calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    doc.work_lat,
                    doc.work_lng,
                  )
                : null;

              return (
                <View key={doc.id} style={styles.doctorItemCard}>
                  <View style={styles.doctorItemMain}>
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarTextSmall}>
                        {doc.full_name
                          ?.split(" ")
                          .map((n: any) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </Text>
                    </View>
                    <View style={styles.doctorItemInfo}>
                      <Text style={styles.doctorItemName}>
                        Dr. {doc.full_name}
                      </Text>
                      <Text style={styles.doctorItemSpecialty}>
                        {doc.specialization || t("common.doctor")}
                      </Text>
                      {distance !== null && (
                        <Text style={styles.distanceText}>
                          📍{" "}
                          {t("patient.doctor.away", {
                            distance:
                              distance < 1
                                ? t("common.distance_m", {
                                    dist: (distance * 1000).toFixed(0),
                                  })
                                : t("common.distance_km", {
                                    dist: distance.toFixed(1),
                                  }),
                          })}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      style={styles.connectBtn}
                      onPress={() => router.push(`/(patient)/nearby`)}
                    >
                      <Text style={styles.connectBtnText}>
                        {t("common.map")}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}

          {allDoctors.length === 0 && !searching && (
            <View style={styles.emptyContainerSmall}>
              <Text style={styles.emptyDesc}>
                {t("patient.doctor.no_doctors_area")}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const initials = doctorData.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const nextAppt = appointments[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>{t("patient.doctor.title")}</Text>

        {/* Doctor card */}
        <View style={styles.doctorCard}>
          <View style={styles.avatar}>
            {doctorData.avatar_url ? (
              <Image
                source={{ uri: doctorData.avatar_url }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>Dr. {doctorData.full_name}</Text>
            <Text style={styles.doctorSpecialty}>
              {doctorData.specialization || "Endocrinologist"}
            </Text>
            <Text style={styles.doctorHospital}>
              {doctorData.hospital_name || t("common.clinic")}
            </Text>
          </View>
        </View>

        {/* Next appointment */}
        <Text style={styles.sectionLabel}>
          {t("patient.doctor.next_appointment")}
        </Text>
        {nextAppt ? (
          <View style={styles.appointmentCard}>
            <View style={styles.apptIcon}>
              <Text style={styles.apptIconText}>📅</Text>
            </View>
            <View style={styles.apptInfo}>
              <Text style={styles.apptDate}>
                {new Date(nextAppt.scheduled_at).toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                ·{" "}
                {new Date(nextAppt.scheduled_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text style={styles.apptSub}>
                {nextAppt.type === "remote"
                  ? t("patient.doctor.appointment_types.remote")
                  : t("patient.doctor.appointment_types.in_person")}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataText}>
              {t("patient.doctor.no_appointments")}
            </Text>
          </View>
        )}

        {/* Contact */}
        <Text style={styles.sectionLabel}>{t("patient.doctor.contact")}</Text>
        <View style={styles.card}>
          {doctorData.phone && (
            <View style={[styles.contactRow, styles.contactBorder]}>
              <Text style={styles.contactLabel}>
                {t("patient.doctor.phone")}
              </Text>
              <Pressable
                onPress={() => Linking.openURL(`tel:${doctorData.phone}`)}
              >
                <Text style={styles.contactVal}>{doctorData.phone}</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>
              {t("patient.doctor.workplace")}
            </Text>
            <Text style={styles.contactVal}>
              {doctorData.hospital_name || t("common.clinic")}
            </Text>
          </View>
        </View>

        {/* Recent notes */}
        <Text style={styles.sectionLabel}>{t("patient.doctor.notes")}</Text>
        <View style={styles.card}>
          {notes.length > 0 ? (
            notes.map((n, i) => (
              <View
                key={n.id}
                style={[
                  styles.noteRow,
                  i < notes.length - 1 && styles.noteBorder,
                ]}
              >
                <View style={styles.noteHeaderSmall}>
                  <Ionicons
                    name="calendar-outline"
                    size={12}
                    color={theme.textMuted}
                  />
                  <Text style={styles.noteDate}>
                    {new Date(n.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <Text style={styles.noteText}>{n.body}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noDataNote}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={32}
                color={theme.border}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.noDataText}>
                {t("patient.doctor.no_notes")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
    pageTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 20,
    },
    doctorCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.border,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImg: { width: "100%", height: "100%" },
    avatarText: { color: "#fff", fontWeight: "700", fontSize: 20 },
    doctorInfo: { flex: 1 },
    doctorName: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 2,
    },
    doctorSpecialty: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: "600",
      marginBottom: 2,
    },
    doctorHospital: { fontSize: 12, color: theme.textMuted },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.textMuted,
      letterSpacing: 1,
      marginBottom: 12,
      marginTop: 8,
    },
    appointmentCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    apptIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.primary + "1a",
      alignItems: "center",
      justifyContent: "center",
    },
    apptIconText: { fontSize: 20 },
    apptInfo: { flex: 1 },
    apptDate: { fontSize: 15, fontWeight: "600", color: theme.text },
    apptSub: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      paddingHorizontal: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    contactRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
    },
    contactBorder: { borderBottomWidth: 1, borderBottomColor: theme.border },
    contactLabel: { fontSize: 14, color: theme.textMuted },
    contactVal: { fontSize: 14, color: theme.text, fontWeight: "600" },
    noteRow: { paddingVertical: 14 },
    noteBorder: { borderBottomWidth: 1, borderBottomColor: theme.border },
    noteHeaderSmall: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 6,
    },
    noteDate: { fontSize: 11, color: theme.textMuted, fontWeight: "600" },
    noteText: { fontSize: 14, color: theme.secondary, lineHeight: 22 },

    // Empty state
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
      marginTop: 60,
    },
    emptyIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 12,
    },
    emptyDesc: {
      fontSize: 15,
      color: theme.textMuted,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 32,
    },
    findBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
    },
    findBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

    noDataCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: "dashed",
    },
    noDataNote: { paddingVertical: 30, alignItems: "center" },
    noDataText: { color: theme.textMuted, fontSize: 14, fontWeight: "500" },

    // Search UI
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, color: theme.text },

    doctorItemCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    doctorItemMain: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatarSmall: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarTextSmall: { color: "#fff", fontSize: 14, fontWeight: "700" },
    doctorItemInfo: { flex: 1 },
    doctorItemName: { fontSize: 16, fontWeight: "700", color: theme.text },
    doctorItemSpecialty: { fontSize: 13, color: theme.primary },
    distanceText: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
    connectBtn: {
      backgroundColor: theme.primary + "1a",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    connectBtnText: { color: theme.primary, fontSize: 13, fontWeight: "700" },
    emptyContainerSmall: { padding: 40, alignItems: "center" },
  });
