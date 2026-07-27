import { View, StyleSheet, ScrollView } from "react-native";
import EmergencyTypeCard, { EmergencyTypeOption } from "../EmergencyTypeCard";
import SectionHeader from "../../common/SectionHeader";

export const EMERGENCY_TYPES: EmergencyTypeOption[] = [
  {
    id: "medical",
    label: "Medical Emergency",
    iconName: "local-hospital",
    description: "Severe injury, cardiac arrest, or acute trauma.",
  },
  {
    id: "fire",
    label: "Fire",
    iconName: "local-fire-department",
    description: "Structure fire, wildfire, or explosive hazard.",
  },
  {
    id: "flood",
    label: "Flood",
    iconName: "water",
    description: "Flash flooding, rising water, or broken levee.",
  },
  {
    id: "collapse",
    label: "Building Collapse",
    iconName: "domain",
    description: "Structural failure, earthquake damage, or entrapment.",
  },
  {
    id: "electrical",
    label: "Electrical Hazard",
    iconName: "bolt",
    description: "Downed power lines or substation explosion.",
  },
  {
    id: "accident",
    label: "Road Accident",
    iconName: "minor-crash",
    description: "Major traffic collision or hazardous transport spill.",
  },
  {
    id: "missing",
    label: "Missing Person",
    iconName: "person-search",
    description: "Unaccounted individual during disaster evacuation.",
  },
  {
    id: "other",
    label: "Other Emergency",
    iconName: "error-outline",
    description: "General rescue request or unspecified disaster.",
  },
];

interface Props {
  selectedTypeId: string | null;
  onSelectType: (id: string) => void;
}

export default function StepTypeSelection({ selectedTypeId, onSelectType }: Props) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SectionHeader title="Select Emergency Category" />
      
      <View style={styles.list}>
        {EMERGENCY_TYPES.map((option) => (
          <EmergencyTypeCard
            key={option.id}
            option={option}
            isSelected={selectedTypeId === option.id}
            onSelect={onSelectType}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 20,
  },
});
