import json
import os

locales_dir = r"c:\Users\mim\Desktop\agency\startup\diabetes-control\assets\locales"

def update(lang, updates_dict):
    path = os.path.join(locales_dir, f"{lang}.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if 'admin' not in data:
        data['admin'] = {}

    for k, v in updates_dict.items():
        data['admin'][k] = v

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en_updates = {
    "tabs": {
        "stats": "Stats",
        "users": "Users",
        "posts": "Posts",
        "map": "Map"
    },
    "users": {
        "title": "Platform Users",
        "search": "Search by name or email...",
        "role_all": "All",
        "role_patient": "Patients",
        "role_doctor": "Doctors",
        "role_admin": "Admins",
        "joined": "Joined",
        "phone": "Phone",
        "no_users": "No users found."
    },
    "posts": {
        "title": "Content Moderation",
        "search": "Search posts...",
        "delete_confirm_title": "Delete Post",
        "delete_confirm_desc": "Are you sure you want to permanently delete this post?",
        "no_posts": "No posts found.",
        "author": "Author",
        "target_role": "Target role"
    },
    "map": {
        "title": "Incident Map",
        "active_doctors": "Active Doctors",
        "emergencies": "Emergencies",
        "sos_alert": "SOS Alert",
        "doctor": "Doctor Facility"
    }
}

fr_updates = {
    "tabs": {
        "stats": "Stats",
        "users": "Util.",
        "posts": "Pubs",
        "map": "Carte"
    },
    "users": {
        "title": "Utilisateurs",
        "search": "Rechercher par nom...",
        "role_all": "Tous",
        "role_patient": "Patients",
        "role_doctor": "Médecins",
        "role_admin": "Admins",
        "joined": "Rejoint",
        "phone": "Téléphone",
        "no_users": "Aucun utilisateur."
    },
    "posts": {
        "title": "Modération",
        "search": "Rechercher des publications...",
        "delete_confirm_title": "Supprimer la publication",
        "delete_confirm_desc": "Voulez-vous vraiment supprimer définitivement cette publication ?",
        "no_posts": "Aucune publication.",
        "author": "Auteur",
        "target_role": "Cible"
    },
    "map": {
        "title": "Carte des incidents",
        "active_doctors": "Médecins actifs",
        "emergencies": "Urgences",
        "sos_alert": "Alerte SOS",
        "doctor": "Médecin"
    }
}

ar_updates = {
    "tabs": {
        "stats": "إحصائيات",
        "users": "مستخدمين",
        "posts": "منشورات",
        "map": "الخريطة"
    },
    "users": {
        "title": "قائمة المستخدمين",
        "search": "بحث بالاسم...",
        "role_all": "الكل",
        "role_patient": "المرضى",
        "role_doctor": "الأطباء",
        "role_admin": "المشرفين",
        "joined": "انضم",
        "phone": "الهاتف",
        "no_users": "لا يوجد مستخدمين."
    },
    "posts": {
        "title": "إدارة المحتوى",
        "search": "البحث في المنشورات...",
        "delete_confirm_title": "حذف المنشور",
        "delete_confirm_desc": "هل أنت متأكد أنك تريد حذف هذا المنشور نهائياً؟",
        "no_posts": "لا توجد منشورات.",
        "author": "الكاتب",
        "target_role": "الفئة المستهدفة"
    },
    "map": {
        "title": "خريطة المتابعة",
        "active_doctors": "الأطباء النشطين",
        "emergencies": "الطوارئ",
        "sos_alert": "نداء استغاثة",
        "doctor": "عيادة طبيب"
    }
}

update('en', en_updates)
update('fr', fr_updates)
update('ar', ar_updates)
print("Updated Locales with admin namespace.")
