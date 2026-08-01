"use client";

import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem(
          "user_id",
          data.user_id.toString()
        );
        localStorage.setItem(
          "user_name",
          data.name
        );
        localStorage.setItem(
          "user_email",
          data.email
        );
        localStorage.setItem(
          "user_role",
          data.role
        );
        localStorage.setItem(
          "access_token",
          data.access_token
        );
        

        setSuccess(
          `Welcome ${data.name}! Login Successful.`
        );

        setTimeout(() => {
          if (data.role === "Admin") {
            window.location.href =
              "/admin-dashboard";
          } else {
            window.location.href =
              "/dashboard";
          }
        }, 1500);
      } else {
        setError(
          data.detail ||
            "Invalid email or password."
        );
      }
    } catch (err) {
      setError(
        "Backend server is not running."
      );
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F172A",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1300px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "60px",
          alignItems: "center",
        }}
      >
        {/* LEFT SIDE - LEGAL AI BRANDING */}

<div>
  <h1
    style={{
      color: "#F8FAFC",
      fontSize: "58px",
      fontWeight: "800",
      lineHeight: "70px",
      marginBottom: "15px",
    }}
  >
    LEGAL AI
    <br />
    PLATFORM
  </h1>

  <div
    style={{
      width: "120px",
      height: "5px",
      background: "#D4AF37",
      borderRadius: "10px",
      marginBottom: "25px",
    }}
  />

  <h2
    style={{
      color: "#CBD5E1",
      fontSize: "24px",
      fontWeight: "600",
      marginBottom: "15px",
    }}
  >
    AI Powered Legal & Judiciary
    Automation System
  </h2>

  <p
    style={{
      color: "#94A3B8",
      fontSize: "18px",
      lineHeight: "32px",
      marginBottom: "35px",
    }}
  >
    Smart • Secure • Intelligent
    <br />
    Legal Assistance
  </p>

  <div
    style={{
      background: "#1E293B",
      padding: "30px",
      borderRadius: "24px",
      border: "1px solid #334155",
      boxShadow:
        "0 15px 40px rgba(0,0,0,0.25)",
    }}
  >
    <p
      style={{
        color: "#F8FAFC",
        fontSize: "18px",
        marginBottom: "18px",
      }}
    >
      ✓ Legal Intelligence Assistant
    </p>

    <p
      style={{
        color: "#F8FAFC",
        fontSize: "18px",
        marginBottom: "18px",
      }}
    >
      ✓ Case Management System
    </p>

    <p
      style={{
        color: "#F8FAFC",
        fontSize: "18px",
        marginBottom: "18px",
      }}
    >
      ✓ FIR Monitoring System
    </p>

    <p
      style={{
        color: "#F8FAFC",
        fontSize: "18px",
        marginBottom: "18px",
      }}
    >
      ✓ Legal Advocate Services
    </p>

    <p
      style={{
        color: "#F8FAFC",
        fontSize: "18px",
        marginBottom: "18px",
      }}
    >
      ✓ Legal Document Vault
    </p>

    <p
      style={{
        color: "#F8FAFC",
        fontSize: "18px",
      }}
    >
      ✓ Secure Authentication
    </p>
  </div>

  <p
    style={{
      color: "#D4AF37",
      marginTop: "30px",
      fontSize: "18px",
      fontWeight: "600",
    }}
  >
    Empowering the Future of Legal Technology.
  </p>
</div>
{/* RIGHT SIDE - LOGIN CARD */}

<div
  style={{
    background: "#1E293B",
    padding: "50px",
    borderRadius: "30px",
    border: "1px solid #334155",
    boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
  }}
>
  <h1
    style={{
      color: "#F8FAFC",
      fontSize: "42px",
      marginBottom: "10px",
      fontWeight: "700",
    }}
  >
    Welcome to Legal AI
  </h1>

  <div
    style={{
      width: "90px",
      height: "5px",
      background: "#D4AF37",
      borderRadius: "10px",
      marginBottom: "20px",
    }}
  />

  <p
    style={{
      color: "#CBD5E1",
      fontSize: "16px",
      lineHeight: "28px",
      marginBottom: "35px",
    }}
  >
    Sign in to continue to your secure
    Legal AI workspace.
  </p>

  {/* EMAIL */}

  <label
    style={{
      color: "#F8FAFC",
      fontWeight: "600",
      fontSize: "15px",
    }}
  >
    Email Address
  </label>

  <input
    type="email"
    placeholder="Enter your email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    style={{
      width: "100%",
      padding: "15px",
      marginTop: "10px",
      marginBottom: "25px",
      background: "#0F172A",
      color: "#F8FAFC",
      border: "1px solid #334155",
      borderRadius: "15px",
      outline: "none",
      boxSizing: "border-box",
      fontSize: "15px",
    }}
  />

  {/* PASSWORD */}

  <label
    style={{
      color: "#F8FAFC",
      fontWeight: "600",
      fontSize: "15px",
    }}
  >
    Password
  </label>

  <div
    style={{
      position: "relative",
      marginTop: "10px",
      marginBottom: "25px",
    }}
  >
    <input
      type={showPassword ? "text" : "password"}
      placeholder="Enter your password"
      value={password}
      onChange={(e) =>
        setPassword(e.target.value)
      }
      style={{
        width: "100%",
        padding: "15px",
        paddingRight: "50px",
        background: "#0F172A",
        color: "#F8FAFC",
        border: "1px solid #334155",
        borderRadius: "15px",
        outline: "none",
        boxSizing: "border-box",
        fontSize: "15px",
      }}
    />
    {/* SHOW / HIDE PASSWORD ICON */}

<span
  onClick={() =>
    setShowPassword(!showPassword)
  }
  style={{
    position: "absolute",
    right: "18px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    color: "#CBD5E1",
    fontSize: "18px",
    userSelect: "none",
  }}
>
  {showPassword ? "🙈" : "👁️"}
</span>

</div>

{/* ERROR MESSAGE */}

{error && (
  <div
    style={{
      background: "#7F1D1D",
      color: "#FCA5A5",
      padding: "15px",
      borderRadius: "15px",
      marginBottom: "20px",
      border: "1px solid #EF4444",
    }}
  >
    {error}
  </div>
)}

{/* SUCCESS MESSAGE */}

{success && (
  <div
    style={{
      background: "#064E3B",
      color: "#6EE7B7",
      padding: "15px",
      borderRadius: "15px",
      marginBottom: "20px",
      border: "1px solid #10B981",
    }}
  >
    {success}
  </div>
)}

{/* LOGIN BUTTON */}

<button
  onClick={handleLogin}
  disabled={loading}
  style={{
    width: "100%",
    padding: "16px",
    background: loading
      ? "#475569"
      : "#4F46E5",
    color: "white",
    border: "none",
    borderRadius: "15px",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: "700",
    transition: "0.3s",
    boxShadow:
      "0 10px 25px rgba(79,70,229,0.40)",
  }}
>
  {loading ? "Logging In..." : "LOGIN"}
</button>

{/* REGISTER LINK */}

<p
  style={{
    marginTop: "28px",
    textAlign: "center",
    color: "#CBD5E1",
    fontSize: "15px",
  }}
>
  Don't have an account?{" "}
  <a
    href="/register"
    style={{
      color: "#D4AF37",
      textDecoration: "none",
      fontWeight: "700",
    }}
  >
    Create Your Legal AI Account
  </a>
</p>

</div>

{/* END OF GRID */}

</div>

{/* END OF PAGE */}

</div>
);
}