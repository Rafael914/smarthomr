import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import axios from 'axios';
import Voice, {
  SpeechErrorEvent,
  SpeechResultsEvent,
} from '@react-native-voice/voice';
import { BASE_URL } from '../utils/api';

interface RelayCommand {
  relayNumber: number;
  action: 'on' | 'off';
}

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

const executeRelayCommand = async (cmd: RelayCommand) => {
  const key = `relay${cmd.relayNumber}`;

  await axios.post(`${BASE_URL}/api/relay`, {
    [key]: cmd.action === 'on',
  });
};

export const useVoiceCommand = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const webRecognitionRef = useRef<any>(null);

  const showAlert = useCallback((title: string, message: string) => {
    Platform.OS === 'web' ? alert(`${title}: ${message}`) : Alert.alert(title, message);
  }, []);

  const handleRecognizedText = useCallback(
    async (text?: string) => {
      if (!text) return;

      setTranscript(text);
      setError(null);

      const cmd = parseVoiceCommand(text);
      if (!cmd) {
        showAlert('Voice Command', `Command not recognized: ${text}`);
        return;
      }

      try {
        await executeRelayCommand(cmd);
        showAlert(
          'Voice Command',
          `Relay ${cmd.relayNumber} turned ${cmd.action.toUpperCase()}`
        );
      } catch (err: any) {
        const message = err?.message || 'Failed to send relay command';
        setError(message);
        showAlert('Voice Command Error', message);
      }
    },
    [showAlert]
  );

  useEffect(() => {
    if (Platform.OS === 'web') return;

    Voice.onSpeechStart = () => {
      setIsListening(true);
      setError(null);
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };

    Voice.onSpeechError = (event: SpeechErrorEvent) => {
      const message = event.error?.message || 'Speech recognition failed';
      setError(message);
      setIsListening(false);
    };

    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      handleRecognizedText(event.value?.[0]);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => undefined);
    };
  }, [handleRecognizedText]);

  const startWebListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const message = 'Speech recognition is not supported in this browser.';
      setError(message);
      showAlert('Not Supported', message);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    webRecognitionRef.current = recognition;

    setIsListening(true);
    setError(null);

    recognition.onresult = async (event: any) => {
      await handleRecognizedText(event.results[0][0].transcript);
    };

    recognition.onerror = (event: any) => {
      setError(event.error || 'Speech recognition failed');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      webRecognitionRef.current = null;
    };

    recognition.start();
  }, [handleRecognizedText, showAlert]);

  const startNativeListening = useCallback(async () => {
    try {
      const available = await Voice.isAvailable();
      if (!available) {
        showAlert('Not Supported', 'Speech recognition is not available on this device.');
        return;
      }

      setTranscript('');
      setError(null);
      setIsListening(true);
      await Voice.start('en-US');
    } catch (err: any) {
      const message = err?.message || 'Could not start speech recognition';
      setError(message);
      setIsListening(false);
      showAlert('Voice Command Error', message);
    }
  }, [showAlert]);

  const startListening = useCallback(() => {
    if (Platform.OS === 'web') {
      startWebListening();
      return;
    }

    startNativeListening();
  }, [startNativeListening, startWebListening]);

  const stopListening = useCallback(async () => {
    if (Platform.OS === 'web') {
      webRecognitionRef.current?.stop?.();
      webRecognitionRef.current = null;
      setIsListening(false);
      return;
    }

    try {
      await Voice.stop();
    } catch (err: any) {
      setError(err?.message || 'Could not stop speech recognition');
    }

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
