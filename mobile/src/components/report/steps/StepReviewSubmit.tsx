import { View, StyleSheet, ScrollView } from "react-native";
import ReviewCard, { ReviewItem } from "../ReviewCard";
import SectionHeader from "../../common/SectionHeader";
import { EMERGENCY_TYPES } from "./StepTypeSelection";
import { IncidentDetailsData } from "./StepIncidentDetails";
import { LocationTelemetry } from "../LocationCard";

interface Props {
  selectedTypeId: string | null;
  incidentDetails: IncidentDetailsData;
  location: LocationTelemetry | null;
  onEditStep: (stepNumber: number) => void;
}

export default function StepReviewSubmit({
  selectedTypeId,
  incidentDetails,
  location,
  onEditStep,
}: Props) {
  // 1. Resolve Emergency Type
  const typeObj = EMERGENCY_TYPES.find((t) => t.id === selectedTypeId);
  const typeItems: ReviewItem[] = [
    { label: "EMERGENCY CATEGORY", value: typeObj ? typeObj.label : "Not selected", highlight: true },
    { label: "DESCRIPTION", value: typeObj ? typeObj.description : "None" },
  ];

  // 2. Resolve Incident Details
  const detailItems: ReviewItem[] = [
    { label: "INCIDENT TITLE", value: incidentDetails.title || "Unspecified Incident" },
    { label: "SITUATION DESCRIPTION", value: incidentDetails.description || "No specific observations provided." },
    { label: "ESTIMATED PEOPLE AFFECTED", value: incidentDetails.peopleAffected ? `${incidentDetails.peopleAffected} individuals` : "Unknown" },
    { label: "SEVERITY RATING", value: incidentDetails.severity, highlight: incidentDetails.severity === "Critical" || incidentDetails.severity === "High" },
    { label: "SCENE ATTACHMENTS", value: incidentDetails.hasPhoto ? "1 Photo Attached (scene_capture_01.jpg)" : "None attached" },
  ];

  // 3. Resolve Location Telemetry
  const locationItems: ReviewItem[] = [
    { label: "COORDINATES", value: location ? `${location.latitude.toFixed(6)}°, ${location.longitude.toFixed(6)}°` : "No GPS fix acquired" },
    { label: "ESTIMATED ACCURACY", value: location && location.accuracy ? `±${location.accuracy.toFixed(1)} meters` : "High" },
    { label: "TIMESTAMP", value: location ? location.timestamp : "N/A" },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SectionHeader title="Verify Emergency Transmission" />

      <ReviewCard
        title="Emergency Category"
        iconName="warning"
        items={typeItems}
        onEdit={() => onEditStep(1)}
      />

      <ReviewCard
        title="Incident Specifics"
        iconName="description"
        items={detailItems}
        onEdit={() => onEditStep(2)}
      />

      <ReviewCard
        title="GPS Telemetry"
        iconName="my-location"
        items={locationItems}
        onEdit={() => onEditStep(3)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 24,
  },
});
