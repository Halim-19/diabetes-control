import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
    useActivityLogs,
    useGlucoseLogs,
    useNutritionLogs,
    useWellbeingLogs,
} from "@/hooks/useTracking";
import {
    CARB_LEVELS,
    getGlucoseStatus,
    GLUCOSE_TIMINGS,
    GlucoseEntry,
    INTENSITY_OPTIONS,
    MEAL_TYPES,
    MOOD_OPTIONS,
} from "@/types/tracking";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Dimensions,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
    Circle,
    Defs,
    LinearGradient,
    Path,
    Rect,
    Stop,
} from "react-native-svg";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const getColors = (theme: any) => ({
    bg: theme.background,
    surface: theme.card,
    border: theme.border,
    text: theme.text,
    sub: theme.secondary,
    muted: theme.textMuted,
    blue: theme.primary,
    blueBg: theme.primary + "1a",
    green: theme.success,
    greenBg: theme.success + "1a",
    amber: "#b45309",
    amberBg: "#fffbeb",
    red: theme.danger,
    redBg: theme.danger + "1a",
    violet: "#7c3aed",
    violetBg: "#f5f3ff",
});

const SW = Dimensions.get("window").width;

// ─── Shared: SVG line chart ───────────────────────────────────────────────────

interface LinePoint {
    value: number;
    label: string;
    color: string;
}

function LineChart({
    points,
    width,
    height = 120,
    yMin,
    yMax,
    gradientColor,
    targetMin,
    targetMax,
}: {
    points: LinePoint[];
    width: number;
    height?: number;
    yMin: number;
    yMax: number;
    gradientColor: string;
    targetMin?: number;
    targetMax?: number;
}) {
    const { theme, isDark } = useTheme();
    const C = useMemo(() => getColors(theme), [theme]);
    const { t } = useTranslation();

    if (points.length < 2)
        return (
            <View style={{ height, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: C.muted, fontSize: 12 }}>
                    {t("common.no_data")}
                </Text>
            </View>
        );

    const PAD = { t: 10, b: 24, l: 4, r: 4 };
    const W = width - PAD.l - PAD.r;
    const H = height - PAD.t - PAD.b;
    const range = yMax - yMin || 1;

    const px = (i: number) => PAD.l + (i / (points.length - 1)) * W;
    const py = (v: number) => PAD.t + (1 - (v - yMin) / range) * H;

    let d = "";
    points.forEach((p, i) => {
        const x = px(i),
            y = py(p.value);
        if (i === 0) {
            d += `M${x} ${y}`;
            return;
        }
        const px0 = px(i - 1),
            py0 = py(points[i - 1].value);
        const cpx = (px0 + x) / 2;
        d += ` C${cpx} ${py0} ${cpx} ${y} ${x} ${y}`;
    });

    const last = points[points.length - 1];
    const fillD = `${d} L${px(points.length - 1)} ${PAD.t + H} L${px(0)} ${PAD.t + H} Z`;

    const tMinY = targetMin !== undefined ? py(targetMin) : undefined;
    const tMaxY = targetMax !== undefined ? py(targetMax) : undefined;

    return (
        <Svg width={width} height={height}>
            <Defs>
                <LinearGradient
                    id={`g${gradientColor.replace("#", "")}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <Stop offset="0" stopColor={gradientColor} stopOpacity="0.15" />
                    <Stop offset="1" stopColor={gradientColor} stopOpacity="0.01" />
                </LinearGradient>
            </Defs>

            {/* Target band */}
            {tMinY !== undefined && tMaxY !== undefined && (
                <Rect
                    x={PAD.l}
                    y={tMaxY}
                    width={W}
                    height={tMinY - tMaxY}
                    fill={C.green}
                    opacity={0.07}
                />
            )}

            {/* Fill */}
            <Path d={fillD} fill={`url(#g${gradientColor.replace("#", "")})`} />

            {/* Line */}
            <Path
                d={d}
                stroke={gradientColor}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Dots */}
            {points.map((p, i) => (
                <Circle
                    key={i}
                    cx={px(i)}
                    cy={py(p.value)}
                    r={3.5}
                    fill={isDark ? theme.card : "#fff"}
                    stroke={p.color}
                    strokeWidth={2}
                />
            ))}

            {/* X labels */}
            {points.map((p, i) => (
                <Svg key={i} x={px(i) - 16} y={PAD.t + H + 4} width={32} height={16}>
                    <Path d="" />
                    {/* label drawn via foreignObject not available — use absolute text below */}
                </Svg>
            ))}
        </Svg>
    );
}

// X-axis labels rendered as RN Text (overlay)
function XLabels({
    points,
    width,
    height = 120,
}: {
    points: LinePoint[];
    width: number;
    height?: number;
}) {
    const { theme } = useTheme();
    const C = useMemo(() => getColors(theme), [theme]);
    if (points.length < 2) null;
    const PAD = { t: 10, b: 24, l: 4, r: 4 };
    const W = width - PAD.l - PAD.r;
    const px = (i: number) => PAD.l + (i / (points.length - 1)) * W;
    return (
        <View
            style={{
                position: "absolute",
                bottom: 2,
                left: 0,
                right: 0,
                flexDirection: "row",
            }}
        >
            {points.map((p, i) => (
                <Text
                    key={i}
                    style={{
                        position: "absolute",
                        left: px(i) - 16,
                        width: 32,
                        textAlign: "center",
                        fontSize: 9,
                        color: C.muted,
                    }}
                >
                    {p.label}
                </Text>
            ))}
        </View>
    );
}

// ─── Bar chart (nutrition carbs / activity minutes) ───────────────────────────

interface BarPoint {
    value: number;
    label: string;
    color: string;
    maxValue: number;
}

function BarChart({
    points,
    width,
    height = 100,
}: {
    points: BarPoint[];
    width: number;
    height?: number;
}) {
    const { theme } = useTheme();
    const C = useMemo(() => getColors(theme), [theme]);
    const { t } = useTranslation();
    if (points.length === 0)
        return (
            <View style={{ height, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: C.muted, fontSize: 12 }}>
                    {t("common.no_data")}
                </Text>
            </View>
        );

    const barW = Math.min(28, width / points.length - 8);
    const actualMax = Math.max(...points.map((p) => Number(p.value) || 0));
    const maxVal = Math.max(...points.map((p) => p.maxValue), actualMax, 1);

    return (
        <View
            style={{
                height,
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 6,
                paddingBottom: 20,
            }}
        >
            {points.map((p, i) => {
                const barH = Math.max(3, (p.value / maxVal) * (height - 28));
                return (
                    <View key={i} style={{ alignItems: "center", flex: 1 }}>
                        <Text
                            style={{
                                fontSize: 9,
                                color: C.sub,
                                marginBottom: 2,
                                fontWeight: "600",
                            }}
                        >
                            {p.value || ""}
                        </Text>
                        <View
                            style={{
                                width: barW,
                                height: barH,
                                borderRadius: 4,
                                backgroundColor: p.color + "20",
                                justifyContent: "flex-end",
                                overflow: "hidden",
                            }}
                        >
                            <View
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: 4,
                                    backgroundColor: p.color,
                                }}
                            />
                        </View>
                        <Text style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
                            {p.label}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

// ─── Metric card shell ────────────────────────────────────────────────────────

function MetricCard({
    title,
    value,
    unit,
    subtitle,
    accentColor,
    accentBg,
    onLog,
    children,
}: {
    title: string;
    value: string | number;
    unit?: string;
    subtitle?: string;
    accentColor: string;
    accentBg: string;
    onLog: () => void;
    children?: React.ReactNode;
}) {
    const { theme } = useTheme();
    const C = useMemo(() => getColors(theme), [theme]);
    const styles = useMemo(() => createStyles(C), [C]);
    const { t } = useTranslation();
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <View style={styles.cardValueRow}>
                        <Text style={[styles.cardValue, { color: accentColor }]}>
                            {value}
                        </Text>
                        {unit && <Text style={styles.cardUnit}>{unit}</Text>}
                    </View>
                    {subtitle ? <Text style={styles.cardSub}>{subtitle}</Text> : null}
                </View>
                <Pressable
                    style={[
                        styles.logBtn,
                        { backgroundColor: accentBg, borderColor: accentColor + "40" },
                    ]}
                    onPress={onLog}
                >
                    <Text style={[styles.logBtnText, { color: accentColor }]}>
                        + {t("patient.tracker.log")}
                    </Text>
                </Pressable>
            </View>
            {children}
        </View>
    );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function LogScreen() {
    const { theme } = useTheme();
    const C = useMemo(() => getColors(theme), [theme]);
    const styles = useMemo(() => createStyles(C), [C]);
    const { t } = useTranslation();
    const { session, profile } = useAuth();

    const patientId = session?.user?.id;
    const router = useRouter();

    const glucoseHook = useGlucoseLogs(patientId);
    const nutritionHook = useNutritionLogs(patientId);
    const activityHook = useActivityLogs(patientId);
    const wellbeingHook = useWellbeingLogs(patientId);

    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState<"today" | "week" | "month" | "3months">("today");

    const loadAll = async (p = period) => {
        await Promise.all([
            glucoseHook.fetchPeriod(p),
            nutritionHook.fetchPeriod(p),
            activityHook.fetchPeriod(p),
            wellbeingHook.fetchPeriod(p),
        ]);
    };

    useEffect(() => {
        loadAll(period);
    }, [period]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAll(period);
        setRefreshing(false);
    };

    const handleExport = async () => {
        try {
            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: -apple-system, sans-serif; padding: 20px; color: #333; }
                        h1 { color: #2563eb; }
                        h2 { border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 30px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
                        th { background: #f8fafc; }
                    </style>
                </head>
                <body>
                    <h1>${t("patient.tracker.pdf_title")}</h1>
                    <p>${t("settings.language")}: ${period === "today"
                    ? t("periods.today")
                    : period === "week"
                        ? t("periods.week")
                        : period === "month"
                            ? t("periods.month")
                            : t("periods.three_months")
                }</p>
                    <p>${t("common.success")}: ${new Date().toLocaleDateString()}</p>
                    
                    <h2>🩸 ${t("patient.tracker.rings.glucose")}</h2>
                    <table>
                        <tr><th>${t("periods.today")}</th><th>${t("patient.tracker.pdf.value")}</th><th>${t("patient.tracker.pdf.unit")}</th><th>${t("patient.tracker.pdf.timing_col")}</th></tr>
                        ${glucoseHook.logs
                    .map((row) => {
                        try {
                            const e = JSON.parse(row.value) as GlucoseEntry;
                            return `<tr><td>${new Date(row.recorded_at).toLocaleString()}</td><td>${e.glucose_value}</td><td>${e.unit}</td><td>${e.timing.replace(/_/g, " ")}</td></tr>`;
                        } catch {
                            return "";
                        }
                    })
                    .join("")}
                    </table>

                    <h2>🥗 ${t("patient.tracker.rings.nutrition")}</h2>
                    <table>
                        <tr><th>${t("periods.today")}</th><th>${t("patient.tracker.pdf.meal_type")}</th><th>${t("patient.tracker.pdf.carbs")}</th></tr>
                        ${nutritionHook.logs.map((row: any) => `<tr><td>${new Date(row.logged_at).toLocaleString()}</td><td>${row.meal_type || "N/A"}</td><td>${row.carb_level || ""} (${row.carb_grams || 0}g)</td></tr>`).join("")}
                    </table>

                    <h2>🏃‍♂️ ${t("patient.tracker.rings.activity")}</h2>
                    <table>
                        <tr><th>${t("periods.today")}</th><th>${t("patient.tracker.pdf.activity_col")}</th><th>${t("patient.tracker.pdf.duration")}</th><th>${t("patient.tracker.pdf.intensity")}</th></tr>
                        ${activityHook.logs.map((row: any) => `<tr><td>${new Date(row.logged_at).toLocaleString()}</td><td>${row.activity_type}</td><td>${row.duration_min} min</td><td>${row.intensity}</td></tr>`).join("")}
                    </table>

                     <h2>🧠 ${t("patient.tracker.rings.wellbeing")}</h2>
                    <table>
                        <tr><th>${t("periods.today")}</th><th>${t("patient.tracker.pdf.mood_col")}</th><th>${t("patient.tracker.pdf.sleep_col")}</th></tr>
                        ${wellbeingHook.logs.map((row: any) => `<tr><td>${new Date(row.logged_at).toLocaleString()}</td><td>${row.mood || "N/A"}</td><td>${row.sleep_hours || 0} hrs</td></tr>`).join("")}
                    </table>
                </body>

                </html>
            `;
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, {
                UTI: ".pdf",
                mimeType: "application/pdf",
            });
        } catch (error) {
            console.error("Export Error:", error);
            Alert.alert(t("common.error"), t("common.error")); // Failed to generate PDF
        }
    };

    const tMin = profile?.target_glucose_min ?? 80;
    const tMax = profile?.target_glucose_max ?? 180;

    // ── Glucose chart points ──────────────────────────────────────────────────
    const glucosePoints: LinePoint[] = useMemo(() => {
        const raw = glucoseHook.logs.slice().reverse();
        if (period === "today") {
            return raw.map((row) => {
                const entry = (() => {
                    try { return JSON.parse(row.value) as GlucoseEntry; } catch { return null; }
                })();
                if (!entry) return null;
                const st = getGlucoseStatus(entry.glucose_value, entry.unit, tMin, tMax);
                const time = new Date(row.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return { value: entry.glucose_value, label: time, color: st.color };
            }).filter(Boolean) as LinePoint[];
        }

        // Aggregate by day
        const groups: Record<string, number[]> = {};
        raw.forEach(row => {
            const date = new Date(row.recorded_at).toLocaleDateString([], { day: 'numeric', month: 'short' });
            const entry = (() => {
                try { return JSON.parse(row.value) as GlucoseEntry; } catch { return null; }
            })();
            if (entry) {
                if (!groups[date]) groups[date] = [];
                groups[date].push(entry.glucose_value);
            }
        });

        return Object.entries(groups).map(([date, vals]) => {
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            // Unit is assumed consistent for a single patient
            const firstEntry = JSON.parse(raw[0].value);
            const st = getGlucoseStatus(avg, firstEntry.unit, tMin, tMax);
            return { value: Math.round(avg), label: date, color: st.color };
        });
    }, [glucoseHook.logs, period, tMin, tMax]);

    const lastGlucose = glucoseHook.logs[0]
        ? (() => {
            try {
                return JSON.parse(glucoseHook.logs[0].value) as GlucoseEntry;
            } catch {
                return null;
            }
        })()
        : null;
    const lastStatus = lastGlucose
        ? getGlucoseStatus(lastGlucose.glucose_value, lastGlucose.unit, tMin, tMax)
        : null;

    // ── Nutrition chart points ─────────────────────────────────────────────────
    const CARB_ORDER = ["none", "low", "medium", "high"];
    const carbColorMap: Record<string, string> = {
        none: "#94a3b8",
        low: C.green,
        medium: C.amber,
        high: C.red,
    };
    const nutritionPoints: BarPoint[] = useMemo(() => {
        const raw = nutritionHook.logs.slice().reverse();
        if (period === "today") {
            return raw.map((row: any) => {
                const level = CARB_ORDER.indexOf(row.carb_level);
                return {
                    value: row.carb_grams ?? level,
                    label: new Date(row.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    color: carbColorMap[row.carb_level] ?? C.amber,
                    maxValue: 150,
                };
            });
        }

        // Aggregate by day
        const groups: Record<string, number> = {};
        raw.forEach(row => {
            if (!row.logged_at) return; // Fix: Only process if the date exists
            const date = new Date(row.logged_at).toLocaleDateString([], { day: 'numeric', month: 'short' });
            groups[date] = (groups[date] || 0) + (row.carb_grams || 0);
        });

        return Object.entries(groups).map(([date, total]) => ({
            value: total,
            label: date,
            color: C.green,
            maxValue: 250,
        }));
    }, [nutritionHook.logs, period, C.green, C.amber, C.red]);

    const totalWater = nutritionHook.logs.reduce(
        (s: number, l: any) => s + (l.water_glasses || 0),
        0,
    );

    // ── Activity chart points ──────────────────────────────────────────────────
    const intensityColor: Record<string, string> = {
        light: C.blue,
        moderate: C.green,
        intense: C.red,
    };
    const activityPoints: BarPoint[] = useMemo(() => {
        const raw = activityHook.logs.slice().reverse();
        if (period === "today") {
            return raw.map((row: any) => ({
                value: row.duration_min,
                label: row.activity_type?.slice(0, 3) ?? "—",
                color: intensityColor[row.intensity] ?? C.blue,
                maxValue: 90,
            }));
        }

        // Aggregate by day
        const groups: Record<string, number> = {};
        raw.forEach(row => {
            if (!row.logged_at) return;
            const date = new Date(row.logged_at).toLocaleDateString([], { day: 'numeric', month: 'short' });
            groups[date] = (groups[date] || 0) + row.duration_min;
        });

        return Object.entries(groups).map(([date, total]) => ({
            value: total,
            label: date,
            color: C.blue,
            maxValue: 120,
        }));
    }, [activityHook.logs, period, C.blue, C.green, C.red]);
    const totalMins = activityHook.logs.reduce(
        (s: number, l: any) => s + (l.duration_min || 0),
        0,
    );

    // ── Wellbeing mood dots ────────────────────────────────────────────────────
    const moodScore: Record<string, number> = {
        great: 5, good: 4, neutral: 3, tired: 2, stressed: 2, anxious: 1,
    };
    const moodColor: Record<string, string> = {
        great: C.green, good: C.blue, neutral: C.amber, tired: C.amber, stressed: C.red, anxious: C.red,
    };
    const wellbeingPoints: LinePoint[] = useMemo(() => {
        const raw = wellbeingHook.logs.slice().reverse();
        if (period === "today") {
            return raw.map((row: any) => ({
                value: moodScore[row.mood] ?? 3,
                label: new Date(row.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                color: moodColor[row.mood] ?? C.muted,
            }));
        }

        // Aggregate by day
        const groups: Record<string, number[]> = {};
        raw.forEach(row => {
            if (!row.logged_at) return; // Fix: Only process if the date exists
            const date = new Date(row.logged_at).toLocaleDateString([], { day: 'numeric', month: 'short' });
            if (row.mood) {
                if (!groups[date]) groups[date] = [];
                groups[date].push(moodScore[row.mood] ?? 3);
            }
        });

        return Object.entries(groups).map(([date, scores]) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            const mood = Object.keys(moodScore).find(k => moodScore[k] === Math.round(avg)) || 'neutral';
            return { value: avg, label: date, color: moodColor[mood] ?? C.muted };
        });
    }, [wellbeingHook.logs, period, C.green, C.blue, C.amber, C.red, C.muted]);
    const lastMood = wellbeingHook.logs[0]
        ? MOOD_OPTIONS.find((m) => m.value === wellbeingHook.logs[0].mood)
        : null;

    const chartW = SW - 64;

    if (!patientId) return null;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>
                        {period === "today"
                            ? t("periods.today")
                            : period === "week"
                                ? t("periods.week")
                                : period === "month"
                                    ? t("periods.month")
                                    : t("periods.three_months")}
                    </Text>

                    <Text style={styles.headerDate}>
                        {new Date().toLocaleDateString(
                            t("common.locale", { defaultValue: "en-GB" }),
                            { weekday: "long", day: "numeric", month: "long" },
                        )}
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <Pressable
                        onPress={() => router.push("/(patient)/emergency")}
                        style={[
                            styles.exportBtn,
                            { backgroundColor: C.redBg, borderColor: C.red + "40" },
                        ]}
                    >
                        <Ionicons name="warning" size={20} color={C.red} />
                        <Text style={[styles.exportBtnText, { color: C.red }]}>
                            {/* {t("patient.sos.title")} */} SOS
                        </Text>
                    </Pressable>
                    <Pressable onPress={handleExport} style={styles.exportBtn}>
                        <Ionicons name="document-text-outline" size={20} color={C.blue} />
                        <Text style={styles.exportBtnText}>
                            {t("patient.tracker.export")}
                        </Text>
                    </Pressable>
                </View>
            </View>

            <View style={styles.filterRow}>
                {(["today", "week", "month", "3months"] as const).map((p) => (
                    <Pressable
                        key={p}
                        style={[styles.filterBtn, period === p && styles.filterBtnActive]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text
                            style={[
                                styles.filterBtnText,
                                period === p && styles.filterBtnTextActive,
                            ]}
                        >
                            {p === "today"
                                ? t("periods.today")
                                : p === "week"
                                    ? t("periods.week_short")
                                    : p === "month"
                                        ? t("periods.month_short")
                                        : t("periods.three_months_short")}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={C.blue}
                    />
                }
            >
                {/* ── Glucose ── */}
                <MetricCard
                    title={t("patient.tracker.rings.glucose") + " 🩸"}
                    value={lastGlucose ? lastGlucose.glucose_value : "—"}
                    unit={lastGlucose?.unit ?? t("patient.tracker.units.glucose")}
                    subtitle={
                        lastStatus
                            ? lastStatus.label
                            : t("patient.tracker.placeholders.no_readings")
                    }
                    accentColor={lastStatus?.color ?? C.blue}
                    accentBg={lastStatus?.bg ?? C.blueBg}
                    onLog={() => router.push("/tracker/log-glucose")}
                >
                    {glucosePoints.length >= 2 ? (
                        <View style={styles.chartWrap}>
                            <LineChart
                                points={glucosePoints}
                                width={chartW}
                                height={120}
                                yMin={Math.min(...glucosePoints.map((p) => p.value)) - 20}
                                yMax={Math.max(...glucosePoints.map((p) => p.value)) + 20}
                                gradientColor={lastStatus?.color ?? C.blue}
                                targetMin={tMin}
                                targetMax={tMax}
                            />
                            <XLabels points={glucosePoints} width={chartW} height={120} />
                        </View>
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyText}>
                                {t("patient.tracker.charts.glucose_empty")}
                            </Text>
                        </View>
                    )}

                    {glucoseHook.logs.length > 0 && (
                        <View style={styles.entryList}>
                            {glucoseHook.logs.slice(0, 3).map((row) => {
                                const e = (() => {
                                    try {
                                        return JSON.parse(row.value) as GlucoseEntry;
                                    } catch {
                                        return null;
                                    }
                                })();
                                if (!e) return null;
                                const st = getGlucoseStatus(
                                    e.glucose_value,
                                    e.unit,
                                    tMin,
                                    tMax,
                                );
                                const timingObj = GLUCOSE_TIMINGS.find(
                                    (t: any) => t.value === e.timing,
                                );
                                const timingStr = timingObj
                                    ? `${timingObj.emoji} ${t(`patient.tracker.timing.${e.timing}`, timingObj.label)}`
                                    : e.timing.replace(/_/g, " ");
                                return (
                                    <View key={row.id} style={styles.entryRow}>
                                        <View
                                            style={[styles.entryDot, { backgroundColor: st.color }]}
                                        />
                                        <Text style={styles.entryMain}>
                                            {e.glucose_value} {e.unit}
                                        </Text>
                                        <Text style={styles.entrySub}>{timingStr}</Text>
                                        <View
                                            style={[styles.entryBadge, { backgroundColor: st.bg }]}
                                        >
                                            <Text
                                                style={[styles.entryBadgeText, { color: st.color }]}
                                            >
                                                {st.label}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </MetricCard>

                {/* ── Nutrition ── */}
                <MetricCard
                    title={t("patient.tracker.rings.nutrition") + " 🍎"}
                    value={totalWater}
                    unit={t("patient.tracker.units.water")}
                    subtitle={t("patient.tracker.placeholders.meals_logged", {
                        count: nutritionHook.logs.length,
                    })}
                    accentColor={C.green}
                    accentBg={C.greenBg}
                    onLog={() => router.push("/tracker/log-nutrition")}
                >
                    {nutritionPoints.length > 0 ? (
                        <View style={styles.chartWrap}>
                            <BarChart points={nutritionPoints} width={chartW} height={100} />
                        </View>
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyText}>
                                {t("patient.tracker.charts.nutrition_empty")}
                            </Text>
                        </View>
                    )}

                    {nutritionHook.logs.length > 0 && (
                        <View style={styles.entryList}>
                            {nutritionHook.logs.slice(0, 3).map((row: any) => {
                                const cl = CARB_LEVELS.find((c) => c.value === row.carb_level);
                                const mt = MEAL_TYPES.find((m) => m.value === row.meal_type);
                                return (
                                    <View key={row.id} style={styles.entryRow}>
                                        <View
                                            style={[
                                                styles.entryDot,
                                                { backgroundColor: cl?.color ?? C.green },
                                            ]}
                                        />
                                        <Text style={styles.entryMain}>
                                            {mt
                                                ? `${mt.emoji} ${t(`patient.tracker.meal_type.${row.meal_type}`, mt.label)}`
                                                : t("patient.tracker.rings.nutrition")}
                                        </Text>
                                        <Text style={styles.entrySub}>
                                            {cl
                                                ? t(`patient.tracker.carb_level.${cl.value}`, cl.label)
                                                : ""}{" "}
                                            {t("patient.tracker.rings.nutrition")}
                                            {row.carb_grams ? ` · ${row.carb_grams}g` : ""}
                                        </Text>

                                        <Text style={styles.entryTime}>
                                            {new Date(row.logged_at).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </MetricCard>

                {/* ── Activity ── */}
                <MetricCard
                    title={t("patient.tracker.rings.activity") + " 🏃"}
                    value={totalMins}
                    unit={t("patient.tracker.units.active_min")}
                    subtitle={t("patient.tracker.placeholders.sessions_logged", {
                        count: activityHook.logs.length,
                    })}
                    accentColor={C.blue}
                    accentBg={C.blueBg}
                    onLog={() => router.push("/tracker/log-activity")}
                >
                    {activityPoints.length > 0 ? (
                        <View style={styles.chartWrap}>
                            <BarChart points={activityPoints} width={chartW} height={100} />
                        </View>
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyText}>
                                {t("patient.tracker.charts.activity_empty")}
                            </Text>
                        </View>
                    )}

                    {activityHook.logs.length > 0 && (
                        <View style={styles.entryList}>
                            {activityHook.logs.slice(0, 3).map((row: any) => {
                                const actObj = INTENSITY_OPTIONS.find(
                                    (i) => i.value === row.intensity,
                                );
                                return (
                                    <View key={row.id} style={styles.entryRow}>
                                        <View
                                            style={[
                                                styles.entryDot,
                                                {
                                                    backgroundColor:
                                                        intensityColor[row.intensity] ?? C.blue,
                                                },
                                            ]}
                                        />
                                        <Text style={styles.entryMain}>{row.activity_type}</Text>
                                        <Text style={styles.entrySub}>
                                            {row.duration_min} min ·{" "}
                                            {actObj
                                                ? `${actObj.emoji} ${t(`patient.tracker.intensity.${row.intensity}`, actObj.label)}`
                                                : row.intensity}
                                        </Text>
                                        <Text style={styles.entryTime}>
                                            {new Date(row.logged_at).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </MetricCard>

                {/* ── Wellbeing ── */}
                <MetricCard
                    title={t("patient.tracker.rings.wellbeing") + " 😌"}
                    value={lastMood ? lastMood.label : "—"}
                    subtitle={
                        wellbeingHook.logs[0]?.sleep_hours
                            ? t("patient.tracker.placeholders.sleep_last_night", {
                                count: wellbeingHook.logs[0].sleep_hours,
                            })
                            : t("patient.tracker.placeholders.no_readings")
                    }
                    accentColor={C.violet}
                    accentBg={C.violetBg}
                    onLog={() => router.push("/tracker/log-wellbeing")}
                >
                    {wellbeingPoints.length >= 2 ? (
                        <View style={styles.chartWrap}>
                            <LineChart
                                points={wellbeingPoints}
                                width={chartW}
                                height={100}
                                yMin={0}
                                yMax={5}
                                gradientColor={C.violet}
                            />
                            <XLabels points={wellbeingPoints} width={chartW} height={100} />
                        </View>
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyText}>
                                {t("patient.tracker.charts.wellbeing_empty")}
                            </Text>
                        </View>
                    )}

                    {wellbeingHook.logs.length > 0 && (
                        <View style={styles.entryList}>
                            {wellbeingHook.logs.slice(0, 2).map((row: any) => {
                                const mo = MOOD_OPTIONS.find((m) => m.value === row.mood);
                                return (
                                    <View key={row.id} style={styles.entryRow}>
                                        <View
                                            style={[
                                                styles.entryDot,
                                                { backgroundColor: moodColor[row.mood] ?? C.muted },
                                            ]}
                                        />
                                        <Text style={styles.entryMain}>
                                            {mo
                                                ? `${mo.emoji} ${t(`patient.tracker.mood.${row.mood}`, mo.label)}`
                                                : t("common.done")}
                                        </Text>
                                        <Text style={styles.entrySub}>
                                            {row.symptoms?.length > 0
                                                ? `${row.symptoms.length} ${t("common.symptoms")}`
                                                : t("common.no_data")}
                                        </Text>
                                        <Text style={styles.entryTime}>
                                            {new Date(row.logged_at).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </MetricCard>
            </ScrollView>

            <Pressable
                style={styles.aiFab}
                onPress={() =>
                    router.push({
                        pathname: "/(patient)/tracker/ai-assistant",
                        params: { period },
                    })
                }
            >
                <Ionicons name="sparkles" size={24} color="#fff" />
                <Text style={styles.aiFabText}>{t("patient.feed.ai_consult.ask")}</Text>
            </Pressable>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (C: any) =>
    StyleSheet.create({
        safe: { flex: 1, backgroundColor: C.bg },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 8,
        },
        headerActions: { flexDirection: "row", gap: 8 },

        aiFab: {
            position: "absolute",
            bottom: 24,
            right: 24,
            backgroundColor: C.blue,
            borderRadius: 28,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
            shadowColor: C.blue,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
            gap: 8,
        },
        aiFabText: { color: "#fff", fontWeight: "700", fontSize: 15 },
        headerTitle: {
            fontSize: 20,
            fontWeight: "700",
            color: C.text,
            letterSpacing: -0.3,
        },
        headerDate: { fontSize: 13, color: C.sub, marginTop: 2 },

        exportBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: C.blueBg,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
        },
        exportBtnText: { color: C.blue, fontWeight: "600", fontSize: 13 },

        filterRow: {
            flexDirection: "row",
            paddingHorizontal: 16,
            marginBottom: 8,
            gap: 8,
        },
        filterBtn: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.border,
        },
        filterBtnActive: { backgroundColor: C.text, borderColor: C.text },
        filterBtnText: {
            fontSize: 13,
            fontWeight: "600",
            color: C.sub,
            textTransform: "capitalize",
        },
        filterBtnTextActive: { color: C.surface },

        scroll: {
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 40,
            gap: 12,
        },

        card: {
            backgroundColor: C.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: C.border,
            gap: 12,
        },
        cardHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
        },
        cardTitle: {
            fontSize: 11,
            fontWeight: "600",
            color: C.sub,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            marginBottom: 4,
        },
        cardValueRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
        cardValue: {
            fontSize: 26,
            fontWeight: "700",
            letterSpacing: -0.5,
            color: C.text,
        },
        cardUnit: { fontSize: 13, color: C.sub, fontWeight: "400" },
        cardSub: { fontSize: 12, color: C.muted, marginTop: 2 },

        logBtn: {
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 8,
            borderWidth: 1,
        },
        logBtnText: { fontSize: 13, fontWeight: "600" },

        chartWrap: { position: "relative" },

        emptyChart: {
            height: 80,
            backgroundColor: C.bg,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: C.border,
            alignItems: "center",
            justifyContent: "center",
            borderStyle: "dashed",
        },
        emptyText: { fontSize: 12, color: C.muted },

        entryList: {
            gap: 0,
            borderTopWidth: 1,
            borderTopColor: C.border,
            paddingTop: 8,
        },
        entryRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 7,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
        },
        entryDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
        entryMain: { fontSize: 13, fontWeight: "500", color: C.text, flex: 1 },
        entrySub: { fontSize: 12, color: C.muted },
        entryTime: { fontSize: 11, color: C.muted },
        entryBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
        entryBadgeText: { fontSize: 10, fontWeight: "600" },
    });
