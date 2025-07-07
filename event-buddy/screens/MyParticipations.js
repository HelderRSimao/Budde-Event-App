//MyParticipations

import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Snackbar } from 'react-native-paper';
import { database } from '../firebaseConfig';
import firebase from 'firebase';

export default function MyParticipationsScreen({ navigation, userId }) {
  // State to store fetched events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true); // For showing the loader
  const [snackbarVisible, setSnackbarVisible] = useState(false); // Snackbar visibility
  const [snackbarMessage, setSnackbarMessage] = useState(''); // Snackbar message

  useEffect(() => {
    // If user is not logged in or userId is missing
    if (!userId) {
      setLoading(false);
      return;
    }

    // Subscribe to user's document to listen for participation changes
    const unsubscribeUser = database
      .collection('users')
      .doc(userId)
      .onSnapshot(async (doc) => {
        // If user document doesn't exist
        if (!doc.exists) {
          setEvents([]);
          setLoading(false);
          return;
        }

        const data = doc.data();
        const participationIds = data.participations || [];

        // If user has no participations
        if (participationIds.length === 0) {
          setEvents([]);
          setLoading(false);
          return;
        }

        // Warn if there are too many participations (only show 10)
        if (participationIds.length > 10) {
          setSnackbarMessage('Only showing up to 10 events.');
          setSnackbarVisible(true);
        }

        try {
          // Fetch event data for up to 10 participated events
          const snapshot = await database
            .collection('events')
            .where(firebase.firestore.FieldPath.documentId(), 'in', participationIds.slice(0, 10))
            .get();

          // Map fetched documents to usable event objects
          const eventList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setEvents(eventList);
          setLoading(false);
        } catch (error) {
          // Handle errors during fetch
          setSnackbarMessage('Error loading events');
          setSnackbarVisible(true);
          setLoading(false);
        }
      });

    // Cleanup listener on unmount
    return () => unsubscribeUser();
  }, [userId]);

  // Render each event card
  const renderItem = ({ item }) => {
    const dateString = item.datetime?.toDate?.().toLocaleString?.() || '';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id, userId })}
      >
        <Card style={styles.card} mode="elevated">
          <Card.Cover
            source={{
              uri: item.imageUrl || 'https://via.placeholder.com/600x300.png?text=No+Image',
            }}
            style={styles.cardCover}
            resizeMode="cover"
          />
          <Card.Content>
            <Title style={styles.title}>{item.title}</Title>
            <Paragraph style={styles.date}>{dateString}</Paragraph>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="gold" />
      </View>
    );
  }

  // Render main UI
  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Paragraph style={styles.emptyText}>No participated events yet.</Paragraph>
          </View>
        }
      />
      {/* Error or info snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1a18',
    paddingHorizontal: 10,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1e1a18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#2a2523',
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardCover: {
    height: 180,
  },
  title: {
    color: 'gold',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  date: {
    color: '#ccc',
    marginTop: 4,
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
  },
  snackbar: {
    backgroundColor: '#C62828',
  },
});
