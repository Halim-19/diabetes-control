import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Profile, supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface LinkedPatient extends Profile {
    status: "pending" | "accepted";
    link_id: string;
}

export default function PatientsScreen() {
    const { profile: doctor } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [patients, setPatients] = useState<LinkedPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Add Patient Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [searching, setSearching] = useState(false);

    const fetchPatients = async () => {
        if (!doctor) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("doctor_patient")
                .select(
                    `
                    id,
                    status,
                    patient_id,
                    profiles!doctor_patient_patient_id_fkey (*)
                `,
                )
                .eq("doctor_id", doctor.id);

            if (error) throw error;

            const formatted = data.map((item: any) => ({
                ...item.profiles,
                status: item.status || "accepted",
                link_id: item.id,
            })) as LinkedPatient[];

            setPatients(formatted);
        } catch (err) {
            console.error("Error fetching patients:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [doctor]);

    // Live search debouncing
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                handleSearchPatients();
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearchPatients = async () => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("role", "patient")
                .or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
                .limit(10);

            if (error) {
                console.error("Search error:", error);
                Alert.alert(
                    t("doctor.patients.search_error", "Search Error"),
                    error.message,
                );
                setSearchResults([]);
            } else {
                setSearchResults(data || []);
            }
        } catch (err) {
            console.error("Search exception:", err);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const addPatient = async (patientId: string) => {
        if (!doctor) return;

        // Check if already linked
        if (patients.some((p) => p.id === patientId)) {
            Alert.alert(
                t("common.info", "Info"),
                t(
                    "doctor.patients.already_linked",
                    "This patient is already in your list.",
                ),
            );
            return;
        }

        const { error } = await supabase.from("doctor_patient").insert({
            doctor_id: doctor.id,
            patient_id: patientId,
            status: "accepted",
        });

        if (error) {
            Alert.alert(
                t("common.error", "Error"),
                t("doctor.patients.add_error", "Could not add patient."),
            );
        } else {
            Alert.alert(
                t("common.success", "Success"),
                t("doctor.patients.add_success", "Patient added successfully."),
            );
            setModalVisible(false);
            setSearchQuery("");
            setSearchResults([]);
            fetchPatients();
        }
    };

    const acceptPatient = async (linkId: string) => {
        const { error } = await supabase
            .from("doctor_patient")
            .update({ status: "accepted" })
            .eq("id", linkId);

        if (!error) fetchPatients();
        else
            Alert.alert(
                t("common.error", "Error"),
                t("doctor.patients.accept_error", "Could not accept request."),
            );
    };

    const filtered = patients.filter(
        (p) =>
            p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.phone?.includes(search),
    );

    const pending = filtered.filter((p) => p.status === "pending");
    const accepted = filtered.filter((p) => p.status === "accepted");

    const renderPatientCard = ({ item }: { item: LinkedPatient }) => (
        <Pressable
            style={styles.patientCard}
            onPress={() =>
                item.status === "accepted" &&
                router.push({
                    pathname: "/(doctor)/patients/[id]",
                    params: { id: item.id },
                })
            }
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {item.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                </Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.subInfo}>
                    {item.phone || "No phone"} · {item.diabetes_type?.replace("_", " ")}
                </Text>
            </View>
            {item.status === "pending" ? (
                <Pressable
                    style={styles.acceptBtn}
                    onPress={() => acceptPatient(item.link_id)}
                >
                    <Text style={styles.acceptBtnText}>
                        {t("doctor.patients.accept", "Accept")}
                    </Text>
                </Pressable>
            ) : (
                <Ionicons name="chevron-forward" size={20} color={theme.border} />
            )}
        </Pressable>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>
                        {t("doctor.patients.title")}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t("doctor.patients.active_count", {
                            count: accepted.length,
                            defaultValue: "{{count}} active patients",
                        })}
                    </Text>
                </View>
                <Pressable style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.addBtnText}>
                        {t("doctor.patients.add", "Add")}
                    </Text>
                </Pressable>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons
                    name="search"
                    size={20}
                    color={theme.textMuted}
                    style={styles.searchIcon}
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t(
                        "doctor.patients.filter",
                        "Filter by name or phone...",
                    )}
                    placeholderTextColor={theme.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
            ) : (
                <FlatList
                    data={[
                        ...(pending.length > 0
                            ? [
                                {
                                    id: "header-pending",
                                    isHeader: true,
                                    title: t("doctor.patients.pending", "Pending Requests"),
                                },
                                ...pending,
                            ]
                            : []),
                        ...(accepted.length > 0
                            ? [
                                {
                                    id: "header-accepted",
                                    isHeader: true,
                                    title: t("doctor.patients.my_patients", "My Patients"),
                                },
                                ...accepted,
                            ]
                            : []),
                    ]}
                    keyExtractor={(item: any) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }: any) => {
                        if (item.isHeader) {
                            return <Text style={styles.sectionTitle}>{item.title}</Text>;
                        }
                        return renderPatientCard({ item });
                    }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="people-outline" size={48} color={theme.border} />
                            <Text style={styles.emptyText}>
                                {t("doctor.patients.empty", "No patients found.")}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Add Patient Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {t("doctor.patients.add_new", "Add New Patient")}
                            </Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </Pressable>
                        </View>

                        <View style={styles.modalSearch}>
                            <TextInput
                                style={styles.modalInput}
                                placeholder={t(
                                    "doctor.patients.search_placeholder",
                                    "Search by name or phone...",
                                )}
                                placeholderTextColor={theme.textMuted}
                                autoFocus
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearchPatients}
                            />
                            <Pressable
                                style={styles.modalSearchBtn}
                                onPress={handleSearchPatients}
                            >
                                {searching ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name="search" size={20} color="#fff" />
                                )}
                            </Pressable>
                        </View>

                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item.id}
                            style={styles.resultsList}
                            renderItem={({ item }) => (
                                <View style={styles.resultItem}>
                                    <View>
                                        <Text style={styles.resultName}>{item.full_name}</Text>
                                        <Text style={styles.resultPhone}>{item.phone}</Text>
                                    </View>
                                    <Pressable
                                        style={styles.resultAddBtn}
                                        onPress={() => addPatient(item.id)}
                                    >
                                        <Text style={styles.resultAddText}>
                                            {t("doctor.patients.link", "Link")}
                                        </Text>
                                    </Pressable>
                                </View>
                            )}
                            ListEmptyComponent={
                                searchQuery.trim().length >= 2 && !searching ? (
                                    <Text style={styles.noResults}>
                                        {t("common.no_matches", "No matches found.")}
                                    </Text>
                                ) : null
                            }
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const createStyles = (theme: any) =>
    StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.background },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingVertical: 20,
        },
        title: { fontSize: 24, fontWeight: "700", color: theme.text },
        subtitle: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
        addBtn: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.primary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 12,
            gap: 4,
        },
        addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
        searchContainer: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.card,
            marginHorizontal: 24,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            marginBottom: 16,
        },
        searchIcon: { marginRight: 8 },
        searchInput: { flex: 1, height: 44, fontSize: 15, color: theme.text },
        list: { paddingHorizontal: 24, paddingBottom: 40 },
        sectionTitle: {
            fontSize: 12,
            fontWeight: "700",
            color: theme.textMuted,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginTop: 16,
            marginBottom: 12,
        },
        patientCard: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.card,
            padding: 16,
            borderRadius: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
        },
        avatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.primary + "1a",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
        },
        avatarText: { color: theme.primary, fontWeight: "700", fontSize: 16 },
        info: { flex: 1 },
        name: { fontSize: 16, fontWeight: "600", color: theme.text },
        subInfo: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
        acceptBtn: {
            backgroundColor: theme.success,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
        },
        acceptBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
        empty: { alignItems: "center", marginTop: 60, gap: 12 },
        emptyText: { color: theme.textMuted, fontSize: 15 },
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
        },
        modalContent: {
            backgroundColor: theme.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            height: "90%",
            padding: 24,
            borderWidth: theme.dark ? 1 : 0,
            borderColor: theme.border,
        },
        modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
        },
        modalTitle: { fontSize: 20, fontWeight: "700", color: theme.text },
        modalSearch: { flexDirection: "row", gap: 8, marginBottom: 20 },
        modalInput: {
            flex: 1,
            backgroundColor: theme.background,
            height: 48,
            borderRadius: 12,
            paddingHorizontal: 16,
            fontSize: 15,
            color: theme.text,
            borderWidth: 1,
            borderColor: theme.border,
        },
        modalSearchBtn: {
            width: 48,
            height: 48,
            backgroundColor: theme.primary,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
        },
        resultsList: { flex: 1 },
        resultItem: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        resultName: { fontSize: 15, fontWeight: "600", color: theme.text },
        resultPhone: { fontSize: 13, color: theme.textMuted },
        resultAddBtn: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.primary,
        },
        resultAddText: { color: theme.primary, fontWeight: "600", fontSize: 13 },
        noResults: { textAlign: "center", color: theme.textMuted, marginTop: 20 },
    });
