import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Alert,
} from "react-native";

import axios from "axios";
import { Storage } from "../../utils/storage";
import { router } from "expo-router";
import { BASE_URL } from "../../utils/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  
  // New UI state to hold the error message string
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  // Cross-platform alert utility function
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleRegister = async () => {
    setErrorMessage(null);

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setErrorMessage("Please complete all input fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }


    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${BASE_URL}/api/auth/register`,
        {
          name,
          email,
          password,
        },
        {
          timeout: 5000,
        }
      );

      const token = res.data.token;
      const userId = res.data.user?.id;

      if (token && userId) {
        await Storage.setItem("token", token);
        await Storage.setItem("userId", userId.toString());

        showAlert("Success", "Account created successfully!");
        router.replace("/(tabs)");
      } else {
        router.push("/auth/login");
      }
    } catch (err: any) {
      console.log(err?.response?.data || err.message);
      
      const serverMsg = err?.response?.data?.message;
      setErrorMessage(serverMsg || "Registration failed. Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>

          {/* LOGO */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>⚡</Text>
          </View>

          {/* BRAND */}
          <Text style={styles.brand}>VoltGuard</Text>

          {/* TITLE */}
          <Text style={styles.title}>Create Account</Text>

          <Text style={styles.subtitle}>
            Smart Energy Monitoring System
          </Text>

          {/* NAME */}
          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#7c7c8a"
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errorMessage) setErrorMessage(null);
            }}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          {/* EMAIL */}
          <TextInput
            ref={emailRef}
            placeholder="Email Address"
            placeholderTextColor="#7c7c8a"
            style={styles.input}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errorMessage) setErrorMessage(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          {/* PASSWORD */}
          <TextInput
            ref={passwordRef}
            placeholder="Password"
            placeholderTextColor="#7c7c8a"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errorMessage) setErrorMessage(null);
            }}
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />

          {/* CONFIRM PASSWORD */}
          <TextInput
            ref={confirmRef}
            placeholder="Confirm Password"
            placeholderTextColor="#7c7c8a"
            style={styles.input}
            secureTextEntry
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errorMessage) setErrorMessage(null);
            }}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          {/* INLINE UI ERROR CONTAINER */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          )}

          {/* BUTTON */}
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
              width: "100%",
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={animateIn}
              onPressOut={animateOut}
              style={[
                styles.button,
                loading && styles.disabledButton,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creating..." : "Create Account"}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* LOGIN LINK */}
          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.link}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#07070b",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#111118",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e1e2d",
    width: "100%",
    maxWidth: 440,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    fontSize: 55,
  },
  brand: {
    color: "#00d4ff",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 28,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#1a1a24",
    borderWidth: 1,
    borderColor: "#2b2b3d",
    padding: 16,
    borderRadius: 14,
    color: "#fff",
    marginBottom: 16,
    fontSize: 15,
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#00d4ff",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#00d4ff",
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: "0px 4px 15px rgba(0, 212, 255, 0.35)",
      }
    })
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },
  link: {
    color: "#00d4ff",
    textAlign: "center",
    marginTop: 22,
    fontWeight: "600",
  },
});