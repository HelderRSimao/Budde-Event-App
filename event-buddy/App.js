// App.js

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { MaterialIcons } from "@expo/vector-icons";

import { auth, database } from "./firebaseConfig";

// Import screen components
import LoginScreen from "./screens/Login";
import SignupScreen from "./screens/Signup";
import HomeScreen from "./screens/Home";
import AddEventScreen from "./screens/AddEvent";
import FavoritesScreen from "./screens/MyFavorites";
import ParticipationsScreen from "./screens/MyParticipations";
import ProfileScreen from "./screens/Profile";
import EventDetailScreen from "./screens/EventDetail";

// Create navigation objects
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Show login/signup screens when user is not logged in
function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function AppTabs({ role, userId }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Set icons for each tab
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Home") iconName = "home";
          else if (route.name === "Create") iconName = "add-circle";
          else if (route.name === "Favorites") iconName = "favorite";
          else if (route.name === "Participations") iconName = "event-available";
          else if (route.name === "Profile") iconName = "person";

          return (
            <MaterialIcons
              name={iconName}
              size={size} // consistent icon size across all tabs
              color={color}
              style={route.name === "Create" ? { marginBottom: 2 } : null} // slight align tweak
            />
          );
        },
        tabBarActiveTintColor: "purple",      // active tab color
        tabBarInactiveTintColor: "gray",      // inactive tab color
        tabBarStyle: { height: 60 },          // bottom bar height
        tabBarLabelStyle: { fontSize: 12 },   // tab label font
      })}
    >
      {/* Home tab */}
      <Tab.Screen name="Home">
        {(props) => <HomeScreen {...props} userId={userId} />}
      </Tab.Screen>

      {/* Admin only: Create Event */}
      {role === "admin" ? (
        <Tab.Screen
          name="Create"
          component={AddEventScreen}
          options={{ tabBarLabel: "" }} // hide label for clean look
        />
      ) : (
        // Normal user tabs
        <>
          <Tab.Screen name="Favorites" options={{ tabBarLabel: "" }}>
            {(props) => <FavoritesScreen {...props} userId={userId} />}
          </Tab.Screen>
          <Tab.Screen name="Participations" options={{ tabBarLabel: "" }}>
            {(props) => <ParticipationsScreen {...props} userId={userId} />}
          </Tab.Screen>
        </>
      )}

      {/* Profile tab */}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Stack to include tabs and Event Detail screen
function AppStack({ role, userId }) {
  return (
    <Stack.Navigator>
      {/* Tabs (main app) */}
      <Stack.Screen name="Tabs" options={{ headerShown: false }}>
        {(props) => <AppTabs {...props} role={role} userId={userId} />}
      </Stack.Screen>

      {/* Event Detail screen - shown when clicking an event */}
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ title: "Event Details" }}
      />
    </Stack.Navigator>
  );
}

// Main App
export default function App() {
  const [user, setUser] = useState(null); // Current logged-in user
  const [role, setRole] = useState(null); // User role (admin or user)
  const [loading, setLoading] = useState(true); // Show spinner while checking

  // Check if user is logged in and get their role
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (usr) => {
      if (usr) {
        setUser(usr); // Save user
        try {
          // Get user's role from Firestore
          const userDoc = await database.collection("users").doc(usr.uid).get();
          if (userDoc.exists) {
            setRole(userDoc.data().role || "user");
          } else {
            setRole("user"); // Default role
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole("user"); // If error, use default
        }
      } else {
        // User logged out
        setUser(null);
        setRole(null);
      }
      setLoading(false); // Done loading
    });

    return () => unsubscribe(); // Cleanup
  }, []);

  // Show spinner while checking login
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="purple" />
      </View>
    );
  }

  // If user is logged in, show AppStack, else AuthStack
  return (
    <NavigationContainer>
      {user ? <AppStack role={role} userId={user.uid} /> : <AuthStack />}
    </NavigationContainer>
  );
}
