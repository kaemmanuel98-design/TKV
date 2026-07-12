import { useCallback, useEffect, useRef, useState } from 'react';
import { postAgentTranscribe } from '../lib/agentApi';
import { speakText, stopSpeech } from '../lib/speech';
import { prepareAgentSpeechText } from '../lib/speech/prepareText';
import { useSpeechStore } from '../store/useSpeechStore';
import { resolveSpeechLocale } from '../lib/speech/locale';

const SpeechRecognition =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

function localeForLang(lang, getAccent) {
  return resolveSpeechLocale(lang, null, getAccent);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('read_failed'));
        return;
      }
      resolve(dataUrl.split(',')[1] || '');
    };
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Conversation vocale Mim : écoute (Web Speech ou Whisper) + lecture des réponses.
 */
export function useMimVoice({ lang, accessToken, onTranscript, onVoiceError, disabled }) {
  const getAccent = useSpeechStore((s) => s.getAccent);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState('');

  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recorderRef = useRef(null);

  const stopListening = useCallback(() => {
    setInterimText('');
    setIsListening(false);
    try {
      recognitionRef.current?.abort?.();
    } catch {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        /* ignore */
      }
    }
    recognitionRef.current = null;

    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const speakReply = useCallback(
    async (text) => {
      const prepared = prepareAgentSpeechText(text);
      if (!prepared) return;
      setIsSpeaking(true);
      stopSpeech();
      try {
        const locale = localeForLang(lang, getAccent);
        await speakText(prepared, { language: lang, locale, prepared: true });
      } catch (err) {
        onVoiceError?.(err);
      } finally {
        setIsSpeaking(false);
      }
    },
    [lang, getAccent, onVoiceError]
  );

  const transcribeBlob = useCallback(
    async (blob) => {
      const base64 = await blobToBase64(blob);
      const data = await postAgentTranscribe({
        audioBase64: base64,
        language: lang,
        accessToken,
      });
      return data.text?.trim() || '';
    },
    [lang, accessToken]
  );

  const startWhisperRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      recorderRef.current = null;
      setIsListening(false);

      try {
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 32) {
          onVoiceError?.(new Error('stt_empty'));
          return;
        }
        const text = await transcribeBlob(blob);
        if (text) onTranscript?.(text);
        else onVoiceError?.(new Error('stt_empty'));
      } catch (err) {
        onVoiceError?.(err);
      }
    };

    recorder.start(300);
    setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, 90_000);
  }, [onTranscript, onVoiceError, transcribeBlob]);

  const startBrowserRecognition = useCallback(() => {
    if (!SpeechRecognition) return false;

    const rec = new SpeechRecognition();
    rec.lang = localeForLang(lang, getAccent);
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const t = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimText(interim || final);
      if (final.trim()) {
        stopListening();
        onTranscript?.(final.trim());
      }
    };

    rec.onerror = (event) => {
      stopListening();
      if (event.error !== 'aborted') onVoiceError?.(new Error(event.error || 'stt_failed'));
    };

    rec.onend = () => {
      if (recognitionRef.current === rec) {
        setIsListening(false);
        recognitionRef.current = null;
      }
    };

    recognitionRef.current = rec;
    rec.start();
    return true;
  }, [lang, getAccent, onTranscript, onVoiceError, stopListening]);

  const startListening = useCallback(async () => {
    if (disabled || isListening || isSpeaking) return;
    setInterimText('');
    setIsListening(true);

    if (startBrowserRecognition()) return;

    try {
      await startWhisperRecording();
    } catch (err) {
      setIsListening(false);
      onVoiceError?.(err);
    }
  }, [disabled, isListening, isSpeaking, startBrowserRecognition, startWhisperRecording, onVoiceError]);

  const stopAndSendRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
      return;
    }
    stopListening();
  }, [stopListening]);

  const toggleVoiceMode = useCallback(() => {
    setVoiceMode((v) => !v);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
      stopSpeech();
    };
  }, [stopListening]);

  return {
    voiceMode,
    setVoiceMode,
    toggleVoiceMode,
    isListening,
    isSpeaking,
    interimText,
    startListening,
    stopListening,
    stopAndSendRecording,
    speakReply,
  };
}
