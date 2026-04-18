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
            "carb_desc": {
                "none": "No carbs / water only",
                "low": "Salad, eggs, meat",
                "medium": "Rice, bread (small)",
                "high": "Pasta, sweets, bread"
            },
            "placeholders": {
                "carbs_example": "e.g. 45",
                "meal_description_example": "e.g. Rice with chicken"
            },
            "labels": {
                "carbs_optional": "Carbs (g) — optional",
                "description_optional": "Description — optional",
                "today_meals": "Today's meals",
                "meal": "Meal"
            }
        }
    },
    "common": {
        "delete_meal": "Remove this meal?"
    }
}

fr = {
    "patient": {
        "tracker": {
            "carb_desc": {
                "none": "Pas de glucides / eau uniquement",
                "low": "Salade, œufs, viande",
                "medium": "Riz, pain (petite portion)",
                "high": "Pâtes, bonbons, pain"
            },
            "placeholders": {
                "carbs_example": "ex: 45",
                "meal_description_example": "ex: Riz au poulet"
            },
            "labels": {
                "carbs_optional": "Glucides (g) — facultatif",
                "description_optional": "Description — facultative",
                "today_meals": "Repas d'aujourd'hui",
                "meal": "Repas"
            }
        }
    },
    "common": {
        "delete_meal": "Supprimer ce repas ?"
    }
}

ar = {
    "patient": {
        "tracker": {
            "carb_desc": {
                "none": "بدون كربوهيدرات / ماء فقط",
                "low": "سلطة، بيض، لحم",
                "medium": "أرز، خبز (كمية صغيرة)",
                "high": "معكرونة، حلويات، خبز"
            },
            "placeholders": {
                "carbs_example": "مثال: ٤٥",
                "meal_description_example": "مثال: أرز مع دجاج"
            },
            "labels": {
                "carbs_optional": "كربوهيدرات (جم) — اختياري",
                "description_optional": "الوصف — اختياري",
                "today_meals": "وجبات اليوم",
                "meal": "وجبة"
            }
        }
    },
    "common": {
        "delete_meal": "حذف هذه الوجبة؟"
    }
}

update('en', en)
update('fr', fr)
update('ar', ar)
print("Locales updated with nutrition details.")
