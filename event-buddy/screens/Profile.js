import React, { useState } from "react";
import { View, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { auth } from "../firebaseConfig";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export default function ProfileScreen() {
  const user = auth.currentUser;

  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Weak Password", "New password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await user.updatePassword(newPassword);
      Alert.alert("Success ✅", "Your password has been updated successfully.");
      setNewPassword("");
      setCurrentPassword("");
    } catch (error) {
      if (error.code === "auth/requires-recent-login") {
        if (!currentPassword) {
          setLoading(false);
          Alert.alert(
            "Re-authentication Required",
            "Please enter your current password to continue."
          );
          return;
        }

        try {
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(user, credential);

          await user.updatePassword(newPassword);
          Alert.alert("Success ✅", "Password updated after re-authentication.");
          setNewPassword("");
          setCurrentPassword("");
        } catch (reauthError) {
          Alert.alert("Re-authentication Failed ❌", reauthError.message);
        }
      } else {
        Alert.alert("Error ❗", error.message || "Something went wrong.");
      }
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Not authenticated.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.email}>{user.email}</Text>

      <TextInput
        label="Current Password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
        theme={{ colors: { primary: "gold", text: "#fff", placeholder: "#aaa" } }}
      />

      <TextInput
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
        theme={{ colors: { primary: "gold", text: "#fff", placeholder: "#aaa" } }}
      />

      <Button
        mode="contained-tonal"
        onPress={handleUpdatePassword}
        style={styles.saveBtn}
        disabled={loading || !newPassword}
        labelStyle={{ color: "gold" }}
      >
        {loading ? "Updating..." : "Save New Password"}
      </Button>

      <Button mode="contained" onPress={() => auth.signOut()} style={styles.logoutBtn}>
        Logout
      </Button>

      {loading && <ActivityIndicator size="large" color="gold" style={{ marginTop: 20 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1a18",
    padding: 20,
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1e1a18",
  },
  email: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    width: "100%",
    marginBottom: 10,
    backgroundColor: "#2a2523",
  },
  saveBtn: {
    borderColor: "gold",
    borderWidth: 1,
    marginBottom: 20,
    width: 200,
  },
  logoutBtn: {
    backgroundColor: "#E53935",
    width: 200,
  },
  text: {
    color: "#fff",
    marginTop: 20,
  },
});
