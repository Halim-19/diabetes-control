import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// ─── Model priority list: try in order until one works ────────────────────────
const MODEL_FALLBACK_ORDER = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.0-pro',
];

/**
 * Calls a model generation function with automatic fallback to other models
 * if the primary model returns a 503 (overloaded) or 404 (not found) error.
 */
async function generateWithFallback(
    buildRequest: (modelName: string) => Promise<any>
): Promise<any> {
    let lastError: any;
    for (const modelName of MODEL_FALLBACK_ORDER) {
        try {
            return await buildRequest(modelName);
        } catch (err: any) {
            const message = err?.message || '';
            const isRetryable = message.includes('503') || message.includes('429') ||
                message.includes('high demand') || message.includes('overload');
            const isNotFound = message.includes('404') || message.includes('not found');
            lastError = err;
            if (isRetryable || isNotFound) {
                console.warn(`[AI] Model ${modelName} unavailable, trying next...`);
                continue;
            }
            // Non-retryable error, throw immediately
            throw err;
        }
    }
    throw lastError;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIPatientReview {
    resume: string;
    suggestions: string[];
}

export interface AIConsultationResponse {
    title: string;
    body: string;
    media_url: string | null;
    media_type: 'youtube' | 'link' | 'none';
}

// ─── Patient Review (Doctor Panel) ────────────────────────────────────────────

export async function generatePatientReview(data: {
    patientName: string;
    glucoseLogs: string;
    nutritionLogs: string;
    activityLogs: string;
    wellbeingLogs: string;
    targets: string;
    language?: string;
}): Promise<AIPatientReview> {
    if (!genAI) {
        throw new Error('Gemini API Key is missing. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env.local file.');
    }

    const prompt = `
You are a specialized medical AI assistant for an endocrinologist. 
Analyze the following patient data for the last 30 days and provide two things:
1. A concise professional resume of their current health status (bullet points, focus on patterns).
2. Exactly 3 suggested feedback messages the doctor can send to the patient (varying from positive reinforcement to corrective advice).

Patient: ${data.patientName}
Targets: ${data.targets}

Glucose Logs:
${data.glucoseLogs || 'No logs recorded.'}

Nutrition:
${data.nutritionLogs || 'No logs recorded.'}

Activity:
${data.activityLogs || 'No logs recorded.'}

Wellbeing:
${data.wellbeingLogs || 'No logs recorded.'}

Response format: JSON
{
  "resume": "string",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

IMPORTANT: Generate the response content (both the resume and the suggestions) entirely in this language code: ${data.language || 'en'} (e.g. 'en' for English, 'fr' for French, 'ar' for Arabic). The JSON keys must remain exactly "resume" and "suggestions".
`;

    const result = await generateWithFallback(async (modelName) => {
        const model = genAI!.getGenerativeModel({ model: modelName });
        return model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
        });
    });

    const response = JSON.parse(result.response.text());
    return response as AIPatientReview;
}

// ─── Auto Tag Post ─────────────────────────────────────────────────────────────

export async function categorizeAndTagPost(content: string): Promise<string[]> {
    if (!genAI) return ['Other'];

    const prompt = `
Analyze the following social media post text for a diabetes community app. 
Assign exactly 1 to 3 relevant categories from this list: Diet, Exercise, Monitoring, Medication, Success, Motivation, Question, Other.
Return ONLY a JSON array of strings.

Post: "${content}"
`;

    try {
        const result = await generateWithFallback(async (modelName) => {
            const model = genAI!.getGenerativeModel({ model: modelName });
            return model.generateContent(prompt);
        });
        const text = result.response.text().trim();
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (err) {
        console.error('AI Tagging Error:', err);
        return ['Other'];
    }
}

// ─── AI Consultation (Patient Feed) ───────────────────────────────────────────

export async function generateAiConsultation(data: {
    question: string;
    profile: any;
    glucoseLogs: string[];
    nutritionLogs: string[];
    activityLogs: string[];
    language?: string;
}): Promise<AIConsultationResponse> {
    if (!genAI) {
        throw new Error('Gemini API Key is missing.');
    }

    const prompt = `
You are CareAlly AI, a highly empathetic and knowledgeable diabetes consultant. 
You are helping a patient with their specific question using their recent medical data.

PATIENT PROFILE:
- Name: ${data.profile.full_name || 'User'}
- Diabetes Type: ${data.profile.diabetes_type || 'Unknown'}
- Location: ${data.profile.wilaya || 'Unknown'}
- Target Range: ${data.profile.target_glucose_min ?? '?'}-${data.profile.target_glucose_max ?? '?'} mg/dL
- Insulin Regimen: ${data.profile.insulin_regimen || 'None'}

RECENT GLUCOSE LOGS:
${data.glucoseLogs.length ? data.glucoseLogs.join('\n') : 'No recent logs.'}

RECENT NUTRITION:
${data.nutritionLogs.length ? data.nutritionLogs.join('\n') : 'No recent logs recorded.'}

RECENT ACTIVITY:
${data.activityLogs.length ? data.activityLogs.join('\n') : 'No recent logs recorded.'}

USER QUESTION:
"${data.question}"

INSTRUCTIONS:
1. Provide a professional, structured, and personalized answer.
2. Use the patient's data (glucose patterns, location for local climate/food advice) to make it highly relevant.
3. Suggest a relevant YouTube educational video OR a high-authority medical link (PubMed, Mayo Clinic, etc.) that directly relates to the question.
4. Format the response as JSON.
5. IMPORTANT: Generate the "title" and "body" content entirely in this language code: ${data.language || 'en'} (e.g. 'en' for English, 'fr' for French, 'ar' for Arabic). The JSON keys must remain exactly "title", "body", "media_url", and "media_type".

Response format:
{
  "title": "Short catchy title for the response",
  "body": "Detailed response text (use markdown for emphasis if needed)",
  "media_url": "https://youtube.com/... or https://...",
  "media_type": "youtube" | "link" | "none"
}
`;

    try {
        const result = await generateWithFallback(async (modelName) => {
            const model = genAI!.getGenerativeModel({ model: modelName });
            return model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' },
            });
        });

        const response = JSON.parse(result.response.text());

        if (response.media_url) {
            const isYoutube = response.media_url.includes('youtube.com') || response.media_url.includes('youtu.be');
            response.media_type = isYoutube ? 'youtube' : 'link';
        } else {
            response.media_type = 'none';
        }

        return response as AIConsultationResponse;
    } catch (err: any) {
        const message = err?.message || '';
        const isBusy = message.includes('503') || message.includes('high demand') ||
            message.includes('overload') || message.includes('429');

        if (isBusy) {
            // All models are overloaded — return a soft error the UI can display
            throw new Error('The AI service is currently busy due to high demand. Please try again in a few minutes. ⏳');
        }

        console.error('AI Consultation Error:', err);
        throw new Error(err?.message || 'AI generation failed. Please try again.');
    }
}
