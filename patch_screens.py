import codecs
import re
import os

def insert_translation_imports(path):
    with codecs.open(path, 'r', 'utf-8') as f:
        code = f.read()

    if "from 'react-i18next'" not in code:
        code = code.replace("import { useTheme } from '@/context/ThemeContext';", "import { useTheme } from '@/context/ThemeContext';\nimport { useTranslation } from 'react-i18next';")
        # specific fallback for Select.tsx
        code = code.replace("import { useTheme } from '@/context/ThemeContext';\nimport { Ionicons }", "import { useTheme } from '@/context/ThemeContext';\nimport { useTranslation } from 'react-i18next';\nimport { Ionicons }")
        
        # auth profileSetup fallback
        if "from 'react-i18next'" not in code:
            code = code.replace("import { useAuth } from '@/context/AuthContext';", "import { useAuth } from '@/context/AuthContext';\nimport { useTranslation } from 'react-i18next';")

    if "const { t } = useTranslation();" not in code:
        code = code.replace("const { theme } = useTheme();", "const { theme } = useTheme();\n    const { t } = useTranslation();")
        code = code.replace("const { session, refreshProfile, role } = useAuth();", "const { session, refreshProfile, role } = useAuth();\n  const { t } = useTranslation();")

    with codecs.open(path, 'w', 'utf-8') as f:
        f.write(code)

base_dir = r"c:\Users\mim\Desktop\agency\startup\diabetes-control"

# 1. PatientsScreen.tsx
p_screen = os.path.join(base_dir, "components", "screens", "PatientsScreen.tsx")
insert_translation_imports(p_screen)
with codecs.open(p_screen, 'r', 'utf-8') as f:
    code = f.read()

code = code.replace("Alert.alert('Info', 'This patient is already in your list.')", "Alert.alert(t('common.info', 'Info'), t('doctor.patients.already_linked', 'This patient is already in your list.'))")
code = code.replace("Alert.alert('Error', 'Could not add patient.')", "Alert.alert(t('common.error', 'Error'), t('doctor.patients.add_error', 'Could not add patient.'))")
code = code.replace("Alert.alert('Success', 'Patient added successfully.')", "Alert.alert(t('common.success', 'Success'), t('doctor.patients.add_success', 'Patient added successfully.'))")
code = code.replace("Alert.alert('Error', 'Could not accept request.')", "Alert.alert(t('common.error', 'Error'), t('doctor.patients.accept_error', 'Could not accept request.'))")
code = code.replace("Alert.alert('Search Error', error.message)", "Alert.alert(t('doctor.patients.search_error', 'Search Error'), error.message)")

code = code.replace(">Your Patients<", ">{t('doctor.patients.title', 'Your Patients')}<")
code = code.replace(">{accepted.length} active patients<", ">{t('doctor.patients.active_count', { count: accepted.length, defaultValue: '{{count}} active patients' })}<")
code = code.replace(">Add<", ">{t('doctor.patients.add', 'Add')}<")
code = code.replace('placeholder="Filter by name or phone..."', 'placeholder={t("doctor.patients.filter", "Filter by name or phone...")}')
code = code.replace("title: 'Pending Requests'", "title: t('doctor.patients.pending', 'Pending Requests')")
code = code.replace("title: 'My Patients'", "title: t('doctor.patients.my_patients', 'My Patients')")
code = code.replace(">No patients found.<", ">{t('doctor.patients.empty', 'No patients found.')}<")
code = code.replace(">Add New Patient<", ">{t('doctor.patients.add_new', 'Add New Patient')}<")
code = code.replace('placeholder="Search by name or phone..."', 'placeholder={t("doctor.patients.search_placeholder", "Search by name or phone...")}')
code = code.replace(">Link<", ">{t('doctor.patients.link', 'Link')}<")
code = code.replace(">Accept<", ">{t('doctor.patients.accept', 'Accept')}<")
code = code.replace(">No matches found.<", ">{t('common.no_matches', 'No matches found.')}<")

with codecs.open(p_screen, 'w', 'utf-8') as f:
    f.write(code)

# 2. Select.tsx
s_screen = os.path.join(base_dir, "components", "Select.tsx")
insert_translation_imports(s_screen)
with codecs.open(s_screen, 'r', 'utf-8') as f:
    code = f.read()

code = code.replace("placeholder = 'Select an option'", "placeholder = ''")
code = code.replace("{value || placeholder}", "{value || (placeholder || t('common.select_option', 'Select an option'))}")
code = code.replace('placeholder="Search..."', 'placeholder={t("common.search", "Search...")}')
code = code.replace(">No matches found (Options: {options.length})<", ">{t('common.no_matches', 'No matches found')} ({t('common.options', 'Options')}: {options.length})<")

with codecs.open(s_screen, 'w', 'utf-8') as f:
    f.write(code)


# 3. ExploreScreen.tsx
e_screen = os.path.join(base_dir, "components", "screens", "ExploreScreen.tsx")
insert_translation_imports(e_screen)
with codecs.open(e_screen, 'r', 'utf-8') as f:
    code = f.read()

code = code.replace(">Explore<", ">{t('patient.explore.title', 'Explore')}<")
code = code.replace('placeholder="Search activities..."', 'placeholder={t("patient.explore.search", "Search activities...")}')

with codecs.open(e_screen, 'w', 'utf-8') as f:
    f.write(code)


# 4. StatsScreen.tsx
st_screen = os.path.join(base_dir, "components", "screens", "StatsScreen.tsx")
insert_translation_imports(st_screen)
with codecs.open(st_screen, 'r', 'utf-8') as f:
    code = f.read()

code = code.replace(">Admin Stats<", ">{t('doctor.stats.title', 'Admin Stats')}<")
code = code.replace(">Platform overview · Apr 9<", ">{t('doctor.stats.subtitle', 'Platform overview')} · Apr 9<")
code = code.replace(">Log out<", ">{t('doctor.stats.logout', 'Log out')}<")
code = code.replace(">RECENT ACTIVITY<", ">{t('doctor.stats.recent_activity', 'RECENT ACTIVITY')}<")

code = code.replace("label: 'Total Patients'", "label: t('doctor.stats.total_patients', 'Total Patients')")
code = code.replace("label: 'Active Doctors'", "label: t('doctor.stats.active_doctors', 'Active Doctors')")
code = code.replace("label: 'Avg Daily Steps'", "label: t('doctor.stats.avg_steps', 'Avg Daily Steps')")
code = code.replace("label: 'Instructions Sent'", "label: t('doctor.stats.instructions_sent', 'Instructions Sent')")

with codecs.open(st_screen, 'w', 'utf-8') as f:
    f.write(code)

# 5. InstructionsScreen.tsx
i_screen = os.path.join(base_dir, "components", "screens", "InstructionsScreen.tsx")
insert_translation_imports(i_screen)
with codecs.open(i_screen, 'r', 'utf-8') as f:
    code = f.read()

code = code.replace(">Instructions<", ">{t('patient.instructions.title', 'Instructions')}<")
code = code.replace(">Guidelines from your care team<", ">{t('patient.instructions.subtitle', 'Guidelines from your care team')}<")

with codecs.open(i_screen, 'w', 'utf-8') as f:
    f.write(code)

# 6. profileSetup.tsx
ps_screen = os.path.join(base_dir, "app", "(auth)", "profileSetup.tsx")
insert_translation_imports(ps_screen)
with codecs.open(ps_screen, 'r', 'utf-8') as f:
    code = f.read()

code = code.replace(">Personal Info<", ">{t('profile_setup.personal_info', 'Personal Info')}<")
code = code.replace(">Professional Info<", ">{t('profile_setup.professional_info', 'Professional Info')}<")
code = code.replace(">Diabetes Info<", ">{t('profile_setup.diabetes_info', 'Diabetes Info')}<")
code = code.replace(">Step {step + 1} of {TOTAL_STEPS}<", ">{t('profile_setup.step', 'Step')} {step + 1} {t('profile_setup.of', 'of')} {TOTAL_STEPS}<")
code = code.replace("Alert.alert('Upload Failed', 'There was an error saving your image.')", "Alert.alert(t('profile_setup.upload_failed', 'Upload Failed'), t('profile_setup.upload_error', 'There was an error saving your image.'))")

code = code.replace("Alert.alert('Required'", "Alert.alert(t('profile_setup.required', 'Required')")
code = code.replace("'Please enter your full name.')", "t('profile_setup.enter_full_name', 'Please enter your full name.'))")
code = code.replace("'Please select your birth date.')", "t('profile_setup.select_birth_date', 'Please select your birth date.'))")
code = code.replace("'Please select your gender.')", "t('profile_setup.select_gender', 'Please select your gender.'))")
code = code.replace("'Please select your wilaya.')", "t('profile_setup.select_wilaya', 'Please select your wilaya.'))")
code = code.replace("'Please select your commune.')", "t('profile_setup.select_commune', 'Please select your commune.'))")
code = code.replace("'Please select your diabetes type.')", "t('profile_setup.select_diabetes_type', 'Please select your diabetes type.'))")
code = code.replace("'Please provide your specialization and medical license.')", "t('profile_setup.select_specialization', 'Please provide your specialization and medical license.'))")
code = code.replace("Alert.alert('Error', error.message);", "Alert.alert(t('common.error', 'Error'), error.message);")

code = code.replace('text="BASIC DETAILS"', 'text={t("profile_setup.basic_details", "BASIC DETAILS")}')
code = code.replace(">Professional photo recommended<", ">{t('profile_setup.photo_hint', 'Professional photo recommended')}<")
code = code.replace('text="BODY MEASUREMENTS"', 'text={t("profile_setup.body_measurements", "BODY MEASUREMENTS")}')
code = code.replace('text="LOCATION"', 'text={t("profile_setup.location", "LOCATION")}')
code = code.replace('text="CREDENTIALS"', 'text={t("profile_setup.credentials", "CREDENTIALS")}')
code = code.replace('text="PROFESSIONAL BIO"', 'text={t("profile_setup.professional_bio", "PROFESSIONAL BIO")}')
code = code.replace('text="DIAGNOSIS"', 'text={t("profile_setup.diagnosis", "DIAGNOSIS")}')
code = code.replace('text="GLUCOSE TARGETS (mg/dL)"', 'text={t("profile_setup.glucose_targets", "GLUCOSE TARGETS (mg/dL)")}')
code = code.replace('text="TREATMENT"', 'text={t("profile_setup.treatment", "TREATMENT")}')
code = code.replace('text="LIFESTYLE & COMORBIDITIES"', 'text={t("profile_setup.lifestyle", "LIFESTYLE & COMORBIDITIES")}')
code = code.replace('text="EMERGENCY CONTACT"', 'text={t("profile_setup.emergency_contact", "EMERGENCY CONTACT")}')
code = code.replace(">BMI:", ">{t('profile_setup.bmi', 'BMI')}:")

code = code.replace('label="Wilaya *"', 'label={t("doctor.profile.wilaya", "Wilaya *")}')
code = code.replace('placeholder="Select province"', 'placeholder={t("doctor.profile.select_wilaya", "Select province")}')
code = code.replace('label="Commune *"', 'label={t("doctor.profile.commune", "Commune *")}')
code = code.replace('placeholder={personal.wilaya ? "Select commune" : "First select a wilaya"}', 'placeholder={personal.wilaya ? t("doctor.profile.select_commune", "Select commune") : t("doctor.profile.select_wilaya_first", "First select a wilaya")}')

code = code.replace('text="Full Name *"', 'text={t("doctor.profile.full_name", "Full Name") + " *"}')
code = code.replace('text="Phone Number"', 'text={t("doctor.profile.phone", "Phone Number")}')
code = code.replace('text="Date of Birth *"', 'text={t("doctor.profile.dob", "Date of Birth") + " *"}')
code = code.replace('text="Gender *"', 'text={t("doctor.profile.gender", "Gender") + " *"}')
code = code.replace('text="Weight (kg)"', 'text={t("doctor.detail.highlights.weight", "Weight") + " (kg)"}')
code = code.replace('text="Height (cm)"', 'text={t("doctor.profile.height", "Height") + " (cm)"}') # Assuming height wasn't in dict, but it works with fallback

with codecs.open(ps_screen, 'w', 'utf-8') as f:
    f.write(code)

print("Patched all screens successfully.")
