import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AsyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      storage: AsyncStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export type UserRole = 'patient' | 'doctor' | 'admin';
export type Gender = 'male' | 'female';
export type DiabetesType = 'type1' | 'type2' | 'gestational' | 'prediabetes' | 'other';
export type InsulinRegimen = 'none' | 'basal_only' | 'basal_bolus' | 'pump' | 'premixed';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface Profile {
  id: string;
  role: UserRole;

  // ── Personal Info ──────────────────────────────────────────
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  birth_date: string | null;         // ISO date e.g. "1990-05-14"
  gender: Gender | null;
  weight_kg: number | null;
  height_cm: number | null;
  wilaya: string | null;             // Algerian province
  commune: string | null;

  // ── Diabetes Info ──────────────────────────────────────────
  diabetes_type: DiabetesType | null;
  diagnosis_year: number | null;
  hba1c: number | null;              // latest HbA1c %
  target_glucose_min: number | null; // mg/dL
  target_glucose_max: number | null;
  insulin_regimen: InsulinRegimen | null;
  uses_cgm: boolean | null;          // Continuous Glucose Monitor
  activity_level: ActivityLevel | null;
  has_hypertension: boolean | null;
  has_dyslipidemia: boolean | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;

  // ── Doctor Info ────────────────────────────────────────────
  specialization: string | null;
  medical_license: string | null;
  hospital_name: string | null;
  experience_years: number | null;
  bio: string | null;
  work_lat: number | null;
  work_lng: number | null;

  // ── Meta ───────────────────────────────────────────────────
  profile_complete: boolean;
  created_at: string;
  updated_at: string | null;
}

// ── Algerian Wilayas ───────────────────────────────────────────────────────────
export const WILAYAS = [
  '01 - Adrar', '02 - Chlef', '03 - Laghouat', '04 - Oum El Bouaghi', '05 - Batna', '06 - Béjaïa', '07 - Biskra',
  '08 - Béchar', '09 - Blida', '10 - Bouira', '11 - Tamanrasset', '12 - Tébessa', '13 - Tlemcen', '14 - Tiaret',
  '15 - Tizi Ouzou', '16 - Alger', '17 - Djelfa', '18 - Jijel', '19 - Sétif', '20 - Saïda', '21 - Skikda',
  '22 - Sidi Bel Abbès', '23 - Annaba', '24 - Guelma', '25 - Constantine', '26 - Médéa', '27 - Mostaganem',
  '28 - M\'Sila', '29 - Mascara', '30 - Ouargla', '31 - Oran', '32 - El Bayadh', '33 - Illizi', '34 - Bordj Bou Arréridj',
  '35 - Boumerdès', '36 - El Tarf', '37 - Tindouf', '38 - Tissemsilt', '39 - El Oued', '40 - Khenchela',
  '41 - Souk Ahras', '42 - Tipaza', '43 - Mila', '44 - Aïn Defla', '45 - Naâma', '46 - Aïn Témouchent',
  '47 - Ghardaïa', '48 - Relizane', '49 - Timimoun', '50 - Bordj Badji Mokhtar', '51 - Ouled Djellal',
  '52 - Béni Abbès', '53 - In Salah', '54 - In Guezzam', '55 - Touggourt', '56 - Djanet',
  '57 - El M\'Ghair', '58 - El Meniaa',
];