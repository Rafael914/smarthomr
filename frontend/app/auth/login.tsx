import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Alert,
} from "react-native";

import axios from "axios";
import { Storage } from "../../utils/storage";
import { router } from "expo-router";
import { BASE_URL } from "../../utils/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // New state to hold the error message for the UI
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

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

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      // Fallback for web testing so you get a browser popup
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const login = async () => {
    // Clear any previous error messages when trying again
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${BASE_URL}/api/auth/login`,
        { email, password },
        { timeout: 5000 }
      );

      const token = res.data.token;
      const userId = res.data.user?.id;

      if (!userId) {
        setErrorMessage("No user ID received from server.");
        return;
      }

      await Storage.setItem("token", token);
      await Storage.setItem("userId", userId.toString());


      router.replace("/(tabs)");
    } catch (err: any) {
      console.log("Login Error Details:", err?.response?.data || err.message);

      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;

      // Catch the 401 Unauthorized intentionally triggered by your wrong password
      if (status === 401 || status === 400) {
        setErrorMessage(serverMessage || "Incorrect email or password. Please try again.");
      } else if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
        setErrorMessage("The server took too long to respond. Please try again.");
      } else {
        setErrorMessage(serverMessage || "Cannot connect to server. Please check your network.");
      }
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
        <View style={[styles.cardWrapper, isDesktop && styles.cardWrapperDesktop]}>
          <View style={styles.card}>

            {/* LOGO */}
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>⚡</Text>
            </View>

            {/* TITLE */}
            <Text style={styles.title}>VoltGuard</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            {/* EMAIL */}
            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#7c7c8a"
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if(errorMessage) setErrorMessage(null); // Clear error when typing
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            {/* PASSWORD */}
            <View style={styles.passwordContainer}>
              <TextInput
                ref={passwordRef}
                placeholder="Password"
                placeholderTextColor="#7c7c8a"
                style={styles.passwordInput}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if(errorMessage) setErrorMessage(null); // Clear error when typing
                }}
                returnKeyType="done"
                onSubmitEditing={login}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eye}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            {/* ERROR MESSAGE DYNAMICALLY DISPLAYED ON UI */}
            {errorMessage && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            )}

            {/* BUTTON */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }], width: "100%" }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPressIn={animateIn}
                onPressOut={animateOut}
                style={[styles.button, loading && styles.disabledButton]}
                onPress={login}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Signing In..." : "Sign In"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* REGISTER */}
            <TouchableOpacity onPress={() => router.push("/auth/register")}>
              <Text style={styles.link}>{"Don't have an account? Sign Up"}</Text>
            </TouchableOpacity>

          </View>
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
  cardWrapper: {
    width: "100%",
  },
  cardWrapperDesktop: {
    width: 420,
  },
  card: {
    backgroundColor: "#111118",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e1e2d",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    fontSize: 55,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 30,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a24",
    borderWidth: 1,
    borderColor: "#2b2b3d",
    borderRadius: 14,
    marginBottom: 18,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    color: "#fff",
    fontSize: 15,
  },
  eye: {
    fontSize: 18,
  },
  // Added styling for the clean UI error warning block
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
    shadowColor: "#00d4ff",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
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
    marginTop: 24,
    fontWeight: "600",
  },
});