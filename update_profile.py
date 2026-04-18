import codecs

path = r"c:\Users\mim\Desktop\agency\startup\diabetes-control\app\(doctor)\profile.tsx"
with codecs.open(path, "r", "utf-8") as f:
    code = f.read()

# Add useTranslation import
if "useTranslation" not in code:
    code = code.replace("import { useTheme } from '@/context/ThemeContext';", 
                        "import { useTheme } from '@/context/ThemeContext';\nimport { useTranslation } from 'react-i18next';")

# Add t hook
if "const { t } = useTranslation();" not in code:
    code = code.replace("const { theme } = useTheme();",
                        "const { theme } = useTheme();\n  const { t } = useTranslation();")


# Replace text inside tags first
code = code.replace(">My Profile<", ">{t('doctor.profile.title', 'My Profile')}<")
code = code.replace(">Cancel<", ">{t('common.cancel', 'Cancel')}<")
code = code.replace(">Save<", ">{t('common.save', 'Save')}<")
code = code.replace(">✏️ Edit<", ">{t('common.edit', '✏️ Edit')}<")

# String literals replace
code = code.replace("?? 'Doctor'", "?? t('common.doctor', 'Doctor')")
code = code.replace("?? 'Specialization Not Set'", "?? t('doctor.profile.specialization_not_set', 'Specialization Not Set')")
code = code.replace(" yrs<", " {t('doctor.profile.yrs', 'yrs')}<")
code = code.replace(">Exp<", ">{t('doctor.profile.exp', 'Exp')}<")

code = code.replace('title="Professional Details"', 'title={t("doctor.profile.professional_details", "Professional Details")}')
code = code.replace('label="Specialization *"', 'label={t("doctor.profile.specialization", "Specialization *")}')
code = code.replace('placeholder="Choose specialty"', 'placeholder={t("doctor.profile.choose_specialty", "Choose specialty")}')

code = code.replace('text="Medical License ID"', 'text={t("doctor.profile.medical_license", "Medical License ID")}')
code = code.replace('placeholder="License number"', 'placeholder={t("doctor.profile.license_number", "License number")}')

code = code.replace('text="Current Workplace"', 'text={t("doctor.profile.workplace", "Current Workplace")}')
code = code.replace('placeholder="Hospital/Clinic name"', 'placeholder={t("doctor.profile.workplace_placeholder", "Hospital/Clinic name")}')

code = code.replace('text="Years of Experience"', 'text={t("doctor.profile.experience_years", "Years of Experience")}')
code = code.replace('placeholder="e.g. 10"', 'placeholder={t("doctor.profile.experience_placeholder", "e.g. 10")}')

code = code.replace('text="Professional Bio"', 'text={t("doctor.profile.bio", "Professional Bio")}')
code = code.replace('placeholder="Describe your background..."', 'placeholder={t("doctor.profile.bio_placeholder", "Describe your background...")}')

code = code.replace('title="Work Location"', 'title={t("doctor.profile.work_location", "Work Location")}')
code = code.replace('>Set your clinic or hospital location so patients can find you on the map.<', '>{t("doctor.profile.location_desc", "Set your clinic or hospital location so patients can find you on the map.")}<')
code = code.replace('>Set to Current Position<', '>{t("doctor.profile.set_current_position", "Set to Current Position")}<')

code = code.replace('text="Latitude"', 'text={t("doctor.profile.latitude", "Latitude")}')
code = code.replace('text="Longitude"', 'text={t("doctor.profile.longitude", "Longitude")}')

code = code.replace('label="Specialty"', 'label={t("doctor.profile.specialty_label", "Specialty")}')
code = code.replace('label="License"', 'label={t("doctor.profile.license_label", "License")}')
code = code.replace('label="Workplace"', 'label={t("doctor.profile.workplace_label", "Workplace")}')
code = code.replace('label="Experience"', 'label={t("doctor.profile.experience_label", "Experience")}')
code = code.replace("|| 'No bio provided'", "|| t('doctor.profile.no_bio', 'No bio provided')")

code = code.replace('title="Personal Information"', 'title={t("doctor.profile.personal_info", "Personal Information")}')
code = code.replace('text="Full Name"', 'text={t("doctor.profile.full_name", "Full Name")}')
code = code.replace('text="Phone"', 'text={t("doctor.profile.phone", "Phone")}')
code = code.replace('text="Date of Birth"', 'text={t("doctor.profile.dob", "Date of Birth")}')
code = code.replace('text="Gender"', 'text={t("doctor.profile.gender", "Gender")}')
code = code.replace('label="Wilaya *"', 'label={t("doctor.profile.wilaya", "Wilaya *")}')
code = code.replace('placeholder="Select province"', 'placeholder={t("doctor.profile.select_wilaya", "Select province")}')
code = code.replace('label="Commune *"', 'label={t("doctor.profile.commune", "Commune *")}')
code = code.replace('placeholder={form.wilaya ? "Select commune" : "First select a wilaya"}', 'placeholder={form.wilaya ? t("doctor.profile.select_commune", "Select commune") : t("doctor.profile.select_wilaya_first", "First select a wilaya")}')

code = code.replace("'Not set'", "t('doctor.profile.not_set', 'Not set')")
code = code.replace('label="Work Location"', 'label={t("doctor.profile.work_location", "Work Location")}')

code = code.replace(">Sign Out<", '>{t("common.sign_out", "Sign Out")}<')
code = code.replace("Alert.alert('Sign Out', 'Are you sure you want to sign out?',", "Alert.alert(t('common.sign_out', 'Sign Out'), t('common.confirm_sign_out', 'Are you sure you want to sign out?'),")
code = code.replace("{ text: 'Cancel', style: 'cancel' }", "{ text: t('common.cancel', 'Cancel'), style: 'cancel' }")
code = code.replace("{ text: 'Sign Out', style: 'destructive', onPress: logout }", "{ text: t('common.sign_out', 'Sign Out'), style: 'destructive', onPress: logout }")

code = code.replace('label="Full Name"', 'label={t("doctor.profile.full_name", "Full Name")}')
code = code.replace('label="Phone"', 'label={t("doctor.profile.phone", "Phone")}')
code = code.replace('label="Date of Birth"', 'label={t("doctor.profile.dob", "Date of Birth")}')
code = code.replace('label="Gender"', 'label={t("doctor.profile.gender", "Gender")}')
code = code.replace('label="Wilaya"', 'label={t("doctor.profile.wilaya", "Wilaya *")}')
code = code.replace('label="Commune"', 'label={t("doctor.profile.commune", "Commune *")}')

code = code.replace("Alert.alert('Success', 'Work location set to your current position.')", "Alert.alert(t('common.success', 'Success'), t('doctor.profile.location_success', 'Work location set to your current position.'))")
code = code.replace("Alert.alert('Error', 'Could not fetch current location.')", "Alert.alert(t('common.error', 'Error'), t('doctor.profile.location_error', 'Could not fetch current location.'))")
code = code.replace("Alert.alert('Permission Denied', 'Allow location access to set your workplace.')", "Alert.alert(t('common.error', 'Error'), t('doctor.profile.location_permission', 'Allow location access to set your workplace.'))")


# Write back
with codecs.open(path, "w", "utf-8") as f:
    f.write(code)

print("Done updating profile.")
