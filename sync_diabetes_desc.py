import json
import os

locales_dir = r"c:\Users\mim\Desktop\agency\startup\diabetes-control\assets\locales"

diabetes_desc = {
    "type1": {"en": "Autoimmune, insulin dependent", "fr": "Auto-immune, dépendant de l'insuline", "ar": "مناعي ذاتي، معتمد على الأنسولين"},
    "type2": {"en": "Insulin resistance", "fr": "Résistance à l'insuline", "ar": "مقاومة الأنسولين"},
    "gestational": {"en": "During pregnancy", "fr": "Pendant la grossesse", "ar": "أثناء الحمل"},
    "prediabetes": {"en": "At risk", "fr": "عرضة للخطر", "ar": "معرض للخطر"},
    "other": {"en": "MODY, LADA, etc.", "fr": "MODY, LADA, etc.", "ar": "LADA ،MODY، إلخ"}
}

def update_locale(lang):
    path = os.path.join(locales_dir, f"{lang}.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if "enums" not in data: data["enums"] = {}
    data["enums"]["diabetes_desc"] = {k: v[lang] for k, v in diabetes_desc.items()}

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

update_locale('en')
update_locale('fr')
update_locale('ar')
print("Diabetes descriptions synchronized.")
