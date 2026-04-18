import json
import os

locales_dir = r"c:\Users\mim\Desktop\agency\startup\diabetes-control\assets\locales"

def update_locale(lang, updates):
    path = os.path.join(locales_dir, f"{lang}.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Merge updates
    for section, values in updates.items():
        if section not in data: data[section] = {}
        for k, v in values.items():
            data[section][k] = v

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

placeholders = {
    "en": {
        "name_placeholder": "Ahmed Benali",
        "phone_placeholder": "+213 555 000 000",
        "weight_placeholder": "70",
        "height_placeholder": "175",
        "min_placeholder": "80",
        "max_placeholder": "180",
        "select_date": "Select date"
    },
    "fr": {
        "name_placeholder": "Ahmed Benali",
        "phone_placeholder": "+213 555 000 000",
        "weight_placeholder": "70",
        "height_placeholder": "175",
        "min_placeholder": "80",
        "max_placeholder": "180",
        "select_date": "Choisir une date"
    },
    "ar": {
        "name_placeholder": "أحمد بن علي",
        "phone_placeholder": "+213 555 000 000",
        "weight_placeholder": "70",
        "height_placeholder": "175",
        "min_placeholder": "80",
        "max_placeholder": "180",
        "select_date": "اختر التاريخ"
    }
}

for lang, vals in placeholders.items():
    update_locale(lang, {"profile_setup": vals})
