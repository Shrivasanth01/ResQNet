import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";

interface Props {
  fullName: string;
  photoUrl?: string;
  onEditPhoto?: () => void;
  size?: number;
}

export default function ProfileAvatar({ fullName, photoUrl, onEditPhoto, size = 80 }: Props) {
  const getInitials = (name: string) => {
    if (!name) return "RQ";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.avatarBox, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{getInitials(fullName)}</Text>
        <View style={styles.verifiedBadge}>
          <MaterialIcons name="verified" size={20} color={Colors.secondary} />
        </View>
      </View>

      {onEditPhoto && (
        <Pressable style={styles.photoButton} onPress={onEditPhoto}>
          <MaterialIcons name="photo-camera" size={16} color={Colors.primary} />
          <Text style={styles.photoText}>Change Photo (Placeholder)</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 12,
  },
  avatarBox: {
    backgroundColor: `${Colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: Colors.primary,
    position: "relative",
  },
  initials: {
    fontWeight: "900",
    color: Colors.primary,
    letterSpacing: 1,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
    gap: 6,
  },
  photoText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
  },
});
