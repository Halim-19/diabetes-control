import Select from '@/components/Select';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
    ActivityLevel, DiabetesType, Gender, InsulinRegimen, supabase, WILAYAS
} from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
    ActivityIndicator, Alert, Platform, Pressable, ScrollView,
    StyleSheet, Switch, Text, TextInput, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

// ─── Option value constants (labels built dynamically in component) ────────────
const GENDER_VALUES: Gender[] = ['male', 'female'];
const DIABETES_TYPE_VALUES: DiabetesType[] = ['type1', 'type2', 'gestational', 'prediabetes', 'other'];
const INSULIN_VALUES: InsulinRegimen[] = ['none', 'basal_only', 'basal_bolus', 'pump', 'premixed'];
const ACTIVITY_VALUES: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ icon, title }: { icon: string; title: string }) {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>{icon}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}

function FieldLabel({ text }: { text: string }) {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    return <Text style={styles.fieldLabel}>{text}</Text>;
}

function Field({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    return <View style={styles.fieldBox}>{children}</View>;
}

function StyledInput({ value, onChangeText, placeholder, keyboardType, multiline }: any) {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <TextInput
            style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.textMuted}
            keyboardType={keyboardType ?? 'default'}
            multiline={multiline}
        />
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HealthProfileScreen() {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { t } = useTranslation();
    const { session, profile, refreshProfile } = useAuth();

    // ── Translated option lists ────────────────────────────────────────────────
    const GENDER_OPTIONS = useMemo(() => GENDER_VALUES.map(v => ({ label: t(`enums.gender.${v}`), value: v })), [t]);
    const DIABETES_TYPES = useMemo(() => DIABETES_TYPE_VALUES.map(v => ({ label: t(`enums.diabetes_type.${v}`), value: v })), [t]);
    const INSULIN_OPTIONS = useMemo(() => INSULIN_VALUES.map(v => ({ label: t(`enums.insulin_regimen.${v}`), value: v })), [t]);
    const ACTIVITY_OPTIONS = useMemo(() => ACTIVITY_VALUES.map(v => ({ label: t(`enums.activity_level.${v}`), value: v })), [t]);

    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // ── Personal Info ──────────────────────────────────────────────────────────
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState<Gender | null>(null);
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [weightKg, setWeightKg] = useState('');
    const [heightCm, setHeightCm] = useState('');
    const [wilaya, setWilaya] = useState('');
    const [commune, setCommune] = useState('');

    // ── Medical Info ───────────────────────────────────────────────────────────
    const [diabetesType, setDiabetesType] = useState<DiabetesType | null>(null);
    const [diagnosisYear, setDiagnosisYear] = useState('');
    const [hba1c, setHba1c] = useState('');
    const [targetMin, setTargetMin] = useState('');
    const [targetMax, setTargetMax] = useState('');
    const [insulinRegimen, setInsulinRegimen] = useState<InsulinRegimen | null>(null);
    const [usesCgm, setUsesCgm] = useState(false);
    const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
    const [hasHypertension, setHasHypertension] = useState(false);
    const [hasDyslipidemia, setHasDyslipidemia] = useState(false);

    // ── Emergency Contact ──────────────────────────────────────────────────────
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');

    // ─── Load existing profile ────────────────────────────────────────────────
    useEffect(() => {
        if (!profile) return;
        setFullName(profile.full_name ?? '');
        setPhone(profile.phone ?? '');
        setGender(profile.gender ?? null);
        setBirthDate(profile.birth_date ? new Date(profile.birth_date) : null);
        setWeightKg(profile.weight_kg?.toString() ?? '');
        setHeightCm(profile.height_cm?.toString() ?? '');
        setWilaya(profile.wilaya ?? '');
        setCommune(profile.commune ?? '');
        setDiabetesType(profile.diabetes_type ?? null);
        setDiagnosisYear(profile.diagnosis_year?.toString() ?? '');
        setHba1c(profile.hba1c?.toString() ?? '');
        setTargetMin(profile.target_glucose_min?.toString() ?? '80');
        setTargetMax(profile.target_glucose_max?.toString() ?? '180');
        setInsulinRegimen(profile.insulin_regimen ?? null);
        setUsesCgm(profile.uses_cgm ?? false);
        setActivityLevel(profile.activity_level ?? null);
        setHasHypertension(profile.has_hypertension ?? false);
        setHasDyslipidemia(profile.has_dyslipidemia ?? false);
        setEmergencyName(profile.emergency_contact_name ?? '');
        setEmergencyPhone(profile.emergency_contact_phone ?? '');
    }, [profile]);

    const handleSave = async () => {
        if (!session?.user?.id) return;
        setSaving(true);
        try {
            const updates: Record<string, any> = {
                full_name: fullName.trim() || null,
                phone: phone.trim() || null,
                gender,
                birth_date: birthDate ? birthDate.toISOString().split('T')[0] : null,
                weight_kg: weightKg ? parseFloat(weightKg) : null,
                height_cm: heightCm ? parseFloat(heightCm) : null,
                wilaya: wilaya || null,
                commune: commune.trim() || null,
                diabetes_type: diabetesType,
                diagnosis_year: diagnosisYear ? parseInt(diagnosisYear) : null,
                hba1c: hba1c ? parseFloat(hba1c) : null,
                target_glucose_min: targetMin ? parseInt(targetMin) : 80,
                target_glucose_max: targetMax ? parseInt(targetMax) : 180,
                insulin_regimen: insulinRegimen,
                uses_cgm: usesCgm,
                activity_level: activityLevel,
                has_hypertension: hasHypertension,
                has_dyslipidemia: hasDyslipidemia,
                emergency_contact_name: emergencyName.trim() || null,
                emergency_contact_phone: emergencyPhone.trim() || null,
                profile_complete: true,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
            if (error) throw error;

            await refreshProfile();
            Alert.alert(`✅ ${t('common.save')}`, t('patient.health_profile.save_success'), [
                { text: 'OK', onPress: () => router.replace('/(patient)/settings') }
            ]);
        } catch (err: any) {
            Alert.alert(t('common.error'), err?.message || t('patient.health_profile.save_success'));
        }

        setSaving(false);
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.replace('/(patient)/settings')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </Pressable>
                <Text style={styles.headerTitle}>{t('patient.health_profile.title')}</Text>
                <Pressable onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                    )}
                </Pressable>
            </View>


            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                {/* ── Personal Info ─────────────────────────────────────────── */}
                <Section icon="👤" title={t('patient.health_profile.sections.personal')} />

                <FieldLabel text={t('patient.health_profile.fields.full_name')} />
                <Field><StyledInput value={fullName} onChangeText={setFullName} placeholder={t('patient.health_profile.fields.full_name')} /></Field>

                <FieldLabel text={t('patient.health_profile.fields.phone')} />
                <Field><StyledInput value={phone} onChangeText={setPhone} placeholder="+213 000 000 000" keyboardType="phone-pad" /></Field>

                <FieldLabel text={t('patient.health_profile.fields.gender')} />
                <Field>
                    <Select
                        label={t('patient.health_profile.fields.gender')}
                        options={GENDER_OPTIONS.map(o => o.label)}
                        value={gender ? GENDER_OPTIONS.find(o => o.value === gender)?.label ?? null : null}
                        placeholder={t('patient.health_profile.fields.gender')}
                        onSelect={v => setGender(GENDER_OPTIONS.find(o => o.label === v)?.value ?? null)}
                    />
                </Field>

                <FieldLabel text={t('patient.health_profile.fields.birth_date')} />
                <Field>
                    <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                        <Ionicons name="calendar-outline" size={18} color={theme.textMuted} />
                        <Text style={styles.dateBtnText}>
                            {birthDate ? birthDate.toLocaleDateString() : t('patient.health_profile.fields.select_date')}
                        </Text>
                    </Pressable>
                </Field>

                {showDatePicker && (
                    <DateTimePicker
                        value={birthDate ?? new Date(1990, 0, 1)}
                        mode="date"
                        maximumDate={new Date()}
                        onChange={(_, date) => { setShowDatePicker(Platform.OS === 'ios'); if (date) setBirthDate(date); }}
                    />
                )}

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <FieldLabel text={t('patient.health_profile.fields.weight')} />
                        <Field><StyledInput value={weightKg} onChangeText={setWeightKg} placeholder="70" keyboardType="numeric" /></Field>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <FieldLabel text={t('patient.health_profile.fields.height')} />
                        <Field><StyledInput value={heightCm} onChangeText={setHeightCm} placeholder="170" keyboardType="numeric" /></Field>
                    </View>
                </View>

                <FieldLabel text={t('patient.health_profile.fields.wilaya')} />
                <Field>
                    <Select
                        label={t('patient.health_profile.fields.wilaya')}
                        options={WILAYAS}
                        value={wilaya || null}
                        placeholder={t('patient.health_profile.fields.wilaya')}
                        onSelect={v => setWilaya(v ?? '')}
                    />
                </Field>

                <FieldLabel text={t('patient.health_profile.fields.commune')} />
                <Field><StyledInput value={commune} onChangeText={setCommune} placeholder={t('patient.health_profile.fields.commune')} /></Field>

                {/* ── Medical Info ──────────────────────────────────────────── */}
                <Section icon="🩺" title={t('patient.health_profile.sections.medical')} />

                <FieldLabel text={t('patient.health_profile.fields.diabetes_type')} />
                <Field>
                    <Select
                        label={t('patient.health_profile.fields.diabetes_type')}
                        options={DIABETES_TYPES.map(o => o.label)}
                        value={diabetesType ? DIABETES_TYPES.find(o => o.value === diabetesType)?.label ?? null : null}
                        placeholder={t('patient.health_profile.fields.diabetes_type')}
                        onSelect={v => setDiabetesType(DIABETES_TYPES.find(o => o.label === v)?.value ?? null)}
                    />
                </Field>

                <FieldLabel text={t('patient.health_profile.fields.diagnosis_year')} />
                <Field><StyledInput value={diagnosisYear} onChangeText={setDiagnosisYear} placeholder="e.g. 2015" keyboardType="numeric" /></Field>

                <FieldLabel text={t('patient.health_profile.fields.hba1c')} />
                <Field><StyledInput value={hba1c} onChangeText={setHba1c} placeholder="e.g. 7.2" keyboardType="numeric" /></Field>

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <FieldLabel text={t('patient.health_profile.fields.target_min')} />
                        <Field><StyledInput value={targetMin} onChangeText={setTargetMin} placeholder="80" keyboardType="numeric" /></Field>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <FieldLabel text={t('patient.health_profile.fields.target_max')} />
                        <Field><StyledInput value={targetMax} onChangeText={setTargetMax} placeholder="180" keyboardType="numeric" /></Field>
                    </View>
                </View>

                <FieldLabel text={t('patient.health_profile.fields.insulin_regimen')} />
                <Field>
                    <Select
                        label={t('patient.health_profile.fields.insulin_regimen')}
                        options={INSULIN_OPTIONS.map(o => o.label)}
                        value={insulinRegimen ? INSULIN_OPTIONS.find(o => o.value === insulinRegimen)?.label ?? null : null}
                        placeholder={t('patient.health_profile.fields.insulin_regimen')}
                        onSelect={v => setInsulinRegimen(INSULIN_OPTIONS.find(o => o.label === v)?.value ?? null)}
                    />
                </Field>

                <FieldLabel text={t('patient.health_profile.fields.activity_level')} />
                <Field>
                    <Select
                        label={t('patient.health_profile.fields.activity_level')}
                        options={ACTIVITY_OPTIONS.map(o => o.label)}
                        value={activityLevel ? ACTIVITY_OPTIONS.find(o => o.value === activityLevel)?.label ?? null : null}
                        placeholder={t('patient.health_profile.fields.activity_level')}
                        onSelect={v => setActivityLevel(ACTIVITY_OPTIONS.find(o => o.label === v)?.value ?? null)}
                    />
                </Field>

                {/* Toggles */}
                <View style={styles.card}>
                    <View style={styles.toggleRow}>
                        <View>
                            <Text style={styles.toggleLabel}>{t('patient.health_profile.fields.uses_cgm')}</Text>
                            <Text style={styles.toggleSub}>{t('health_profile_hints.cgm_desc')}</Text>
                        </View>
                        <Switch value={usesCgm} onValueChange={setUsesCgm} trackColor={{ true: theme.primary }} />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.toggleRow}>
                        <View>
                            <Text style={styles.toggleLabel}>{t('patient.health_profile.fields.hypertension')}</Text>
                            <Text style={styles.toggleSub}>{t('health_profile_hints.hypertension_desc')}</Text>
                        </View>
                        <Switch value={hasHypertension} onValueChange={setHasHypertension} trackColor={{ true: theme.primary }} />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.toggleRow}>
                        <View>
                            <Text style={styles.toggleLabel}>{t('patient.health_profile.fields.dyslipidemia')}</Text>
                            <Text style={styles.toggleSub}>{t('health_profile_hints.dyslipidemia_desc')}</Text>
                        </View>
                        <Switch value={hasDyslipidemia} onValueChange={setHasDyslipidemia} trackColor={{ true: theme.primary }} />
                    </View>
                </View>

                {/* ── Emergency Contact ─────────────────────────────────────── */}
                <Section icon="🆘" title={t('patient.health_profile.sections.emergency')} />

                <FieldLabel text={t('patient.health_profile.fields.contact_name')} />
                <Field><StyledInput value={emergencyName} onChangeText={setEmergencyName} placeholder={t('health_profile_hints.emergency_placeholder')} /></Field>

                <FieldLabel text={t('patient.health_profile.fields.contact_phone')} />
                <Field><StyledInput value={emergencyPhone} onChangeText={setEmergencyPhone} placeholder="+213 000 000 000" keyboardType="phone-pad" /></Field>

                {/* Save Button */}
                <Pressable style={[styles.saveBottomBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBottomBtnText}>{t('common.save')}</Text>}
                </Pressable>


            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
    saveBtn: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    scroll: { padding: 16, paddingBottom: 40 },

    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginTop: 24, marginBottom: 16,
        paddingBottom: 10, borderBottomWidth: 1.5, borderBottomColor: theme.primary + '1a',
    },
    sectionIcon: { fontSize: 18 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text },

    fieldLabel: { fontSize: 13, fontWeight: '600', color: theme.secondary, marginBottom: 6, marginLeft: 2 },
    fieldBox: { marginBottom: 14 },
    input: {
        backgroundColor: theme.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
        fontSize: 15, color: theme.text, borderWidth: 1, borderColor: theme.border,
    },
    row: { flexDirection: 'row', marginBottom: 0 },

    dateBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: theme.background, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.border,
    },
    dateBtnText: { fontSize: 15, color: theme.text },

    card: {
        backgroundColor: theme.card, borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: theme.border, marginBottom: 14,
    },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    toggleLabel: { fontSize: 15, fontWeight: '600', color: theme.text },
    toggleSub: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    divider: { height: 1, backgroundColor: theme.border, marginHorizontal: 16 },

    saveBottomBtn: {
        backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 16,
        alignItems: 'center', marginTop: 24,
        shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    saveBottomBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
