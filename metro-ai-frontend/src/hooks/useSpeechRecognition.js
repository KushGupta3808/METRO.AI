import { useEffect, useRef, useState, useCallback } from 'react';

// Wraps the browser's native Web Speech API for speech-to-text. This is a
// browser feature, not a backend one - no API key, no call to your FastAPI
// backend, nothing to configure.
//
// Support is real but genuinely uneven (checked July 2026): Chrome, Edge,
// and Safari (14.1+ on macOS, 14.5+ on iOS) expose it under the
// `webkitSpeechRecognition` prefix. Firefox ships an implementation but
// keeps it disabled behind a flag almost no user has flipped. `isSupported`
// reflects that honestly - callers should disable/hide voice input rather
// than let it silently fail on unsupported browsers.
//
// Also worth knowing: on Chrome and Safari, recognition is server-based -
// your audio is sent to Google's or Apple's servers to be transcribed, not
// processed fully on-device. That's a browser/OS-level behavior, not
// something this hook (or your backend) controls.
export function useSpeechRecognition({ onFinalResult, onInterimResult, lang = 'en-US' } = {}) {
  const recognitionRef = useRef(null);
  const onFinalResultRef = useRef(onFinalResult);
  const onInterimResultRef = useRef(onInterimResult);
  onFinalResultRef.current = onFinalResult; // always the latest, no stale-closure risk
  onInterimResultRef.current = onInterimResult;

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);

  const SpeechRecognitionImpl =
    typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const isSupported = !!SpeechRecognitionImpl;

  useEffect(() => {
    if (!isSupported) return;

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) {
        setInterimTranscript('');
        onFinalResultRef.current?.(final.trim());
      } else {
        setInterimTranscript(interim);
        onInterimResultRef.current?.(interim);
      }
    };

    recognition.onerror = (event) => {
      const messages = {
        'not-allowed': "Microphone access was denied - check your browser's site permissions.",
        'no-speech': "Didn't catch that - try again.",
        'audio-capture': 'No microphone was found.',
      };
      setError(messages[event.error] || 'Voice input hit an unexpected error.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    };
    // Deliberately excludes onFinalResult - it's read via a ref above so
    // the recognition instance isn't torn down and recreated every time
    // the parent component re-renders with a fresh inline callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, lang]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setError(null);
    setInterimTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // start() throws if called while already running - safe to ignore.
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { isSupported, isListening, interimTranscript, error, startListening, stopListening };
}