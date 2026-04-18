// ─── Glucose & Medication ─────────────────────────────────────────────────────

export type GlucoseUnit = 'mg/dL' | 'mmol/L';

export type GlucoseTiming =
  | 'fasting'
  | 'before_breakfast'
  | 'after_breakfast'
  | 'before_lunch'
  | 'after_lunch'
  | 'before_dinner'
  | 'after_dinner'
  | 'bedtime'
  | 'random'
  | 'night';

export const GLUCOSE_TIMINGS: { value: GlucoseTiming; label: string; emoji: string }[] = [
  { value: 'fasting',          label: 'Fasting',         emoji: '🌙' },
  { value: 'before_breakfast', label: 'Before Breakfast', emoji: '🌅' },
  { value: 'after_breakfast',  label: 'After Breakfast',  emoji: '☀️' },
  { value: 'before_lunch',     label: 'Before Lunch',     emoji: '🕛' },
  { value: 'after_lunch',      label: 'After Lunch',      emoji: '🕑' },
  { value: 'before_dinner',    label: 'Before Dinner',    emoji: '🌆' },
  { value: 'after_dinner',     label: 'After Dinner',     emoji: '🌙' },
  { value: 'bedtime',          label: 'Bedtime',          emoji: '😴' },
  { value: 'random',           label: 'Random',           emoji: '🎲' },
  { value: 'night',            label: 'Night',            emoji: '🌌' },
];

// Stored in measurements table: type='glucose', value=JSON string
export interface GlucoseEntry {
  glucose_value: number;
  unit: GlucoseUnit;
  timing: GlucoseTiming;
  insulin_units?: number | null;
  insulin_type?: string | null;
  medication_name?: string | null;
  medication_taken?: boolean;
  notes?: string | null;
}

// What we get back from measurements table
export interface MeasurementRow {
  id: string;
  patient_id: string;
  type: string;
  value: string;        // JSON-encoded GlucoseEntry
  unit: string | null;
  recorded_at: string;
  note: string | null;
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type CarbLevel = 'none' | 'low' | 'medium' | 'high';

export const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { value: 'lunch',     label: 'Lunch',     emoji: '☀️' },
  { value: 'dinner',    label: 'Dinner',    emoji: '🌆' },
  { value: 'snack',     label: 'Snack',     emoji: '🍎' },
];

export const CARB_LEVELS: { value: CarbLevel; label: string; color: string; desc: string }[] = [
  { value: 'none',   label: 'None',   color: '#94a3b8', desc: 'No carbs / water only' },
  { value: 'low',    label: 'Low',    color: '#22c55e', desc: 'Salad, eggs, meat' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', desc: 'Rice, bread (small)' },
  { value: 'high',   label: 'High',   color: '#ef4444', desc: 'Pasta, sweets, bread' },
];

export interface NutritionLog {
  id?: string;
  patient_id?: string;
  meal_type: MealType | null;
  carb_level: CarbLevel;
  description: string;
  carb_grams: number | null;
  water_glasses: number;
  logged_at?: string;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export type ActivityIntensity = 'light' | 'moderate' | 'intense';

export const COMMON_ACTIVITIES = [
  'Walking', 'Running', 'Cycling', 'Swimming', 'Judo', 'Football',
  'Basketball', 'Yoga', 'Gym', 'Dancing', 'Hiking', 'Other',
];

export const INTENSITY_OPTIONS: { value: ActivityIntensity; label: string; emoji: string; desc: string }[] = [
  { value: 'light',    label: 'Light',    emoji: '🚶', desc: 'Easy, no sweat' },
  { value: 'moderate', label: 'Moderate', emoji: '🚴', desc: 'Some effort, light sweat' },
  { value: 'intense',  label: 'Intense',  emoji: '🏋️', desc: 'Hard effort, heavy sweat' },
];

export interface ActivityLog {
  id?: string;
  patient_id?: string;
  activity_type: string;
  duration_min: number;
  intensity: ActivityIntensity;
  calories_burned: number | null;
  notes: string;
  logged_at?: string;
}

// ─── Wellbeing & Symptoms ─────────────────────────────────────────────────────

export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type MoodType = 'great' | 'good' | 'neutral' | 'tired' | 'stressed' | 'anxious';

// Hypo = low blood sugar signs
export const HYPO_SYMPTOMS: { id: string; label: string; emoji: string }[] = [
  { id: 'dizziness', label: 'Dizziness',  emoji: '😵' },
  { id: 'sweating',  label: 'Sweating',   emoji: '💧' },
  { id: 'shaking',   label: 'Shaking',    emoji: '🫨' },
  { id: 'hunger',    label: 'Hunger',     emoji: '🍽️' },
  { id: 'palpitations', label: 'Palpitations', emoji: '💓' },
  { id: 'confusion', label: 'Confusion',  emoji: '🌀' },
];

// Hyper = high blood sugar signs
export const HYPER_SYMPTOMS: { id: string; label: string; emoji: string }[] = [
  { id: 'thirst',     label: 'Thirst',          emoji: '🥤' },
  { id: 'urination',  label: 'Frequent Urination', emoji: '🚽' },
  { id: 'blurred',    label: 'Blurred Vision',  emoji: '👁️' },
  { id: 'fatigue',    label: 'Fatigue',          emoji: '😴' },
  { id: 'headache',   label: 'Headache',         emoji: '🤕' },
  { id: 'nausea',     label: 'Nausea',           emoji: '🤢' },
];

export const MOOD_OPTIONS: { value: MoodType; label: string; emoji: string }[] = [
  { value: 'great',    label: 'Great',   emoji: '😄' },
  { value: 'good',     label: 'Good',    emoji: '😊' },
  { value: 'neutral',  label: 'Neutral', emoji: '😐' },
  { value: 'tired',    label: 'Tired',   emoji: '😪' },
  { value: 'stressed', label: 'Stressed',emoji: '😤' },
  { value: 'anxious',  label: 'Anxious', emoji: '😰' },
];

export const SLEEP_QUALITY_OPTIONS: { value: SleepQuality; label: string; color: string }[] = [
  { value: 'poor',      label: 'Poor',      color: '#ef4444' },
  { value: 'fair',      label: 'Fair',      color: '#f59e0b' },
  { value: 'good',      label: 'Good',      color: '#22c55e' },
  { value: 'excellent', label: 'Excellent', color: '#3b82f6' },
];

export interface WellbeingLog {
  id?: string;
  patient_id?: string;
  symptoms: string[];
  mood: MoodType | null;
  sleep_hours: number | null;
  sleep_quality: SleepQuality | null;
  stress_level: number | null;   // 1–5
  notes: string;
  logged_at?: string;
}

// ─── Glucose status helpers ───────────────────────────────────────────────────

export function getGlucoseStatus(
  value: number,
  unit: GlucoseUnit,
  targetMin = 80,
  targetMax = 180
): { label: string; color: string; bg: string } {
  const mgdl = unit === 'mmol/L' ? value * 18.018 : value;

  if (mgdl < 54)  return { label: 'Critical Low',  color: '#7f1d1d', bg: '#fef2f2' };
  if (mgdl < 70)  return { label: 'Low (Hypo)',    color: '#dc2626', bg: '#fee2e2' };
  if (mgdl < targetMin) return { label: 'Below Target', color: '#f97316', bg: '#fff7ed' };
  if (mgdl <= targetMax) return { label: 'In Range',   color: '#16a34a', bg: '#f0fdf4' };
  if (mgdl <= 250) return { label: 'High (Hyper)', color: '#d97706', bg: '#fffbeb' };
  return             { label: 'Very High',         color: '#9a3412', bg: '#fff7ed' };
}

export function mmolToMgdl(mmol: number) { return Math.round(mmol * 18.018); }
export function mgdlToMmol(mgdl: number) { return Math.round(mgdl / 18.018 * 10) / 10; }
