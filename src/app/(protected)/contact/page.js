"use client";

import { useState } from "react";

// Theme colors defined directly here - no external file needed
const theme = {
  background: "#0F172A",
  card: "#1E293B",
  input: "#334155",
  border: "#475569",
  primary: "#6366F1",
  primaryHover: "#4F46E5",
  gold: "#D4AF37",
  textMain: "#F8FAFC",
  textSecondary: "#CBD5E1",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "20px",
  borderRadius: "8px",
  border: `1px solid ${theme.border}`,
  fontSize: "16px",
  boxSizing: "border-box",
  background: theme.input,
  color: theme.textMain,
};

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const sendMessage = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("access_token");

      // CONTACT API
      const response = await fetch("http://127.0.0.1:8000/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Failed to send message.");
        setLoading(false);
        return;
      }

      // NOTIFICATION API
      const notifyResponse = await fetch("http://127.0.0.1:8000/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient_name: name,
          recipient_email: email,
          recipient_phone: null,
          notification_type: "email",
          subject: "Contact Request Received",
          message:
            "Thank you for contacting Legal Assistant. We received your request and will contact you soon.",
        }),
      });

      if (notifyResponse.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      if (!notifyResponse.ok) {
        setError("Message saved, but notification failed.");
        setLoading(false);
        return;
      }

      setSuccess("✅ Message Sent Successfully! Notification Generated.");

      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError("Could not connect to server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        fontFamily: "Arial",
        padding: "50px",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          color: theme.gold,
          fontSize: "50px",
        }}
      >
        📞 Contact Us
      </h1>

      <p
        style={{
          textAlign: "center",
          color: theme.textSecondary,
          fontSize: "18px",
          marginBottom: "40px",
        }}
      >
        Have a question? We are here to help.
      </p>

      <div
        style={{
          maxWidth: "700px",
          margin: "40px auto",
          background: theme.card,
          padding: "40px",
          borderRadius: "15px",
          border: `1px solid ${theme.border}`,
          boxShadow: "0px 8px 20px rgba(0,0,0,0.35)",
        }}
      >
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder="Enter your message"
          rows="6"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={inputStyle}
        />

        {error && (
          <div
            style={{
              padding: "12px",
              background: "rgba(239, 68, 68, 0.15)",
              borderRadius: "8px",
              color: theme.error,
              fontWeight: "bold",
              marginBottom: "15px",
              border: `1px solid ${theme.error}`,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "12px",
              background: "rgba(16, 185, 129, 0.15)",
              borderRadius: "8px",
              color: theme.success,
              fontWeight: "bold",
              marginBottom: "15px",
              border: `1px solid ${theme.success}`,
            }}
          >
            {success}
          </div>
        )}

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px",
            background: loading ? theme.border : theme.primary,
            color: theme.textMain,
            border: "none",
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </div>
    </div>
  );
}