//MyLogin
import React, { useState } from "react";
import {TextInput,TouchableOpacity,
Text,StyleSheet,KeyboardAvoidingView, Platform,} from "react-native";
import { signIn } from "../services/firebaseAuth"; // Custom signIn function that handles Firebase auth
import { useAuth } from "../context/AuthContext"; // Access current user via context

export default function LoginScreen({ navigation }) {
  // Track email and password entered by the user
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Get the current user from context (can be useful for redirecting if logged in)
  const { user } = useAuth();

  // Function that runs when "Login" is pressed
  const handleLogin = async () => {
    try {
      // Attempt to sign in with provided email and password
      await signIn(email, password);
    } catch (error) {
      // If login fails, print the error to the console
      console.log(error.message);
    }
  };

  return (
    // Adjust layout when the keyboard is open (especially for iOS)
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Welcome to Event Buddy App</Text>

      {/* Email Input Field */}
      <TextInput
        placeholder="Email"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none" // Prevent auto-capitalizing email input
      />

      {/* Password Input Field */}
      <TextInput
        placeholder="Password"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Hide password characters
      />

      {/* Login Button */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* Link to Signup Screen */}
      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

// Styling for the login screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1a18", // Dark background
    justifyContent: "center", // Center content vertically
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#2b2422", // Dark input background
    color: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3a2a28",
  },
  button: {
    backgroundColor: "#E53935", // Red button
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 24,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  linkText: {
    color: "#ccc",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
