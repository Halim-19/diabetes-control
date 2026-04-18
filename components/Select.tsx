import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  placeholder?: string;
  options: (string | SelectOption)[];
  value: string | null;
  onSelect: (value: string) => void;
  error?: string;
}

export default function Select({
  label,
  placeholder = "",
  options,
  value,
  onSelect,
  error,
}: SelectProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const s = useMemo(() => createStyles(theme), [theme]);

  // Normalize options to SelectOption[]
  const normalizedOptions = useMemo(() => {
    return options.map((opt) =>
      typeof opt === "string" ? { label: opt, value: opt } : opt,
    );
  }, [options]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q),
    );
  }, [normalizedOptions, searchQuery]);

  const handleOpen = () => {
    setModalVisible(true);
    setSearchQuery("");
  };

  const handleSelect = (val: string) => {
    onSelect(val);
    setModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  return (
    <View style={s.container}>
      {label && <Text style={s.label}>{label}</Text>}

      <Pressable
        style={[s.trigger, error && s.triggerError]}
        onPress={handleOpen}
      >
        <Text style={[s.triggerText, !value && s.placeholder]}>
          {selectedOption?.label ||
            placeholder ||
            t("common.select_option", "Select an option")}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
      </Pressable>

      {error && <Text style={s.errorText}>{error}</Text>}

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={s.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
            <Text style={s.modalTitle}>{label}</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={s.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={theme.textMuted}
              style={s.searchIcon}
            />
            <TextInput
              style={s.searchInput}
              placeholder={t("common.search", "Search...")}
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.value}
            initialNumToRender={20}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <Pressable
                style={[s.option, value === item.value && s.optionSelected]}
                onPress={() => handleSelect(item.value)}
              >
                <Text
                  style={[
                    s.optionText,
                    value === item.value && s.optionTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
                {value === item.value && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={s.emptyContainer}>
                <Text style={s.emptyText}>
                  {t("common.no_matches", "No matches found")} (
                  {t("common.options", "Options")}: {options.length})
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginBottom: 4,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textMuted,
      marginBottom: 8,
    },
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    triggerError: {
      borderColor: theme.danger,
    },
    triggerText: {
      fontSize: 14,
      color: theme.text,
    },
    placeholder: {
      color: theme.textMuted,
    },
    errorText: {
      fontSize: 12,
      color: theme.danger,
      marginTop: 4,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.card,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
      paddingVertical: 8,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.card,
    },
    optionSelected: {
      backgroundColor: theme.primary + "10",
    },
    optionText: {
      fontSize: 15,
      color: theme.text,
    },
    optionTextSelected: {
      color: theme.primary,
      fontWeight: "600",
    },
    emptyContainer: {
      padding: 40,
      alignItems: "center",
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 14,
    },
  });
