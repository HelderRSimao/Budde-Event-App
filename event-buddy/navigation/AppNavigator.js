import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, database } from '../firebaseConfig';

import AddEventScreen from '../screens/AddEvent';
import ProfileScreen from '../screens/Profile';
import MyFavoritesScreen from '../screens/MyFavorites';
import HomeStack from './HomeStackNavigator'; // NEW import for the stack

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userDoc = await database.collection('users').doc(user.uid).get();
          setRole(userDoc.exists ? userDoc.data().role : 'user');
        } catch (error) {
          console.error('Failed to get user role:', error);
          setRole('user');
        }
      } else {
        setRole(null);
        setUserId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ size, color }) => {
          if (route.name === 'Home') return <MaterialIcons name="home" size={size} color={color} />;
          if (route.name === 'Create') return <MaterialIcons name="add-circle" size={size + 8} color={color} />;
          if (route.name === 'Profile') return <MaterialIcons name="person" size={size} color={color} />;
          if (route.name === 'Favorites') return <MaterialIcons name="favorite" size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeTintColor: 'purple',
        inactiveTintColor: 'gray',
        style: { height: 60 },
        labelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen name="Home">
        {() => <HomeStack userId={userId} />}
      </Tab.Screen>

      <Tab.Screen name="Favorites" component={MyFavoritesScreen} />

      {role === 'admin' && (
        <Tab.Screen
          name="Create"
          component={AddEventScreen}
          options={{
            tabBarLabel: '',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="add-circle" size={size + 16} color="purple" />
            ),
          }}
        />
      )}

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
