import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useGlucoseLogs } from '@/hooks/useTracking';
import {
  GLUCOSE_TIMINGS,
  GlucoseEntry,
  GlucoseTiming,
  GlucoseUnit,
  getGlucoseStatus,
} from '@/types/tracking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';


const getColors = (theme: any) => ({
  bg: theme.background, surface: theme.card, border: theme.border,
  text: theme.text, sub: theme.secondary, muted: theme.textMuted,
  blue: theme.primary, blueBg: theme.primary + '1a',
  red: theme.danger, redBg: theme.danger + '1a',
  green: theme.success, greenBg: theme.success + '1a',
});

function SectionLabel({ text }: { text: string }) {
  const { theme } = useTheme();
  const C = useMemo(() => getColors(theme), [theme]);
  const s = useMemo(() => createStyles(C), [C]);
  return <Text style={s.sectionLabel}>{text}</Text>;
}

function FieldLabel({ text }: { text: string }) {
  const { theme } = useTheme();
  const C = useMemo(() => getColors(theme), [theme]);
  const s = useMemo(() => createStyles(C), [C]);
  return <Text style={s.fieldLabel}>{text}</Text>;
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  const { theme } = useTheme();
  const C = useMemo(() => getColors(theme), [theme]);
  const s = useMemo(() => createStyles(C), [C]);
  return (
    <TextInput
      style={s.input}
      placeholderTextColor={C.muted}
      selectionColor={C.blue}
      {...props}
    />
  );
}

export default function LogGlucoseScreen() {
  const { theme } = useTheme();
  const C = useMemo(() => getColors(theme), [theme]);
  const s = useMemo(() => createStyles(C), [C]);
  const { t } = useTranslation();
  const { session, profile } = useAuth();

  const patientId = session?.user?.id;
  const router = useRouter();
  const { logs, save, remove, fetchToday } = useGlucoseLogs(patientId);
  const [saving, setSaving] = useState(false);

  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<GlucoseUnit>('mg/dL');
  const [timing, setTiming] = useState<GlucoseTiming>('random');
  const [insulinUnits, setInsulinUnits] = useState('');
  const [insulinType, setInsulinType] = useState('');
  const [medName, setMedName] = useState('');
  const [medTaken, setMedTaken] = useState(false);
  const [notes, setNotes] = useState('');

  const tMin = profile?.target_glucose_min ?? 80;
  const tMax = profile?.target_glucose_max ?? 180;

  useEffect(() => { fetchToday(); }, []);

  const numVal = parseFloat(value);
  const status = value && !isNaN(numVal)
    ? getGlucoseStatus(numVal, unit, tMin, tMax)
    : null;

  const handleSave = async () => {
    if (!value || isNaN(numVal) || numVal <= 0) {
      Alert.alert(t('common.error'), 'Enter a valid glucose reading.'); return;
    }
    setSaving(true);
    const { error } = await save({
      glucose_value: numVal, unit, timing,
      insulin_units: insulinUnits ? parseFloat(insulinUnits) : null,
      insulin_type: insulinType || null,
      medication_name: medName || null,
      medication_taken: medTaken,
      notes: notes || null,
    });
    setSaving(false);
    if (error) { Alert.alert(t('common.error'), error); return; }
    setValue(''); setInsulinUnits(''); setInsulinType(''); setMedName(''); setNotes(''); setMedTaken(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(t('common.delete'), t('confirm_sign_out'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => remove(id) },
    ]);
  };


  const handleBack = () => {
    router.replace('/(patient)/tracker');
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={handleBack}>
          <Text style={s.backText}>{t('common.back')}</Text>
        </Pressable>
        <Text style={s.headerTitle}>{t('patient.tracker.rings.glucose')}</Text>

        <View style={{ width: 52 }} />
      </View>


      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Value input */}
          <View style={s.card}>
            <SectionLabel text={t('common.reading')} />
            <View style={s.glucoseRow}>


              <TextInput
                style={s.glucoseBig}
                placeholder="0"
                placeholderTextColor={C.muted}
                keyboardType="decimal-pad"
                value={value}
                onChangeText={setValue}
                selectionColor={status?.color ?? C.blue}
              />
              <View style={s.unitRow}>
                {(['mg/dL', 'mmol/L'] as GlucoseUnit[]).map(u => (
                  <Pressable
                    key={u}
                    style={[s.unitChip, unit === u && { borderColor: C.blue, backgroundColor: C.blueBg }]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[s.unitChipText, unit === u && { color: C.blue }]}>{u}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {status && (
              <View style={[s.statusBar, { backgroundColor: status.bg }]}>
                <View style={[s.statusDot, { backgroundColor: status.color }]} />
                <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
                <Text style={[s.statusRange, { color: status.color }]}>{t('patient.tracker.title')}: {tMin}–{tMax} mg/dL</Text>
              </View>


            )}
          </View>

          {/* Timing */}
          <View style={s.card}>
            <SectionLabel text={t('common.timing')} />
            <View style={s.timingGrid}>

              {GLUCOSE_TIMINGS.map(item => (
                <Pressable
                  key={item.value}
                  style={[s.timingChip, timing === item.value && { borderColor: C.blue, backgroundColor: C.blueBg }]}
                  onPress={() => setTiming(item.value)}
                >
                  <Text style={[s.timingText, timing === item.value && { color: C.blue, fontWeight: '600' }]}>
                    {item.emoji} {t(`patient.tracker.timing.${item.value}`, item.label)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Medication */}
          <View style={s.card}>
            <SectionLabel text={t('patient.health_profile.sections.medical')} />
            <View style={s.row2}>

              <View style={s.col}>
                <FieldLabel text={t('common.insulin')} />
                <Input placeholder="0" keyboardType="decimal-pad" value={insulinUnits} onChangeText={setInsulinUnits} />
              </View>
              <View style={s.col}>
                <FieldLabel text={t('common.insulin')} />
                <Input placeholder="e.g. Novorapid" value={insulinType} onChangeText={setInsulinType} />
              </View>
            </View>
            <FieldLabel text={t('common.medication')} />
            <Input placeholder="e.g. Metformin 500mg" value={medName} onChangeText={setMedName} />
            <Pressable style={s.checkRow} onPress={() => setMedTaken(v => !v)}>
              <View style={[s.checkbox, medTaken && { backgroundColor: C.blue, borderColor: C.blue }]}>
                {medTaken && <Text style={s.checkmark}>✓</Text>}
              </View>
              <Text style={s.checkLabel}>{t('common.medication')} taken</Text>
            </Pressable>
          </View>


          {/* Notes */}
          <View style={s.card}>
            <SectionLabel text={t('common.notes')} />
            <Input
              placeholder={t('patient.feed.ai_consult.placeholder')}

              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={[s.input, { height: 72, textAlignVertical: 'top' }]}
            />
          </View>

          {/* Save */}
          <Pressable
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.saveBtnText}>{t('common.save')}</Text>}
          </Pressable>



          {/* Today's readings */}
          {logs.length > 0 && (
            <View style={s.card}>
              <SectionLabel text={`Today's readings (${logs.length})`} />
              {logs.map(row => {
                const e = (() => { try { return JSON.parse(row.value) as GlucoseEntry; } catch { return null; } })();
                if (!e) return null;
                const st = getGlucoseStatus(e.glucose_value, e.unit, tMin, tMax);
                const timingObj = GLUCOSE_TIMINGS.find(t => t.value === e.timing);
                const timingStr = timingObj ? `${timingObj.emoji} ${t(`patient.tracker.timing.${e.timing}`, timingObj.label)}` : e.timing.replace(/_/g, ' ');
                const time = new Date(row.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <View key={row.id} style={s.logRow}>
                    <View style={[s.logDot, { backgroundColor: st.color }]} />
                    <View style={s.logInfo}>
                      <Text style={s.logVal}>{e.glucose_value} <Text style={s.logUnit}>{e.unit}</Text></Text>
                      <Text style={s.logMeta}>{timingStr} · {time}</Text>
                    </View>
                    <View style={[s.logBadge, { backgroundColor: st.bg }]}>
                      <Text style={[s.logBadgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                    <Pressable onPress={() => handleDelete(row.id)} style={s.deleteBtn}>
                      <Text style={s.deleteBtnText}>×</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (C: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { paddingHorizontal: 4, paddingVertical: 2 },
  backText: { fontSize: 15, color: C.blue, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  scroll: { padding: 16, gap: 12, paddingBottom: 48 },

  card: { backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 0.8, textTransform: 'uppercase' },
  fieldLabel: { fontSize: 12, fontWeight: '500', color: C.sub, marginBottom: 4 },

  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text },

  glucoseRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  glucoseBig: { flex: 1, fontSize: 52, fontWeight: '700', color: C.text, letterSpacing: -1 },
  unitRow: { gap: 6 },
  unitChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  unitChipText: { fontSize: 12, color: C.sub, fontWeight: '500' },

  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700', flex: 1 },
  statusRange: { fontSize: 11, opacity: 0.7 },

  timingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  timingChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  timingText: { fontSize: 12, color: C.sub },

  row2: { flexDirection: 'row', gap: 10 },
  col: { flex: 1, gap: 4 },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  checkLabel: { fontSize: 13, color: C.sub },

  saveBtn: { backgroundColor: C.blue, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logInfo: { flex: 1 },
  logVal: { fontSize: 14, fontWeight: '600', color: C.text },
  logUnit: { fontSize: 12, color: C.sub, fontWeight: '400' },
  logMeta: { fontSize: 11, color: C.muted, marginTop: 1 },
  logBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  logBadgeText: { fontSize: 10, fontWeight: '600' },
  deleteBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  deleteBtnText: { fontSize: 18, color: C.muted, lineHeight: 18 },
});
