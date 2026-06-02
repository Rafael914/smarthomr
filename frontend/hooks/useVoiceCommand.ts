import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import axios from 'axios';

// ⚠️ IMPORTANT: replace this with react-native-voice later
// import Voice from '@react-native-voice/voice';

const BASE_URL = "http://192.168.137.1:8000";

interface RelayCommand {
  relayNumber: number;
  action: 'on' | 'off';
}

// ─── Normalize speech ─────────────────────────────
const normalizeSpeech = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/putlet|outlit|outlett|oulet|owlet|out let/g, 'outlet')
    .replace(/\breally\b|\bre-lay\b/g, 'relay')
    .replace(/\bone\b/g, '1')
    .replace(/\btwo\b/g, '2')
    .replace(/\bthree\b/g, '3')
    .replace(/\bfour\b/g, '4')
    .replace(/\bfive\b/g, '5')
    .replace(/\bturn on\b|\bswitch on\b|\benable\b/g, 'on')
    .replace(/\bturn off\b|\bswitch off\b|\bdisable\b/g, 'off');
};

// ─── Parse command ────────────────────────────────
const parseVoiceCommand = (text: string): RelayCommand | null => {
  const normalized = normalizeSpeech(text);

  const patterns = [
    /turn\s+(on|off)\s+(?:outlet|relay)\s*([1-5])/i,
    /(?:outlet|relay)\s*([1-5])\s+(?:is\s+|to\s+)?(on|off)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;

    let relayNumber: number;
    let action: 'on' | 'off';

    if (/\d/.test(match[1])) {
      relayNumber = Number(match[1]);
      action = match[2] as 'on' | 'off';
    } else {
      action = match[1] as 'on' | 'off';
      relayNumber = Number(match[2]);
    }

    if (relayNumber >= 1 && relayNumber <= 5) {
      return { relayNumber, action };
    }
  }

  return null;
};

// ─── API call ─────────────────────────────────────
const executeRelayCommand = async (cmd: RelayCommand) => {
  const key = `relay${cmd.relayNumber}`;

  await axios.post(`${BASE_URL}/api/relay`, {
    [key]: cmd.action === 'on',
  });
};

// ─── HOOK ─────────────────────────────────────────
export const useVoiceCommand = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const showAlert = (t: string, m: string) => {
    Platform.OS === 'web' ? alert(`${t}: ${m}`) : Alert.alert(t, m);
  };

  // ⚠️ WEB ONLY VERSION (what you currently have)
  const startListening = useCallback(() => {
    if (Platform.OS !== 'web') {
      showAlert('Not Supported', 'Install native speech library for APK');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);

    recognition.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);

      const cmd = parseVoiceCommand(text);
      if (!cmd) return;

      await executeRelayCommand(cmd);
    };

    recognition.onerror = (e: any) => {
      setError(e.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  };
};