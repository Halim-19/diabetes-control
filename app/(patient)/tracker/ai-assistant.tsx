import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useActivityLogs, useGlucoseLogs, useNutritionLogs, useWellbeingLogs } from '@/hooks/useTracking';
import { Ionicons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';


// Initialize Gemini SDK
// Ensure EXPO_PUBLIC_GEMINI_API_KEY is defined in .env.local
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export default function AIAssistantScreen() {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const markdownStyles = useMemo(() => createMarkdownStyles(theme), [theme]);
    const { t, i18n } = useTranslation();
    const { period } = useLocalSearchParams<{ period: 'today' | 'week' | 'month' }>();
    const router = useRouter();
    const { session, profile } = useAuth();

    const patientId = session?.user?.id;

    const glucoseHook = useGlucoseLogs(patientId);
    const nutritionHook = useNutritionLogs(patientId);
    const activityHook = useActivityLogs(patientId);
    const wellbeingHook = useWellbeingLogs(patientId);

    const [loadingData, setLoadingData] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [insights, setInsights] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoadingData(true);
            await Promise.all([
                glucoseHook.fetchPeriod(period || 'today'),
                nutritionHook.fetchPeriod(period || 'today'),
                activityHook.fetchPeriod(period || 'today'),
                wellbeingHook.fetchPeriod(period || 'today'),
            ]);
            setLoadingData(false);
        };
        load();
    }, [period]);

    useEffect(() => {
        if (!loadingData && !insights && !generating && patientId) {
            generateInsights();
        }
    }, [loadingData]);

    const generateInsights = async () => {
        if (!API_KEY) {
            Alert.alert(t('common.error'), "Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env.local file.");
            setInsights(`⚠️ **${t('common.error')}**\n\nThe app cannot connect to the AI without a valid \`EXPO_PUBLIC_GEMINI_API_KEY\` in your environment variables.`);
            return;
        }


        try {
            setGenerating(true);
            const genAI = new GoogleGenerativeAI(API_KEY);
            // Upgrading to gemini-2.5-flash since 1.5 versions are deprecated
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            // Build formatting strings
            const gLogs = glucoseHook.logs.map(l => {
                try { const v = JSON.parse(l.value); return `${new Date(l.recorded_at).toLocaleDateString()} - ${v.glucose_value} ${v.unit} (${v.timing})`; } catch { return ''; }
            }).join('\n');
            const nLogs = nutritionHook.logs.map((l: any) => `${new Date(l.logged_at).toLocaleDateString()} - ${l.meal_type} (${l.carb_level}, ${l.carb_grams}g carbs)`).join('\n');
            const aLogs = activityHook.logs.map((l: any) => `${new Date(l.logged_at).toLocaleDateString()} - ${l.activity_type} for ${l.duration_min} min`).join('\n');
            const wLogs = wellbeingHook.logs.map((l: any) => `${new Date(l.logged_at).toLocaleDateString()} - Mood: ${l.mood}, Sleep: ${l.sleep_hours}h`).join('\n');

            const prompt = `
You are an expert AI health assistant for a patient managing diabetes. Analyze the following tracked data for the period: ${period}.

Patient Target Profile:
- Glucose Target: ${profile?.target_glucose_min} to ${profile?.target_glucose_max} mg/dL
- Weight: ${profile?.weight_kg} kg

Blood Glucose Logs:
${gLogs || "None"}

Nutrition Logs (Carbs):
${nLogs || "None"}

Activity Logs:
${aLogs || "None"}

Wellbeing (Mood/Sleep):
${wLogs || "None"}

Please provide a concise, actionable, and encouraging health report. 
Use Markdown to format your response (use bolding, bullet points, and emojis). 
Only give medical insights based strictly on the provided data. Do not make up any data.
Keep it strictly under 300 words. Address the patient directly and be supportive.

IMPORTANT: Generate the response entirely in this language code: ${i18n.language || 'en'} (e.g. 'en' for English, 'fr' for French, 'ar' for Arabic).
`;

            const result = await model.generateContent(prompt);
            setInsights(result.response.text());
        } catch (error: any) {
            console.error("AI Error:", error);
            setInsights(`❌ **${t('common.error')}**\n\nEnsure your device has an active internet connection and that your API key is valid.`);
        } finally {

            setGenerating(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Pressable onPress={() => router.replace('/(patient)/tracker')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={styles.headerTitle}>{t('patient.feed.tabs.ai_consult')}</Text>
                <View style={{ width: 24 }} />
            </View>


            <ScrollView contentContainerStyle={styles.scroll}>
                {(loadingData || generating) ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={styles.loadingText}>
                            {loadingData ? t('common.search') : t('patient.feed.ai_consult.analyzing')}
                        </Text>
                    </View>

                ) : (
                    <View style={styles.card}>
                        <Markdown style={markdownStyles}>
                            {insights}
                        </Markdown>

                        <Pressable style={styles.refreshBtn} onPress={generateInsights}>
                            <Ionicons name="refresh" size={18} color="#fff" />
                            <Text style={styles.refreshBtnText}>{t('common.done')}</Text>
                        </Pressable>

                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const createMarkdownStyles = (theme: any): any => ({
    body: { fontSize: 16, color: theme.secondary, lineHeight: 24 },
    heading1: { fontSize: 22, fontWeight: '700', color: theme.text, marginTop: 16, marginBottom: 8 },
    heading2: { fontSize: 18, fontWeight: '700', color: theme.text, marginTop: 16, marginBottom: 8 },
    strong: { color: theme.text, fontWeight: '700' },
    bullet_list: { marginTop: 10, marginBottom: 10 },
    list_item: { marginBottom: 6 },
});

const createStyles = (theme: any) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
    scroll: { padding: 20, flexGrow: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    loadingText: { marginTop: 16, fontSize: 15, color: theme.textMuted, fontWeight: '500' },
    card: { backgroundColor: theme.card, padding: 20, borderRadius: 16, shadowColor: theme.textMuted, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 12, marginTop: 24, gap: 8 },
    refreshBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
