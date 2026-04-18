import json
import os

locales_dir = r"c:\Users\mim\Desktop\agency\startup\diabetes-control\assets\locales"

def update(lang, updates):
    path = os.path.join(locales_dir, f"{lang}.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if 'periods' not in data: data['periods'] = {}
    data['periods'].update(updates)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en = {
    "three_months": "Last 90 Days",
    "three_months_short": "3 Months"
}

fr = {
    "three_months": "Derniers 90 jours",
    "three_months_short": "3 mois"
}

ar = {
    "three_months": "آخر 90 يوم",
    "three_months_short": "3 أشهر"
}

update('en', en)
update('fr', fr)
update('ar', ar)
print("Locales updated with 3-month periods.")
