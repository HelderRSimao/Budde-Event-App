import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/Home';
import EventDetailScreen from '../screens/EventDetail';

const Stack = createNativeStackNavigator();

export default function HomeStack({ userId }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" options={{ title: 'Events' }}>
        {(props) => <HomeScreen {...props} userId={userId} />}
      </Stack.Screen>
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event Details' }} />
    </Stack.Navigator>
  );
}
