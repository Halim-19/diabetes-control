import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNutritionLogs } from '@/hooks/useTracking';
import { CARB_LEVELS, CarbLevel, MEAL_TYPES, MealType } from '@/types/tracking';
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
  green: theme.success,
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

export default function LogNutritionScreen() {
  const { theme } = useTheme();
  const C = useMemo(() => getColors(theme), [theme]);
  const s = useMemo(() => createStyles(C), [C]);
  const { t } = useTranslation();
  const { session } = useAuth();

  const patientId = session?.user?.id;
  const router = useRouter();
  const { logs, save, remove, fetchToday } = useNutritionLogs(patientId);
  const [saving, setSaving] = useState(false);

  const [mealType, setMealType] = useState<MealType | null>(null);
  const [carbLevel, setCarbLevel] = useState<CarbLevel>('medium');
  const [description, setDesc] = useState('');
  const [carbGrams, setCarbGrams] = useState('');
  const [water, setWater] = useState(0);

  useEffect(() => { fetchToday(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await save({
      meal_type: mealType,
      carb_level: carbLevel,
      description,
      carb_grams: carbGrams ? parseInt(carbGrams) : null,
      water_glasses: water,
    });
    setSaving(false);
    if (error) { Alert.alert('Error', error); return; }
    setMealType(null); setCarbLevel('medium'); setDesc(''); setCarbGrams(''); setWater(0);
  };

  const handleDelete = (id: string) =>
    Alert.alert(t('common.delete'), t('common.delete_meal'), [
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
        <Text style={s.headerTitle}>{t('patient.tracker.rings.nutrition')}</Text>
        <View style={{ width: 52 }} />
      </View>


      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Meal type */}
          <View style={s.card}>
            <SectionLabel text={t('common.reading')} />
            <View style={s.row4}>

              {MEAL_TYPES.map(m => (
                <Pressable
                  key={m.value}
                  style={[s.mealChip, mealType === m.value && { borderColor: C.green, backgroundColor: theme.success + '1a' }]}
                  onPress={() => setMealType(m.value)}
                >
                  <Text style={[s.mealChipText, mealType === m.value && { color: C.green, fontWeight: '600' }]}>
                    {m.emoji} {t(`patient.tracker.meal_type.${m.value}`, m.label)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Carb level */}
          <View style={s.card}>
            <SectionLabel text={t('common.timing')} />
            {CARB_LEVELS.map(cl => (

              <Pressable
                key={cl.value}
                style={[s.carbRow, carbLevel === cl.value && { borderColor: cl.color, backgroundColor: cl.color + '10' }]}
                onPress={() => setCarbLevel(cl.value)}
              >
                <View style={[s.carbDot, { backgroundColor: cl.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.carbLabel, carbLevel === cl.value && { color: cl.color }]}>{t(`patient.tracker.carb_level.${cl.value}`, cl.label)}</Text>
                  <Text style={s.carbDesc}>{t(`patient.tracker.carb_desc.${cl.value}`, cl.desc)}</Text>
                </View>
                {carbLevel === cl.value && (
                  <View style={[s.selectedMark, { backgroundColor: cl.color }]}>
                    <Text style={s.selectedMarkText}>✓</Text>
                  </View>
                )}
              </Pressable>
            ))}

            <View style={s.row2}>
              <View style={s.col}>
                <FieldLabel text={t("patient.tracker.labels.carbs_optional")} />
                <Input placeholder={t("patient.tracker.placeholders.carbs_example")} keyboardType="number-pad" value={carbGrams} onChangeText={setCarbGrams} />
              </View>
              <View style={s.col}>
                <FieldLabel text={t("patient.tracker.labels.description_optional")} />
                <Input placeholder={t("patient.tracker.placeholders.meal_description_example")} value={description} onChangeText={setDesc} />
              </View>
            </View>
          </View>

          {/* Water */}
          <View style={s.card}>
            <SectionLabel text={t('patient.tracker.units.water')} />
            <View style={s.waterHeader}>
              <Text style={s.waterCount}>{water}</Text>
              <Text style={s.waterLabel}>{t('patient.tracker.units.water')} {t('periods.today')}</Text>
            </View>
            <View style={s.waterGrid}>

              {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
                <Pressable
                  key={n}
                  style={[s.waterBtn, water >= n && { backgroundColor: theme.primary + '1a', borderColor: C.blue }]}
                  onPress={() => setWater(water === n ? n - 1 : n)}
                >
                  <Text style={[s.waterBtnText, water >= n && { color: C.blue }]}>{n}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>{t('common.save')}</Text>}
          </Pressable>


          {logs.length > 0 && (
            <View style={s.card}>
              <SectionLabel text={`${t("patient.tracker.labels.today_meals")} (${logs.length})`} />
              {logs.map((row: any) => {
                const cl = CARB_LEVELS.find(c => c.value === row.carb_level);
                const mt = MEAL_TYPES.find(m => m.value === row.meal_type);
                const time = new Date(row.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <View key={row.id} style={s.logRow}>
                    <View style={[s.logDot, { backgroundColor: cl?.color ?? C.green }]} />
                    <View style={s.logInfo}>
                      <Text style={s.logVal}>{mt ? `${mt.emoji} ${t(`patient.tracker.meal_type.${row.meal_type}`, mt.label)}` : t("patient.tracker.labels.meal")}{row.description ? ` — ${row.description}` : ''}</Text>
                      <Text style={s.logMeta}>{cl ? t(`patient.tracker.carb_level.${row.carb_level}`, cl.label) : ''} {t("patient.tracker.rings.nutrition").toLowerCase()}{row.carb_grams ? ` · ${row.carb_grams}g` : ''} · {row.water_glasses} {t("patient.tracker.units.water").toLowerCase()} · {time}</Text>
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

  row4: { flexDirection: 'row', gap: 8 },
  row2: { flexDirection: 'row', gap: 10 },
  col: { flex: 1, gap: 4 },

  mealChip: { flex: 1, paddingVertical: 9, borderRadius: 9, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, alignItems: 'center' },
  mealChipText: { fontSize: 12, color: C.sub },

  carbRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  carbDot: { width: 10, height: 10, borderRadius: 5 },
  carbLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 1 },
  carbDesc: { fontSize: 11, color: C.muted },
  selectedMark: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  selectedMarkText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  waterHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  waterCount: { fontSize: 36, fontWeight: '700', color: C.blue },
  waterLabel: { fontSize: 14, color: C.sub },
  waterGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  waterBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  waterBtnText: { fontSize: 13, fontWeight: '600', color: C.muted },

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
