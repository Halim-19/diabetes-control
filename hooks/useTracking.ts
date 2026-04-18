import { supabase } from '@/utils/supabase';
import { useCallback, useState } from 'react';
import {
  ActivityLog,
  GlucoseEntry,
  NutritionLog,
  WellbeingLog,
} from '@/types/tracking';

// ─── Glucose (stored in measurements table as type='glucose') ────────────────

export function useGlucoseLogs(patientId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const fetchPeriod = useCallback(async (period: 'today' | 'week' | 'month' | '3months' = 'today') => {
    if (!patientId) return;
    setLoading(true);
    let fromStr = '';
    const now = new Date();
    if (period === 'today') {
      fromStr = `${now.toISOString().split('T')[0]}T00:00:00`;
    } else {
      const d = new Date();
      if (period === 'week') d.setDate(d.getDate() - 7);
      else if (period === 'month') d.setDate(d.getDate() - 30);
      else if (period === '3months') d.setDate(d.getDate() - 90);
      fromStr = `${d.toISOString().split('T')[0]}T00:00:00`;
    }
    const { data } = await supabase
      .from('measurements')
      .select('*')
      .eq('patient_id', patientId)
      .eq('type', 'glucose')
      .gte('recorded_at', fromStr)
      .order('recorded_at', { ascending: false });
    setLogs(data ?? []);
    setLoading(false);
  }, [patientId]);

  const fetchToday = useCallback(async () => fetchPeriod('today'), [fetchPeriod]);

  const fetchRange = useCallback(async (from: string, to: string) => {
    if (!patientId) return [];
    const { data } = await supabase
      .from('measurements')
      .select('*')
      .eq('patient_id', patientId)
      .eq('type', 'glucose')
      .gte('recorded_at', from)
      .lte('recorded_at', to)
      .order('recorded_at', { ascending: false });
    return data ?? [];
  }, [patientId]);

  const save = useCallback(async (entry: GlucoseEntry): Promise<{ error: string | null }> => {
    if (!patientId) return { error: 'Not authenticated' };
    const { error } = await supabase.from('measurements').insert({
      patient_id: patientId,
      type: 'glucose',
      value: JSON.stringify(entry),
      unit: entry.unit,
      recorded_at: new Date().toISOString(),
      note: entry.notes ?? null,
    });
    if (!error) await fetchToday();
    return { error: error?.message ?? null };
  }, [patientId, fetchToday]);

  const remove = useCallback(async (id: string) => {
    await supabase.from('measurements').delete().eq('id', id);
    await fetchToday();
  }, [fetchToday]);

  return { logs, loading, fetchToday, fetchPeriod, fetchRange, save, remove };
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

export function useNutritionLogs(patientId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<NutritionLog[]>([]);

  const fetchPeriod = useCallback(async (period: 'today' | 'week' | 'month' | '3months' = 'today') => {
    if (!patientId) return;
    setLoading(true);
    let fromStr = '';
    const now = new Date();
    if (period === 'today') {
      fromStr = `${now.toISOString().split('T')[0]}T00:00:00`;
    } else {
      const d = new Date();
      if (period === 'week') d.setDate(d.getDate() - 7);
      else if (period === 'month') d.setDate(d.getDate() - 30);
      else if (period === '3months') d.setDate(d.getDate() - 90);
      fromStr = `${d.toISOString().split('T')[0]}T00:00:00`;
    }
    const { data } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('patient_id', patientId)
      .gte('logged_at', fromStr)
      .order('logged_at', { ascending: false });
    setLogs((data ?? []) as NutritionLog[]);
    setLoading(false);
  }, [patientId]);

  const fetchToday = useCallback(async () => fetchPeriod('today'), [fetchPeriod]);

  const fetchRange = useCallback(async (from: string, to: string) => {
    if (!patientId) return [];
    const { data } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('patient_id', patientId)
      .gte('logged_at', from)
      .lte('logged_at', to)
      .order('logged_at', { ascending: false });
    return (data ?? []) as NutritionLog[];
  }, [patientId]);

  const save = useCallback(async (entry: NutritionLog): Promise<{ error: string | null }> => {
    if (!patientId) return { error: 'Not authenticated' };
    const { error } = await supabase.from('nutrition_logs').insert({
      patient_id: patientId,
      meal_type: entry.meal_type,
      carb_level: entry.carb_level,
      description: entry.description || null,
      carb_grams: entry.carb_grams,
      water_glasses: entry.water_glasses,
      logged_at: new Date().toISOString(),
    });
    if (!error) await fetchToday();
    return { error: error?.message ?? null };
  }, [patientId, fetchToday]);

  const remove = useCallback(async (id: string) => {
    await supabase.from('nutrition_logs').delete().eq('id', id);
    await fetchToday();
  }, [fetchToday]);

  return { logs, loading, fetchToday, fetchPeriod, fetchRange, save, remove };
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export function useActivityLogs(patientId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const fetchPeriod = useCallback(async (period: 'today' | 'week' | 'month' | '3months' = 'today') => {
    if (!patientId) return;
    setLoading(true);
    let fromStr = '';
    const now = new Date();
    if (period === 'today') {
      fromStr = `${now.toISOString().split('T')[0]}T00:00:00`;
    } else {
      const d = new Date();
      if (period === 'week') d.setDate(d.getDate() - 7);
      else if (period === 'month') d.setDate(d.getDate() - 30);
      else if (period === '3months') d.setDate(d.getDate() - 90);
      fromStr = `${d.toISOString().split('T')[0]}T00:00:00`;
    }
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('patient_id', patientId)
      .gte('logged_at', fromStr)
      .order('logged_at', { ascending: false });
    setLogs((data ?? []) as ActivityLog[]);
    setLoading(false);
  }, [patientId]);

  const fetchToday = useCallback(async () => fetchPeriod('today'), [fetchPeriod]);

  const fetchRange = useCallback(async (from: string, to: string) => {
    if (!patientId) return [];
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('patient_id', patientId)
      .gte('logged_at', from)
      .lte('logged_at', to)
      .order('logged_at', { ascending: false });
    return (data ?? []) as ActivityLog[];
  }, [patientId]);

  const save = useCallback(async (entry: ActivityLog): Promise<{ error: string | null }> => {
    if (!patientId) return { error: 'Not authenticated' };
    const { error } = await supabase.from('activity_logs').insert({
      patient_id: patientId,
      activity_type: entry.activity_type,
      duration_min: entry.duration_min,
      intensity: entry.intensity,
      calories_burned: entry.calories_burned,
      notes: entry.notes || null,
      logged_at: new Date().toISOString(),
    });
    if (!error) await fetchToday();
    return { error: error?.message ?? null };
  }, [patientId, fetchToday]);

  const remove = useCallback(async (id: string) => {
    await supabase.from('activity_logs').delete().eq('id', id);
    await fetchToday();
  }, [fetchToday]);

  return { logs, loading, fetchToday, fetchPeriod, fetchRange, save, remove };
}

// ─── Wellbeing ────────────────────────────────────────────────────────────────

export function useWellbeingLogs(patientId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<WellbeingLog[]>([]);

  const fetchPeriod = useCallback(async (period: 'today' | 'week' | 'month' | '3months' = 'today') => {
    if (!patientId) return;
    setLoading(true);
    let fromStr = '';
    const now = new Date();
    if (period === 'today') {
      fromStr = `${now.toISOString().split('T')[0]}T00:00:00`;
    } else {
      const d = new Date();
      if (period === 'week') d.setDate(d.getDate() - 7);
      else if (period === 'month') d.setDate(d.getDate() - 30);
      else if (period === '3months') d.setDate(d.getDate() - 90);
      fromStr = `${d.toISOString().split('T')[0]}T00:00:00`;
    }
    const { data } = await supabase
      .from('wellbeing_logs')
      .select('*')
      .eq('patient_id', patientId)
      .gte('logged_at', fromStr)
      .order('logged_at', { ascending: false });
    setLogs((data ?? []) as WellbeingLog[]);
    setLoading(false);
  }, [patientId]);

  const fetchToday = useCallback(async () => fetchPeriod('today'), [fetchPeriod]);

  const fetchRange = useCallback(async (from: string, to: string) => {
    if (!patientId) return [];
    const { data } = await supabase
      .from('wellbeing_logs')
      .select('*')
      .eq('patient_id', patientId)
      .gte('logged_at', from)
      .lte('logged_at', to)
      .order('logged_at', { ascending: false });
    return (data ?? []) as WellbeingLog[];
  }, [patientId]);

  const save = useCallback(async (entry: WellbeingLog): Promise<{ error: string | null }> => {
    if (!patientId) return { error: 'Not authenticated' };
    const { error } = await supabase.from('wellbeing_logs').insert({
      patient_id: patientId,
      symptoms: entry.symptoms,
      mood: entry.mood,
      sleep_hours: entry.sleep_hours,
      sleep_quality: entry.sleep_quality,
      stress_level: entry.stress_level,
      notes: entry.notes || null,
      logged_at: new Date().toISOString(),
    });
    if (!error) await fetchToday();
    return { error: error?.message ?? null };
  }, [patientId, fetchToday]);

  const remove = useCallback(async (id: string) => {
    await supabase.from('wellbeing_logs').delete().eq('id', id);
    await fetchToday();
  }, [fetchToday]);

  return { logs, loading, fetchToday, fetchPeriod, fetchRange, save, remove };
}
