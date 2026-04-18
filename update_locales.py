import json
import os

locales_dir = r"c:\Users\mim\Desktop\agency\startup\diabetes-control\assets\locales"

# -------- ENGLISH --------
en_path = os.path.join(locales_dir, "en.json")
with open(en_path, "r", encoding="utf-8") as f:
    en_data = json.load(f)

if "profile" not in en_data["doctor"]:
    en_data["doctor"]["profile"] = {}

en_data["doctor"]["profile"].update({
    "title": "My Profile",
    "not_set": "Not set",
    "specialization_not_set": "Specialization Not Set",
    "yrs": "yrs",
    "exp": "Exp",
    "professional_details": "Professional Details",
    "specialization": "Specialization *",
    "choose_specialty": "Choose specialty",
    "medical_license": "Medical License ID",
    "license_number": "License number",
    "workplace": "Current Workplace",
    "workplace_placeholder": "Hospital/Clinic name",
    "experience_years": "Years of Experience",
    "experience_placeholder": "e.g. 10",
    "bio": "Professional Bio",
    "bio_placeholder": "Describe your background...",
    "work_location": "Work Location",
    "location_desc": "Set your clinic or hospital location so patients can find you on the map.",
    "set_current_position": "Set to Current Position",
    "latitude": "Latitude",
    "longitude": "Longitude",
    "specialty_label": "Specialty",
    "license_label": "License",
    "workplace_label": "Workplace",
    "experience_label": "Experience",
    "no_bio": "No bio provided",
    "personal_info": "Personal Information",
    "full_name": "Full Name",
    "phone": "Phone",
    "dob": "Date of Birth",
    "gender": "Gender",
    "wilaya": "Wilaya *",
    "select_wilaya": "Select province",
    "commune": "Commune *",
    "select_commune": "Select commune",
    "select_wilaya_first": "First select a wilaya"
})

if "detail" not in en_data["doctor"]:
    en_data["doctor"]["detail"] = {}

en_data["doctor"]["detail"].update({
    "note_sent": "Note sent to patient.",
    "note_error": "Could not save note.",
    "not_found": "Patient not found.",
    "no_logs": "No logs found for this month.",
    "no_activity": "No activity logs.",
    "no_wellbeing": "No wellbeing logs.",
    "no_notes": "No notes recorded yet.",
    "new_note_title": "New Medical Note",
    "note_placeholder": "Type your notes or instructions for the patient..."
})

if "ai_review" not in en_data["doctor"]["detail"]:
    en_data["doctor"]["detail"]["ai_review"] = {}

en_data["doctor"]["detail"]["ai_review"].update({
    "assistant_title": "AI Patient Assistant",
    "assistant_desc": "Get a professional medical summary and suggested notes for this patient based on their recent tracking logs."
})

with open(en_path, "w", encoding="utf-8") as f:
    json.dump(en_data, f, ensure_ascii=False, indent=2)


# -------- FRENCH --------
fr_path = os.path.join(locales_dir, "fr.json")
with open(fr_path, "r", encoding="utf-8") as f:
    fr_data = json.load(f)

if "profile" not in fr_data["doctor"]:
    fr_data["doctor"]["profile"] = {}

fr_data["doctor"]["profile"].update({
    "title": "Mon Profil",
    "not_set": "Non défini",
    "specialization_not_set": "Spécialisation non définie",
    "yrs": "ans",
    "exp": "Exp",
    "professional_details": "Détails Professionnels",
    "specialization": "Spécialisation *",
    "choose_specialty": "Choisir une spécialité",
    "medical_license": "Numéro de licence médicale",
    "license_number": "Numéro de licence",
    "workplace": "Lieu de travail actuel",
    "workplace_placeholder": "Nom de l'hôpital/clinique",
    "experience_years": "Années d'expérience",
    "experience_placeholder": "ex: 10",
    "bio": "Biographie professionnelle",
    "bio_placeholder": "Décrivez votre parcours...",
    "work_location": "Lieu de travail",
    "location_desc": "Définissez votre lieu de travail pour que les patients puissent vous trouver sur la carte.",
    "set_current_position": "Définir sur la position actuelle",
    "latitude": "Latitude",
    "longitude": "Longitude",
    "specialty_label": "Spécialité",
    "license_label": "Licence",
    "workplace_label": "Lieu de travail",
    "experience_label": "Expérience",
    "no_bio": "Aucune biographie fournie",
    "personal_info": "Informations personnelles",
    "full_name": "Nom complet",
    "phone": "Téléphone",
    "dob": "Date de naissance",
    "gender": "Sexe",
    "wilaya": "Wilaya *",
    "select_wilaya": "Sélectionner la province",
    "commune": "Commune *",
    "select_commune": "Sélectionner la commune",
    "select_wilaya_first": "Sélectionnez d'abord une wilaya"
})

if "detail" not in fr_data["doctor"]:
    fr_data["doctor"]["detail"] = {}

fr_data["doctor"]["detail"].update({
    "note_sent": "Note envoyée au patient.",
    "note_error": "Impossible d'enregistrer la note.",
    "not_found": "Patient introuvable.",
    "no_logs": "Aucune donnée trouvée pour ce mois.",
    "no_activity": "Aucune activité enregistrée.",
    "no_wellbeing": "Aucun bien-être enregistré.",
    "no_notes": "Aucune note enregistrée.",
    "new_note_title": "Nouvelle Note Médicale",
    "note_placeholder": "Tapez vos notes ou instructions pour le patient..."
})

if "ai_review" not in fr_data["doctor"]["detail"]:
    fr_data["doctor"]["detail"]["ai_review"] = {}

fr_data["doctor"]["detail"]["ai_review"].update({
    "assistant_title": "Assistant Médical IA",
    "assistant_desc": "Obtenez un résumé médical professionnel et des suggestions de notes pour ce patient en fonction de ses suivis récents."
})

with open(fr_path, "w", encoding="utf-8") as f:
    json.dump(fr_data, f, ensure_ascii=False, indent=2)


# -------- ARABIC --------
ar_path = os.path.join(locales_dir, "ar.json")
with open(ar_path, "r", encoding="utf-8") as f:
    ar_data = json.load(f)

if "profile" not in ar_data["doctor"]:
    ar_data["doctor"]["profile"] = {}

ar_data["doctor"]["profile"].update({
    "title": "الملف الشخصي",
    "not_set": "غير محدد",
    "specialization_not_set": "التخصص غير محدد",
    "yrs": "سنوات",
    "exp": "خبرة",
    "professional_details": "التفاصيل المهنية",
    "specialization": "التخصص *",
    "choose_specialty": "اختر التخصص",
    "medical_license": "رقم الرخصة الطبية",
    "license_number": "رقم الرخصة",
    "workplace": "مكان العمل الحالي",
    "workplace_placeholder": "اسم المستشفى/العيادة",
    "experience_years": "سنوات الخبرة",
    "experience_placeholder": "مثال 10",
    "bio": "السيرة المهنية",
    "bio_placeholder": "اكتب نبذة عنك...",
    "work_location": "موقع العمل",
    "location_desc": "حدد موقع عيادتك أو المستشفى ليتمكن المرضى من العثور عليك على الخريطة.",
    "set_current_position": "تعيين الموقع الحالي",
    "latitude": "خط العرض (Latitude)",
    "longitude": "خط الطول (Longitude)",
    "specialty_label": "التخصص",
    "license_label": "الرخصة",
    "workplace_label": "العمل",
    "experience_label": "الخبرة",
    "no_bio": "لم يتم تقديم سيرة",
    "personal_info": "المعلومات الشخصية",
    "full_name": "الاسم الكامل",
    "phone": "الهاتف",
    "dob": "تاريخ الميلاد",
    "gender": "الجنس",
    "wilaya": "الولاية *",
    "select_wilaya": "اختر الولاية",
    "commune": "البلدية *",
    "select_commune": "اختر البلدية",
    "select_wilaya_first": "يرجى اختيار ولاية أولا"
})

if "detail" not in ar_data["doctor"]:
    ar_data["doctor"]["detail"] = {}

ar_data["doctor"]["detail"].update({
    "note_sent": "تم إرسال الملاحظة للمريض.",
    "note_error": "لم يتم حفظ الملاحظة.",
    "not_found": "المريض غير موجود.",
    "no_logs": "لا توجد سجلات لهذا الشهر.",
    "no_activity": "لا توجد أنشطة مسجلة.",
    "no_wellbeing": "لا يوجد سجل للحالة العامة.",
    "no_notes": "لا توجد أي ملاحظات مسجلة بعد.",
    "new_note_title": "ملاحظة طبية جديدة",
    "note_placeholder": "اكتب ملاحظاتك أو تعليماتك للمريض..."
})

if "ai_review" not in ar_data["doctor"]["detail"]:
    ar_data["doctor"]["detail"]["ai_review"] = {}

ar_data["doctor"]["detail"]["ai_review"].update({
    "assistant_title": "مساعد الطبيب الذكي",
    "assistant_desc": "احصل على ملخص طبي محترف وملاحظات مقترحة لهذا المريض بناءً على سجلاته الحديثة."
})

with open(ar_path, "w", encoding="utf-8") as f:
    json.dump(ar_data, f, ensure_ascii=False, indent=2)

print("Updated all locales.")
