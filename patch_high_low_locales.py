import json
import os

locales_dir = r"c:\Users\mim\Desktop\agency\startup\diabetes-control\assets\locales"

def update(lang, low, high):
    path = os.path.join(locales_dir, f"{lang}.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if 'common' not in data: data['common'] = {}
    data['common']['low'] = low
    data['common']['high'] = high

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


update('en', 'Low', 'High')
update('fr', 'Faible', 'Élevé')
update('ar', 'منخفض', 'مرتفع')
print("Updated Locales for Low and High.")
