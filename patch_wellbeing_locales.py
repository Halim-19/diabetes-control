import json
import os

locales_dir = r"c:\Users\mim\Desktop\agency\startup\diabetes-control\assets\locales"

def update(lang, updates_dict):
    path = os.path.join(locales_dir, f"{lang}.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if 'patient' not in data: data['patient'] = {}
    if 'tracker' not in data['patient']: data['patient']['tracker'] = {}

    for k, v in updates_dict.items():
        data['patient']['tracker'][k] = v

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en_updates = {
    "hypo_symptoms": {
        "dizziness": "Dizziness",
        "sweating": "Sweating",
        "shaking": "Shaking",
        "hunger": "Hunger",
        "palpitations": "Palpitations",
        "confusion": "Confusion"
    },
    "hyper_symptoms": {
        "thirst": "Thirst",
        "urination": "Frequent Urination",
        "blurred": "Blurred Vision",
        "fatigue": "Fatigue",
        "headache": "Headache",
        "nausea": "Nausea"
    },
    "sleep_quality": {
        "poor": "Poor",
        "fair": "Fair",
        "good": "Good",
        "excellent": "Excellent"
    }
}

fr_updates = {
    "hypo_symptoms": {
        "dizziness": "Vertiges",
        "sweating": "Transpiration",
        "shaking": "Tremblements",
        "hunger": "Faim",
        "palpitations": "Palpitations",
        "confusion": "Confusion"
    },
    "hyper_symptoms": {
        "thirst": "Soif",
        "urination": "Miction fréquente",
        "blurred": "Vision floue",
        "fatigue": "Fatigue",
        "headache": "Maux de tête",
        "nausea": "Nausée"
    },
    "sleep_quality": {
        "poor": "Mauvais",
        "fair": "Passable",
        "good": "Bon",
        "excellent": "Excellent"
    }
}

ar_updates = {
    "hypo_symptoms": {
        "dizziness": "دوخة",
        "sweating": "تعرق",
        "shaking": "رجفة",
        "hunger": "جوع",
        "palpitations": "خفقان",
        "confusion": "ارتباك"
    },
    "hyper_symptoms": {
        "thirst": "عطش",
        "urination": "تبول متكرر",
        "blurred": "تشوش الرؤية",
        "fatigue": "إرهاق",
        "headache": "صداع",
        "nausea": "غثيان"
    },
    "sleep_quality": {
        "poor": "ضعيف",
        "fair": "مقبول",
        "good": "جيد",
        "excellent": "ممتاز"
    }
}

update('en', en_updates)
update('fr', fr_updates)
update('ar', ar_updates)
print("Updated Locales with wellbeing tracker options.")
