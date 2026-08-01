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

export default function LegalDocuments() {
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("FIR Copy");
  const [uploadedBy, setUploadedBy] = useState("");
  const [caseId, setCaseId] = useState("");
  const [filePath, setFilePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  const uploadDocument = async () => {
  if (!title.trim() || !uploadedBy.trim() || !filePath.trim()) {
    setError("Please fill Title, Uploaded By and File Path fields.");
    return;
  }

  setLoading(true);
  setError("");
  setSuccess("");

  try {
    const token = localStorage.getItem("access_token");

    const response = await fetch("http://127.0.0.1:8000/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: title,
        document_type: documentType,
        uploaded_by: uploadedBy,
        case_id: caseId || null,
        file_path: filePath,
      }),
    });

    if (response.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
      return;
    }

    const data = await response.json();

    if (response.ok) {
      setSuccess(
        `Document uploaded successfully! Document ID: ${data.document.id}`
      );

      // Clear form
      setTitle("");
      setUploadedBy("");
      setCaseId("");
      setFilePath("");

      // Automatically refresh documents list
      fetchDocuments();
    } else {
      setError(data.detail || "Upload failed.");
    }
  } catch (err) {
    setError("Could not connect to server. Make sure backend is running.");
  } finally {
    setLoading(false);
  }
};

  const fetchDocuments = async () => {
    setFetchLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch("http://127.0.0.1:8000/documents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError("Could not fetch documents.");
    } finally {
      setFetchLoading(false);
    }
  };

  const deleteDocument = async (docId) => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(`http://127.0.0.1:8000/documents/${docId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (err) {
      setError("Could not delete document.");
    }
  };

  return (
    <div style={{ background: theme.background, minHeight: "100vh", padding: "40px", fontFamily: "Arial" }}>

      <h1 style={{ textAlign: "center", color: theme.gold, fontSize: "45px" }}>
        Legal Document Assistant
      </h1>

      <p style={{ textAlign: "center", color: theme.textSecondary, fontSize: "18px", marginBottom: "40px" }}>
        Upload and manage your legal documents.
      </p>

      {/* UPLOAD FORM */}
      <div
        style={{
          maxWidth: "850px",
          margin: "auto",
          background: theme.card,
          padding: "30px",
          borderRadius: "15px",
          border: `1px solid ${theme.border}`,
          boxShadow: "0px 8px 20px rgba(0,0,0,0.35)",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ color: theme.gold }}>Upload Document</h2>

        {/* TITLE */}
        <div style={{ marginTop: "20px" }}>
          <label style={{ fontWeight: "bold", color: theme.textSecondary }}>Document Title *</label>
          <input
            type="text"
            placeholder="e.g. FIR Copy - Mobile Theft"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              marginTop: "8px",
              fontSize: "15px",
              boxSizing: "border-box",
              background: theme.input,
              color: theme.textMain,
            }}
          />
        </div>

        {/* DOCUMENT TYPE */}
        <div style={{ marginTop: "20px" }}>
          <label style={{ fontWeight: "bold", color: theme.textSecondary }}>Document Type *</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              marginTop: "8px",
              fontSize: "15px",
              boxSizing: "border-box",
              background: theme.input,
              color: theme.textMain,
            }}
          >
            <option>FIR Copy</option>
            <option>Bail Application</option>
            <option>Court Order</option>
            <option>Legal Notice</option>
            <option>Affidavit</option>
            <option>Power of Attorney</option>
            <option>Property Document</option>
            <option>Other</option>
          </select>
        </div>

        {/* UPLOADED BY */}
        <div style={{ marginTop: "20px" }}>
          <label style={{ fontWeight: "bold", color: theme.textSecondary }}>Uploaded By *</label>
          <input
            type="text"
            placeholder="Your name"
            value={uploadedBy}
            onChange={(e) => setUploadedBy(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              marginTop: "8px",
              fontSize: "15px",
              boxSizing: "border-box",
              background: theme.input,
              color: theme.textMain,
            }}
          />
        </div>

        {/* CASE ID */}
        <div style={{ marginTop: "20px" }}>
          <label style={{ fontWeight: "bold", color: theme.textSecondary }}>Case ID (optional)</label>
          <input
            type="number"
            placeholder="Link to a case ID if any"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              marginTop: "8px",
              fontSize: "15px",
              boxSizing: "border-box",
              background: theme.input,
              color: theme.textMain,
            }}
          />
        </div>

        {/* FILE PATH */}
        <div style={{ marginTop: "20px" }}>
          <label style={{ fontWeight: "bold", color: theme.textSecondary }}>File Path *</label>
          <input
            type="text"
            placeholder="e.g. /docs/fir_copy.pdf"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              marginTop: "8px",
              fontSize: "15px",
              boxSizing: "border-box",
              background: theme.input,
              color: theme.textMain,
            }}
          />
        </div>

        {/* ERROR */}
        {error && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              background: "rgba(239, 68, 68, 0.15)",
              borderRadius: "8px",
              color: theme.error,
              fontWeight: "bold",
              border: `1px solid ${theme.error}`,
            }}
          >
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              background: "rgba(16, 185, 129, 0.15)",
              borderRadius: "8px",
              color: theme.success,
              fontWeight: "bold",
              border: `1px solid ${theme.success}`,
            }}
          >
            {success}
          </div>
        )}

        {/* SUBMIT */}
        <button
          onClick={uploadDocument}
          disabled={loading}
          style={{
            marginTop: "25px",
            background: loading ? theme.border : theme.primary,
            color: theme.textMain,
            border: "none",
            padding: "14px 30px",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {loading ? "Uploading..." : "Upload Document"}
        </button>
      </div>

      {/* VIEW ALL DOCUMENTS */}
      <div
        style={{
          maxWidth: "850px",
          margin: "auto",
          background: theme.card,
          padding: "30px",
          borderRadius: "15px",
          border: `1px solid ${theme.border}`,
          boxShadow: "0px 8px 20px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: theme.gold }}>All Documents</h2>
          <button
            onClick={fetchDocuments}
            disabled={fetchLoading}
            style={{
              background: theme.primary,
              color: theme.textMain,
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {fetchLoading ? "Loading..." : "Load Documents"}
          </button>
        </div>

        {documents.length === 0 && (
          <p style={{ color: theme.textSecondary, marginTop: "20px" }}>
            No documents loaded yet. Click Load Documents.
          </p>
        )}

        {documents.map((doc) => (
          <div
            key={doc.id}
            style={{
              marginTop: "20px",
              padding: "20px",
              background: theme.input,
              borderRadius: "10px",
              border: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: "bold", color: theme.gold, fontSize: "16px", margin: 0 }}>
                  {doc.title}
                </p>
                <p style={{ color: theme.textSecondary, fontSize: "14px", margin: "5px 0" }}>
                  Type: {doc.document_type}
                </p>
                <p style={{ color: theme.textSecondary, fontSize: "14px", margin: "5px 0" }}>
                  Uploaded by: {doc.uploaded_by}
                </p>
                <p style={{ color: theme.textSecondary, fontSize: "14px", margin: "5px 0" }}>
                  File: {doc.file_path}
                </p>
                {doc.case_id && (
                  <p style={{ color: theme.textSecondary, fontSize: "14px", margin: "5px 0" }}>
                    Case ID: {doc.case_id}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteDocument(doc.id)}
                style={{
                  background: theme.error,
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}