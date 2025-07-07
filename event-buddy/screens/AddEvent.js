import React, { useState } from "react";
import {
  View,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { database, auth } from "../firebaseConfig";
import firebase from "firebase"; // Consider replacing with modular import if using Firebase v9+
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function AddEventScreen({ navigation }) {
  // State hooks for form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [datetime, setDatetime] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false); // For button loading state

  // Validate all form fields
  const isFormValid = title && description && location && datetime && imageUrl;

  // Submit event to Firestore
  const handleSubmit = async () => {
    if (!isFormValid) {
      alert("Please fill all fields and provide an image URL.");
      return;
    }

    if (!auth.currentUser) {
      alert("You must be logged in to create an event.");
      return;
    }

    setUploading(true); // Start loading spinner

    try {
      await database.collection("events").add({
        title,
        description,
        location,
        datetime: firebase.firestore.Timestamp.fromDate(datetime), // Convert to Firestore format
        imageUrl,
        participants: [auth.currentUser.uid], // Add creator as initial participant
      });

      alert("Event created successfully!");

      // Reset form fields
      setTitle("");
      setDescription("");
      setLocation("");
      setDatetime(new Date());
      setImageUrl("");

      navigation.goBack(); // Navigate back after submission
    } catch (error) {
      alert("Error creating event: " + error.message);
    } finally {
      setUploading(false); // Stop loading spinner
    }
  };

  // Date picker handlers
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date) => {
    setDatetime(date);
    hideDatePicker();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#1e1a18" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          {/* Title input */}
          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            theme={{
              colors: { primary: "gold", text: "white", placeholder: "#aaa" },
            }}
            style={styles.input}
          />

          {/* Description input */}
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            mode="outlined"
            theme={{
              colors: { primary: "gold", text: "white", placeholder: "#aaa" },
            }}
            style={styles.input}
          />

          {/* Location input */}
          <TextInput
            label="Location"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            theme={{
              colors: { primary: "gold", text: "white", placeholder: "#aaa" },
            }}
            style={styles.input}
          />

          {/* Date picker trigger button */}
          <Button
            mode="outlined"
            onPress={showDatePicker}
            style={styles.dateButton}
            labelStyle={{ color: "gold" }}
            theme={{ colors: { primary: "gold" } }}
          >
            Select Date and Time
          </Button>

          {/* Display selected date/time */}
          <Text style={styles.dateText}>
            Selected: {datetime.toLocaleString()}
          </Text>

          {/* Date picker modal */}
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="datetime"
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
          />

          {/* Image URL input */}
          <TextInput
            label="Image URL"
            value={imageUrl}
            onChangeText={setImageUrl}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
            theme={{
              colors: { primary: "gold", text: "white", placeholder: "#aaa" },
            }}
            style={styles.input}
          />

          {/* Image preview if valid URL */}
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : null}
        </View>

        {/* Submit button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={uploading || !isFormValid}
          loading={uploading}
          style={styles.createButton}
          labelStyle={styles.createButtonLabel}
        >
          {uploading ? "Uploading..." : "Create Event"}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Style definitions
const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
    justifyContent: "space-between",
    backgroundColor: "#1e1a18",
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#2a2523",
  },
  dateButton: {
    borderColor: "gold",
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: "#2a2523",
  },
  dateText: {
    color: "#aaa",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: 200,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#444",
  },
  createButton: {
    marginTop: 12,
    backgroundColor: "#C62828",
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
});
