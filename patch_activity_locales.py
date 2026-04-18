import json
import os

locales_dir = r"c:\Users\mim\Desktop\agency\startup\diabetes-control\assets\locales"

def update(lang, updates):
    path = os.path.join(locales_dir, f"{lang}.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    def deep_update(base, up):
        for k, v in up.items():
            if isinstance(v, dict) and k in base:
                deep_update(base[k], v)
            else:
                base[k] = v

    deep_update(data, updates)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en = {
    "patient": {
        "tracker": {
            "activities": {
                "walking": "Walking",
                "running": "Running",
                "cycling": "Cycling",
                "swimming": "Swimming",
                "judo": "Judo",
                "football": "Football",
                "basketball": "Basketball",
                "yoga": "Yoga",
                "gym": "Gym",
                "dancing": "Dancing",
                "hiking": "Hiking",
                "other": "Other"
            },
            "intensity_desc": {
                "light": "Easy, no sweat",
                "moderate": "Some effort, light sweat",
                "intense": "Hard effort, heavy sweat"
            },
            "placeholders": {
                "activity_example": "e.g. Skipping rope",
                "duration_example": "30",
                "calories_example": "200"
            },
            "labels": {
                "calories_burned": "Calories burned",
                "calories_burned_opt": "Calories burned (optional)",
                "intensity": "Intensity",
                "today_sessions": "Today's sessions"
            }
        }
    },
    "common": {
        "required": "Required",
        "select_activity": "Select or enter an activity.",
        "enter_duration": "Enter a duration in minutes.",
        "delete_activity": "Remove this activity?"
    }
}

fr = {
    "patient": {
        "tracker": {
            "activities": {
                "walking": "Marche",
                "running": "Course",
                "cycling": "Cyclisme",
                "swimming": "Natation",
                "judo": "Judo",
                "football": "Football",
                "basketball": "Basketball",
                "yoga": "Yoga",
                "gym": "Gym",
                "dancing": "Danse",
                "hiking": "Randonnée",
                "other": "Autre"
            },
            "intensity_desc": {
                "light": "Facile, pas de transpiration",
                "moderate": "Quelques efforts, légère transpiration",
                "intense": "Effort intense, forte transpiration"
            },
            "placeholders": {
                "activity_example": "ex: Corde à sauter",
                "duration_example": "30",
                "calories_example": "200"
            },
            "labels": {
                "calories_burned": "Calories brûlées",
                "calories_burned_opt": "Calories brûlées (optionnel)",
                "intensity": "Intensité",
                "today_sessions": "Séances d'aujourd'hui"
            }
        }
    },
    "common": {
        "required": "Requis",
        "select_activity": "Sélectionnez ou entrez une activité.",
        "enter_duration": "Entrez une durée en minutes.",
        "delete_activity": "Supprimer cette activité ?"
    }
}

ar = {
    "patient": {
        "tracker": {
            "activities": {
                "walking": "مشي",
                "running": "جري",
                "cycling": "ركوب الدراجة",
                "swimming": "سباحة",
                "judo": "جودو",
                "football": "كرة قدم",
                "basketball": "كرة سلة",
                "yoga": "يوغا",
                "gym": "نادي رياضي",
                "dancing": "رقص",
                "hiking": "تنزه",
                "other": "آخر"
            },
            "intensity_desc": {
                "light": "سهل، بدون عرق",
                "moderate": "بعض المجهود، عرق خفيف",
                "intense": "مجهود شاق، عرق كثيف"
            },
            "placeholders": {
                "activity_example": "مثال: قفز الحبل",
                "duration_example": "٣٠",
                "calories_example": "٢٠٠"
            },
            "labels": {
                "calories_burned": "السعرات الحرارية المحروقة",
                "calories_burned_opt": "السعرات الحرارية المحروقة (اختياري)",
                "intensity": "الشدة",
                "today_sessions": "جلسات اليوم"
            }
        }
    },
    "common": {
        "required": "مطلوب",
        "select_activity": "اختر أو أدخل نشاطاً.",
        "enter_duration": "أدخل المدة بالدقائق.",
        "delete_activity": "حذف هذا النشاط؟"
    }
}

update('en', en)
update('fr', fr)
update('ar', ar)
print("Locales updated with activity details.")
