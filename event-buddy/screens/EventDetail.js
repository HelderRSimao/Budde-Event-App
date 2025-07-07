import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Card, Paragraph } from "react-native-paper";
import { database, auth } from "../firebaseConfig";
import firebase from "firebase";

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;

  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [participantNames, setParticipantNames] = useState({});
  const [participating, setParticipating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribeEvent = database
      .collection("events")
      .doc(eventId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setEvent({ id: doc.id, ...doc.data() });
          } else {
            setEvent(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching event:", error);
          setLoading(false);
        }
      );

    return () => unsubscribeEvent();
  }, [eventId]);

  useEffect(() => {
    const unsubscribeParticipants = database
      .collection("events")
      .doc(eventId)
      .collection("participants")
      .onSnapshot(
        (snapshot) => {
          const ids = snapshot.docs.map((doc) => doc.id);
          setParticipants(ids);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching participants:", error);
          setLoading(false);
        }
      );

    return () => unsubscribeParticipants();
  }, [eventId]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (userId) {
        try {
          const userDoc = await database.collection("users").doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setIsAdmin(userData.role === "admin");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
    };

    fetchUserRole();
  }, [userId]);

  useEffect(() => {
    if (userId) {
      setParticipating(participants.includes(userId));
    } else {
      setParticipating(false);
    }
  }, [participants, userId]);

  useEffect(() => {
    const fetchNames = async () => {
      const names = {};
      const otherIds = participants.filter((id) => id !== userId);

      await Promise.all(
        otherIds.map(async (pid) => {
          try {
            const doc = await database.collection("users").doc(pid).get();
            names[pid] = doc.exists ? doc.data().username || "Unknown User" : "Unknown User";
          } catch (error) {
            names[pid] = "Unknown User";
          }
        })
      );

      setParticipantNames(names);
    };

    if (participants.length > 0) {
      fetchNames();
    }
  }, [participants, userId]);

  const toggleParticipation = async () => {
    if (!userId) {
      alert("Please login to participate");
      return;
    }

    const participantDocRef = database
      .collection("events")
      .doc(eventId)
      .collection("participants")
      .doc(userId);

    const userDocRef = database.collection("users").doc(userId);

    try {
      if (participating) {
        await Promise.all([
          participantDocRef.delete(),
          userDocRef.update({
            participations: firebase.firestore.FieldValue.arrayRemove(eventId),
          }),
        ]);
      } else {
        await Promise.all([
          participantDocRef.set({
            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
          }),
          userDocRef.update({
            participations: firebase.firestore.FieldValue.arrayUnion(eventId),
          }),
        ]);
      }
    } catch (error) {
      console.error("Error updating participation:", error);
      alert("Failed to update participation");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="gold" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  const dateString = event.datetime?.toDate?.().toLocaleString() || "";
  const otherParticipants = participants.filter((pid) => pid !== userId);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Cover
          source={{
            uri:
              event.imageUrl ||
              "https://via.placeholder.com/600x300.png?text=No+Image",
          }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <Card.Content style={styles.cardContent}>
          <Text style={styles.title}>{event.title}</Text>
          <Paragraph style={styles.date}>{dateString}</Paragraph>
          <Paragraph style={styles.description}>{event.description}</Paragraph>
        </Card.Content>
      </Card>

      {!isAdmin && (
        <>
          <TouchableOpacity onPress={toggleParticipation} style={styles.button}>
            <Text style={styles.buttonText}>
              {participating ? "Withdraw Participation" : "Join Event"}
            </Text>
          </TouchableOpacity>

          {participating && (
            <View style={styles.statusBox}>
              <Text style={styles.statusMessage}>
                ✅ You are currently participating in this event.
              </Text>
            </View>
          )}
        </>
      )}

      <View style={styles.participantSection}>
        <Text style={styles.participantHeading}>
          Participants ({participants.length})
        </Text>

        {otherParticipants.length === 0 ? (
          <Text style={styles.noParticipants}>No other participants yet.</Text>
        ) : (
          otherParticipants.map((pid) => (
            <Text key={pid} style={styles.participantId}>
              • {participantNames[pid] || "Unknown User"} ({pid})
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1a18",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1e1a18",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#ccc",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#2a2523",
    borderRadius: 12,
    overflow: "hidden",
  },
  cardImage: {
    height: 200,
  },
  cardContent: {
    marginVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "gold",
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: "#ddd",
    lineHeight: 20,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#C62828",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  statusBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#2e7d32",
    borderRadius: 8,
  },
  statusMessage: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  participantSection: {
    marginTop: 30,
  },
  participantHeading: {
    fontSize: 18,
    color: "gold",
    fontWeight: "bold",
    marginBottom: 8,
  },
  noParticipants: {
    color: "#aaa",
  },
  participantId: {
    color: "#ccc",
    marginBottom: 4,
    fontSize: 15,
  },
});
