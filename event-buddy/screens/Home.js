import React, { useEffect, useState } from 'react';
import {
  FlatList,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  Image,
} from 'react-native';
import { IconButton, Snackbar } from 'react-native-paper';
import { database } from '../firebaseConfig';
import firebase from 'firebase';

export default function HomeScreen({ navigation, userId }) {
  const [events, setEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const FieldValue = firebase.firestore.FieldValue;

  useEffect(() => {
    const unsubscribeEvents = database
      .collection('events')
      .orderBy('datetime')
      .onSnapshot(
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setEvents(list);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching events:', error);
          setLoading(false);
        }
      );

    return () => unsubscribeEvents();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const unsubscribeUser = database
      .collection('users')
      .doc(userId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            setFavorites(data.favorites || []);
            setParticipations(data.participations || []);
            setUserRole(data.role || 'user');
          }
        },
        (error) => console.error('Error fetching user data:', error)
      );

    return () => unsubscribeUser();
  }, [userId]);

  const showSnack = (msg) => {
    setSnackbarMessage(msg);
    setSnackbarVisible(true);
  };

  const toggleFavorite = async (eventId) => {
    if (!userId) return showSnack('User not logged in');

    const userRef = database.collection('users').doc(userId);
    const isFav = favorites.includes(eventId);

    try {
      await userRef.update({
        favorites: isFav
          ? FieldValue.arrayRemove(eventId)
          : FieldValue.arrayUnion(eventId),
      });

      setFavorites((prev) =>
        isFav ? prev.filter((id) => id !== eventId) : [...prev, eventId]
      );

      showSnack(isFav ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      console.error(err);
      showSnack('Failed to update favorite');
    }
  };

  const toggleParticipation = async (eventId) => {
    if (!userId) return showSnack('User not logged in');

    const userRef = database.collection('users').doc(userId);
    const participantRef = database
      .collection('events')
      .doc(eventId)
      .collection('participants')
      .doc(userId);

    const isJoined = participations.includes(eventId);

    try {
      if (isJoined) {
        await Promise.all([
          userRef.update({
            participations: FieldValue.arrayRemove(eventId),
          }),
          participantRef.delete(),
        ]);
      } else {
        await Promise.all([
          userRef.update({
            participations: FieldValue.arrayUnion(eventId),
          }),
          participantRef.set({
            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
          }),
        ]);
      }

      setParticipations((prev) =>
        isJoined ? prev.filter((id) => id !== eventId) : [...prev, eventId]
      );

      showSnack(isJoined ? 'Left event' : 'Joined event');
    } catch (err) {
      console.error('Participation error:', err);
      showSnack('Failed to update participation');
    }
  };

  const renderItem = ({ item }) => {
    const isFav = favorites.includes(item.id);
    const isJoined = participations.includes(item.id);
    const dateStr = item.datetime?.toDate?.().toLocaleString?.() || '';

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('EventDetail', { eventId: item.id, userId })
        }
      >
        <View style={styles.card}>
          <Image
            source={{
              uri:
                item.imageUrl ||
                'https://via.placeholder.com/600x300.png?text=No+Image',
            }}
            style={styles.image}
          />
          <View style={styles.content}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.date}>{dateStr}</Text>
            {userRole !== 'admin' && (
              <View style={styles.iconRow}>
                <IconButton
                  icon={isFav ? 'star' : 'star-outline'}
                  color={isFav ? 'gold' : '#aaa'}
                  size={24}
                  onPress={() => toggleFavorite(item.id)}
                />
                <IconButton
                  icon={isJoined ? 'account-check' : 'account-plus'}
                  color={isJoined ? 'green' : '#aaa'}
                  size={24}
                  onPress={() => toggleParticipation(item.id)}
                />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: '#333' }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1a18',
    padding: 8,
  },
  card: {
    backgroundColor: '#2a2523',
    borderRadius: 16,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 4,
  },
  image: {
    height: 180,
    width: '100%',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  date: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 6,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1a18',
  },
});
