"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const BACKEND = "http://127.0.0.1:8000";

const SUGGESTIONS = [
  "🚔 Fill FIR: Register FIR for theft incident",
  "What is an FIR and how to file one?",
  "Explain anticipatory bail under CrPC 438",
  "What are my rights during police arrest?",
  "How does the cognizable offense process work?",
  "Explain Article 21 - Right to Life",
  "What is Zero FIR?",
  "IPC Section 302 - Punishment for Murder",
  "How to file a writ petition?",
];

const SECTION_ICONS = {
  "📋 Summary":          { color: "#60A5FA", bg: "rgba(96, 165, 250, 0.08)" },
  "📊 Current Status":   { color: "#FBBF24", bg: "rgba(251, 191, 36, 0.08)" },
  "⚙️ Next Legal Process":{ color: "#A78BFA", bg: "rgba(167, 139, 250, 0.08)" },
  "📄 Required Documents":{ color: "#34D399", bg: "rgba(52, 211, 153, 0.08)" },
  "⚠️ Important Notes":  { color: "#F87171", bg: "rgba(248, 113, 113, 0.08)" },
};

// ── Helpers ─────────────────────────────────────────────────
function parseStructuredAnswer(text) {
  if (!text) return null;
  const sections = [];
  const headers = Object.keys(SECTION_ICONS);
  let current = null;
  text.split("\n").forEach(line => {
    const header = headers.find(h => line.includes(h));
    if (header) {
      if (current) sections.push(current);
      current = { title: header, lines: [] };
    } else if (current && line.trim() && line !== "---") {
      current.lines.push(line.replace(/^#+\s*/, "").trim());
    }
  });
  if (current) sections.push(current);
  return sections.length >= 2 ? sections : null;
}

function StructuredResponse({ text }) {
  const sections = parseStructuredAnswer(text);
  if (!sections) {
    return (
      <div style={{ color: "#CBD5E1", fontSize: "15px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
        {text}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {sections.map((section, i) => {
        const style = SECTION_ICONS[section.title] || { color: "#94A3B8", bg: "rgba(148,163,184,0.08)" };
        return (
          <div key={i} style={{ background: style.bg, border: `1px solid ${style.color}30`, borderRadius: "12px", padding: "14px 18px" }}>
            <div style={{ color: style.color, fontWeight: "800", fontSize: "14px", marginBottom: "10px" }}>
              {section.title}
            </div>
            <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: "1.8" }}>
              {section.lines.map((line, j) => (
                <div key={j} style={{ marginBottom: "4px" }}>
                  {line.startsWith("-") || line.startsWith("•")
                    ? <span style={{ display: "flex", gap: "8px" }}><span style={{ color: style.color }}>▸</span><span>{line.replace(/^[-•]\s*/, "")}</span></span>
                    : <span>{line}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 18px" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#60A5FA", display: "inline-block", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
      ))}
      <span style={{ color: "#60A5FA", fontSize: "13px", marginLeft: "8px", fontStyle: "italic" }}>AI is analysing...</span>
    </div>
  );
}

// ── Waveform bars while recording ────────────────────────────
function WaveformBars() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "24px" }}>
      {[...Array(7)].map((_, i) => (
        <div key={i} style={{
          width: "3px", borderRadius: "2px", background: "#EF4444",
          animation: "waveBar 0.8s ease-in-out infinite",
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function AIAssistant() {
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [caseNumber, setCaseNumber]     = useState("");
  const [isTyping, setIsTyping]         = useState(false);
  const [useStructured, setUseStructured] = useState(true);
  const [ragEnabled, setRagEnabled]     = useState(false);
  const [aiStatus, setAiStatus]         = useState(null);
  const [sessionId]                     = useState(() => "session_" + Date.now());

  // ── Voice state ──────────────────────────────────────────
  const [voiceLangs, setVoiceLangs]       = useState([]);
  const [voiceSpeakers, setVoiceSpeakers] = useState([]);
  const [sttEnabled, setSttEnabled]       = useState(false);
  const [ttsEnabled, setTtsEnabled]       = useState(false);
  const [selectedLang, setSelectedLang]   = useState("en-IN");
  const [selectedSpeaker, setSelectedSpeaker] = useState("anushka");
  const [autoSpeak, setAutoSpeak]         = useState(false);
  const [isRecording, setIsRecording]     = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null);
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [voiceError, setVoiceError]       = useState("");
  const [recordingSecs, setRecordingSecs] = useState(0);
  // ── Pure voice-to-voice mode (no text shown) ─────────────
  const [voiceOnlyMode, setVoiceOnlyMode] = useState(true);
  const [voiceStatus, setVoiceStatus]     = useState(""); // status label during voice flow

  const mediaRecorderRef  = useRef(null);
  const audioChunksRef    = useRef([]);
  const recordingTimerRef = useRef(null);
  const currentAudioRef   = useRef(null);
  const bottomRef         = useRef(null);
  const inputRef          = useRef(null);

  // ── Scroll to bottom on new messages ─────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── On mount: load AI status + voice languages ────────────
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { window.location.href = "/login"; return; }

    axios.get(`${BACKEND}/ai/status`)
      .then(r => setAiStatus(r.data))
      .catch(() => setAiStatus({ groq_enabled: false, mode: "Rule-Based Legal Engine", topics_covered: [] }));

    axios.get(`${BACKEND}/voice/languages`)
      .then(r => {
        setVoiceLangs(r.data.languages || []);
        setVoiceSpeakers(r.data.speakers || []);
        setSttEnabled(r.data.stt_enabled);
        setTtsEnabled(r.data.tts_enabled);
      })
      .catch(() => {});

    setMessages([{
      role: "assistant",
      content: `## 📋 Summary
Welcome to the **AI Legal Assistant** — your intelligent guide to Indian law and judiciary procedures.

## 📊 Current Status
System ready. Structured 5-section legal analysis enabled for all queries. Voice input/output powered by **Deepgram STT** and **Sarvam AI TTS**.

## ⚙️ Next Legal Process
Ask any legal question by typing or **clicking the 🎙️ microphone button** to speak in any Indian language.

## 📄 Required Documents
No documents needed. Just type or speak your question below.

## ⚠️ Important Notes
- This AI provides general legal information, not formal legal advice.
- For urgent matters, call NALSA helpline: **15100** (free legal aid).
- Voice supports 10 Indian languages including Hindi, Tamil, Telugu, Bengali.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      structured: true,
    }]);
  }, []);

  // ── Send text message ─────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const question = (text || input).trim();
    if (!question) return;
    const token = localStorage.getItem("access_token");
    if (!token) { window.location.href = "/login"; return; }

    setMessages(prev => [...prev, {
      role: "user",
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
    setInput("");
    setIsTyping(true);

    try {
      const endpoint = useStructured ? "/ai/structured-query" : "/ai-chat";
      const payload  = useStructured
        ? { question, case_number: caseNumber || null, context_type: caseNumber ? "case" : "general" }
        : { question };

      const res     = await axios.post(`${BACKEND}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const answer  = res.data.answer;
      const ragUsed = res.data.rag_used;

      const newMsg = {
        role: "assistant",
        content: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        structured: useStructured,
        rag_used: ragUsed,
        case_number: res.data.case_number,
      };
      setMessages(prev => [...prev, newMsg]);
      setRagEnabled(ragUsed);

      // Auto-speak if enabled
      if (autoSpeak && ttsEnabled) {
        speakText(answer, messages.length + 1); // +1 because we just added
      }
    } catch (err) {
      if (err?.response?.status === 401) { localStorage.clear(); window.location.href = "/login"; return; }
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "## ⚠️ Important Notes\nSorry, the AI Legal Assistant is currently unavailable. Please try again or contact support.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        structured: true,
      }]);
    }
    setIsTyping(false);
  }, [input, caseNumber, useStructured, autoSpeak, ttsEnabled, messages.length]);

  // ── Start voice recording ─────────────────────────────────
  const startRecording = useCallback(async () => {
    setVoiceError("");
    if (!sttEnabled) {
      setVoiceError("STT not configured. Add DEEPGRAM_API_KEY to .env");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSecs(0);
      recordingTimerRef.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);
    } catch {
      setVoiceError("Microphone access denied. Please allow microphone permission.");
    }
  }, [sttEnabled]);

  // ── Speak text directly (no message added) ───────────────
  const speakDirect = useCallback(async (text) => {
    if (!ttsEnabled) return;
    const token = localStorage.getItem("access_token");
    setIsSpeaking(true);
    setVoiceStatus("🔊 AI is speaking...");
    try {
      const res = await axios.post(`${BACKEND}/voice/tts`, {
        text, language_code: selectedLang, speaker: selectedSpeaker, pace: 1.0, pitch: 0.0,
      }, { headers: { Authorization: `Bearer ${token}` } });
      const audios = res.data.audios || [];
      if (!audios.length) throw new Error("No audio");
      let idx = 0;
      const playNext = () => {
        if (idx >= audios.length) { setIsSpeaking(false); setVoiceStatus(""); return; }
        const audioData = audios[idx++];
        const byteChars = atob(audioData);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArray], { type: "audio/wav" });
        const url  = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(url); playNext(); };
        audio.onerror = () => { URL.revokeObjectURL(url); setIsSpeaking(false); setVoiceStatus(""); };
        audio.play();
      };
      playNext();
    } catch {
      setIsSpeaking(false);
      setVoiceStatus("");
    }
  }, [ttsEnabled, selectedLang, selectedSpeaker]);

  // ── Stop recording & transcribe ───────────────────────────
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);

    if (recordingSecs < 1 && audioChunksRef.current.length === 0) {
      setVoiceError("Recording was too short. Please hold mic and speak.");
      mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
      return;
    }

    setIsTranscribing(true);
    setVoiceStatus("⏳ Transcribing...");

    mediaRecorderRef.current.onstop = async () => {
      const blob  = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const token = localStorage.getItem("access_token");
      try {
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        const sttRes = await axios.post(
          `${BACKEND}/voice/stt?language=${selectedLang}`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
        );
        const transcript = sttRes.data.transcript?.trim();
        if (!transcript) {
          setVoiceError("Could not understand. Please speak clearly and try again.");
          setIsTranscribing(false);
          setVoiceStatus("");
          return;
        }

        // ── Voice-only mode: auto-send → auto-speak, no text ──
        if (voiceOnlyMode) {
          setIsTranscribing(false);
          setVoiceStatus("🤖 AI thinking...");
          setIsTyping(true);
          try {
            const aiRes = await axios.post(`${BACKEND}/ai-chat`,
              { question: transcript },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const answer = aiRes.data.answer;
            setIsTyping(false);
            await speakDirect(answer);
          } catch (err) {
            setIsTyping(false);
            setVoiceStatus("");
            if (err?.response?.status === 401) { localStorage.clear(); window.location.href = "/login"; }
          }
        } else {
          // Text mode: put transcript in input box as before
          setInput(transcript);
          inputRef.current?.focus();
          setIsTranscribing(false);
          setVoiceStatus("");
        }
      } catch (err) {
        if (err?.response?.status === 401) { localStorage.clear(); window.location.href = "/login"; return; }
        const msg = err?.response?.data?.detail || "Transcription failed. Check your DEEPGRAM_API_KEY.";
        setVoiceError(msg);
        setIsTranscribing(false);
        setVoiceStatus("");
      } finally {
        mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
      }
    };
    mediaRecorderRef.current.stop();
  }, [recordingSecs, selectedLang, voiceOnlyMode, speakDirect]);

  // ── Toggle recording on click ──────────────────────────────
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // ── Speak a text response via Sarvam TTS ──────────────────
  const speakText = useCallback(async (text, msgIdx) => {
    if (!ttsEnabled) {
      setVoiceError("TTS not configured. Add SARVAM_API_KEY to .env");
      return;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      if (speakingMsgIdx === msgIdx) { setIsSpeaking(false); setSpeakingMsgIdx(null); return; }
    }
    const token = localStorage.getItem("access_token");
    setIsSpeaking(true);
    setSpeakingMsgIdx(msgIdx);
    try {
      const res = await axios.post(`${BACKEND}/voice/tts`, {
        text, language_code: selectedLang, speaker: selectedSpeaker, pace: 1.0, pitch: 0.0,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const audios = res.data.audios || [];
      if (!audios.length) throw new Error("No audio returned");

      // Play all chunks sequentially
      let idx = 0;
      const playNext = () => {
        if (idx >= audios.length) { setIsSpeaking(false); setSpeakingMsgIdx(null); return; }
        const audioData = audios[idx++];
        // Sarvam returns base64 WAV
        const byteChars  = atob(audioData);
        const byteArray  = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
        const blob       = new Blob([byteArray], { type: "audio/wav" });
        const url        = URL.createObjectURL(blob);
        const audio      = new Audio(url);
        currentAudioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(url); playNext(); };
        audio.onerror = () => { URL.revokeObjectURL(url); setIsSpeaking(false); setSpeakingMsgIdx(null); };
        audio.play();
      };
      playNext();
    } catch (err) {
      if (err?.response?.status === 401) { localStorage.clear(); window.location.href = "/login"; return; }
      const msg = err?.response?.data?.detail || "TTS failed. Check your SARVAM_API_KEY.";
      setVoiceError(msg);
      setIsSpeaking(false);
      setSpeakingMsgIdx(null);
    }
  }, [ttsEnabled, selectedLang, selectedSpeaker, speakingMsgIdx]);

  // ── Download chat transcript ───────────────────────────────
  const downloadTranscript = () => {
    const content = messages.map(m =>
      `[${m.role.toUpperCase()} - ${m.timestamp}]\n${m.content}\n`
    ).join("\n" + "─".repeat(60) + "\n");
    const blob = new Blob([`LEGAL AI ASSISTANT — CONSULTATION TRANSCRIPT\n${"=".repeat(60)}\nGenerated: ${new Date().toLocaleString()}\n\n${content}`], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `legal-ai-${sessionId}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const langName = voiceLangs.find(l => l.code === selectedLang)?.name || selectedLang;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", display: "flex", flexDirection: "column", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes waveBar { 0%,100%{height:6px} 50%{height:22px} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.95)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes recordPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)} 70%{box-shadow:0 0 0 10px rgba(239,68,68,0)} }
        .msg-appear { animation: fadeIn 0.3s ease; }
        textarea:focus { outline:none!important; border-color:#3B82F6!important; }
        select { background:#0F172A; color:#CBD5E1; border:1px solid #334155; border-radius:8px; padding:5px 10px; font-size:13px; cursor:pointer; }
        select:focus { outline:none; border-color:#3B82F6; }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}
      `}</style>

      {/* ── GROQ FALLBACK BANNER ── */}
      {aiStatus && !aiStatus.groq_enabled && (
        <div style={{ background: "linear-gradient(90deg,rgba(251,191,36,.1),rgba(245,158,11,.06))", borderBottom: "1px solid rgba(251,191,36,.25)", padding: "8px 28px", display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
          <span>⚡</span>
          <span style={{ color: "#FBBF24", fontWeight: 700 }}>Rule-Based Engine Active</span>
          <span style={{ color: "#64748B" }}>— Add <code style={{ color: "#60A5FA", background: "rgba(96,165,250,.1)", padding: "1px 5px", borderRadius: 4 }}>GROQ_API_KEY</code> in .env for Groq LLaMA 3.3-70B</span>
          <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ marginLeft: "auto", color: "#FBBF24", fontWeight: 700, textDecoration: "none" }}>Get Free Key →</a>
        </div>
      )}

      {/* ── VOICE NOT CONFIGURED BANNER ── */}
      {(!sttEnabled || !ttsEnabled) && voiceLangs.length > 0 && (
        <div style={{ background: "linear-gradient(90deg,rgba(167,139,250,.08),rgba(124,58,237,.05))", borderBottom: "1px solid rgba(167,139,250,.2)", padding: "8px 28px", display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
          <span>🎙️</span>
          <span style={{ color: "#A78BFA", fontWeight: 700 }}>Voice AI Not Configured</span>
          <span style={{ color: "#64748B" }}>
            {!sttEnabled && <span>Add <code style={{ color: "#60A5FA", background: "rgba(96,165,250,.1)", padding: "1px 4px", borderRadius: 4 }}>DEEPGRAM_API_KEY</code> for STT</span>}
            {!sttEnabled && !ttsEnabled && <span style={{ margin: "0 6px" }}>·</span>}
            {!ttsEnabled && <span>Add <code style={{ color: "#60A5FA", background: "rgba(96,165,250,.1)", padding: "1px 4px", borderRadius: 4 }}>SARVAM_API_KEY</code> for TTS</span>}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
            {!sttEnabled && <a href="https://console.deepgram.com" target="_blank" rel="noreferrer" style={{ color: "#A78BFA", fontWeight: 700, textDecoration: "none" }}>Deepgram →</a>}
            {!ttsEnabled && <a href="https://dashboard.sarvam.ai" target="_blank" rel="noreferrer" style={{ color: "#A78BFA", fontWeight: 700, textDecoration: "none" }}>Sarvam AI →</a>}
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background: "rgba(10,18,35,.98)", borderBottom: "1px solid rgba(96,165,250,.15)", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#3B82F6,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🤖</div>
          <div>
            <h2 style={{ color: "#F8FAFC", margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-.3px" }}>AI Legal Assistant</h2>
            <p style={{ color: "#60A5FA", margin: 0, fontSize: 12, fontWeight: 600 }}>
              {aiStatus ? aiStatus.mode : "Initializing..."} · Deepgram STT · Sarvam AI TTS
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {ragEnabled && (
            <div style={{ background: "rgba(52,211,153,.12)", border: "1px solid #10B981", borderRadius: 8, padding: "4px 12px", color: "#34D399", fontSize: 11, fontWeight: 700 }}>📚 RAG</div>
          )}
          {isSpeaking && (
            <div style={{ background: "rgba(167,139,250,.12)", border: "1px solid #7C3AED", borderRadius: 8, padding: "4px 12px", color: "#A78BFA", fontSize: 11, fontWeight: 700, animation: "pulse 1.5s infinite" }}>🔊 Speaking...</div>
          )}
          <button onClick={downloadTranscript} style={{ background: "rgba(96,165,250,.1)", border: "1px solid #3B82F6", color: "#60A5FA", borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>📥 Export</button>
        </div>
      </div>

      {/* ── CONTROLS BAR ── */}
      <div style={{ background: "rgba(10,18,35,.7)", borderBottom: "1px solid rgba(255,255,255,.05)", padding: "10px 28px", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        {/* Mode toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#64748B", fontSize: 12, fontWeight: 600 }}>Mode:</span>
          <button onClick={() => setUseStructured(p => !p)} style={{ padding: "4px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: useStructured ? "#3B82F6" : "rgba(255,255,255,.07)", color: useStructured ? "#fff" : "#94A3B8" }}>
            {useStructured ? "📋 Structured" : "💬 Free Chat"}
          </button>
        </div>

        {/* Case context */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#64748B", fontSize: 12, fontWeight: 600 }}>Case:</span>
          <input type="text" placeholder="Case No. (optional)" value={caseNumber} onChange={e => setCaseNumber(e.target.value)}
            style={{ padding: "4px 10px", background: "#0F172A", color: "#60A5FA", border: "1px solid #334155", borderRadius: 8, fontSize: 12, width: 160, outline: "none" }} />
        </div>
        {caseNumber && <div style={{ background: "rgba(167,139,250,.1)", border: "1px solid #7C3AED", borderRadius: 8, padding: "3px 10px", color: "#A78BFA", fontSize: 11, fontWeight: 700 }}>🔗 {caseNumber}</div>}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Voice controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Language selector */}
          <select value={selectedLang} onChange={e => setSelectedLang(e.target.value)}>
            {voiceLangs.length ? voiceLangs.map(l => <option key={l.code} value={l.code}>{l.name}</option>)
              : <option value="en-IN">English (India)</option>}
          </select>

          {/* Speaker selector */}
          <select value={selectedSpeaker} onChange={e => setSelectedSpeaker(e.target.value)}>
            {voiceSpeakers.length ? voiceSpeakers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
              : <option value="anushka">Anushka (Female)</option>}
          </select>

          {/* Voice-Only mode toggle */}
          <button
            onClick={() => setVoiceOnlyMode(p => !p)}
            title={voiceOnlyMode ? "Voice-only ON: speak → AI answers aloud (no text)" : "Text mode: transcript appears in input box"}
            style={{ padding: "4px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: voiceOnlyMode ? "rgba(52,211,153,.2)" : "rgba(255,255,255,.07)", color: voiceOnlyMode ? "#34D399" : "#64748B", border: voiceOnlyMode ? "1px solid #10B981" : "1px solid transparent", transition: "all .2s" }}>
            {voiceOnlyMode ? "🎙️ Voice Only" : "🎙️ Voice+Text"}
          </button>

          {/* Voice panel toggle */}
          <button onClick={() => setVoicePanelOpen(p => !p)}
            style={{ padding: "4px 10px", borderRadius: 8, background: voicePanelOpen ? "rgba(96,165,250,.15)" : "rgba(255,255,255,.06)", border: voicePanelOpen ? "1px solid #3B82F6" : "1px solid transparent", color: voicePanelOpen ? "#60A5FA" : "#64748B", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .2s" }}
            title="Voice settings">
            ⚙️
          </button>
        </div>
      </div>

      {/* ── VOICE PANEL ── */}
      {voicePanelOpen && (
        <div style={{ background: "rgba(15,23,42,.95)", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "14px 28px" }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px" }}>Speech-to-Text</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: sttEnabled ? "#34D399" : "#EF4444" }} />
                <span style={{ color: sttEnabled ? "#34D399" : "#EF4444", fontSize: 13, fontWeight: 600 }}>{sttEnabled ? "Deepgram Nova-2 Ready" : "Not Configured"}</span>
              </div>
              {!sttEnabled && <div style={{ color: "#64748B", fontSize: 11, marginTop: 4 }}>Set DEEPGRAM_API_KEY in .env → <a href="https://console.deepgram.com" target="_blank" rel="noreferrer" style={{ color: "#60A5FA" }}>console.deepgram.com</a></div>}
            </div>
            <div>
              <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px" }}>Text-to-Speech</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ttsEnabled ? "#34D399" : "#EF4444" }} />
                <span style={{ color: ttsEnabled ? "#34D399" : "#EF4444", fontSize: 13, fontWeight: 600 }}>{ttsEnabled ? "Sarvam AI bulbul:v1 Ready" : "Not Configured"}</span>
              </div>
              {!ttsEnabled && <div style={{ color: "#64748B", fontSize: 11, marginTop: 4 }}>Set SARVAM_API_KEY in .env → <a href="https://dashboard.sarvam.ai" target="_blank" rel="noreferrer" style={{ color: "#60A5FA" }}>dashboard.sarvam.ai</a></div>}
            </div>
            <div>
              <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px" }}>Active Language</div>
              <div style={{ color: "#F8FAFC", fontSize: 13, fontWeight: 600 }}>{langName}</div>
              <div style={{ color: "#64748B", fontSize: 11 }}>Speaker: {voiceSpeakers.find(s => s.id === selectedSpeaker)?.name || selectedSpeaker}</div>
            </div>
            <div>
              <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px" }}>Supported Languages</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {voiceLangs.map(l => (
                  <span key={l.code} onClick={() => setSelectedLang(l.code)}
                    style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", background: selectedLang === l.code ? "rgba(59,130,246,.2)" : "rgba(255,255,255,.06)", color: selectedLang === l.code ? "#60A5FA" : "#64748B", border: selectedLang === l.code ? "1px solid #3B82F6" : "1px solid transparent", transition: "all .15s" }}>
                    {l.name.split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VOICE ERROR ── */}
      {voiceError && (
        <div style={{ background: "rgba(239,68,68,.08)", borderBottom: "1px solid rgba(239,68,68,.25)", padding: "8px 28px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#F87171", fontSize: 13 }}>⚠️ {voiceError}</span>
          <button onClick={() => setVoiceError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── SUGGESTIONS ── */}
      <div style={{ padding: "12px 28px 0", display: "flex", gap: 7, flexWrap: "wrap" }}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => sendMessage(s)}
            style={{ padding: "5px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 20, color: "#94A3B8", cursor: "pointer", fontSize: 11, fontWeight: 600, transition: "all .2s" }}
            onMouseEnter={e => { e.target.style.background = "rgba(59,130,246,.15)"; e.target.style.color = "#60A5FA"; e.target.style.borderColor = "#3B82F6"; }}
            onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,.05)"; e.target.style.color = "#94A3B8"; e.target.style.borderColor = "rgba(255,255,255,.09)"; }}>
            {s}
          </button>
        ))}
      </div>

      {/* ── MESSAGES ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: "18px" }}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div key={idx} className="msg-appear" style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: "10px" }}>
              {!isUser && (
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg,#3B82F6,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, marginTop: 4 }}>🤖</div>
              )}
              <div style={{ maxWidth: "78%", minWidth: "180px" }}>
                {!isUser && (
                  <div style={{ display: "flex", gap: 7, marginBottom: 7, alignItems: "center" }}>
                    <span style={{ color: "#60A5FA", fontWeight: 700, fontSize: 12 }}>Legal AI</span>
                    {msg.rag_used && <span style={{ background: "rgba(52,211,153,.12)", color: "#34D399", border: "1px solid #10B981", borderRadius: 5, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>RAG</span>}
                    {msg.case_number && <span style={{ background: "rgba(167,139,250,.12)", color: "#A78BFA", border: "1px solid #7C3AED", borderRadius: 5, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>CASE</span>}
                    <span style={{ color: "#475569", fontSize: 10 }}>{msg.timestamp}</span>
                    {/* Per-message speak button */}
                    {ttsEnabled && (
                      <button
                        onClick={() => speakText(msg.content, idx)}
                        title={speakingMsgIdx === idx ? "Stop" : "Speak this response"}
                        style={{ background: speakingMsgIdx === idx ? "rgba(167,139,250,.2)" : "rgba(255,255,255,.06)", border: speakingMsgIdx === idx ? "1px solid #7C3AED" : "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "2px 7px", cursor: "pointer", fontSize: 11, color: speakingMsgIdx === idx ? "#A78BFA" : "#64748B", transition: "all .15s", animation: speakingMsgIdx === idx ? "pulse 1.5s infinite" : "none" }}>
                        {speakingMsgIdx === idx ? "⏹ Stop" : "🔊"}
                      </button>
                    )}
                  </div>
                )}
                <div style={{ background: isUser ? "linear-gradient(135deg,#1E40AF,#3B82F6)" : "rgba(22,32,52,.9)", border: isUser ? "none" : "1px solid rgba(255,255,255,.07)", borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px", padding: "14px 18px" }}>
                  {isUser
                    ? <p style={{ color: "#fff", margin: 0, fontSize: 14, lineHeight: "1.6" }}>{msg.content}</p>
                    : <StructuredResponse text={msg.content} />}
                </div>
                {isUser && <div style={{ textAlign: "right", color: "#475569", fontSize: 10, marginTop: 3 }}>{msg.timestamp}</div>}
              </div>
              {isUser && (
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg,#1E40AF,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 13, flexShrink: 0, marginTop: 4 }}>
                  {(typeof window !== "undefined" && localStorage.getItem("user_name") || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg,#3B82F6,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🤖</div>
            <div style={{ background: "rgba(22,32,52,.9)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "4px 18px 18px 18px", padding: "4px 8px" }}>
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div style={{ background: "rgba(10,18,35,.98)", borderTop: "1px solid rgba(255,255,255,.07)", padding: "14px 28px" }}>

        {/* ── VOICE STATUS INDICATOR (voice-only mode) ── */}
        {voiceOnlyMode && (isRecording || isTranscribing || isTyping || isSpeaking) && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: isRecording ? "rgba(239,68,68,.12)" : isSpeaking ? "rgba(167,139,250,.12)" : "rgba(251,191,36,.1)",
              border: isRecording ? "1px solid rgba(239,68,68,.4)" : isSpeaking ? "1px solid #7C3AED" : "1px solid rgba(251,191,36,.3)",
              borderRadius: 30, padding: "8px 20px"
            }}>
              {isRecording && <><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444", animation: "pulse 1s infinite" }} /><span style={{ color: "#F87171", fontWeight: 700, fontSize: 13 }}>🎙️ Recording... {recordingSecs}s — Release to send</span></>}
              {(isTranscribing || isTyping) && !isRecording && <><span style={{ fontSize: 16, animation: "spin 1s linear infinite", display: "block" }}>⏳</span><span style={{ color: "#FBBF24", fontWeight: 700, fontSize: 13 }}>{voiceStatus || "AI thinking..."}</span></>}
              {isSpeaking && !isRecording && !isTranscribing && !isTyping && <><span style={{ animation: "pulse 1.2s infinite", display: "block", fontSize: 18 }}>🔊</span><span style={{ color: "#A78BFA", fontWeight: 700, fontSize: 13 }}>AI is speaking...</span></>}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", maxWidth: 1100, margin: "0 auto" }}>

          {/* ── BIG MIC BUTTON (voice-only mode) ── */}
          {voiceOnlyMode ? (
            <button
              onClick={toggleRecording}
              disabled={(isTranscribing || isTyping || isSpeaking) || !sttEnabled}
              title={isRecording ? "Release to send" : "Hold to speak — AI will answer aloud"}
              style={{
                width: 64, height: 64, borderRadius: "50%", border: "none",
                cursor: sttEnabled && !isTranscribing && !isTyping && !isSpeaking ? "pointer" : "not-allowed",
                flexShrink: 0,
                background: isRecording ? "#EF4444" : isSpeaking ? "rgba(167,139,250,.25)" : sttEnabled ? "linear-gradient(135deg,#2563EB,#7C3AED)" : "rgba(255,255,255,.04)",
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2,
                boxShadow: isRecording ? "0 0 0 8px rgba(239,68,68,.2)" : sttEnabled ? "0 4px 20px rgba(59,130,246,.4)" : "none",
                animation: isRecording ? "recordPulse 1s infinite" : "none", transition: "all .2s",
              }}>
              {isTranscribing || isTyping
                ? <span style={{ fontSize: 24, animation: "spin 1s linear infinite", display: "block" }}>⏳</span>
                : isRecording ? <WaveformBars />
                : isSpeaking ? <span style={{ fontSize: 26, animation: "pulse 1.2s infinite" }}>🔊</span>
                : <span style={{ fontSize: 26 }}>🎙️</span>}
            </button>
          ) : (
            <button
              onClick={toggleRecording}
              disabled={isTranscribing || !sttEnabled}
              style={{
                width: 50, height: 50, borderRadius: 14, border: "none", cursor: sttEnabled ? "pointer" : "not-allowed", flexShrink: 0,
                background: isRecording ? "#EF4444" : isTranscribing ? "rgba(251,191,36,.15)" : sttEnabled ? "rgba(59,130,246,.12)" : "rgba(255,255,255,.04)",
                color: isRecording ? "#fff" : isTranscribing ? "#FBBF24" : sttEnabled ? "#60A5FA" : "#334155",
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2,
                border: isRecording ? "2px solid #EF4444" : isTranscribing ? "1px solid #FBBF24" : sttEnabled ? "1px solid rgba(59,130,246,.3)" : "1px solid #1E293B",
                animation: isRecording ? "recordPulse 1s infinite" : "none", transition: "all .2s",
              }}>
              {isTranscribing
                ? <span style={{ fontSize: 18, animation: "spin 1s linear infinite", display: "block" }}>⏳</span>
                : isRecording ? <WaveformBars />
                : <span style={{ fontSize: 20 }}>🎙️</span>}
            </button>
          )}

          {/* ── TEXT AREA (hidden in voice-only mode) ── */}
          {!voiceOnlyMode && (
            <>
              {isRecording && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 12, height: 50, flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", animation: "pulse 1s infinite" }} />
                  <span style={{ color: "#F87171", fontSize: 12, fontWeight: 700 }}>REC {recordingSecs}s</span>
                </div>
              )}
              <textarea
                ref={inputRef}
                rows={1}
                placeholder={isRecording ? "Listening..." : isTranscribing ? "Transcribing..." : "Ask any legal question... or 🎙️ click mic to speak"}
                value={input}
                disabled={isRecording || isTranscribing}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                style={{ flex: 1, padding: "14px 16px", background: isRecording ? "rgba(239,68,68,.04)" : "#111827", color: "#F8FAFC", border: isRecording ? "1px solid rgba(239,68,68,.3)" : "1px solid #1E293B", borderRadius: 14, fontSize: 14, resize: "none", lineHeight: "1.5", overflowY: "auto", transition: "all .2s" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isTyping || !input.trim() || isRecording || isTranscribing}
                style={{
                  height: 50, minWidth: 100, borderRadius: 14, border: "none", fontWeight: 700, fontSize: 13,
                  cursor: (input.trim() && !isTyping && !isRecording && !isTranscribing) ? "pointer" : "not-allowed",
                  background: (input.trim() && !isTyping && !isRecording && !isTranscribing) ? "linear-gradient(135deg,#2563EB,#3B82F6)" : "#111827",
                  color: (input.trim() && !isTyping && !isRecording && !isTranscribing) ? "#fff" : "#334155",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .2s",
                }}>
                {isTyping ? "⏳" : "⚡"} {isTyping ? "Thinking..." : "Send"}
              </button>
            </>
          )}

          {/* In voice-only mode, show a helper label */}
          {voiceOnlyMode && !isRecording && !isTranscribing && !isTyping && !isSpeaking && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "#334155", fontSize: 13, margin: 0, fontWeight: 600 }}>
                🎙️ Tap mic → Speak your question → AI answers aloud
              </p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 8 }}>
          <p style={{ color: "#1E293B", fontSize: 11, margin: 0 }}>
            {voiceOnlyMode ? "Voice-Only Mode: No text shown — pure voice conversation" : `Enter to send · 🎙️ mic → text in Voice+Text mode · Language: ${langName}`}
          </p>
        </div>
      </div>

    </div>
  );
}