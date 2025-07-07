import { auth, firestore } from "../firebaseConfig";
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from "firebase/auth";
import { 
  doc, 
  setDoc 
} from "firebase/firestore";

// Sign up a new user and assign default role "user"
export const signUp = async (email, password) => {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Save user data with default role in Firestore
    await setDoc(doc(firestore, "users", user.uid), {
      email: user.email,
      role: "user", // default role, change to creat admin
      createdAt: new Date()
    });

    return userCredential;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Sign in an existing user
export const signIn = async (email, password) => {
  try {
    return await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Update password for the currently signed-in user
export const updateUserPassword = async (newPassword, currentPassword) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No user is currently signed in.");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long.");
  }

  try {
    // Try to update password directly
    await user.updatePassword(newPassword);
  } catch (error) {
    if (error.code === "auth/requires-recent-login") {
      if (!currentPassword) {
        throw new Error("Reauthentication required. Please enter your current password.");
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Retry updating password
      await user.updatePassword(newPassword);
    } else {
      throw error;
    }
  }
};
 