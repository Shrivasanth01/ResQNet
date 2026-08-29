import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useState } from "react";
import { router, Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../src/theme/colors";
import PrimaryButton from "../../src/components/buttons/PrimaryButton";

// Step Components
import StepTypeSelection from "../../src/components/report/steps/StepTypeSelection";
import StepIncidentDetails, { IncidentDetailsData } from "../../src/components/report/steps/StepIncidentDetails";
import StepLocationCapture from "../../src/components/report/steps/StepLocationCapture";
import StepReviewSubmit from "../../src/components/report/steps/StepReviewSubmit";
import SuccessModal from "../../src/components/report/SuccessModal";
import { LocationTelemetry } from "../../src/components/report/LocationCard";
import { PacketBuilder } from "../../src/services/packet/PacketBuilder";
import { PacketQueue } from "../../src/services/packet/PacketQueue";
import { CommunicationEngine } from "../../src/services/communication/CommunicationEngine";
import { IncidentSeverity } from "../../src/types/packet";

const STEP_TITLES = [
  "Select Category",
  "Incident Details",
  "GPS Location",
  "Review & Broadcast",
];

export default function EmergencyReportScreen() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>("medical");
  const [incidentDetails, setIncidentDetails] = useState<IncidentDetailsData>({
    title: "",
    description: "",
    peopleAffected: "",
    severity: "Medium",
    hasPhoto: false,
  });
  const [location, setLocation] = useState<LocationTelemetry | null>(null);

  const handleUpdateDetails = (updated: Partial<IncidentDetailsData>) => {
    setIncidentDetails((prev) => ({ ...prev, ...updated }));
    setErrorMessage(null);
  };

  const handleNext = async () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!selectedTypeId) {
        setErrorMessage("Please select an emergency category to proceed.");
        return;
      }
    } else if (currentStep === 2) {
      if (!incidentDetails.title.trim()) {
        setErrorMessage("Please provide an Emergency Title (e.g., 'Flooding on 5th Ave').");
        return;
      }
    }
    
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === 4) {
      // Execute Real Decentralized Incident Dispatch
      setIsSubmitting(true);
      try {
        const sevMap: Record<string, IncidentSeverity> = {
          Low: "LOW",
          Medium: "MODERATE",
          High: "HIGH",
          Critical: "CRITICAL",
        };
        const mappedSeverity: IncidentSeverity = sevMap[incidentDetails.severity] || "MODERATE";

        const packet = await PacketBuilder.buildEmergencyPacket({
          emergencyType: `${selectedTypeId?.toUpperCase() || "GENERAL"}: ${incidentDetails.title}`,
          severity: mappedSeverity,
          ecs: mappedSeverity === "CRITICAL" ? 95 : mappedSeverity === "HIGH" ? 80 : 60,
          isAutomatic: false,
          triggerSource: "INCIDENT_REPORT_FORM",
          additionalDescription: `${incidentDetails.description || incidentDetails.title}${incidentDetails.peopleAffected ? ` | People Affected: ${incidentDetails.peopleAffected}` : ""}`,
          latitude: location?.latitude,
          longitude: location?.longitude,
          accuracy: location?.accuracy ?? undefined,
          locationSource: location ? "LIVE" : "CACHED",
        });

        await PacketQueue.enqueue(packet);
        await CommunicationEngine.deliverPacket(packet);

        setIsSubmitting(false);
        setCurrentStep(5);
      } catch (err) {
        console.warn("[ReportScreen] Dispatch error fallback:", err);
        setIsSubmitting(false);
        setCurrentStep(5);
      }
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (currentStep > 1 && currentStep < 5) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  if (currentStep === 5) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SuccessModal onReturnHome={() => router.replace("/(tabs)")} />
      </>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.flex} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen 
        options={{ 
          title: "New Emergency Report",
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
        }} 
      />

      <View style={styles.container}>
        {/* Progress Tracker */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTextRow}>
            <Text style={styles.stepIndicator}>STEP {currentStep} OF 4</Text>
            <Text style={styles.stepName}>{STEP_TITLES[currentStep - 1]}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(currentStep / 4) * 100}%` }]} />
          </View>
        </View>

        {/* Error Notice */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={20} color={Colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Main Step View */}
        <View style={styles.stepContent}>
          {currentStep === 1 && (
            <StepTypeSelection 
              selectedTypeId={selectedTypeId} 
              onSelectType={(id) => {
                setSelectedTypeId(id);
                setErrorMessage(null);
              }} 
            />
          )}
          {currentStep === 2 && (
            <StepIncidentDetails 
              data={incidentDetails} 
              onChange={handleUpdateDetails} 
            />
          )}
          {currentStep === 3 && (
            <StepLocationCapture 
              location={location} 
              onUpdateLocation={setLocation} 
            />
          )}
          {currentStep === 4 && (
            <StepReviewSubmit 
              selectedTypeId={selectedTypeId}
              incidentDetails={incidentDetails}
              location={location}
              onEditStep={(stepNum) => setCurrentStep(stepNum)}
            />
          )}
        </View>

        {/* Bottom Actions Footer */}
        <View style={styles.footer}>
          <Pressable 
            style={styles.cancelButton} 
            onPress={handleBack}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelText}>{currentStep === 1 ? "Cancel" : "Back"}</Text>
          </Pressable>
          
          <View style={styles.submitContainer}>
            <PrimaryButton
              title={currentStep === 4 ? "Broadcast Report" : "Continue"}
              onPress={handleNext}
              loading={isSubmitting}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 1,
  },
  stepName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.danger}15`,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    fontWeight: "600",
  },
  stepContent: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  submitContainer: {
    flex: 1,
    marginLeft: 12,
  },
});
