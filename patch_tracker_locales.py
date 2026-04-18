import json
import os

locales_dir = r"c:\Users\mim\Desktop\agency\startup\diabetes-control\assets\locales"

def update(lang, updates_dict):
    path = os.path.join(locales_dir, f"{lang}.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if 'patient' not in data:
        data['patient'] = {}
    if 'tracker' not in data['patient']:
        data['patient']['tracker'] = {}

    for k, v in updates_dict.items():
        data['patient']['tracker'][k] = v

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en_updates = {
    "timing": {
        "fasting": "Fasting",
        "before_breakfast": "Before Breakfast",
        "after_breakfast": "After Breakfast",
        "before_lunch": "Before Lunch",
        "after_lunch": "After Lunch",
        "before_dinner": "Before Dinner",
        "after_dinner": "After Dinner",
        "bedtime": "Bedtime",
        "random": "Random",
        "night": "Night"
    },
    "meal_type": {
        "breakfast": "Breakfast",
        "lunch": "Lunch",
        "dinner": "Dinner",
        "snack": "Snack"
    },
    "carb_level": {
        "none": "None",
        "low": "Low",
        "medium": "Medium",
        "high": "High"
    },
    "intensity": {
        "light": "Light",
        "moderate": "Moderate",
        "intense": "Intense"
    },
    "mood": {
        "great": "Great",
        "good": "Good",
        "neutral": "Neutral",
        "tired": "Tired",
        "stressed": "Stressed",
        "anxious": "Anxious"
    }
}

fr_updates = {
    "timing": {
        "fasting": "À jeun",
        "before_breakfast": "Avant petit-déj",
        "after_breakfast": "Après petit-déj",
        "before_lunch": "Avant déjeuner",
        "after_lunch": "Après déjeuner",
        "before_dinner": "Avant dîner",
        "after_dinner": "Après dîner",
        "bedtime": "Au coucher",
        "random": "Aléatoire",
        "night": "Nuit"
    },
    "meal_type": {
        "breakfast": "Petit-déj",
        "lunch": "Déjeuner",
        "dinner": "Dîner",
        "snack": "Collation"
    },
    "carb_level": {
        "none": "Aucun",
        "low": "Faible",
        "medium": "Moyen",
        "high": "Élevé"
    },
    "intensity": {
        "light": "Léger",
        "moderate": "Modéré",
        "intense": "Intense"
    },
    "mood": {
        "great": "Super",
        "good": "Bien",
        "neutral": "Neutre",
        "tired": "Fatigué",
        "stressed": "Stressé",
        "anxious": "Anxieux"
    }
}

ar_updates = {
    "timing": {
        "fasting": "صائم",
        "before_breakfast": "قبل الفطور",
        "after_breakfast": "بعد الفطور",
        "before_lunch": "قبل الغداء",
        "after_lunch": "بعد الغداء",
        "before_dinner": "قبل العشاء",
        "after_dinner": "بعد العشاء",
        "bedtime": "وقت النوم",
        "random": "عشوائي",
        "night": "بالليل"
    },
    "meal_type": {
        "breakfast": "فطور",
        "lunch": "غداء",
        "dinner": "عشاء",
        "snack": "وجبة خفيفة"
    },
    "carb_level": {
        "none": "بدون",
        "low": "قليل",
        "medium": "متوسط",
        "high": "كثير"
    },
    "intensity": {
        "light": "خفيف",
        "moderate": "متوسط",
        "intense": "شاق"
    },
    "mood": {
        "great": "ممتاز",
        "good": "جيد",
        "neutral": "عادي",
        "tired": "متعب",
        "stressed": "مضغوط",
        "anxious": "قلق"
    }
}

update('en', en_updates)
update('fr', fr_updates)
update('ar', ar_updates)
print("Updated Locales with tracker selections.")
