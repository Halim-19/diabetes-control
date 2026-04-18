import json
import os

locales_dir = r"c:\Users\mim\Desktop\agency\startup\diabetes-control\assets\locales"

common_enums = {
    "gender": {
        "male": {"en": "Male", "fr": "Homme", "ar": "ذكر"},
        "female": {"en": "Female", "fr": "Femme", "ar": "أنثى"}
    },
    "diabetes_type": {
        "type1": {"en": "Type 1", "fr": "Type 1", "ar": "النوع 1"},
        "type2": {"en": "Type 2", "fr": "Type 2", "ar": "النوع 2"},
        "gestational": {"en": "Gestational", "fr": "Gestationnel", "ar": "سكري الحمل"},
        "prediabetes": {"en": "Pre-diabetes", "fr": "Prédiabète", "ar": "مرحلة ما قبل السكري"},
        "other": {"en": "Other", "fr": "Autre", "ar": "آخر"}
    },
    "insulin_regimen": {
        "none": {"en": "None", "fr": "Aucun", "ar": "لا يوجد"},
        "basal_only": {"en": "Basal only", "fr": "Basale uniquement", "ar": "قاعدي فقط"},
        "basal_bolus": {"en": "Basal + Bolus", "fr": "Basale + Bolus", "ar": "قاعدي + سريع"},
        "pump": {"en": "Pump", "fr": "Pompe", "ar": "مضخة"},
        "premixed": {"en": "Premixed", "fr": "Prémélangé", "ar": "مخلوط مسبقاً"}
    },
    "activity_level": {
        "sedentary": {"en": "🛋️ Sedentary", "fr": "🛋️ Sédentaire", "ar": "🛋️ خامل"},
        "light": {"en": "🚶 Light", "fr": "🚶 Léger", "ar": "🚶 خفيف"},
        "moderate": {"en": "🚴 Moderate", "fr": "🚴 Modéré", "ar": "🚴 متوسط"},
        "active": {"en": "🏃 Active", "fr": "🏃 Actif", "ar": "🏃 نشط"},
        "very_active": {"en": "🏋️ Very Active", "fr": "🏋️ Très Actif", "ar": "🏋️ نشط جداً"}
    }
}

def update_locale(lang):
    path = os.path.join(locales_dir, f"{lang}.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if "enums" not in data: data["enums"] = {}
    
    for category, options in common_enums.items():
        if category not in data["enums"]: data["enums"][category] = {}
        for opt_key, translations in options.items():
            data["enums"][category][opt_key] = translations[lang]

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

update_locale('en')
update_locale('fr')
update_locale('ar')
print("Common enums synchronized across all languages.")
