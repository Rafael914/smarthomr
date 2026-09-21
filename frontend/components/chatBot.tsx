import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
};

export default function ChatScreen() {
  const insets = useSafeAreaInsets();

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! How can I help you?",
      sender: "bot",
    },
  ]);

  function sendMessage() {
    if (message.trim() === "") {
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      newMessage,
    ]);

    setMessage("");
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>AI Assistant</Text>
        <Text style={styles.status}>Online</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chat}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.sender === "user"
                ? styles.userContainer
                : styles.botContainer,
            ]}
          >
            <View
              style={[
                styles.bubble,
                item.sender === "user"
                  ? styles.userBubble
                  : styles.botBubble,
              ]}
            >
              <Text style={styles.messageText}>
                {item.text}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Message AI..."
          placeholderTextColor="#888"
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
        >
          <Text style={styles.sendText}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },

  header: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#273244",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  status: {
    color: "#10B981",
    fontSize: 12,
    marginTop: 3,
  },

  chat: {
    padding: 15,
  },

  messageContainer: {
    marginVertical: 6,
  },

  userContainer: {
    alignItems: "flex-end",
  },

  botContainer: {
    alignItems: "flex-start",
  },

  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
  },

  userBubble: {
    backgroundColor: "#2563EB",
  },

  botBubble: {
    backgroundColor: "#273244",
  },

  messageText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 21,
  },

  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#273244",
  },

  input: {
    flex: 1,
    backgroundColor: "#1F2937",
    color: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 16,
    fontSize: 15,
  },

  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  sendText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },
});