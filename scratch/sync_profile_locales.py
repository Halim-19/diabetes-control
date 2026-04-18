import json
import os

def update_locales():
    locales_dir = "assets/locales"
    languages = ["en", "fr", "ar"]
    
    # Standardized profile_setup keys
    profile_setup_keys = {
        "personal_info": {"en": "Personal Info", "fr": "Infos personnelles", "ar": "المعلومات الشخصية"},
        "professional_info": {"en": "Professional Info", "fr": "Infos professionnelles", "ar": "المعلومات المهنية"},
        "diabetes_info": {"en": "Diabetes Info", "fr": "Infos diabète", "ar": "معلومات السكري"},
        "step_progress": {"en": "Step {{current}} of {{total}}", "fr": "Étape {{current}} sur {{total}}", "ar": "الخطوة {{current}} من {{total}}"},
        "back": {"en": "Back", "fr": "Retour", "ar": "رجوع"},
        "continue": {"en": "Continue", "fr": "Continuer", "ar": "متابعة"},
        "save_continue": {"en": "Save & Continue", "fr": "Enregistrer et continuer", "ar": "حفظ ومتابعة"},
        "upload_failed": {"en": "Upload Failed", "fr": "Échec du téléchargement", "ar": "فشل الرفع"},
        "upload_error": {"en": "There was an error saving your image.", "fr": "Une erreur est survenue lors de l'enregistrement de votre image.", "ar": "حدث خطأ أثناء حفظ الصورة."},
        "required": {"en": "Required", "fr": "Requis", "ar": "مطلوب"},
        
        # Validation
        "enter_full_name": {"en": "Please enter your full name.", "fr": "Veuillez entrer votre nom complet.", "ar": "يرجى إدخال اسمك الكامل."},
        "select_birth_date": {"en": "Please select your birth date.", "fr": "Veuillez sélectionner votre date de naissance.", "ar": "يرجى اختيار تاريخ ميلادك."},
        "select_gender": {"en": "Please select your gender.", "fr": "Veuillez sélectionner votre genre.", "ar": "يرجى اختيار الجنس."},
        "select_wilaya": {"en": "Please select your wilaya.", "fr": "Veuillez sélectionner votre wilaya.", "ar": "يرجى اختيار الولاية."},
        "select_commune": {"en": "Please select your commune.", "fr": "Veuillez sélectionner votre commune.", "ar": "يرجى اختيار البلدية."},
        "select_diabetes_type": {"en": "Please select your diabetes type.", "fr": "Veuillez sélectionner votre type de diabète.", "ar": "يرجى اختيار نوع السكري."},
        "select_specialization": {"en": "Please provide your specialization and medical license.", "fr": "Veuillez fournir votre spécialisation et votre licence médicale.", "ar": "يرجى تقديم التخصص والرخصة الطبية."},
        "select_date": {"en": "Select date", "fr": "Choisir une date", "ar": "اختر التاريخ"},
        
        # Section Labels
        "basic_details": {"en": "BASIC DETAILS", "fr": "DÉTAILS DE BASE", "ar": "التفاصيل الأساسية"},
        "photo_hint": {"en": "Professional photo recommended", "fr": "Photo professionnelle recommandée", "ar": "يوصى بصورة احترافية"},
        "body_measurements": {"en": "BODY MEASUREMENTS", "fr": "MÉSUBES CORPORELLES", "ar": "قياسات الجسم"},
        "location": {"en": "LOCATION", "fr": "EMPLACEMENT", "ar": "الموقع"},
        "credentials": {"en": "CREDENTIALS", "fr": "IDENTIFIANTS", "ar": "البيانات المهنية"},
        "professional_bio": {"en": "PROFESSIONAL BIO", "fr": "BIO PROFESSIONNELLE", "ar": "السيرة المهنية"},
        "diagnosis": {"en": "DIAGNOSIS", "fr": "DIAGNOSTIC", "ar": "التشخيص"},
        "glucose_targets": {"en": "GLUCOSE TARGETS (mg/dL)", "fr": "OBJECTIFS DE GLUCOSE (mg/dL)", "ar": "أهداف الجلوكوز (ملغ/دسل)"},
        "treatment": {"en": "TREATMENT", "fr": "TRAITEMENT", "ar": "العلاج"},
        "lifestyle": {"en": "LIFESTYLE & COMORBIDITIES", "fr": "STYLE DE VIE ET COMORBIDITÉS", "ar": "نمط الحياة والأمراض المصاحبة"},
        "emergency_contact": {"en": "EMERGENCY CONTACT", "fr": "CONTACT D'URGENCE", "ar": "جهة اتصال الطوارئ"},
        
        # Field Labels
        "full_name_label": {"en": "Full Name *", "fr": "Nom complet *", "ar": "الاسم الكامل *"},
        "phone_label": {"en": "Phone Number", "fr": "Numéro de téléphone", "ar": "رقم الهاتف"},
        "birth_date_label": {"en": "Birth Date *", "fr": "Date de naissance *", "ar": "تاريخ الميلاد *"},
        "gender_label": {"en": "Gender *", "fr": "Genre *", "ar": "الجنس *"},
        "weight_label": {"en": "Weight (kg)", "fr": "Poids (kg)", "ar": "الوزن (كغ)"},
        "height_label": {"en": "Height (cm)", "fr": "Taille (cm)", "ar": "الطول (سم)"},
        "bmi_label": {"en": "BMI", "fr": "IMC", "ar": "مؤشر كتلة الجسم"},
        "wilaya_label": {"en": "Wilaya *", "fr": "Wilaya *", "ar": "الولاية *"},
        "commune_label": {"en": "Commune *", "fr": "Commune *", "ar": "البلدية *"},
        "specialization_label": {"en": "Specialization *", "fr": "Spécialisation *", "ar": "التخصص *"},
        "medical_license_label": {"en": "Medical License ID *", "fr": "ID Licence Médicale *", "ar": "رقم الترخيص الطبي *"},
        "hospital_label": {"en": "Hospital or Clinic", "fr": "Hôpital ou Clinique", "ar": "المستشفى أو العيادة"},
        "experience_label": {"en": "Years of Experience", "fr": "Années d'expérience", "ar": "سنوات الخبرة"},
        "bio_label": {"en": "Professional Bio", "fr": "Bio professionnelle", "ar": "السيرة المهنية"},
        "diabetes_type_label": {"en": "Diabetes Type *", "fr": "Type de diabète *", "ar": "نوع السكري *"},
        "diagnosis_year_label": {"en": "Diagnosis Year", "fr": "Année du diagnostic", "ar": "سنة التشخيص"},
        "hba1c_label": {"en": "Latest HbA1c (%)", "fr": "Dernier HbA1c (%)", "ar": "آخر تحليل HbA1c (%)"},
        "min_label": {"en": "Min", "fr": "Min", "ar": "الأدنى"},
        "max_label": {"en": "Max", "fr": "Max", "ar": "الأقصى"},
        "insulin_regimen_label": {"en": "Insulin Regimen", "fr": "Régime d'insuline", "ar": "نظام الأنسولين"},
        "uses_cgm_label": {"en": "Uses CGM (Continuous Glucose Monitor)", "fr": "Utilise un CGM", "ar": "يستخدم جهاز مراقبة السكر (CGM)"},
        "hypertension_label": {"en": "Hypertension (high blood pressure)", "fr": "Hypertension", "ar": "ارتفاع ضغط الدم"},
        "dyslipidemia_label": {"en": "Dyslipidemia (cholesterol issues)", "fr": "Dyslipidémie", "ar": "اضطراب دهون الدم (الكوليسترول)"},
        "contact_name_label": {"en": "Contact Name", "fr": "Nom du contact", "ar": "اسم جهة الاتصال"},
        "contact_phone_label": {"en": "Contact Phone", "fr": "Téléphone du contact", "ar": "رقم جهة الاتصال"},
        
        # Placeholders
        "name_placeholder": {"en": "Ahmed Benali", "fr": "Ahmed Benali", "ar": "أحمد بن علي"},
        "phone_placeholder": {"en": "+213 555 000 000", "fr": "+213 555 000 000", "ar": "+213 555 000 000"},
        "weight_placeholder": {"en": "70", "fr": "70", "ar": "70"},
        "height_placeholder": {"en": "175", "fr": "175", "ar": "175"},
        "wilaya_placeholder": {"en": "Select province", "fr": "Sélectionner la province", "ar": "اختر الولاية"},
        "commune_placeholder": {"en": "Select commune", "fr": "Sélectionner la commune", "ar": "اختر البلدية"},
        "commune_error": {"en": "First select a wilaya", "fr": "Sélectionnez d'abord une wilaya", "ar": "يرجى اختيار ولاية أولا"},
        "specialization_placeholder": {"en": "Choose your specialty", "fr": "Choisissez votre spécialité", "ar": "اختر تخصصك"},
        "medical_license_placeholder": {"en": "License number or ID", "fr": "Numéro de licence ou ID", "ar": "رقم الترخيص أو الهوية"},
        "hospital_placeholder": {"en": "Hospital or Clinic name", "fr": "Nom de l'hôpital ou de la clinique", "ar": "اسم المستشفى أو العيادة"},
        "experience_placeholder": {"en": "Example: 10", "fr": "Exemple : 10", "ar": "مثال: 10"},
        "bio_placeholder": {"en": "Briefly describe your expertise...", "fr": "Décrivez brièvement votre expertise...", "ar": "صف خبرتك وتركيزك باختصار..."},
        "diagnosis_year_placeholder": {"en": "2015", "fr": "2015", "ar": "2015"},
        "hba1c_placeholder": {"en": "7.2", "fr": "7.2", "ar": "7.2"},
        "min_placeholder": {"en": "80", "fr": "80", "ar": "80"},
        "max_placeholder": {"en": "180", "fr": "180", "ar": "180"},
        "family_friend_placeholder": {"en": "Family member or friend", "fr": "Membre de la famille ou ami", "ar": "قريب أو صديق"},
    }
    
    # Enums sync
    enums = {
        "gender": {
            "male": {"en": "Male", "fr": "Homme", "ar": "ذكر"},
            "female": {"en": "Female", "fr": "Femme", "ar": "أنثى"},
        },
        "diabetes_type": {
            "type1": {"en": "Type 1", "fr": "Type 1", "ar": "النوع 1"},
            "type2": {"en": "Type 2", "fr": "Type 2", "ar": "النوع 2"},
            "gestational": {"en": "Gestational", "fr": "Gestationnel", "ar": "سكري الحمل"},
            "prediabetes": {"en": "Pre-diabetes", "fr": "Prédiabète", "ar": "مرحلة ما قبل السكري"},
            "other": {"en": "Other", "fr": "Autre", "ar": "آخر"},
        },
        "diabetes_desc": {
            "type1": {"en": "Autoimmune, insulin dependent", "fr": "Auto-immune, insulinodépendant", "ar": "مناعي ذاتي، معتمد على الأنسولين"},
            "type2": {"en": "Insulin resistance", "fr": "Résistance à l'insuline", "ar": "مقاومة الأنسولين"},
            "gestational": {"en": "During pregnancy", "fr": "Pendant la grossesse", "ar": "أثناء الحمل"},
            "prediabetes": {"en": "At risk", "fr": "À risque", "ar": "معرض للخطر"},
            "other": {"en": "LADA, MODY, etc.", "fr": "LADA, MODY, etc.", "ar": "LADA ،MODY، إلخ"},
        },
        "insulin_regimen": {
            "none": {"en": "None", "fr": "Aucun", "ar": "لا يوجد"},
            "basal_only": {"en": "Basal only", "fr": "Basal uniquement", "ar": "قاعدي فقط"},
            "basal_bolus": {"en": "Basal + Bolus", "fr": "Basal + Bolus", "ar": "قاعدي + سريع"},
            "pump": {"en": "Insulin pump", "fr": "Pompe à insuline", "ar": "مضخة"},
            "premixed": {"en": "Pre-mixed", "fr": "Prémélangé", "ar": "مخلوط مسبقاً"},
        },
        "activity_level": {
            "sedentary": {"en": "Sedentary", "fr": "Sédentaire", "ar": "خامل"},
            "light": {"en": "Light", "fr": "Léger", "ar": "خفيف"},
            "moderate": {"en": "Moderate", "fr": "Modéré", "ar": "متوسط"},
            "active": {"en": "Active", "fr": "Actif", "ar": "نشط"},
            "very_active": {"en": "Very Active", "fr": "Très actif", "ar": "نشط جداً"},
        }
    }

    for lang in languages:
        file_path = os.path.join(locales_dir, f"{lang}.json")
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Update profile_setup
        if "profile_setup" not in data:
            data["profile_setup"] = {}
        for key, vals in profile_setup_keys.items():
            data["profile_setup"][key] = vals[lang]
        
        # Update enums
        if "enums" not in data:
            data["enums"] = {}
        for cat, keys in enums.items():
            if cat not in data["enums"]:
                data["enums"][cat] = {}
            for key, vals in keys.items():
                data["enums"][cat][key] = vals[lang]
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
    print("Locales synchronized successfully.")

if __name__ == "__main__":
    update_locales()
