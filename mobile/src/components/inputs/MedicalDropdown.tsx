import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

interface MedicalDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  required?: boolean;
}

export default function MedicalDropdown({
  label,
  options,
  value,
  onChangeText,
  placeholder,
  required = false,
}: MedicalDropdownProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Determine if current value is one of the predefined options
  const isPredefined = options.filter((o) => o !== 'Other (Type custom...)').includes(value);
  const selectedDisplay = isPredefined ? value : (value ? 'Other (Type custom...)' : '');

  const handleSelect = (option: string) => {
    setIsOpen(false);
    if (option === 'Other (Type custom...)') {
      onChangeText('');
    } else {
      onChangeText(option);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {required && <Text style={styles.requiredStar}>*</Text>}
      </View>

      <Pressable
        style={[
          styles.dropdownTrigger,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isOpen && { borderColor: Colors.primary }
        ]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[styles.triggerText, { color: selectedDisplay ? colors.text : colors.textSecondary }]}>
          {selectedDisplay || placeholder}
        </Text>
        <MaterialIcons name={isOpen ? 'arrow-drop-up' : 'arrow-drop-down'} size={24} color={colors.textSecondary} />
      </Pressable>

      {isOpen && (
        <View style={[styles.optionsContainer, { backgroundColor: colors.surfaceElevated || colors.surface, borderColor: colors.border }]}>
          {options.map((option) => {
            const isSelected = selectedDisplay === option;
            return (
              <Pressable
                key={option}
                style={[
                  styles.optionItem,
                  { borderBottomColor: colors.border },
                  isSelected && { backgroundColor: `${Colors.primary}15` }
                ]}
                onPress={() => handleSelect(option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.text },
                    isSelected && { color: Colors.primary, fontWeight: '700' }
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Show custom input if value is custom or user selected Other */}
      {(!isPredefined || selectedDisplay === 'Other (Type custom...)') && (
        <TextInput
          style={[
            styles.customInput,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder="Type custom details..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={2}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  requiredStar: {
    color: Colors.danger,
    marginLeft: 4,
    fontWeight: '700',
  },
  dropdownTrigger: {
    height: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  triggerText: {
    fontSize: 16,
  },
  optionsContainer: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
    zIndex: 1000,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 15,
  },
  customInput: {
    marginTop: 8,
    minHeight: 60,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
