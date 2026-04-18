import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useActivityLogs } from '@/hooks/useTracking';
import { ActivityIntensity, COMMON_ACTIVITIES, INTENSITY_OPTIONS } from '@/types/tracking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';


const getColors = (theme: any) => ({
  bg: theme.background, surface: theme.card, border: theme.border,
  text: theme.text, sub: theme.secondary, muted: theme.textMuted,
  blue: theme.primary, blueBg: theme.primary + '1a',
  green: theme.success, red: theme.danger,
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
  return <TextInput style={s.input} placeholderTextColor={C.muted} selectionColor={C.blue} {...props} />;
}

export default function LogActivityScreen() {
  const { theme } = useTheme();
  const C = useMemo(() => getColors(theme), [theme]);
  const s = useMemo(() => createStyles(C), [C]);
  
  const intensityColor: Record<string, string> = { light: C.blue, moderate: C.green, intense: C.red };
  const intensityBg: Record<string, string> = { light: theme.primary + '1a', moderate: theme.success + '1a', intense: theme.danger + '1a' };

  const { t } = useTranslation();
  const { session } = useAuth();

  const patientId = session?.user?.id;
  const router = useRouter();
  const { logs, save, remove, fetchToday } = useActivityLogs(patientId);
  const [saving, setSaving] = useState(false);

  const [actType, setActType] = useState('');
  const [customAct, setCustomAct] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<ActivityIntensity>('moderate');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { fetchToday(); }, []);

  const finalActivity = actType === 'Other' ? customAct : actType;

  const handleSave = async () => {
    if (!finalActivity.trim()) { Alert.alert(t('common.required'), t('common.select_activity')); return; }
    if (!duration || parseInt(duration) <= 0) { Alert.alert(t('common.required'), t('common.enter_duration')); return; }
    setSaving(true);
    const { error } = await save({
      activity_type: finalActivity.trim(),
      duration_min: parseInt(duration),
      intensity,
      calories_burned: calories ? parseInt(calories) : null,
      notes,
    });
    setSaving(false);
    if (error) { Alert.alert('Error', error); return; }
    setActType(''); setCustomAct(''); setDuration(''); setCalories(''); setNotes('');
  };

  const handleDelete = (id: string) =>
    Alert.alert(t('common.delete'), t('common.delete_activity'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => remove(id) },
    ]);

  const handleBack = () => {
    router.replace('/(patient)/tracker');
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable onPress={handleBack}><Text style={s.backText}>{t('common.back')}</Text></Pressable>
        <Text style={s.headerTitle}>{t('patient.tracker.rings.activity')}</Text>
        <View style={{ width: 52 }} />
      </View>


      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Activity type */}
          <View style={s.card}>
            <SectionLabel text={t('common.reading')} />
            <View style={s.actGrid}>
              {COMMON_ACTIVITIES.map(a => (
                <Pressable
                  key={a}
                  style={[s.actChip, actType === a && { borderColor: C.blue, backgroundColor: C.blueBg }]}
                  onPress={() => setActType(a)}
                >
                  <Text style={[s.actChipText, actType === a && { color: C.blue, fontWeight: '600' }]}>{t(`patient.tracker.activities.${a.toLowerCase()}`, a)}</Text>
                </Pressable>
              ))}
            </View>
            {actType === 'Other' && (
              <View>
                <FieldLabel text={t('common.notes')} />
                <Input placeholder={t("patient.tracker.placeholders.activity_example")} value={customAct} onChangeText={setCustomAct} />
              </View>
            )}
          </View>


          {/* Duration & calories */}
          <View style={s.card}>
            <SectionLabel text={t('common.timing')} />
            <View style={s.row2}>
              <View style={s.col}>
                <FieldLabel text={t('patient.tracker.units.active_min')} />
                <Input placeholder={t("patient.tracker.placeholders.duration_example")} keyboardType="number-pad" value={duration} onChangeText={setDuration} />
              </View>
              <View style={s.col}>
                <FieldLabel text={t("patient.tracker.labels.calories_burned_opt")} />
                <Input placeholder={t("patient.tracker.placeholders.calories_example")} keyboardType="number-pad" value={calories} onChangeText={setCalories} />
              </View>
            </View>
          </View>


          {/* Intensity */}
          <View style={s.card}>
            <SectionLabel text={t("patient.tracker.labels.intensity")} />
            <View style={s.intensityRow}>
              {INTENSITY_OPTIONS.map(opt => {
                const active = intensity === opt.value;
                const col = intensityColor[opt.value];
                return (
                  <Pressable
                    key={opt.value}
                    style={[s.intensityCard, active && { borderColor: col, backgroundColor: intensityBg[opt.value] }]}
                    onPress={() => setIntensity(opt.value)}
                  >
                    <Text style={[s.intensityLabel, active && { color: col }]}>{opt.emoji} {t(`patient.tracker.intensity.${opt.value}`, opt.label)}</Text>
                    <Text style={s.intensityDesc}>{t(`patient.tracker.intensity_desc.${opt.value}`, opt.desc)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={s.card}>
            <SectionLabel text={t('common.notes')} />
            <Input placeholder={t('patient.feed.ai_consult.placeholder')} value={notes} onChangeText={setNotes}
              multiline numberOfLines={2} style={[s.input, { height: 56, textAlignVertical: 'top' }]} />
          </View>

          <Pressable style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>{t('common.save')}</Text>}
          </Pressable>


          {logs.length > 0 && (
            <View style={s.card}>
              <SectionLabel text={`${t("patient.tracker.labels.today_sessions")} (${logs.length})`} />
              {logs.map((row: any) => {
                const time = new Date(row.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const col = intensityColor[row.intensity] ?? C.blue;
                const actName = COMMON_ACTIVITIES.includes(row.activity_type) 
                  ? t(`patient.tracker.activities.${row.activity_type.toLowerCase()}`, row.activity_type)
                  : row.activity_type;

                return (
                  <View key={row.id} style={s.logRow}>
                    <View style={[s.logDot, { backgroundColor: col }]} />
                    <View style={s.logInfo}>
                      <Text style={s.logVal}>{actName}</Text>
                      <Text style={s.logMeta}>{row.duration_min} min · {t(`patient.tracker.intensity.${row.intensity}`, row.intensity)}{row.calories_burned ? ` · ${row.calories_burned} kcal` : ''} · {time}</Text>
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
  backText: { fontSize: 15, color: C.blue, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  scroll: { padding: 16, gap: 12, paddingBottom: 48 },

  card: { backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 0.8, textTransform: 'uppercase' },
  fieldLabel: { fontSize: 12, fontWeight: '500', color: C.sub, marginBottom: 4 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text },

  actGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  actChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  actChipText: { fontSize: 12, color: C.sub },

  row2: { flexDirection: 'row', gap: 10 },
  col: { flex: 1, gap: 4 },

  intensityRow: { flexDirection: 'row', gap: 8 },
  intensityCard: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, gap: 4 },
  intensityLabel: { fontSize: 13, fontWeight: '600', color: C.sub },
  intensityDesc: { fontSize: 11, color: C.muted },

  saveBtn: { backgroundColor: C.blue, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logInfo: { flex: 1 },
  logVal: { fontSize: 13, fontWeight: '600', color: C.text },
  logMeta: { fontSize: 11, color: C.muted, marginTop: 1 },
  deleteBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  deleteBtnText: { fontSize: 18, color: C.muted, lineHeight: 18 },
});
