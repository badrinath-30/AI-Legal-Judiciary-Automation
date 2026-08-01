"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const BACKEND = "http://127.0.0.1:8000";

const SUGGESTIONS = [
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
  "📋 Summary": { color: "#60A5FA", bg: "rgba(96, 165, 250, 0.08)" },
  "📊 Current Status": { color: "#FBBF24", bg: "rgba(251, 191, 36, 0.08)" },
  "⚙️ Next Legal Process": { color: "#A78BFA", bg: "rgba(167, 139, 250, 0.08)" },
  "📄 Required Documents": { color: "#34D399", bg: "rgba(52, 211, 153, 0.08)" },
  "⚠️ Important Notes": { color: "#F87171", bg: "rgba(248, 113, 113, 0.08)" },
};

function parseStructuredAnswer(text) {
  if (!text) return null;
  const sections = [];
  const sectionHeaders = Object.keys(SECTION_ICONS);
  let current = null;

  text.split("\n").forEach(line => {
    const header = sectionHeaders.find(h => line.includes(h));
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
        const style = SECTION_ICONS[section.title] || { color: "#94A3B8", bg: "rgba(148, 163, 184, 0.08)" };
        return (
          <div key={i} style={{ background: style.bg, border: `1px solid ${style.color}30`, borderRadius: "12px", padding: "14px 18px" }}>
            <div style={{ color: style.color, fontWeight: "800", fontSize: "14px", marginBottom: "10px", letterSpacing: "0.3px" }}>
              {section.title}
            </div>
            <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: "1.8" }}>
              {section.lines.map((line, j) => (
                <div key={j} style={{ marginBottom: "4px" }}>
                  {line.startsWith("-") || line.startsWith("•")
                    ? <span style={{ display: "flex", gap: "8px" }}><span style={{ color: style.color }}>▸</span><span>{line.replace(/^[-•]\s*/, "")}</span></span>
                    : <span>{line}</span>
                  }
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

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [useStructured, setUseStructured] = useState(true);
  const [ragEnabled, setRagEnabled] = useState(false);
  const [sessionId] = useState(() => "session_" + Date.now());
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) window.location.href = "/login";

    // Welcome message
    setMessages([{
      role: "assistant",
      content: `## 📋 Summary
Welcome to the **AI Legal Assistant** — powered by Groq LLaMA 3.3 with RAG integration.

## 📊 Current Status
System ready. Structured 5-section legal analysis enabled.

## ⚙️ Next Legal Process
Ask any legal question in plain language — about your case, FIR, bail, IPC sections, court procedures, or legal rights.

## 📄 Required Documents
No documents needed to use the AI assistant. Just type your question below.

## ⚠️ Important Notes
- This AI provides general legal information, not formal legal advice.
- For case-specific queries, enter your **Case Number** to get personalized analysis.
- All queries are logged under your account for security.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      structured: true
    }]);
  }, []);

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question) return;

    const token = localStorage.getItem("access_token");
    if (!token) { window.location.href = "/login"; return; }

    setMessages(prev => [...prev, {
      role: "user",
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }]);
    setInput("");
    setIsTyping(true);

    try {
      const endpoint = useStructured ? "/ai/structured-query" : "/ai-chat";
      const payload = useStructured
        ? { question, case_number: caseNumber || null, context_type: caseNumber ? "case" : "general" }
        : { question };

      const res = await axios.post(`${BACKEND}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const answer = res.data.answer;
      const ragUsed = res.data.rag_used;

      setMessages(prev => [...prev, {
        role: "assistant",
        content: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        structured: useStructured,
        rag_used: ragUsed,
        case_number: res.data.case_number
      }]);
      setRagEnabled(ragUsed);
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "## ⚠️ Important Notes\nSorry, the AI Legal Assistant is currently unavailable. Please try again or contact support.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        structured: true
      }]);
    }
    setIsTyping(false);
  };

  const downloadChatPDF = () => {
    const content = messages.map(m =>
      `[${m.role.toUpperCase()} - ${m.timestamp}]\n${m.content}\n`
    ).join("\n" + "─".repeat(60) + "\n");

    const blob = new Blob([`LEGAL AI ASSISTANT - CONSULTATION TRANSCRIPT\n${"=".repeat(60)}\nGenerated: ${new Date().toLocaleString()}\n\n${content}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `legal-ai-consultation-${sessionId}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        textarea:focus { outline: none; border-color: #3B82F6 !important; }
        .msg-appear { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "rgba(15, 23, 42, 0.98)", borderBottom: "1px solid rgba(96, 165, 250, 0.2)", padding: "18px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "linear-gradient(135deg, #3B82F6, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>🤖</div>
          <div>
            <h2 style={{ color: "#F8FAFC", margin: 0, fontSize: "20px", fontWeight: "800" }}>AI Legal Assistant</h2>
            <p style={{ color: "#60A5FA", margin: 0, fontSize: "12px", fontWeight: "600" }}>
              Groq LLaMA 3.3-70B • RAG Integration • 5-Section Structured Analysis
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {ragEnabled && (
            <div style={{ background: "rgba(52, 211, 153, 0.15)", border: "1px solid #10B981", borderRadius: "8px", padding: "5px 12px", color: "#34D399", fontSize: "12px", fontWeight: "700" }}>
              📚 RAG Active
            </div>
          )}
          <button onClick={downloadChatPDF} style={{ background: "rgba(96, 165, 250, 0.1)", border: "1px solid #3B82F6", color: "#60A5FA", borderRadius: "10px", padding: "8px 16px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
            📥 Export Transcript
          </button>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div style={{ background: "rgba(15, 23, 42, 0.6)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "12px 32px", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: "600" }}>Mode:</span>
          <button
            onClick={() => setUseStructured(!useStructured)}
            style={{ padding: "5px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700",
              background: useStructured ? "#3B82F6" : "rgba(255,255,255,0.07)",
              color: useStructured ? "white" : "#94A3B8" }}
          >
            {useStructured ? "📋 Structured (5-Section)" : "💬 Free Chat"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: "600" }}>Case Context:</span>
          <input
            type="text"
            placeholder="Enter Case No. (optional)"
            value={caseNumber}
            onChange={e => setCaseNumber(e.target.value)}
            style={{ padding: "5px 12px", background: "#0F172A", color: "#60A5FA", border: "1px solid #334155", borderRadius: "8px", fontSize: "13px", width: "200px" }}
          />
        </div>
        {caseNumber && (
          <div style={{ background: "rgba(167, 139, 250, 0.1)", border: "1px solid #7C3AED", borderRadius: "8px", padding: "4px 12px", color: "#A78BFA", fontSize: "12px", fontWeight: "700" }}>
            🔗 Case: {caseNumber}
          </div>
        )}
      </div>

      {/* SUGGESTIONS */}
      <div style={{ padding: "14px 32px 0", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => sendMessage(s)} style={{ padding: "6px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", color: "#94A3B8", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.2s" }}
            onMouseEnter={e => { e.target.style.background = "rgba(59, 130, 246, 0.15)"; e.target.style.color = "#60A5FA"; e.target.style.borderColor = "#3B82F6"; }}
            onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.06)"; e.target.style.color = "#94A3B8"; e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}>
            {s}
          </button>
        ))}
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div key={idx} className="msg-appear" style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: "12px" }}>
              {!isUser && (
                <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #3B82F6, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0, marginTop: "4px" }}>🤖</div>
              )}
              <div style={{ maxWidth: "78%", minWidth: "200px" }}>
                {!isUser && (
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                    <span style={{ color: "#60A5FA", fontWeight: "700", fontSize: "13px" }}>Legal AI</span>
                    {msg.rag_used && <span style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34D399", border: "1px solid #10B981", borderRadius: "6px", padding: "1px 8px", fontSize: "10px", fontWeight: "700" }}>RAG</span>}
                    {msg.case_number && <span style={{ background: "rgba(167, 139, 250, 0.15)", color: "#A78BFA", border: "1px solid #7C3AED", borderRadius: "6px", padding: "1px 8px", fontSize: "10px", fontWeight: "700" }}>CASE</span>}
                    <span style={{ color: "#475569", fontSize: "11px" }}>{msg.timestamp}</span>
                  </div>
                )}
                <div style={{
                  background: isUser ? "linear-gradient(135deg, #1E40AF, #3B82F6)" : "rgba(30, 41, 59, 0.8)",
                  border: isUser ? "none" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                  padding: "16px 20px",
                }}>
                  {isUser ? (
                    <p style={{ color: "white", margin: 0, fontSize: "15px", lineHeight: "1.6" }}>{msg.content}</p>
                  ) : (
                    <StructuredResponse text={msg.content} />
                  )}
                </div>
                {isUser && <div style={{ textAlign: "right", color: "#475569", fontSize: "11px", marginTop: "4px" }}>{msg.timestamp}</div>}
              </div>
              {isUser && (
                <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #1E40AF, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "white", fontSize: "14px", flexShrink: 0, marginTop: "4px" }}>
                  {(localStorage.getItem("user_name") || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #3B82F6, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🤖</div>
            <div style={{ background: "rgba(30, 41, 59, 0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px 18px 18px 18px", padding: "4px 8px" }}>
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT BAR */}
      <div style={{ background: "rgba(15, 23, 42, 0.98)", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "18px 32px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", maxWidth: "1100px", margin: "0 auto" }}>
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Ask any legal question... (e.g. What are my rights during arrest?)"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            style={{ flex: 1, padding: "14px 18px", background: "#1E293B", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "14px", fontSize: "15px", resize: "none", lineHeight: "1.5", overflowY: "auto" }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isTyping || !input.trim()}
            style={{ height: "50px", minWidth: "110px", background: input.trim() && !isTyping ? "linear-gradient(135deg, #2563EB, #3B82F6)" : "#1E293B", color: input.trim() && !isTyping ? "white" : "#475569", border: "none", borderRadius: "14px", cursor: input.trim() && !isTyping ? "pointer" : "not-allowed", fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.2s" }}
          >
            {isTyping ? "⏳" : "⚡"} {isTyping ? "Thinking..." : "Send"}
          </button>
        </div>
        <p style={{ color: "#334155", fontSize: "11px", textAlign: "center", margin: "10px 0 0" }}>
          Press Enter to send • Shift+Enter for new line • Powered by Groq LLaMA 3.3-70B + RAG
        </p>
      </div>

    </div>
  );
}