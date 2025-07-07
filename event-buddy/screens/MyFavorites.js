import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons"; // <-- import star icons
import { database } from "../firebaseConfig";
import firebase from "firebase";

export default function MyFavorites({ userId, navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const FieldValue = firebase.firestore.FieldValue;

  useEffect(() => {
    if (!userId) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const unsubscribeUser = database
      .collection("users")
      .doc(userId)
      .onSnapshot(async (doc) => {
        if (doc.exists) {
          const favoriteIds = doc.data().favorites || [];
          if (favoriteIds.length === 0) {
            setFavorites([]);
            setLoading(false);
            return;
          }

          try {
            const eventPromises = favoriteIds.map((id) =>
              database.collection("events").doc(id).get()
            );
            const eventDocs = await Promise.all(eventPromises);
            const events = eventDocs
              .filter((doc) => doc.exists)
              .map((doc) => ({ id: doc.id, ...doc.data() }));
            setFavorites(events);
          } catch (error) {
            console.error("Error fetching favorite events:", error);
            setFavorites([]);
          }
        } else {
          setFavorites([]);
        }
        setLoading(false);
      }, error => {
        console.error("Error loading favorites:", error);
        setLoading(false);
      });

    return () => unsubscribeUser();
  }, [userId]);

  // Toggle favorite: remove or add event from user's favorites array
  const toggleFavorite = async (eventId) => {
    if (!userId) {
      console.warn("User not logged in");
      return;
    }
    const userRef = database.collection("users").doc(userId);
    const isFav = favorites.some((event) => event.id === eventId);

    try {
      await userRef.update({
        favorites: isFav
          ? FieldValue.arrayRemove(eventId)
          : FieldValue.arrayUnion(eventId),
      });

      // Update local favorites state immediately for UI feedback
      if (isFav) {
        setFavorites((prev) => prev.filter((e) => e.id !== eventId));
      } else {
        // Optionally, fetch event details to add to favorites if adding
        const eventDoc = await database.collection("events").doc(eventId).get();
        if (eventDoc.exists) {
          setFavorites((prev) => [...prev, { id: eventDoc.id, ...eventDoc.data() }]);
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const renderItem = ({ item }) => {
    const isFav = favorites.some((event) => event.id === item.id);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("EventDetail", { eventId: item.id })}
        style={styles.itemContainer}
      >
        <Image
          source={{
            uri: item.imageUrl || "https://via.placeholder.com/120x120.png?text=No+Image",
          }}
          style={styles.image}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title || "Untitled Event"}</Text>
          <Text style={styles.date}>
            {item.datetime?.toDate?.().toLocaleString?.() || "No Date"}
          </Text>
        </View>

        {/* Star toggle button */}
        <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={{ padding: 6 }}>
          <MaterialIcons
            name={isFav ? "star" : "star-border"}
            size={28}
            color="gold"
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="gold" />
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No favorites yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1a18",
    paddingHorizontal: 10,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1e1a18",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#1e1a18",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#ccc",
    fontSize: 16,
  },
  itemContainer: {
    flexDirection: "row",
    backgroundColor: "#2a2523",
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    alignItems: "center",
    elevation: 2,
  },
  image: {
    width: 60,
    height: 60,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: "#444",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "gold",
  },
  date: {
    color: "#aaa",
    marginTop: 4,
  },
});
