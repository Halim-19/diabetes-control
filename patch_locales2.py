import json
import os

locales_dir = r"c:\Users\mim\Desktop\agency\startup\diabetes-control\assets\locales"

def update_locale(lang, updates_dict):
    path = os.path.join(locales_dir, f"{lang}.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for dotted_key, value in updates_dict.items():
        keys = dotted_key.split('.')
        curr = data
        for k in keys[:-1]:
            if k not in curr:
                curr[k] = {}
            curr = curr[k]
        curr[keys[-1]] = value

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en_updates = {
    "common.search": "Search...",
    "common.no_matches": "No matches found.",
    "common.select_option": "Select an option",
    "common.options": "Options",
    "common.info": "Info",
    "doctor.patients.already_linked": "This patient is already in your list.",
    "doctor.patients.add_error": "Could not add patient.",
    "doctor.patients.add_success": "Patient added successfully.",
    "doctor.patients.accept_error": "Could not accept request.",
    "doctor.patients.search_error": "Search Error",
    "doctor.patients.search_exception": "Could not execute search. Try again.",
    "doctor.patients.add_new": "Add New Patient",
    "doctor.patients.search_placeholder": "Search by name or phone...",
    "doctor.patients.link": "Link",
    "doctor.patients.accept": "Accept",
    "doctor.stats.title": "Admin Stats",
    "doctor.stats.subtitle": "Platform overview",
    "doctor.stats.logout": "Log out",
    "doctor.stats.total_patients": "Total Patients",
    "doctor.stats.active_doctors": "Active Doctors",
    "doctor.stats.avg_steps": "Avg Daily Steps",
    "doctor.stats.instructions_sent": "Instructions Sent",
    "doctor.stats.recent_activity": "RECENT ACTIVITY",
    "patient.instructions.title": "Instructions",
    "patient.instructions.subtitle": "Guidelines from your care team",
    "profile_setup.personal_info": "Personal Info",
    "profile_setup.professional_info": "Professional Info",
    "profile_setup.diabetes_info": "Diabetes Info",
    "profile_setup.step": "Step",
    "profile_setup.of": "of",
    "profile_setup.upload_failed": "Upload Failed",
    "profile_setup.upload_error": "There was an error saving your image.",
    "profile_setup.required": "Required",
    "profile_setup.enter_full_name": "Please enter your full name.",
    "profile_setup.select_birth_date": "Please select your birth date.",
    "profile_setup.select_gender": "Please select your gender.",
    "profile_setup.select_wilaya": "Please select your wilaya.",
    "profile_setup.select_commune": "Please select your commune.",
    "profile_setup.select_diabetes_type": "Please select your diabetes type.",
    "profile_setup.select_specialization": "Please provide your specialization and medical license.",
    "profile_setup.basic_details": "BASIC DETAILS",
    "profile_setup.photo_hint": "Professional photo recommended",
    "profile_setup.body_measurements": "BODY MEASUREMENTS",
    "profile_setup.location": "LOCATION",
    "profile_setup.credentials": "CREDENTIALS",
    "profile_setup.professional_bio": "PROFESSIONAL BIO",
    "profile_setup.diagnosis": "DIAGNOSIS",
    "profile_setup.glucose_targets": "GLUCOSE TARGETS (mg/dL)",
    "profile_setup.treatment": "TREATMENT",
    "profile_setup.lifestyle": "LIFESTYLE & COMORBIDITIES",
    "profile_setup.emergency_contact": "EMERGENCY CONTACT",
    "profile_setup.bmi": "BMI"
}

fr_updates = {
    "common.search": "Rechercher...",
    "common.no_matches": "Aucun résultat trouvé.",
    "common.select_option": "Sélectionner une option",
    "common.options": "Options",
    "common.info": "Info",
    "doctor.patients.already_linked": "Ce patient est déjà dans votre liste.",
    "doctor.patients.add_error": "Impossible d'ajouter le patient.",
    "doctor.patients.add_success": "Patient ajouté avec succès.",
    "doctor.patients.accept_error": "Impossible d'accepter la demande.",
    "doctor.patients.search_error": "Erreur de recherche",
    "doctor.patients.search_exception": "Impossible d'exécuter la recherche. Veuillez r\u00e9essayer.",
    "doctor.patients.add_new": "Ajouter un nouveau patient",
    "doctor.patients.search_placeholder": "Rechercher par nom ou numéro...",
    "doctor.patients.link": "Lier",
    "doctor.patients.accept": "Accepter",
    "doctor.stats.title": "Statistiques Administrateur",
    "doctor.stats.subtitle": "Vue d'ensemble de la plateforme",
    "doctor.stats.logout": "Se déconnecter",
    "doctor.stats.total_patients": "Total des patients",
    "doctor.stats.active_doctors": "Médecins actifs",
    "doctor.stats.avg_steps": "Moyenne de pas",
    "doctor.stats.instructions_sent": "Instructions envoyées",
    "doctor.stats.recent_activity": "ACTIVITÉ RÉCENTE",
    "patient.instructions.title": "Instructions",
    "patient.instructions.subtitle": "Recommandations de votre équipe soignante",
    "profile_setup.personal_info": "Infos Personnelles",
    "profile_setup.professional_info": "Infos Professionnelles",
    "profile_setup.diabetes_info": "Infos Diabète",
    "profile_setup.step": "Étape",
    "profile_setup.of": "sur",
    "profile_setup.upload_failed": "Échec de l'upload",
    "profile_setup.upload_error": "Une erreur s'est produite lors de l'enregistrement de votre image.",
    "profile_setup.required": "Requis",
    "profile_setup.enter_full_name": "Veuillez entrer votre nom complet.",
    "profile_setup.select_birth_date": "Veuillez sélectionner votre date de naissance.",
    "profile_setup.select_gender": "Veuillez sélectionner votre genre.",
    "profile_setup.select_wilaya": "Veuillez sélectionner votre wilaya.",
    "profile_setup.select_commune": "Veuillez sélectionner votre commune.",
    "profile_setup.select_diabetes_type": "Veuillez sélectionner votre type de diabète.",
    "profile_setup.select_specialization": "Veuillez indiquer votre spécialité et votre licence médicale.",
    "profile_setup.basic_details": "DÉTAILS DE BASE",
    "profile_setup.photo_hint": "Une photo professionnelle est recommandée",
    "profile_setup.body_measurements": "MENSURATIONS CORPORELLES",
    "profile_setup.location": "EMPLACEMENT",
    "profile_setup.credentials": "IDENTIFIANTS",
    "profile_setup.professional_bio": "BIOGRAPHIE PROFESSIONNELLE",
    "profile_setup.diagnosis": "DIAGNOSTIC",
    "profile_setup.glucose_targets": "OBJECTIFS DE GLUCOSE (mg/dL)",
    "profile_setup.treatment": "TRAITEMENT",
    "profile_setup.lifestyle": "MODE DE VIE",
    "profile_setup.emergency_contact": "CONTACT D'URGENCE",
    "profile_setup.bmi": "IMC"
}

ar_updates = {
    "common.search": "بحث...",
    "common.no_matches": "لم يتم العثور على نتائج.",
    "common.select_option": "اختر خيارا",
    "common.options": "خيارات",
    "common.info": "معلومة",
    "doctor.patients.already_linked": "هذا المريض موجود بالفعل في القائمة.",
    "doctor.patients.add_error": "تعذر إضافة المريض.",
    "doctor.patients.add_success": "تم إضافة المريض بنجاح.",
    "doctor.patients.accept_error": "تعذر قبول الطلب.",
    "doctor.patients.search_error": "خطأ في البحث",
    "doctor.patients.search_exception": "تعذر تنفيذ البحث. حاول مرة أخرى.",
    "doctor.patients.add_new": "إضافة مريض جديد",
    "doctor.patients.search_placeholder": "البحث بالاسم أو رقم الهاتف...",
    "doctor.patients.link": "ربط",
    "doctor.patients.accept": "قبول",
    "doctor.stats.title": "إحصائيات الإدارة",
    "doctor.stats.subtitle": "نظرة عامة على المنصة",
    "doctor.stats.logout": "تسجيل خروج",
    "doctor.stats.total_patients": "إجمالي المرضى",
    "doctor.stats.active_doctors": "الأطباء النشطين",
    "doctor.stats.avg_steps": "متوسط الخطوات",
    "doctor.stats.instructions_sent": "التعليمات المرسلة",
    "doctor.stats.recent_activity": "النشاط الأخير",
    "patient.instructions.title": "التعليمات",
    "patient.instructions.subtitle": "توجيهات من فريق الرعاية الصحية",
    "profile_setup.personal_info": "المعلومات الشخصية",
    "profile_setup.professional_info": "المعلومات المهنية",
    "profile_setup.diabetes_info": "معلومات السكري",
    "profile_setup.step": "الخطوة",
    "profile_setup.of": "من",
    "profile_setup.upload_failed": "فشل الرفع",
    "profile_setup.upload_error": "حدث خطأ أثناء حفظ الصورة.",
    "profile_setup.required": "مطلوب",
    "profile_setup.enter_full_name": "يرجى إدخال اسمك الكامل.",
    "profile_setup.select_birth_date": "يرجى اختيار تاريخ ميلادك.",
    "profile_setup.select_gender": "يرجى اختيار الجنس.",
    "profile_setup.select_wilaya": "يرجى اختيار الولاية.",
    "profile_setup.select_commune": "يرجى اختيار البلدية.",
    "profile_setup.select_diabetes_type": "يرجى اختيار نوع السكري.",
    "profile_setup.select_specialization": "يرجى تقديم التخصص والرخصة الطبية.",
    "profile_setup.basic_details": "التفاصيل الأساسية",
    "profile_setup.photo_hint": "يوصى بصورة احترافية",
    "profile_setup.body_measurements": "قياسات الجسم",
    "profile_setup.location": "الموقع",
    "profile_setup.credentials": "البيانات المهنية",
    "profile_setup.professional_bio": "السيرة المهنية",
    "profile_setup.diagnosis": "التشخيص",
    "profile_setup.glucose_targets": "أهداف الجلوكوز",
    "profile_setup.treatment": "العلاج",
    "profile_setup.lifestyle": "نمط الحياة",
    "profile_setup.emergency_contact": "جهة اتصال الطوارئ",
    "profile_setup.bmi": "مؤشر كتلة الجسم"
}

update_locale('en', en_updates)
update_locale('fr', fr_updates)
update_locale('ar', ar_updates)
print("Updated Locales.")
