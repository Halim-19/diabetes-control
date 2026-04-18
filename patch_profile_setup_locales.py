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
        if isinstance(values, dict):
            for k, v in values.items():
                if isinstance(v, dict) and k in data[section] and isinstance(data[section][k], dict):
                    data[section][k].update(v)
                else:
                    data[section][k] = v
        else:
            data[section] = values

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en_updates = {
    "profile_setup": {
        "personal_info": "Personal Info",
        "professional_info": "Professional Info",
        "diabetes_info": "Diabetes Info",
        "step_progress": "Step {{current}} of {{total}}",
        "back": "Back",
        "continue": "Continue",
        "save_continue": "Save & Continue",
        "male": "Male",
        "female": "Female",
        "bmi_label": "BMI",
        "specialization_label": "Specialization *",
        "specialization_placeholder": "Choose your specialty",
        "medical_license_label": "Medical License ID *",
        "medical_license_placeholder": "License number or ID",
        "hospital_placeholder": "Hospital or Clinic name",
        "bio_placeholder": "Briefly describe your expertise and focus...",
        "diabetes_type_label": "Diabetes Type *",
        "diagnosis_year_label": "Diagnosis Year",
        "hba1c_label": "Latest HbA1c (%)",
        "min_label": "Min",
        "max_label": "Max",
        "insulin_regimen_label": "Insulin Regimen",
        "uses_cgm_label": "Uses CGM (Continuous Glucose Monitor)",
        "hypertension_label": "Hypertension (high blood pressure)",
        "dyslipidemia_label": "Dyslipidemia (cholesterol issues)",
        "contact_name_label": "Contact Name",
        "contact_phone_label": "Contact Phone",
        "family_friend_placeholder": "Family member or friend",
        "diagnosis_year_placeholder": "2015",
        "hba1c_placeholder": "7.2"
    },
    "enums": {
        "specialization": {
            "endocrinologist": "Endocrinologist",
            "diabetologist": "Diabetologist",
            "general_practitioner": "General Practitioner",
            "internal_medicine": "Internal Medicine",
            "cardiologist": "Cardiologist",
            "nutritionist": "Nutritionist",
            "pediatrician": "Pediatrician",
            "other": "Other"
        },
        "diabetes_desc": {
            "type1": "Autoimmune, insulin dependent",
            "type2": "Insulin resistance",
            "gestational": "During pregnancy",
            "prediabetes": "At risk",
            "other": "MODY, LADA, etc."
        }
    }
}

fr_updates = {
    "profile_setup": {
        "personal_info": "Infos Personnelles",
        "professional_info": "Infos Professionnelles",
        "diabetes_info": "Infos Diabète",
        "step_progress": "Étape {{current}} sur {{total}}",
        "back": "Retour",
        "continue": "Continuer",
        "save_continue": "Enregistrer et continuer",
        "male": "Homme",
        "female": "Femme",
        "bmi_label": "IMC",
        "specialization_label": "Spécialisation *",
        "specialization_placeholder": "Choisissez votre spécialité",
        "medical_license_label": "ID de licence médicale *",
        "medical_license_placeholder": "Numéro de licence ou ID",
        "hospital_placeholder": "Nom de l'hôpital ou de la clinique",
        "bio_placeholder": "Décrivez brièvement votre expertise...",
        "diabetes_type_label": "Type de diabète *",
        "diagnosis_year_label": "Année du diagnostic",
        "hba1c_label": "Dernier HbA1c (%)",
        "min_label": "Min",
        "max_label": "Max",
        "insulin_regimen_label": "Système d'insuline",
        "uses_cgm_label": "Utilise un CGM (moniteur de glucose continu)",
        "hypertension_label": "Hypertension (pression artérielle élevée)",
        "dyslipidemia_label": "Dyslipidémie (problèmes de cholestérol)",
        "contact_name_label": "Nom du contact",
        "contact_phone_label": "Téléphone du contact",
        "family_friend_placeholder": "Membre de la famille ou ami",
        "diagnosis_year_placeholder": "2015",
        "hba1c_placeholder": "7,2"
    },
    "enums": {
        "specialization": {
            "endocrinologist": "Endocrinologue",
            "diabetologist": "Diabétologue",
            "general_practitioner": "Généraliste",
            "internal_medicine": "Médecine interne",
            "cardiologist": "Cardiologue",
            "nutritionist": "Nutritionniste",
            "pediatrician": "Pédiatre",
            "other": "Autre"
        },
        "diabetes_desc": {
            "type1": "Auto-immune, dépendant de l'insuline",
            "type2": "Résistance à l'insuline",
            "gestational": "Pendant la grossesse",
            "prediabetes": "À risque",
            "other": "MODY, LADA, etc."
        }
    }
}

ar_updates = {
    "profile_setup": {
        "personal_info": "المعلومات الشخصية",
        "professional_info": "المعلومات المهنية",
        "diabetes_info": "معلومات السكري",
        "step_progress": "الخطوة {{current}} من {{total}}",
        "back": "رجوع",
        "continue": "متابعة",
        "save_continue": "حفظ ومتابعة",
        "male": "ذكر",
        "female": "أنثى",
        "bmi_label": "مؤشر كتلة الجسم",
        "specialization_label": "التخصص *",
        "specialization_placeholder": "اختر تخصصك",
        "medical_license_label": "رقم الترخيص الطبي *",
        "medical_license_placeholder": "رقم الترخيص أو الهوية",
        "hospital_placeholder": "اسم المستشفى أو العيادة",
        "bio_placeholder": "صف خبرتك وتركيزك باختصار...",
        "diabetes_type_label": "نوع السكري *",
        "diagnosis_year_label": "سنة التشخيص",
        "hba1c_label": "آخر تحليل HbA1c (%)",
        "min_label": "الأدنى",
        "max_label": "الأقصى",
        "insulin_regimen_label": "نظام الأنسولين",
        "uses_cgm_label": "يستخدم جهاز مراقبة السكر (CGM)",
        "hypertension_label": "ارتفاع ضغط الدم",
        "dyslipidemia_label": "اضطراب دهون الدم (الكوليسترول)",
        "contact_name_label": "اسم جهة الاتصال",
        "contact_phone_label": "رقم جهة الاتصال",
        "family_friend_placeholder": "قريب أو صديق",
        "diagnosis_year_placeholder": "2015",
        "hba1c_placeholder": "7.2"
    },
    "enums": {
        "specialization": {
            "endocrinologist": "طبيب غدد صماء",
            "diabetologist": "طبيب سكري",
            "general_practitioner": "طبيب عام",
            "internal_medicine": "طب باطني",
            "cardiologist": "طبيب قلب",
            "nutritionist": "أخصائي تغذية",
            "pediatrician": "طبيب أطفال",
            "other": "آخر"
        },
        "diabetes_desc": {
            "type1": "مناعي ذاتي، معتمد على الأنسولين",
            "type2": "مقاومة الأنسولين",
            "gestational": "أثناء الحمل",
            "prediabetes": "معرض للخطر",
            "other": "MODY, LADA, إلخ."
        }
    }
}

update_locale('en', en_updates)
update_locale('fr', fr_updates)
update_locale('ar', ar_updates)
print("Locales patched successfully.")
