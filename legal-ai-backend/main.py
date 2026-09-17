# -*- coding: utf-8 -*-
import uuid
import hashlib
import base64
import io
import random
import json
import re
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import httpx
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
from rag import build_context
from twilio_service import send_sms
from sqlalchemy.orm import Session
from jwt_handler import create_access_token, verify_token


from database import SessionLocal
from models import (
    User,
    Appointment,
    FIR,
    Case,
    Document,
    Contact,
    Notification,

    ChatHistory,
    AuditLog,
    Hearing,
)
from schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    AuditLogResponse,
    DocumentCreate,
    ContactCreate,
    NotificationCreate,
)
from auth import hash_password, verify_password
from fastapi import Header, HTTPException, Request

VALID_ROLES = ["User", "Police", "Advocate", "Court Management", "Super Admin"]


def log_audit_event(
    db: Session,
    action: str,
    resource: str,
    user_id: Optional[int] = None,
    user_email: Optional[str] = None,
    user_role: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = "127.0.0.1"
):
    try:
        audit = AuditLog(
            user_id=user_id,
            user_email=user_email,
            user_role=user_role,
            action=action,
            resource=resource,
            details=details,
            ip_address=ip_address
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        print("Audit Log Failed:", str(e))


def get_current_user(
    authorization: str = Header(None)
):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    token = authorization.split(" ")[1]

    payload = verify_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or Expired Token")

    return payload


def require_role(allowed_roles: list):
    def role_checker(current_user=Depends(get_current_user)):
        user_role = current_user.get("role")
        # Direct match or Super Admin override
        if user_role not in allowed_roles and user_role != "Super Admin":
            raise HTTPException(
                status_code=403,
                detail=f"Permission Denied. Role '{user_role}' does not have access to this resource."
            )
        return current_user
    return role_checker



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(title="Legal AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# AI LEGAL ASSISTANT
# ================================

class Question(BaseModel):
    question: str


class StructuredQuery(BaseModel):
    question: str
    case_number: Optional[str] = None
    context_type: Optional[str] = "general"  # general | case | fir | hearing


STRUCTURED_AI_SYSTEM_PROMPT = """You are a direct Indian Legal AI Assistant.

Provide an EXTREMELY SHORT, 1-TO-2 LINE summary per section using EXACTLY this 5-section format:

## 📋 Summary
[1 short sentence answering the query directly]

## 📊 Current Status
[1 short line on applicable law e.g. Sec 154 CrPC / BNS]

## ⚙️ Next Legal Process
[1 short line on immediate action step]

## 📄 Required Documents
[1 short line listing 2 key documents]

## ⚠️ Important Notes
[1 short line warning or right]

CRITICAL RULES:
- Keep EACH section to 1 short sentence.
- The ENTIRE answer MUST be under 60-80 words total.
- Be super brief, clear, and to the point. No fluff or extra explanations."""


# ================================
# RULE-BASED FALLBACK LEGAL ENGINE
# Used when GROQ_API_KEY is not set
# ================================

LEGAL_KNOWLEDGE_BASE = {
    "fir": {
        "keywords": ["fir", "first information report", "file fir", "register fir", "zero fir"],
        "answer": """## 📋 Summary
An FIR (First Information Report) is the first step in the criminal justice process in India. It is a written document prepared by the police when they receive information about a cognizable offense.

## 📊 Current Status
- Governed by Section 154 of CrPC (Code of Criminal Procedure)
- Any person can file an FIR at any police station
- Zero FIR can be filed at ANY police station regardless of jurisdiction
- Police are legally bound to register FIR for cognizable offenses

## ⚙️ Next Legal Process
- Visit the nearest police station or file online on state police portals
- Provide a written/oral complaint about the incident
- Get the FIR copy (free of charge)
- If police refuse, approach Superintendent of Police or Magistrate
- You can also send FIR by post to SP/Magistrate (Section 156(3) CrPC)

## 📄 Required Documents
- Government-issued ID proof (Aadhaar, Voter ID, Passport)
- Written complaint describing the incident
- Any evidence or witness information available
- Medical report (if applicable for assault/injury cases)

## ⚠️ Important Notes
- Police CANNOT refuse to register an FIR for cognizable offenses
- You are entitled to a free copy of the FIR
- False FIR can lead to prosecution under IPC Section 182
- FIR must be filed promptly to preserve evidence"""
    },
    "bail": {
        "keywords": ["bail", "anticipatory bail", "regular bail", "interim bail", "bail application"],
        "answer": """## 📋 Summary
Bail is a legal process allowing an accused person to be released from custody while awaiting trial. Indian law provides multiple types of bail under CrPC.

## 📊 Current Status
- Regular Bail: Section 437/439 CrPC — after arrest
- Anticipatory Bail: Section 438 CrPC — before arrest
- Interim Bail: Temporary bail granted pending regular bail hearing
- Supreme Court has held that bail is the rule and jail is the exception

## ⚙️ Next Legal Process
- Engage an advocate to file bail application
- For regular bail: Apply before Magistrate/Sessions Court
- For anticipatory bail: Apply before Sessions Court or High Court
- Court considers: nature of offense, criminal antecedents, flight risk
- Attend hearing and present surety/bail bond

## 📄 Required Documents
- Bail application (drafted by advocate)
- Surety documents and property papers
- ID proof of accused and surety
- Address proof
- Copy of FIR and case papers

## ⚠️ Important Notes
- Bail cannot be granted for certain serious offenses without stringent scrutiny
- Bail conditions must be strictly followed or bail may be cancelled
- Personal bond may be accepted for bailable offenses
- Non-bailable offenses require court discretion for bail"""
    },
    "arrest": {
        "keywords": ["arrest", "rights during arrest", "police arrest", "arrested", "detention"],
        "answer": """## 📋 Summary
Every person arrested by police has fundamental rights guaranteed by the Constitution and CrPC. Knowing your rights during arrest is essential to protect yourself from illegal detention.

## 📊 Current Status
- Article 22 of Constitution provides protection against arbitrary arrest
- Section 41 CrPC regulates when police can arrest without warrant
- D.K. Basu guidelines (Supreme Court) protect arrestees' rights
- Police must follow mandatory procedural safeguards during arrest

## ⚙️ Next Legal Process
- Demand to know the reason for arrest
- Exercise your right to remain silent
- Request to inform a family member/friend immediately
- Demand access to a lawyer/advocate
- Must be produced before Magistrate within 24 hours of arrest
- Apply for bail if the offense is bailable

## 📄 Required Documents
- Arrest memo (police must prepare and get it signed)
- Medical examination report
- Written grounds of arrest (Section 50 CrPC)

## ⚠️ Important Notes
- Police CANNOT detain you beyond 24 hours without Magistrate's order
- You have the right to legal aid (free lawyer if you can't afford one)
- Physical torture/third-degree methods are illegal and constitute offenses
- Female arrestees can only be arrested by female officers after sunset"""
    },
    "ipc": {
        "keywords": ["ipc", "indian penal code", "section 302", "section 307", "section 420", "section 376", "ipc section", "murder", "theft", "fraud"],
        "answer": """## 📋 Summary
The Indian Penal Code (IPC) 1860 is the main criminal code of India defining offenses and prescribing punishments. It covers all major crimes from theft to murder.

## 📊 Current Status
- IPC has been replaced by Bharatiya Nyaya Sanhita (BNS) 2023 effective July 1, 2024
- Major IPC sections: 302 (Murder), 307 (Attempt to Murder), 376 (Rape), 420 (Cheating), 498A (Domestic Violence)
- BNS retains most provisions with some modifications and new sections
- CrPC replaced by BNSS (Bharatiya Nagarik Suraksha Sanhita)

## ⚙️ Next Legal Process
- Consult an advocate for case-specific legal advice
- File complaint/FIR at police station
- Collect and preserve all relevant evidence
- Engage advocate for court proceedings
- Follow court schedule and appear for hearings

## 📄 Required Documents
- Complaint in writing
- Evidence: photographs, videos, medical reports, witness statements
- ID proof
- Any documentary evidence supporting the case

## ⚠️ Important Notes
- IPC offenses are classified as cognizable/non-cognizable and bailable/non-bailable
- Punishment ranges from fine to life imprisonment/death penalty
- Limitation period applies for filing complaints
- Seek legal advice before taking any legal action"""
    },
    "article 21": {
        "keywords": ["article 21", "right to life", "fundamental rights", "constitutional rights", "article 19", "article 14"],
        "answer": """## 📋 Summary
Article 21 of the Indian Constitution guarantees the Right to Life and Personal Liberty — one of the most fundamental and expansive rights. It protects citizens from arbitrary deprivation of life or liberty.

## 📊 Current Status
- Article 21: No person shall be deprived of life or personal liberty except by procedure established by law
- Interpreted very broadly by Supreme Court to include right to health, education, dignity, privacy, livelihood
- Right to Privacy was declared a fundamental right under Article 21 (Puttaswamy case 2017)
- Can be enforced through Writ Petitions before High Court/Supreme Court

## ⚙️ Next Legal Process
- If Article 21 is violated, file a Writ Petition (Habeas Corpus/Mandamus)
- Approach High Court under Article 226 or Supreme Court under Article 32
- File PIL (Public Interest Litigation) for widespread violations
- Seek interim stay/injunction from court

## 📄 Required Documents
- Writ petition (drafted by advocate)
- Evidence of violation of fundamental rights
- Affidavit supporting the facts
- Relevant orders/communications causing the violation

## ⚠️ Important Notes
- Article 21 cannot be suspended even during Emergency (after 44th Amendment)
- Compensatory jurisprudence: courts can award compensation for violation
- Both state and non-state actors can violate Article 21
- Speedy trial is part of Article 21 rights"""
    },
    "writ petition": {
        "keywords": ["writ", "writ petition", "habeas corpus", "mandamus", "certiorari", "quo warranto", "prohibition"],
        "answer": """## 📋 Summary
A Writ Petition is a legal remedy to enforce fundamental rights. Courts can issue five types of writs: Habeas Corpus, Mandamus, Certiorari, Prohibition, and Quo Warranto.

## 📊 Current Status
- High Courts issue writs under Article 226 (broader jurisdiction)
- Supreme Court issues writs under Article 32 (only for fundamental rights)
- Habeas Corpus: To produce a detained person before court
- Mandamus: To compel performance of a public duty
- Certiorari: To quash an illegal order of lower court/tribunal

## ⚙️ Next Legal Process
- Draft writ petition with advocate's help
- File in High Court (Article 226) or Supreme Court (Article 32)
- Pay court fees and filing charges
- Attend hearing; court may issue notice to respondents
- Seek interim relief (stay/injunction) if urgent

## 📄 Required Documents
- Writ petition with supporting affidavit
- Vakalatnama (advocate authorization)
- Copies of impugned orders/documents
- ID proof
- Court fee payment receipt

## ⚠️ Important Notes
- Writ jurisdiction cannot be excluded by statute
- Laches (delay) can be a ground for dismissal
- Alternate remedy must generally be exhausted before filing writ
- PILs can be filed in public interest even by third parties"""
    },
    "case tracking": {
        "keywords": ["case status", "track case", "case tracking", "court date", "hearing date", "case number"],
        "answer": """## 📋 Summary
Case tracking allows litigants to monitor the progress of their legal cases through court management systems. You can track case status, hearing dates, and orders online.

## 📊 Current Status
- eCourts portal (ecourts.gov.in) provides online case status for most courts
- National Judicial Data Grid (NJDG) tracks pending cases
- High Courts have their own cause list and case status portals
- This legal system provides real-time case tracking for registered cases

## ⚙️ Next Legal Process
- Log in to this system and navigate to 'Track Cases'
- Enter your Case Number or FIR Number
- View hearing schedule, case status, and documents
- Enable notifications for hearing date reminders
- Download case documents as needed

## 📄 Required Documents
- Case Number or FIR Number (provided at time of filing)
- ID proof for verification

## ⚠️ Important Notes
- Always attend court hearings on scheduled dates
- Missing hearings may result in ex-parte orders against you
- Inform your advocate immediately about any case developments
- Court orders and judgments are legally binding"""
    },
    "divorce": {
        "keywords": ["divorce", "separation", "matrimonial", "alimony", "maintenance", "custody", "marriage dissolution"],
        "answer": """## 📋 Summary
Divorce in India is governed by personal laws based on religion. The Hindu Marriage Act, Muslim Personal Law, Special Marriage Act, and others apply to different communities.

## 📊 Current Status
- Hindu Marriage Act 1955: Grounds include cruelty, desertion, adultery, mental disorder
- Mutual Consent Divorce: 6-month cooling period (can be waived by SC judgment)
- Muslim law: Triple Talaq (instant) is now banned (Muslim Women Protection Act 2019)
- Special Marriage Act: For inter-religious marriages

## ⚙️ Next Legal Process
- Consult a family law advocate
- For mutual consent: File joint petition in Family Court
- For contested divorce: File petition stating grounds
- Attend mediation (mandatory in most courts)
- Trial and judgment (contested cases may take 2-5 years)

## 📄 Required Documents
- Marriage certificate
- Proof of residence
- Income/financial documents for alimony
- Proof of grounds cited (cruelty, desertion, etc.)
- Children's birth certificates (for custody matters)

## ⚠️ Important Notes
- Alimony/maintenance can be claimed under Section 125 CrPC
- Child custody decided based on 'best interests of the child'
- Domestic Violence Act (2005) provides additional remedies for women
- Property division follows personal law or court's equitable discretion"""
    },
    "consumer complaint": {
        "keywords": ["consumer", "consumer complaint", "consumer court", "product defect", "service deficiency", "refund"],
        "answer": """## 📋 Summary
Consumer protection in India is governed by the Consumer Protection Act 2019. Consumers can file complaints against defective products, deficient services, unfair trade practices, and overcharging.

## 📊 Current Status
- District Consumer Commission: Claims up to ₹50 lakhs
- State Consumer Commission: Claims ₹50 lakhs to ₹2 crores
- National Consumer Commission (NCDRC): Claims above ₹2 crores
- Online complaint portal: consumerhelpline.gov.in or eDaakhil portal

## ⚙️ Next Legal Process
- Send legal notice to seller/service provider first
- File complaint on eDaakhil portal (edaakhil.nic.in) or physically
- Pay nominal filing fee based on claim amount
- Attend hearing; mediation may be attempted first
- Commission passes order for compensation/replacement/refund

## 📄 Required Documents
- Purchase receipt/invoice
- Warranty/guarantee card
- Correspondence with seller
- Medical reports (if injury caused by product)
- Expert opinion on defect (if required)

## ⚠️ Important Notes
- Complaint must be filed within 2 years of cause of action
- Can file complaint yourself without a lawyer
- Product liability provisions allow strict liability claims
- E-commerce companies are also covered under the Act"""
    },
    "property dispute": {
        "keywords": ["property", "land dispute", "property dispute", "title deed", "encroachment", "tenant", "landlord", "rent"],
        "answer": """## 📋 Summary
Property disputes in India are among the most common legal matters. They involve disputes over ownership, possession, boundaries, inheritance, and landlord-tenant relations.

## 📊 Current Status
- Civil suits for property governed by Civil Procedure Code (CPC)
- Specific Relief Act 1963 allows courts to enforce specific performance
- Transfer of Property Act 1882 governs property transfers
- Limitation Act: 12 years for possession disputes, 3 years for recovery of money

## ⚙️ Next Legal Process
- Gather all title documents and mutation records
- Send legal notice to the other party
- File civil suit in appropriate civil court
- Apply for interim injunction to maintain status quo
- Attend trial; may take 3-10 years for full resolution

## 📄 Required Documents
- Sale deed / title documents
- Property tax receipts
- Mutation records (at local revenue office)
- Survey settlement records
- Any agreements, wills, or partition deeds

## ⚠️ Important Notes
- Register all property documents to protect title
- Adverse possession can defeat even a paper title after 12 years
- Lok Adalat and mediation can settle property disputes faster
- Inheritance disputes require probate of will or succession certificate"""
    },
}


def get_fallback_legal_answer(question: str) -> str:
    """Rule-based legal AI fallback when Groq API is unavailable."""
    q_lower = question.lower()
    # Find best matching topic
    best_match = None
    best_score = 0
    for topic, data in LEGAL_KNOWLEDGE_BASE.items():
        score = sum(1 for kw in data["keywords"] if kw in q_lower)
        if score > best_score:
            best_score = score
            best_match = data
    if best_match and best_score > 0:
        return best_match["answer"]
    # Generic fallback
    return """## 📋 Summary
Thank you for your legal query. Our AI Legal Assistant is ready to help with Indian law, court procedures, FIR matters, bail, fundamental rights, and more.

## 📊 Current Status
I can assist you with: FIR filing, Bail procedures, Arrest rights, IPC/BNS sections, Consumer complaints, Property disputes, Divorce/Family law, Fundamental Rights (Articles 14, 19, 21), Writ petitions, and Case tracking.

## ⚙️ Next Legal Process
- Please rephrase your question with more specific legal terms
- Examples: "How to file FIR?", "What is anticipatory bail?", "Rights during police arrest?"
- For case-specific queries, use the Case Number field above
- Visit your nearest District Legal Services Authority for free legal aid

## 📄 Required Documents
- For any legal matter, always keep: ID proof, relevant correspondence, receipts/agreements, and witness details

## ⚠️ Important Notes
- This AI provides general legal information, not formal legal advice
- For urgent matters, contact your advocate or call National Legal Services Authority helpline: 15100
- Free legal aid is available for eligible persons under Legal Services Authorities Act 1987"""


@app.get("/")
def home():
    return {"message": "Legal AI Backend Running Successfully"}


@app.get("/ai/status")
def ai_status():
    """Returns AI engine status - whether Groq LLM or rule-based fallback is active"""
    return {
        "groq_enabled": groq_client is not None,
        "mode": "Groq LLaMA 3.3-70B" if groq_client else "Rule-Based Legal Engine (Fallback)",
        "topics_covered": list(LEGAL_KNOWLEDGE_BASE.keys()) if groq_client is None else ["All Indian Legal Topics"],
        "status": "operational"
    }


# ============================================================
# AI FIR AUTO-FILLING FOR POLICE OFFICERS ONLY
# ============================================================

def is_fir_filing_request(q: str) -> bool:
    ql = q.lower()
    phrases = [
        "fill fir", "register fir", "file fir", "create fir", "log fir", "add fir",
        "fill an fir", "register an fir", "file an fir", "create an fir", "lodge fir",
        "lodge an fir", "draft fir", "write fir", "record fir", "enter fir"
    ]
    return any(p in ql for p in phrases)


def process_ai_fir_filing(question: str, current_user: dict, db: Session) -> str:
    user_role = current_user.get("role")

    # 1. Strict Role Authorization Enforcement: Only Police & Super Admin
    if user_role not in ["Police", "Super Admin"]:
        return (
            "## 📋 Summary\n"
            "🚫 Access Restricted: Only authorized Police Station Officers can fill or register FIRs via AI Assistant.\n\n"
            "## 📊 Current Status\n"
            f"User Role: **{user_role.upper()}** (Unauthorized for official FIR creation)\n\n"
            "## ⚙️ Next Legal Process\n"
            "Please visit your local Police Station or contact a Station House Officer (SHO) to lodge an official FIR complaint.\n\n"
            "## 📄 Required Documents\n"
            "- Written complaint statement\n"
            "- Aadhaar / Government ID proof\n\n"
            "## ⚠️ Important Notes\n"
            "Under Police & Judiciary Regulations, citizens and legal advocates cannot directly register official FIR entries into the law enforcement database."
        )

    # 2. Extract offense / complaint type
    q_lower = question.lower()
    comp_type = "Cognizable Offense"
    type_map = {
        "theft": "Theft (IPC Sec 378 / BNS Sec 303)",
        "cyber": "Cyber Crime / Online Fraud",
        "fraud": "Cheating & Financial Fraud (IPC Sec 420)",
        "robbery": "Robbery / Armed Dacoity",
        "assault": "Assault & Physical Violence",
        "murder": "Homicide / Murder (IPC Sec 302)",
        "burglary": "Housebreaking & Burglary",
        "extortion": "Extortion & Threatening",
        "kidnapping": "Kidnapping & Abduction",
        "property": "Land & Property Dispute",
        "domestic": "Domestic Violence (IPC Sec 498A)",
        "accident": "Hit & Run / Rash Driving",
    }
    for key, val in type_map.items():
        if key in q_lower:
            comp_type = val
            break

    # 3. Generate unique FIR Number
    fir_num = f"FIR-2026-{random.randint(1000, 9999)}"
    while db.query(FIR).filter(FIR.fir_number == fir_num).first():
        fir_num = f"FIR-2026-{random.randint(1000, 9999)}"

    station_name = current_user.get("police_station") or "Central Police Station"
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    # 4. Save FIR directly in database
    new_fir = FIR(
        fir_number=fir_num,
        complainant_id=current_user.get("user_id"),
        complainant_name=current_user.get("full_name") or "Station Officer Logged",
        police_station=station_name,
        complaint_type=comp_type,
        date_registered=today_str,
        status="Registered",
        investigation_status="Under Investigation"
    )
    db.add(new_fir)
    db.commit()
    db.refresh(new_fir)

    # 5. Log audit event
    log_audit_event(
        db=db,
        action="AI_AUTO_FILE_FIR",
        resource="FIR",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"AI Bot auto-filled & registered FIR {fir_num} for station {station_name}"
    )

    return (
        "## 📋 Summary\n"
        f"✅ FIR Successfully Auto-Filled & Registered in Database by AI Police Assistant!\n\n"
        "## 📊 Current Status\n"
        f"- FIR Number: **{new_fir.fir_number}**\n"
        f"- Police Station: {new_fir.police_station}\n"
        f"- Complaint Type: {new_fir.complaint_type}\n"
        f"- Date Registered: {new_fir.date_registered}\n"
        "- Status: Registered (Under Investigation)\n\n"
        "## ⚙️ Next Legal Process\n"
        "- Station Investigation Unit assigned\n"
        "- Evidence collection & witness statement recording initiated\n\n"
        "## 📄 Required Documents\n"
        "- Signed FIR Statement Copy\n"
        "- Evidence logs & seizure memo\n\n"
        "## ⚠️ Important Notes\n"
        f"Registered by Police Officer **{current_user.get('full_name')}** (ID: {current_user.get('user_id')}). Audit record logged."
    )


@app.get("/ai-chat")
def get_chat():
    return {"answer": "Welcome to AI Legal Assistant!"}


@app.post("/ai-chat")
def ai_chat(
    data: Question,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    answer = ""
    try:
        if is_fir_filing_request(data.question):
            answer = process_ai_fir_filing(data.question, current_user, db)
            try:
                chat = ChatHistory(question=data.question, answer=answer)
                db.add(chat)
                db.commit()
            except Exception:
                pass
            return {"answer": answer}

        if groq_client is None:
            # Use rule-based fallback when Groq API key is not configured
            answer = get_fallback_legal_answer(data.question)
        else:
            context = build_context(data.question, top_k=2)

            if context:
                system_content = (
                    "You are a legal assistant. Reply in EXACTLY ONE sentence (max 15 words). "
                    "No lists, no headings, no extra text. Use this reference:\n\n"
                    f"REFERENCE:\n{context}"
                )
            else:
                system_content = (
                    "You are a legal assistant. Reply in EXACTLY ONE sentence (max 15 words). "
                    "No lists, no headings, no extra text. Decline non-legal questions politely in one line."
                )

            response = groq_client.chat.completions.create(
                model="groq/compound-mini",
                messages=[
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": data.question}
                ],
                max_tokens=60,
                temperature=0.1
            )
            answer = response.choices[0].message.content

    except Exception as e:
        print("Groq/RAG Error:", str(e))
        answer = get_fallback_legal_answer(data.question)

    try:
        chat = ChatHistory(question=data.question, answer=answer)
        db.add(chat)
        db.commit()
    except Exception:
        pass

    return {"answer": answer}


@app.post("/ai/structured-query")
def structured_ai_query(
    data: StructuredQuery,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Module 7: Structured AI Engine.
    Returns a mandatory 5-section legal analysis:
    Summary | Current Status | Next Process | Required Documents | Important Notes
    """
    if is_fir_filing_request(data.question):
        structured_answer = process_ai_fir_filing(data.question, current_user, db)
        try:
            log_audit_event(
                db=db,
                action="AI_FIR_REGISTER_QUERY",
                resource="AI Engine",
                user_id=current_user.get("user_id"),
                user_email=current_user.get("email"),
                user_role=current_user.get("role"),
                details=f"AI FIR query: {data.question[:100]}"
            )
            chat = ChatHistory(question=data.question, answer=structured_answer)
            db.add(chat)
            db.commit()
        except Exception:
            pass
        return {
            "question": data.question,
            "answer": structured_answer,
            "case_number": data.case_number,
            "context_type": data.context_type,
            "rag_used": False
        }

    rag_context = ""
    structured_answer = ""
    try:
        # Step 1: RAG context retrieval
        rag_context = build_context(data.question, top_k=3)

        # Step 2: Case-specific context injection
        case_context = ""
        if data.case_number:
            case = db.query(Case).filter(Case.case_number == data.case_number).first()
            if case:
                case_context = (
                    f"\n\nCASE CONTEXT:\n"
                    f"Case Number: {case.case_number}\n"
                    f"Title: {case.case_title}\n"
                    f"Petitioner: {case.petitioner} vs Respondent: {case.respondent}\n"
                    f"Court: {case.court_name} | Judge: {case.judge_name}\n"
                    f"Advocate: {case.advocate_assigned}\n"
                    f"Filing Date: {case.filing_date} | Next Hearing: {case.next_hearing_date}\n"
                    f"Current Status: {case.status}\n"
                    f"Priority: {case.priority}"
                )

        if groq_client is None:
            # Use rule-based fallback when Groq API key is not configured
            structured_answer = get_fallback_legal_answer(data.question)
        else:
            full_system = STRUCTURED_AI_SYSTEM_PROMPT
            if rag_context:
                full_system += f"\n\nRAG REFERENCE MATERIAL:\n{rag_context}"
            if case_context:
                full_system += case_context

            response = groq_client.chat.completions.create(
                model="groq/compound-mini",
                messages=[
                    {"role": "system", "content": full_system},
                    {"role": "user", "content": data.question}
                ],
                max_tokens=200,
                temperature=0.1
            )
            structured_answer = response.choices[0].message.content

    except Exception as e:
        print("Structured AI Error:", str(e))
        structured_answer = get_fallback_legal_answer(data.question)

    try:
        log_audit_event(
            db=db,
            action="AI_STRUCTURED_QUERY",
            resource="AI Engine",
            user_id=current_user.get("user_id"),
            user_email=current_user.get("email"),
            user_role=current_user.get("role"),
            details=f"Structured query: {data.question[:100]}"
        )
        chat = ChatHistory(question=data.question, answer=structured_answer)
        db.add(chat)
        db.commit()
    except Exception:
        pass

    return {
        "question": data.question,
        "answer": structured_answer,
        "case_number": data.case_number,
        "context_type": data.context_type,
        "rag_used": bool(rag_context)
    }


@app.get("/ai/case-summary/{case_number}")
def get_ai_case_summary(
    case_number: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Module 7: Generate structured AI summary for a specific case"""
    case = db.query(Case).filter(Case.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    question = f"Provide a complete legal analysis and guidance for case {case.case_number}: {case.case_title}. The case involves {case.petitioner} vs {case.respondent} in {case.court_name} with current status: {case.status}."

    case_context = (
        f"Case Number: {case.case_number} | Title: {case.case_title}\n"
        f"Petitioner: {case.petitioner} vs Respondent: {case.respondent}\n"
        f"Court: {case.court_name} | Judge: {case.judge_name}\n"
        f"Advocate: {case.advocate_assigned} | Type: {case.case_type}\n"
        f"Filing: {case.filing_date} | Next Hearing: {case.next_hearing_date}\n"
        f"Priority: {case.priority} | Status: {case.status}"
    )

    try:
        if groq_client is None:
            summary = get_fallback_legal_answer(question)
        else:
            system = STRUCTURED_AI_SYSTEM_PROMPT + f"\n\nCASE CONTEXT:\n{case_context}"
            response = groq_client.chat.completions.create(
                model="groq/compound-mini",
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": question}
                ],
                max_tokens=1000,
                temperature=0.2
            )
            summary = response.choices[0].message.content
    except Exception as e:
        print("Case summary AI error:", e)
        summary = get_fallback_legal_answer(question)

    return {
        "case_number": case_number,
        "case_title": case.case_title,
        "summary": summary
    }


@app.get("/chat-history")
def get_chat_history(db: Session = Depends(get_db)):
    return db.query(ChatHistory).all()


# ============================================================
# MODULE: VOICE AI — DEEPGRAM STT + SARVAM TTS
# ============================================================

# Supported languages for STT (Deepgram) & TTS (Sarvam AI)
VOICE_LANGUAGES = [
    {"code": "en-IN", "name": "English (India)",  "deepgram_code": "en-IN",  "sarvam_code": "en-IN",  "speaker": "anushka"},
    {"code": "hi-IN", "name": "Hindi (हिंदी)",     "deepgram_code": "hi",     "sarvam_code": "hi-IN",  "speaker": "anushka"},
    {"code": "ta-IN", "name": "Tamil (தமிழ்)",    "deepgram_code": "ta",     "sarvam_code": "ta-IN",  "speaker": "aditya"},
    {"code": "te-IN", "name": "Telugu (తెలుగు)",  "deepgram_code": "te",     "sarvam_code": "te-IN",  "speaker": "aditya"},
    {"code": "bn-IN", "name": "Bengali (বাংলা)",  "deepgram_code": "bn",     "sarvam_code": "bn-IN",  "speaker": "anushka"},
    {"code": "mr-IN", "name": "Marathi (मराठी)",  "deepgram_code": "mr",     "sarvam_code": "mr-IN",  "speaker": "anushka"},
    {"code": "gu-IN", "name": "Gujarati (ગુજરાતી)","deepgram_code": "gu",    "sarvam_code": "gu-IN",  "speaker": "anushka"},
    {"code": "kn-IN", "name": "Kannada (ಕನ್ನಡ)",  "deepgram_code": "kn",     "sarvam_code": "kn-IN",  "speaker": "aditya"},
    {"code": "ml-IN", "name": "Malayalam (മലയാളം)","deepgram_code": "ml",    "sarvam_code": "ml-IN",  "speaker": "anushka"},
    {"code": "pa-IN", "name": "Punjabi (ਪੰਜਾਬੀ)", "deepgram_code": "pa",     "sarvam_code": "pa-IN",  "speaker": "aditya"},
]

VALID_SARVAM_SPEAKERS = [
    "anushka", "abhilash", "manisha", "vidya", "arya", "karun", "hitesh", "aditya",
    "ritu", "priya", "neha", "rahul", "pooja", "rohan", "simran", "kavya", "amit",
    "dev", "ishita", "shreya", "ratan", "varun", "manan", "sumit", "roopa", "kabir",
    "aayan", "shubh", "ashutosh", "advait", "anand", "tanya", "tarun", "sunny",
    "mani", "gokul", "vijay", "shruti", "suhani", "mohit", "kavitha", "rehan", "soham", "rupali"
]

SARVAM_SPEAKERS = [
    {"id": "anushka", "name": "Anushka (Female)", "gender": "female"},
    {"id": "aditya",  "name": "Aditya (Male)",    "gender": "male"},
    {"id": "manisha", "name": "Manisha (Female)", "gender": "female"},
    {"id": "rahul",   "name": "Rahul (Male)",     "gender": "male"},
    {"id": "kavya",   "name": "Kavya (Female)",   "gender": "female"},
    {"id": "rohan",   "name": "Rohan (Male)",     "gender": "male"},
    {"id": "priya",   "name": "Priya (Female)",   "gender": "female"},
    {"id": "dev",     "name": "Dev (Male)",       "gender": "male"},
]


@app.get("/voice/languages")
def get_voice_languages():
    """Returns supported languages and voices for the voice AI panel."""
    return {
        "languages": VOICE_LANGUAGES,
        "speakers": SARVAM_SPEAKERS,
        "stt_enabled": bool(DEEPGRAM_API_KEY),
        "tts_enabled": bool(SARVAM_API_KEY),
    }


class TTSRequest(BaseModel):
    text: str
    language_code: Optional[str] = "en-IN"
    speaker: Optional[str] = "meera"
    pace: Optional[float] = 1.0
    pitch: Optional[float] = 0.0


@app.post("/voice/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: Optional[str] = "en-IN",
    current_user=Depends(get_current_user),
):
    """
    Speech-to-Text via Deepgram Nova-2.
    Accepts audio file (webm/wav/mp3), returns transcript.
    """
    if not DEEPGRAM_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Speech-to-Text is not configured. Please add DEEPGRAM_API_KEY to .env"
        )

    # Map frontend language code → Deepgram language code
    lang_map = {lang["code"]: lang["deepgram_code"] for lang in VOICE_LANGUAGES}
    deepgram_lang = lang_map.get(language, "en")
    # Deepgram nova-2 uses simple codes like "en", "hi", "ta" — not "en-IN"
    if deepgram_lang == "en-IN":
        deepgram_lang = "en"

    try:
        audio_bytes = await audio.read()

        if len(audio_bytes) < 100:
            raise HTTPException(status_code=400, detail="Audio is too short or empty. Please try speaking again.")

        # ── Fix: strip codec info from content-type ───────────
        # Browser sends "audio/webm;codecs=opus" but Deepgram
        # only accepts the bare MIME type "audio/webm"
        raw_ct = (audio.content_type or "audio/webm").split(";")[0].strip()
        # Normalise: any webm variant → audio/webm
        if "webm" in raw_ct:
            content_type = "audio/webm"
        elif "ogg" in raw_ct:
            content_type = "audio/ogg"
        elif "mp4" in raw_ct or "m4a" in raw_ct:
            content_type = "audio/mp4"
        elif "wav" in raw_ct:
            content_type = "audio/wav"
        elif "mp3" in raw_ct or "mpeg" in raw_ct:
            content_type = "audio/mpeg"
        else:
            content_type = "audio/webm"   # safe default

        print(f"STT: lang={deepgram_lang}, size={len(audio_bytes)}B, type={content_type}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.deepgram.com/v1/listen"
                "?model=nova-2"
                f"&language={deepgram_lang}"
                "&punctuate=true"
                "&smart_format=true"
                "&filler_words=false"
                "&utterances=false",
                headers={
                    "Authorization": f"Token {DEEPGRAM_API_KEY}",
                    "Content-Type": content_type,
                },
                content=audio_bytes,
            )

        if resp.status_code != 200:
            try:
                err_body = resp.json()
                err_msg  = err_body.get("err_msg", resp.text)
            except Exception:
                err_msg = resp.text
            print("Deepgram error:", err_msg)
            raise HTTPException(
                status_code=502,
                detail=f"Transcription failed: {err_msg}"
            )

        data     = resp.json()
        channels = data.get("results", {}).get("channels", [])
        if not channels:
            return {"transcript": "", "confidence": 0.0, "language": language}

        alternatives = channels[0].get("alternatives", [])
        if not alternatives:
            return {"transcript": "", "confidence": 0.0, "language": language}

        best = alternatives[0]
        transcript = best.get("transcript", "").strip()
        print(f"STT result: '{transcript[:80]}' (conf={best.get('confidence', 0):.2f})")
        return {
            "transcript": transcript,
            "confidence": round(best.get("confidence", 0.0), 3),
            "language": language,
            "words": len(best.get("words", [])),
        }

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Transcription timed out. Please try again.")
    except HTTPException:
        raise
    except Exception as e:
        print("STT Error:", str(e))
        raise HTTPException(status_code=500, detail=f"STT failed: {str(e)}")


@app.post("/voice/tts")
async def text_to_speech(
    data: TTSRequest,
    current_user=Depends(get_current_user),
):
    """
    Text-to-Speech via Sarvam AI (bulbul:v2).
    Returns base64-encoded WAV audio.
    """
    if not SARVAM_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Text-to-Speech is not configured. Please add SARVAM_API_KEY to .env"
        )

    # Sarvam TTS supports max ~500 chars per request — chunk if needed
    MAX_CHARS = 450
    text = data.text.strip()

    # Strip markdown for cleaner speech
    import re
    text = re.sub(r"##\s*[\U00010000-\U0010ffff\u2600-\u26FF\u2700-\u27BF]?\s*", "", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"[▸•\-]\s*", ". ", text)
    text = re.sub(r"---", "", text)
    text = re.sub(r"\s+", " ", text).strip()

    # Validate speaker
    speaker = data.speaker or "anushka"
    if speaker not in VALID_SARVAM_SPEAKERS:
        speaker = "anushka"

    # Chunk text
    chunks = []
    while len(text) > MAX_CHARS:
        split_at = text.rfind(".", 0, MAX_CHARS)
        if split_at == -1:
            split_at = MAX_CHARS
        chunks.append(text[:split_at + 1].strip())
        text = text[split_at + 1:].strip()
    if text:
        chunks.append(text)

    if not chunks:
        raise HTTPException(status_code=400, detail="No text to convert")

    all_audios = []
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for chunk in chunks[:5]:  # max 5 chunks to avoid overload
                if not chunk:
                    continue
                resp = await client.post(
                    "https://api.sarvam.ai/text-to-speech",
                    headers={
                        "api-subscription-key": SARVAM_API_KEY,
                        "Content-Type": "application/json",
                    },
                    json={
                        "inputs": [chunk],
                        "target_language_code": data.language_code or "en-IN",
                        "speaker": speaker,
                        "pitch": data.pitch or 0.0,
                        "pace": data.pace or 1.0,
                        "loudness": 1.5,
                        "speech_sample_rate": 22050,
                        "enable_preprocessing": True,
                        "model": "bulbul:v2",
                    },
                )
                if resp.status_code != 200:
                    print("Sarvam TTS error:", resp.text)
                    continue

                result = resp.json()
                audios = result.get("audios", [])
                if audios:
                    all_audios.extend(audios)

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="TTS timed out. Please try again.")
    except HTTPException:
        raise
    except Exception as e:
        print("TTS Error:", str(e))
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

    if not all_audios:
        raise HTTPException(status_code=502, detail="No audio generated by TTS service")

    return {
        "audios": all_audios,       # list of base64-encoded WAV strings
        "chunk_count": len(all_audios),
        "language": data.language_code,
        "speaker": speaker,
    }


# ================================
# MODULE 8: PDF REPORT GENERATION
# ================================

@app.get("/report/case/{case_number}")
def generate_case_report(
    case_number: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a structured case report (JSON) that frontend renders as PDF"""
    case = db.query(Case).filter(Case.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Citizen isolation check
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    if user_role == "User":
        if case.petitioner_id != user_id and case.respondent_id != user_id:
            if case.petitioner_id is not None:
                raise HTTPException(status_code=403, detail="Cannot generate report for another citizen's case")

    firs = db.query(FIR).all()
    related_firs = [f for f in firs if f.status and case_number.split("/")[0] in (f.fir_number or "")]

    log_audit_event(
        db=db, action="GENERATE_CASE_REPORT", resource="Case",
        user_id=user_id, user_email=current_user.get("email"),
        user_role=user_role, details=f"Generated PDF report for case {case_number}"
    )

    return {
        "report_type": "CASE_REPORT",
        "generated_by": current_user.get("email"),
        "generated_at": str(__import__("datetime").datetime.utcnow()),
        "case": {
            "case_number": case.case_number,
            "case_title": case.case_title,
            "petitioner": case.petitioner,
            "respondent": case.respondent,
            "court_name": case.court_name,
            "judge_name": case.judge_name,
            "advocate_assigned": case.advocate_assigned,
            "case_type": case.case_type,
            "filing_date": case.filing_date,
            "next_hearing_date": case.next_hearing_date,
            "priority": case.priority,
            "status": case.status,
        }
    }


@app.get("/report/fir/{fir_number}")
def generate_fir_report(
    fir_number: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a structured FIR report"""
    fir = db.query(FIR).filter(FIR.fir_number == fir_number).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    if user_role == "User":
        if fir.complainant_id and fir.complainant_id != user_id:
            raise HTTPException(status_code=403, detail="Cannot generate report for another citizen's FIR")

    log_audit_event(
        db=db, action="GENERATE_FIR_REPORT", resource="FIR",
        user_id=user_id, user_email=current_user.get("email"),
        user_role=user_role, details=f"Generated PDF report for FIR {fir_number}"
    )

    return {
        "report_type": "FIR_REPORT",
        "generated_by": current_user.get("email"),
        "generated_at": str(__import__("datetime").datetime.utcnow()),
        "fir": {
            "fir_number": fir.fir_number,
            "police_station": fir.police_station,
            "complaint_type": fir.complaint_type,
            "date_registered": fir.date_registered,
            "investigation_status": fir.investigation_status or "Under Investigation",
            "status": fir.status,
            "complainant_name": fir.complainant_name,
        }
    }


# ================================
# ADVOCATE MODULE & APPOINTMENTS (RBAC)
# ================================

class BookingResponse(BaseModel):
    appointment_id: int
    status: str  # Accepted or Rejected
    notes: Optional[str] = None


class CaseStatusUpdate(BaseModel):
    case_number: str
    status: str
    remarks: Optional[str] = None


advocates = [
    {"id": 1, "name": "Ramesh Kumar", "specialization": "Criminal Law", "experience": 12, "rating": 4.8, "location": "Hyderabad"},
    {"id": 2, "name": "Priya Sharma",  "specialization": "Family Law",   "experience": 8,  "rating": 4.6, "location": "Secunderabad"},
    {"id": 3, "name": "Arjun Reddy",   "specialization": "Property Law", "experience": 15, "rating": 4.9, "location": "Banjara Hills"},
    {"id": 4, "name": "Sunita Rao",    "specialization": "Corporate Law","experience": 10, "rating": 4.7, "location": "Hyderabad"},
    {"id": 5, "name": "Vikram Singh",  "specialization": "Criminal Law", "experience": 6,  "rating": 4.4, "location": "Jubilee Hills"},
]


@app.get("/advocates")
def get_advocates(specialization: Optional[str] = None):
    if specialization:
        filtered = [a for a in advocates if a["specialization"].lower() == specialization.lower()]
        return filtered
    return advocates


class AppointmentCreate(BaseModel):
    name: str
    phone: str
    advocate_name: str
    date: str
    time_slot: str


@app.post("/book-appointment")
def book_appointment(
    data: AppointmentCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = Appointment(
        user_id=current_user.get("user_id"),
        name=data.name,
        phone=data.phone,
        advocate_name=data.advocate_name,
        appointment_date=data.date,
        time_slot=data.time_slot,
        status="Pending"
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    log_audit_event(
        db=db,
        action="BOOK_APPOINTMENT",
        resource="Appointment",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Booked appointment with {data.advocate_name} for {data.date}"
    )

    # Automated Twilio SMS Notification
    try:
        sms_message = (
            f"Hi {data.name}, your consultation request with Advocate {data.advocate_name} "
            f"for {data.date} at {data.time_slot} has been received. Status: Pending Advocate Confirmation. - Legal AI System"
        )
        send_sms(data.phone, sms_message)
    except Exception as e:
        print("Appointment SMS failed:", str(e))

    return {
        "message": "Appointment request submitted successfully",
        "appointment": {
            "id": appointment.id,
            "name": appointment.name,
            "phone": appointment.phone,
            "advocate_name": appointment.advocate_name,
            "date": appointment.appointment_date,
            "time_slot": appointment.time_slot,
            "status": appointment.status
        }
    }


@app.get("/appointments")
def get_appointments(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    user_name = current_user.get("full_name")

    all_appointments = db.query(Appointment).all()

    # Filter by role
    if user_role == "Advocate":
        # Advocate sees bookings assigned to their name
        filtered = [a for a in all_appointments if (a.advocate_name and user_name and a.advocate_name.lower() in user_name.lower()) or a.advocate_id == user_id or a.advocate_name is not None]
        return filtered

    if user_role == "User":
        # Citizen sees their own bookings
        filtered = [a for a in all_appointments if a.user_id == user_id or (a.name and user_name and a.name.lower() == user_name.lower())]
        return filtered

    return all_appointments


@app.post("/advocate/booking/respond")
def respond_to_booking(
    data: BookingResponse,
    current_user=Depends(require_role(["Advocate", "Super Admin"])),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == data.appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    new_status = "Accepted" if data.status.lower() == "accepted" else "Rejected"
    appointment.status = new_status
    db.commit()

    log_audit_event(
        db=db,
        action="ADVOCATE_BOOKING_RESPOND",
        resource="Appointment",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Advocate updated booking #{appointment.id} status to {new_status}"
    )

    # Automated Twilio SMS & Voice Alert to Citizen
    if appointment.phone:
        try:
            sms_msg = f"Legal AI Notification: Your appointment #{appointment.id} with Advocate {appointment.advocate_name} has been {new_status.upper()}."
            send_sms(appointment.phone, sms_msg)
        except Exception as e:
            print("Twilio notification failed:", e)

    return {
        "message": f"Booking {new_status} successfully",
        "appointment": appointment
    }


@app.get("/advocate/assigned-cases")
def get_advocate_assigned_cases(
    current_user=Depends(require_role(["Advocate", "Super Admin"])),
    db: Session = Depends(get_db)
):
    user_name = current_user.get("full_name")
    user_id = current_user.get("user_id")

    all_cases = db.query(Case).all()

    # Filter cases assigned to this advocate
    assigned = [
        c for c in all_cases
        if c.advocate_id == user_id
        or (c.advocate_assigned and user_name and user_name.lower() in c.advocate_assigned.lower())
        or (c.advocate_assigned is not None)  # Fallback for demo
    ]

    return assigned


@app.put("/advocate/update-case-status")
def advocate_update_case_status(
    data: CaseStatusUpdate,
    current_user=Depends(require_role(["Advocate", "Court Management", "Super Admin"])),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.case_number == data.case_number).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = data.status
    db.commit()

    log_audit_event(
        db=db,
        action="ADVOCATE_UPDATE_CASE_STATUS",
        resource="Case",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Advocate updated Case {case.case_number} status to {data.status}"
    )

    return {
        "message": "Case status updated successfully by Advocate",
        "case": case
    }


# ================================
# FIR TRACKING & MANAGEMENT (RBAC)
# ================================

class FIRCreate(BaseModel):
    fir_number: str
    police_station: str
    complaint_type: str
    date_registered: str
    status: Optional[str] = "Registered"

class FIRStatusUpdate(BaseModel):
    status: str

@app.post("/add-fir")
def add_fir(
    data: FIRCreate,
    current_user=Depends(require_role(["Police", "Super Admin"])),
    db: Session = Depends(get_db)
):
    existing = db.query(FIR).filter(FIR.fir_number == data.fir_number).first()

    if existing:
        raise HTTPException(status_code=400, detail="FIR already exists")

    fir = FIR(
        fir_number=data.fir_number,
        police_station=data.police_station,
        complaint_type=data.complaint_type,
        date_registered=data.date_registered,
        status=data.status,
        investigation_status="Under Investigation"
    )

    db.add(fir)
    db.commit()
    db.refresh(fir)

    log_audit_event(
        db=db,
        action="CREATE_FIR",
        resource="FIR",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Registered FIR Number: {fir.fir_number}"
    )

    return {
        "message": "FIR Registered Successfully",
        "fir": {
            "fir_number": fir.fir_number,
            "police_station": fir.police_station,
            "complaint_type": fir.complaint_type,
            "date_registered": fir.date_registered,
            "status": fir.status
        }
    }


@app.get("/fir")
def get_fir(
    fir_number: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fir = db.query(FIR).filter(FIR.fir_number == fir_number).first()

    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    user_name = current_user.get("full_name")

    # Data Isolation: User role can only view their own FIR
    if user_role == "User":
        is_owner = (
            fir.complainant_id == user_id or
            (fir.complainant_name and user_name and fir.complainant_name.lower() == user_name.lower())
        )
        if not is_owner:
            # Check if this FIR has no assigned complainant ID yet; allow lookup if explicitly matched
            if fir.complainant_id is None and fir.complainant_name is None:
                pass  # allow legacy viewing if unassigned
            else:
                raise HTTPException(status_code=403, detail="Unauthorized to view another citizen's FIR record")

    return {
        "fir_number": fir.fir_number,
        "police_station": fir.police_station,
        "complaint_type": fir.complaint_type,
        "date_registered": fir.date_registered,
        "investigation_status": fir.investigation_status,
        "status": fir.status,
        "complainant_name": fir.complainant_name
    }


@app.get("/firs")
def get_all_firs(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    user_name = current_user.get("full_name")

    all_firs = db.query(FIR).all()

    # Data Isolation: Filter for Citizens (User role)
    if user_role == "User":
        user_firs = [
            f for f in all_firs
            if f.complainant_id == user_id
            or (f.complainant_name and user_name and f.complainant_name.lower() == user_name.lower())
            or (f.complainant_id is None)  # Include existing sample FIRs for demo visibility
        ]
        return [
            {
                "fir_number": f.fir_number,
                "police_station": f.police_station,
                "complaint_type": f.complaint_type,
                "date_registered": f.date_registered,
                "investigation_status": f.investigation_status or "Under Investigation",
                "status": f.status
            }
            for f in user_firs
        ]

    return [
        {
            "fir_number": f.fir_number,
            "police_station": f.police_station,
            "complaint_type": f.complaint_type,
            "date_registered": f.date_registered,
            "investigation_status": f.investigation_status or "Under Investigation",
            "status": f.status
        }
        for f in all_firs
    ]



@app.put("/update-fir")
def update_fir(
    fir_number: str,
    data: FIRStatusUpdate,
    current_user=Depends(require_role(["Police", "Court Management", "Super Admin"])),
    db: Session = Depends(get_db)
):
    fir = db.query(FIR).filter(FIR.fir_number == fir_number).first()

    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    fir.status = data.status
    db.commit()

    log_audit_event(
        db=db,
        action="UPDATE_FIR",
        resource="FIR",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Updated FIR {fir_number} status to {data.status}"
    )

    return {
        "message": "FIR Updated Successfully",
        "fir": {
            "fir_number": fir.fir_number,
            "status": fir.status
        }
    }


@app.delete("/delete-fir")
def delete_fir(
    fir_number: str,
    current_user=Depends(require_role(["Super Admin"])),
    db: Session = Depends(get_db)
):
    fir = db.query(FIR).filter(FIR.fir_number == fir_number).first()

    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    db.delete(fir)
    db.commit()

    log_audit_event(
        db=db,
        action="DELETE_FIR",
        resource="FIR",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Deleted FIR {fir_number}"
    )

    return {"message": "FIR Deleted Successfully"}
# ================================
# CASE TRACKING
# ================================

class CaseCreate(BaseModel):
    case_number: str
    case_title: str
    petitioner: str
    respondent: str
    court_name: str
    judge_name: str
    advocate_assigned: str
    case_type: str
    filing_date: str
    next_hearing_date: str
    priority: str
    status: str


class StatusUpdate(BaseModel):
    status: str


# ================================
# CASE TRACKING & MANAGEMENT (RBAC)
# ================================

@app.post("/add-case")
def add_case(
    case: CaseCreate,
    current_user=Depends(require_role(["Police", "Court Management", "Super Admin"])),
    db: Session = Depends(get_db)
):
    existing_case = db.query(Case).filter(
        Case.case_number == case.case_number
    ).first()

    if existing_case:
        raise HTTPException(status_code=400, detail="Case number already exists")

    new_case = Case(
        case_number=case.case_number,
        case_title=case.case_title,
        petitioner=case.petitioner,
        respondent=case.respondent,
        court_name=case.court_name,
        judge_name=case.judge_name,
        advocate_assigned=case.advocate_assigned,
        case_type=case.case_type,
        filing_date=case.filing_date,
        next_hearing_date=case.next_hearing_date,
        priority=case.priority,
        status=case.status,
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    log_audit_event(
        db=db,
        action="CREATE_CASE",
        resource="Case",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Registered Case Number: {new_case.case_number}"
    )

    return {
        "message": "Case Registered Successfully",
        "case": new_case
    }


@app.get("/case")
def get_case(
    case_number: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = (
        db.query(Case)
        .filter(Case.case_number == case_number)
        .first()
    )

    if case is None:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    user_name = current_user.get("full_name")

    if user_role == "User":
        is_owner = (
            case.petitioner_id == user_id or
            case.respondent_id == user_id or
            (case.petitioner and user_name and case.petitioner.lower() == user_name.lower()) or
            (case.respondent and user_name and case.respondent.lower() == user_name.lower())
        )
        if not is_owner:
            if case.petitioner_id is None and case.respondent_id is None:
                pass  # allow demo visibility
            else:
                raise HTTPException(status_code=403, detail="Unauthorized to view another citizen's case record")

    return {
        "case_number": case.case_number,
        "case_title": case.case_title,
        "petitioner": case.petitioner,
        "respondent": case.respondent,
        "court_name": case.court_name,
        "judge_name": case.judge_name,
        "advocate_assigned": case.advocate_assigned,
        "case_type": case.case_type,
        "filing_date": case.filing_date,
        "next_hearing_date": case.next_hearing_date,
        "priority": case.priority,
        "status": case.status,
    }


@app.get("/all-cases")
def get_all_cases(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    user_name = current_user.get("full_name")

    cases = db.query(Case).all()

    # Citizen Filtering (User Role)
    if user_role == "User":
        filtered_cases = [
            c for c in cases
            if c.petitioner_id == user_id
            or c.respondent_id == user_id
            or (c.petitioner and user_name and c.petitioner.lower() == user_name.lower())
            or (c.respondent and user_name and c.respondent.lower() == user_name.lower())
            or (c.petitioner_id is None and c.respondent_id is None)  # include demo cases
        ]
        return [
            {
                "case_number": case.case_number,
                "case_title": case.case_title,
                "petitioner": case.petitioner,
                "respondent": case.respondent,
                "court_name": case.court_name,
                "judge_name": case.judge_name,
                "advocate_assigned": case.advocate_assigned,
                "case_type": case.case_type,
                "filing_date": case.filing_date,
                "next_hearing_date": case.next_hearing_date,
                "priority": case.priority,
                "status": case.status,
            }
            for case in filtered_cases
        ]

    return [
        {
            "case_number": case.case_number,
            "case_title": case.case_title,
            "petitioner": case.petitioner,
            "respondent": case.respondent,
            "court_name": case.court_name,
            "judge_name": case.judge_name,
            "advocate_assigned": case.advocate_assigned,
            "case_type": case.case_type,
            "filing_date": case.filing_date,
            "next_hearing_date": case.next_hearing_date,
            "priority": case.priority,
            "status": case.status,
        }
        for case in cases
    ]


@app.get("/case/timeline/{case_number}")
def get_case_timeline(
    case_number: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.case_number == case_number).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Build dynamic timeline milestones based on case state
    timeline = [
        {
            "step": 1,
            "title": "FIR & Complaint Registration",
            "date": case.filing_date,
            "status": "Completed",
            "description": f"Initial filing at {case.court_name} on {case.filing_date}."
        },
        {
            "step": 2,
            "title": "Investigation & Charge Sheet",
            "date": case.filing_date,
            "status": "Completed",
            "description": "Police investigation submitted to court registry."
        },
        {
            "step": 3,
            "title": "Advocate Assignment & Notice",
            "date": case.filing_date,
            "status": "Completed",
            "description": f"Advocate {case.advocate_assigned} assigned to represent petitioner."
        },
        {
            "step": 4,
            "title": "Judicial Hearing Proceedings",
            "date": case.next_hearing_date,
            "status": "In Progress" if case.status.lower() in ["open", "hearing", "pending"] else "Completed",
            "description": f"Presided by {case.judge_name} at {case.court_name}."
        },
        {
            "step": 5,
            "title": "Final Arguments & Judgement",
            "date": "Pending Scheduled Date",
            "status": "Completed" if case.status.lower() in ["closed", "judgement"] else "Upcoming",
            "description": "Final verdict reserved upon hearing conclusion."
        }
    ]

    return {
        "case_number": case.case_number,
        "case_title": case.case_title,
        "current_status": case.status,
        "timeline": timeline
    }


@app.get("/legal-awareness")
def get_legal_awareness_services():
    return {
        "title": "National Legal Awareness & Rights Portal",
        "categories": [
            {
                "id": "fir_rights",
                "title": "🚔 Citizen Rights During FIR Registration",
                "summary": "Every citizen has the constitutional right to file an FIR for cognizable offenses.",
                "key_points": [
                    "Under Section 154 CrPC, Police must register an FIR if a cognizable offense is reported.",
                    "You have the right to receive a free copy of the registered FIR immediately.",
                    "Zero FIR allows filing an FIR at any police station regardless of jurisdiction."
                ]
            },
            {
                "id": "bail_rights",
                "title": "⚖️ Bail & Legal Representation Rights",
                "summary": "Understanding bailable vs non-bailable offenses and legal aid eligibility.",
                "key_points": [
                    "Bailable offenses guarantee bail as a matter of right at the police station.",
                    "Free Legal Services are available under Legal Services Authorities Act, 1987.",
                    "You have the right to consult an advocate of your choice within 24 hours of arrest."
                ]
            },
            {
                "id": "women_cyber_safety",
                "title": "🛡️ Women & Cyber Safety Protections",
                "summary": "Specialized legal protections against harassment, cybercrime, and domestic violence.",
                "key_points": [
                    "Identity protection for victims under IPC 228A.",
                    "National Cyber Crime Portal helpline (1930) for instant financial fraud reporting.",
                    "Protection of Women from Domestic Violence Act, 2005 emergency relief orders."
                ]
            }
        ]
    }



# ================================
# POLICE MODULE (RBAC)
# ================================

class InvestigationUpdate(BaseModel):
    fir_number: str
    investigation_status: str
    remarks: Optional[str] = None
    officer_name: Optional[str] = None


class ChargeSheetUpload(BaseModel):
    fir_number: str
    charge_sheet_number: str
    charges: str
    accused_name: str
    date_filed: str


class ComplaintVerification(BaseModel):
    fir_number: str
    verified: bool
    verification_remarks: Optional[str] = None


@app.put("/police/investigation/update")
def update_investigation_status(
    data: InvestigationUpdate,
    current_user=Depends(require_role(["Police", "Super Admin"])),
    db: Session = Depends(get_db)
):
    """Police: Update FIR investigation status (Under Investigation, Charge Sheet Filed, Closed)"""
    fir = db.query(FIR).filter(FIR.fir_number == data.fir_number).first()

    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    fir.investigation_status = data.investigation_status
    db.commit()

    log_audit_event(
        db=db,
        action="POLICE_UPDATE_INVESTIGATION",
        resource="FIR",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Officer updated FIR {data.fir_number} investigation to: {data.investigation_status}"
    )

    # Twilio SMS notification to complainant
    if fir.complainant_phone:
        try:
            sms_msg = f"Legal AI Alert: Your FIR #{fir.fir_number} investigation status has been updated to '{data.investigation_status}'. - {data.officer_name or 'Police Station'}"
            send_sms(fir.complainant_phone, sms_msg)
        except Exception as e:
            print("Police SMS notification failed:", e)

    return {
        "message": "Investigation status updated successfully",
        "fir_number": fir.fir_number,
        "investigation_status": fir.investigation_status
    }


@app.post("/police/charge-sheet/file")
def file_charge_sheet(
    data: ChargeSheetUpload,
    current_user=Depends(require_role(["Police", "Super Admin"])),
    db: Session = Depends(get_db)
):
    """Police: File a charge sheet for an FIR, escalating it to court proceedings"""
    fir = db.query(FIR).filter(FIR.fir_number == data.fir_number).first()

    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    fir.investigation_status = "Charge Sheet Filed"
    fir.status = "Charge Sheet Submitted"
    db.commit()

    log_audit_event(
        db=db,
        action="POLICE_FILE_CHARGE_SHEET",
        resource="FIR",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Charge sheet {data.charge_sheet_number} filed for FIR {data.fir_number} against {data.accused_name}"
    )

    return {
        "message": "Charge sheet filed successfully. FIR escalated to court proceedings.",
        "fir_number": fir.fir_number,
        "charge_sheet_number": data.charge_sheet_number,
        "accused_name": data.accused_name,
        "date_filed": data.date_filed,
        "status": fir.investigation_status
    }


@app.post("/police/complaint/verify")
def verify_complaint(
    data: ComplaintVerification,
    current_user=Depends(require_role(["Police", "Super Admin"])),
    db: Session = Depends(get_db)
):
    """Police: Verify or flag a filed complaint/FIR"""
    fir = db.query(FIR).filter(FIR.fir_number == data.fir_number).first()

    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    fir.investigation_status = "Verified" if data.verified else "Flagged - Requires Review"
    db.commit()

    log_audit_event(
        db=db,
        action="POLICE_VERIFY_COMPLAINT",
        resource="FIR",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"FIR {data.fir_number} verification: {'VERIFIED' if data.verified else 'FLAGGED'}. Remarks: {data.verification_remarks}"
    )

    return {
        "message": f"FIR {data.fir_number} marked as {'Verified' if data.verified else 'Flagged'}",
        "fir_number": fir.fir_number,
        "investigation_status": fir.investigation_status
    }


@app.get("/police/dashboard")
def get_police_dashboard(
    current_user=Depends(require_role(["Police", "Super Admin"])),
    db: Session = Depends(get_db)
):
    """Police: Dashboard overview - FIRs, cases, investigation stats"""
    all_firs = db.query(FIR).all()
    all_cases = db.query(Case).all()

    return {
        "total_firs": len(all_firs),
        "total_cases": len(all_cases),
        "under_investigation": len([f for f in all_firs if f.investigation_status == "Under Investigation"]),
        "charge_sheet_filed": len([f for f in all_firs if f.investigation_status == "Charge Sheet Filed"]),
        "firs": [
            {
                "fir_number": f.fir_number,
                "police_station": f.police_station,
                "complaint_type": f.complaint_type,
                "date_registered": f.date_registered,
                "investigation_status": f.investigation_status or "Under Investigation",
                "status": f.status
            }
            for f in all_firs
        ],
        "recent_cases": [
            {
                "case_number": c.case_number,
                "case_title": c.case_title,
                "petitioner": c.petitioner,
                "status": c.status,
                "filing_date": c.filing_date
            }
            for c in all_cases
        ]
    }


# ================================
# COURT MANAGEMENT MODULE (RBAC)
# ================================

class HearingCreate(BaseModel):
    case_number: str
    hearing_date: str
    hearing_time: str
    court_room: Optional[str] = None
    judge_name: Optional[str] = None
    hearing_type: Optional[str] = "Regular Hearing"
    notes: Optional[str] = None


class JudgementUpload(BaseModel):
    case_number: str
    judgement_date: str
    judge_name: str
    verdict: str  # "Convicted", "Acquitted", "Dismissed", "Settled"
    judgement_summary: str
    next_steps: Optional[str] = None


class CaseClosure(BaseModel):
    case_number: str
    closure_reason: str
    final_status: str  # "Closed - Disposed", "Closed - Judgement Passed", "Closed - Withdrawn"


@app.post("/court/hearing/schedule")
def schedule_hearing(
    data: HearingCreate,
    current_user=Depends(require_role(["Court Management", "Super Admin"])),
    db: Session = Depends(get_db)
):
    """Court Management: Schedule a hearing date for a case"""
    case = db.query(Case).filter(Case.case_number == data.case_number).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Update next hearing date on the case
    case.next_hearing_date = data.hearing_date
    db.commit()

    log_audit_event(
        db=db,
        action="COURT_SCHEDULE_HEARING",
        resource="Case",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Hearing scheduled for Case {data.case_number} on {data.hearing_date} at {data.hearing_time}. Judge: {data.judge_name}"
    )

    return {
        "message": "Hearing scheduled successfully",
        "case_number": data.case_number,
        "hearing_date": data.hearing_date,
        "hearing_time": data.hearing_time,
        "court_room": data.court_room,
        "judge_name": data.judge_name or case.judge_name,
        "hearing_type": data.hearing_type
    }


@app.post("/court/judgement/upload")
def upload_judgement(
    data: JudgementUpload,
    current_user=Depends(require_role(["Court Management", "Super Admin"])),
    db: Session = Depends(get_db)
):
    """Court Management: Upload and record the final judgement for a case"""
    case = db.query(Case).filter(Case.case_number == data.case_number).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = f"Judgement Passed - {data.verdict}"
    db.commit()

    log_audit_event(
        db=db,
        action="COURT_UPLOAD_JUDGEMENT",
        resource="Case",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Judgement uploaded for Case {data.case_number}. Verdict: {data.verdict}. Judge: {data.judge_name}"
    )

    return {
        "message": "Judgement recorded successfully",
        "case_number": data.case_number,
        "verdict": data.verdict,
        "judgement_date": data.judgement_date,
        "judge_name": data.judge_name,
        "judgement_summary": data.judgement_summary,
        "next_steps": data.next_steps
    }


@app.put("/court/case/close")
def close_case(
    data: CaseClosure,
    current_user=Depends(require_role(["Court Management", "Super Admin"])),
    db: Session = Depends(get_db)
):
    """Court Management: Officially close a case"""
    case = db.query(Case).filter(Case.case_number == data.case_number).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = data.final_status
    db.commit()

    log_audit_event(
        db=db,
        action="COURT_CLOSE_CASE",
        resource="Case",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Case {data.case_number} officially closed. Reason: {data.closure_reason}. Final status: {data.final_status}"
    )

    return {
        "message": "Case closed successfully",
        "case_number": data.case_number,
        "final_status": data.final_status,
        "closure_reason": data.closure_reason
    }


@app.get("/court/dashboard")
def get_court_dashboard(
    current_user=Depends(require_role(["Court Management", "Super Admin"])),
    db: Session = Depends(get_db)
):
    """Court Management: Overview dashboard - active cases, upcoming hearings, recent verdicts"""
    all_cases = db.query(Case).all()

    active_cases = [c for c in all_cases if c.status not in ["Closed", "Closed - Disposed", "Closed - Judgement Passed", "Closed - Withdrawn"]]
    closed_cases = [c for c in all_cases if c.status in ["Closed", "Closed - Disposed", "Closed - Judgement Passed", "Closed - Withdrawn"]]
    judgement_cases = [c for c in all_cases if "Judgement" in (c.status or "")]

    return {
        "total_cases": len(all_cases),
        "active_cases": len(active_cases),
        "closed_cases": len(closed_cases),
        "judgements_passed": len(judgement_cases),
        "cases": [
            {
                "case_number": c.case_number,
                "case_title": c.case_title,
                "petitioner": c.petitioner,
                "respondent": c.respondent,
                "court_name": c.court_name,
                "judge_name": c.judge_name,
                "advocate_assigned": c.advocate_assigned,
                "next_hearing_date": c.next_hearing_date,
                "priority": c.priority,
                "status": c.status
            }
            for c in all_cases
        ]
    }


# ================================
# DOCUMENTS
# ================================

@app.post("/documents")
def add_document(data: DocumentCreate, db: Session = Depends(get_db)):

    new_document = Document(
        title=data.title,
        document_type=data.document_type,
        uploaded_by=data.uploaded_by,
        case_id=data.case_id,
        file_path=data.file_path
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    return {
        "message": "Document added successfully",
        "document": new_document
    }


@app.get("/documents")
def get_all_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).all()
    return documents


@app.get("/documents/{doc_id}")
def get_document(doc_id: int, db: Session = Depends(get_db)):

    document = db.query(Document).filter(
        Document.id == doc_id
    ).first()

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    return document


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):

    document = db.query(Document).filter(
        Document.id == doc_id
    ).first()

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(document)
    db.commit()

    return {
        "message": "Document deleted successfully"
    }
# ================================
# AUTH & SECURITY (RBAC & AUDIT LOGS)
# ================================

@app.get("/auth/roles")
def get_available_roles():
    return {
        "roles": VALID_ROLES,
        "descriptions": {
            "User": "Citizen / Petitioner / Respondent access to track cases & book advocates",
            "Police": "Police Station Officers access to register FIRs, cases & verify complaints",
            "Advocate": "Legal Advocates access to accept/reject bookings & manage client cases",
            "Court Management": "Judiciary officers to schedule hearings & upload judgements",
            "Super Admin": "Full system management, audit logs, analytics & security controls"
        }
    }


@app.post("/auth/register")
def register(data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == data.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    role_to_assign = data.role if data.role in VALID_ROLES else "User"

    new_user = User(
        full_name=data.full_name,
        email=data.email,
        password=hash_password(data.password),
        phone=data.phone,
        role=role_to_assign,
        police_station=data.police_station,
        bar_council_id=data.bar_council_id,
        court_id=data.court_id,
        is_verified="Verified"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_event(
        db=db,
        action="USER_REGISTER",
        resource="User",
        user_id=new_user.id,
        user_email=new_user.email,
        user_role=new_user.role,
        details=f"User registered with role {new_user.role}"
    )

    return {
        "message": "Registered Successfully",
        "user_id": new_user.id,
        "role": new_user.role
    }


@app.post("/auth/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if user is None:
        log_audit_event(
            db=db,
            action="LOGIN_FAILED",
            resource="Auth",
            details=f"Failed login attempt for email: {data.email}"
        )
        raise HTTPException(status_code=401, detail="Invalid Email")

    if not verify_password(data.password, user.password):
        log_audit_event(
            db=db,
            action="LOGIN_FAILED",
            resource="Auth",
            user_id=user.id,
            user_email=user.email,
            user_role=user.role,
            details="Invalid password attempt"
        )
        raise HTTPException(status_code=401, detail="Invalid Password")

    # Create JWT Token with complete identity claims
    token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        }
    )

    log_audit_event(
        db=db,
        action="LOGIN_SUCCESS",
        resource="Auth",
        user_id=user.id,
        user_email=user.email,
        user_role=user.role,
        details=f"User {user.email} logged in successfully with role {user.role}"
    )

    return {
        "message": "Login Successful",
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.full_name,
        "email": user.email,
        "role": user.role
    }


@app.get("/auth/me")
def get_current_user_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "police_station": user.police_station,
        "bar_council_id": user.bar_council_id,
        "court_id": user.court_id,
        "is_verified": user.is_verified,
        "created_at": user.created_at
    }


@app.get("/auth/profile/{user_id}")
def get_profile(
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only allow self profile access, or Super Admin
    if current_user.get("user_id") != user_id and current_user.get("role") != "Super Admin":
        raise HTTPException(status_code=403, detail="Unauthorized to view another user profile")

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "police_station": user.police_station,
        "bar_council_id": user.bar_council_id,
        "court_id": user.court_id
    }


@app.get("/auth/audit-logs")
def get_audit_logs(
    current_user=Depends(require_role(["Super Admin"])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(200).all()
    return logs

# ================================
# HEALTH CHECK
# ================================

@app.get("/health")
def health(db: Session = Depends(get_db)):
    return {
        "status": "ok",
        "modules": {
            "fir": db.query(FIR).count(),
            "cases": db.query(Case).count(),
            "advocates": db.query(User).filter(User.role == "Advocate").count(),
            "appointments": db.query(Appointment).count(),
            "documents": db.query(Document).count(),
            "users": db.query(User).count(),
            "contacts": db.query(Contact).count()
        }
    }
# ================================
# COURT SCHEDULE SERVICE
# ================================

class CourtSchedule(BaseModel):
    case_number: str
    court_name: str
    judge_name: str
    hearing_date: str
    hearing_time: str
    hearing_type: str  # e.g. Arguments, Judgment, Evidence
    notes: Optional[str] = None

court_schedules = [
    {
        "id": "1",
        "case_number": "HC2026-1001",
        "court_name": "Hyderabad High Court",
        "judge_name": "Justice Reddy",
        "hearing_date": "2026-07-15",
        "hearing_time": "10:30 AM",
        "hearing_type": "Arguments",
        "notes": "Both parties to submit written arguments"
    },
    {
        "id": "2",
        "case_number": "HC2026-1001",
        "court_name": "Hyderabad High Court",
        "judge_name": "Justice Reddy",
        "hearing_date": "2026-08-20",
        "hearing_time": "11:00 AM",
        "hearing_type": "Judgment",
        "notes": "Final judgment expected"
    }
]

@app.post("/court-schedule")
def add_court_schedule(
    data: CourtSchedule,
    current_user=Depends(get_current_user)
):
    schedule = {"id": str(uuid.uuid4()), **data.dict()}
    court_schedules.append(schedule)
    return {"message": "Court schedule added", "schedule": schedule}

@app.get("/court-schedule")
def get_court_schedules(
    case_number: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    if case_number:
        filtered = [s for s in court_schedules if s["case_number"] == case_number]
        if not filtered:
            raise HTTPException(status_code=404, detail="No schedules found for this case")
        return filtered
    return court_schedules

# GET ALL SCHEDULES OF A PARTICULAR CASE

@app.get("/court-schedule")
def get_case_schedule(
    case_number: str,
    current_user=Depends(get_current_user)
):

    schedules = []

    for schedule in court_schedules:

        if schedule["case_number"] == case_number:
            schedules.append(schedule)

    return schedules



# GET PARTICULAR SCHEDULE USING ID

@app.get("/court-schedule/{schedule_id}")
def get_schedule(
    schedule_id: str,
    current_user=Depends(get_current_user)
):

    for schedule in court_schedules:

        if schedule["id"] == schedule_id:
            return schedule

    raise HTTPException(
        status_code=404,
        detail="Schedule not found"
    )



# UPDATE PARTICULAR SCHEDULE

@app.put("/court-schedule/{schedule_id}")
def update_schedule(
    schedule_id: str,
    data: CourtSchedule,
    current_user=Depends(get_current_user)
):

    for schedule in court_schedules:

        if schedule["id"] == schedule_id:

            schedule.update(data.dict())

            return {
                "message": "Schedule updated",
                "schedule": schedule
            }

    raise HTTPException(
        status_code=404,
        detail="Schedule not found"
    )
@app.put("/court-schedule/{schedule_id}")
def update_schedule(
    schedule_id: str,
    data: CourtSchedule,
    current_user=Depends(get_current_user)
):
    for s in court_schedules:
        if s["id"] == schedule_id:
            s.update(data.dict())
            return {"message": "Schedule updated", "schedule": s}
    raise HTTPException(status_code=404, detail="Schedule not found")

@app.delete("/court-schedule/{schedule_id}")
def delete_schedule(
    schedule_id: str,
    current_user=Depends(get_current_user)
):
    for s in court_schedules:
        if s["id"] == schedule_id:
            court_schedules.remove(s)
            return {"message": "Schedule deleted"}
    raise HTTPException(status_code=404, detail="Schedule not found")
# ================================
# ANALYTICS
# ================================
@app.get("/analytics")
def get_analytics(
    current_user=Depends(require_role(["Super Admin"])),
    db: Session = Depends(get_db)
):

    users = db.query(User).all()
    cases = db.query(Case).all()
    firs = db.query(FIR).all()
    docs = db.query(Document).all()
    appointments = db.query(Appointment).all()

    return {

        "users": {
            "total": len(users)
        },

        "advocates": {
            "total": len(
                [u for u in users if u.role == "Advocate"]
            )
        },

        "cases": {
            "total": len(cases),

            "open": len(
                [c for c in cases
                 if c.status.lower() in
                 ["open", "pending", "in progress"]]
            ),

            "closed": len(
                [c for c in cases
                 if c.status.lower() == "closed"]
            ),

            "by_type": {
                c.case_type:
                sum(
                    1
                    for x in cases
                    if x.case_type == c.case_type
                )

                for c in cases
            }
        },

        "firs": {
            "total": len(firs),

            "pending": len(
                [f for f in firs
                 if f.status == "Pending"]
            ),

            "by_complaint": {
                f.complaint_type:
                sum(
                    1
                    for x in firs
                    if x.complaint_type ==
                    f.complaint_type
                )

                for f in firs
            }
        },

        "documents": {
            "total": len(docs)
        },

        "appointments": {
            "total": len(appointments)
        }

    }
# ================================
# SEARCH SERVICE
# ================================

@app.get("/search")
def global_search(
    q: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")

    query = q.lower()

    results = {
        "cases": [],
        "firs": [],
        "advocates": [],
        "documents": []
    }

    # CASES
    all_cases = db.query(Case).all()

    for case in all_cases:
        if (
    query in (case.case_number or "").lower()
    or query in (case.case_title or "").lower()
    or query in (case.petitioner or "").lower()
    or query in (case.respondent or "").lower()
    or query in (case.case_type or "").lower()
        ):
            results["cases"].append({
                "case_number": case.case_number,
                "case_title": case.case_title,
                "petitioner": case.petitioner,
                "respondent": case.respondent,
                "status": case.status
            })

    # FIRS
    all_firs = db.query(FIR).all()

    for fir in all_firs:
        if (
            query in (fir.fir_number or "").lower()
            or query in (fir.complaint_type or "").lower()
            or query in (fir.police_station or "").lower()
        ):
            results["firs"].append({
                "fir_number": fir.fir_number,
                "complaint_type": fir.complaint_type,
                "police_station": fir.police_station,
                "status": fir.status
            })

    # ADVOCATES
    advocates = db.query(User).filter(User.role == "Advocate").all()

    for adv in advocates:
        if query in (adv.full_name or "").lower():
            results["advocates"].append({
                "full_name": adv.full_name,
                "email": adv.email,
                "phone": adv.phone
            })

    # DOCUMENTS
    documents = db.query(Document).all()

    for doc in documents:
        if (
            query in (doc.title or "").lower()
            or query in (doc.document_type or "").lower()
        ):
            results["documents"].append({
                "title": doc.title,
                "document_type": doc.document_type,
                "uploaded_by": doc.uploaded_by
            })

    total = sum(len(v) for v in results.values())

    return {
        "query": q,
        "total_results": total,
        "results": results
    }

# ================================
# NOTIFICATION SERVICE
# ================================

@app.post("/notify")
def send_notification(
    data: NotificationCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    status = "Queued"

    # If it's an SMS notification, actually send it via Twilio
    if data.notification_type.lower() == "sms" and data.recipient_phone:
        success, info = send_sms(data.recipient_phone, data.message)
        if success:
            status = "Sent"
        else:
            print("SMS FAILED - full error:", info)  # full detail visible in terminal only
            status = "Failed"

    new_notification = Notification(
        recipient_name=data.recipient_name,
        recipient_email=data.recipient_email,
        recipient_phone=data.recipient_phone,
        notification_type=data.notification_type,
        subject=data.subject,
        message=data.message,
        status=status
    )

    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)

    return {
        "message": "Notification processed",
        "notification": new_notification
    }

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).all()


# ================================
# CONTACT
# ================================

class ContactCreate(BaseModel):
    name: str
    email: str
    message: str


@app.post("/contact")
def send_message(data: ContactCreate, db: Session = Depends(get_db)):

    new_message = Contact(
        name=data.name,
        email=data.email,
        message=data.message
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return {
        "message": "Message sent successfully",
        "contact": new_message
    }


@app.get("/contact")
def get_messages(db: Session = Depends(get_db)):
    return db.query(Contact).all()


# ================================
# SUPER ADMIN MODULE (RBAC)
# ================================

class RoleUpdate(BaseModel):
    user_id: int
    new_role: str


class UserVerification(BaseModel):
    user_id: int
    is_verified: bool
    verification_notes: Optional[str] = None


@app.get("/admin/users")
def get_all_users(
    current_user=Depends(require_role(["Super Admin"])),
    db: Session = Depends(get_db)
):
    """Super Admin: Get all registered users with role info"""
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "police_station": getattr(u, "police_station", None),
            "bar_council_id": getattr(u, "bar_council_id", None),
            "court_id": getattr(u, "court_id", None),
            "is_active": getattr(u, "is_active", True),
        }
        for u in users
    ]


@app.put("/admin/user/role")
def update_user_role(
    data: RoleUpdate,
    current_user=Depends(require_role(["Super Admin"])),
    db: Session = Depends(get_db)
):
    """Super Admin: Promote/demote a user's role"""
    if data.new_role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {VALID_ROLES}")

    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = user.role
    user.role = data.new_role
    db.commit()

    log_audit_event(
        db=db,
        action="ADMIN_ROLE_UPDATE",
        resource="User",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Updated User #{data.user_id} role from '{old_role}' to '{data.new_role}'"
    )

    return {
        "message": f"User #{data.user_id} role updated to '{data.new_role}'",
        "user_id": data.user_id,
        "old_role": old_role,
        "new_role": data.new_role
    }


@app.delete("/admin/user/{user_id}")
def delete_user(
    user_id: int,
    current_user=Depends(require_role(["Super Admin"])),
    db: Session = Depends(get_db)
):
    """Super Admin: Remove a user from the system"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.get("user_id"):
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    db.delete(user)
    db.commit()

    log_audit_event(
        db=db,
        action="ADMIN_DELETE_USER",
        resource="User",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Deleted User #{user_id} ({user.email})"
    )

    return {"message": f"User #{user_id} deleted successfully"}


@app.get("/admin/audit-logs")
def get_all_audit_logs(
    limit: int = 100,
    current_user=Depends(require_role(["Super Admin"])),
    db: Session = Depends(get_db)
):
    """Super Admin: View full system audit logs"""
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "user_email": log.user_email,
            "user_role": log.user_role,
            "action": log.action,
            "resource": log.resource,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": str(log.timestamp) if hasattr(log, "timestamp") else None
        }
        for log in logs
    ]


@app.get("/admin/analytics")
def get_admin_analytics(
    current_user=Depends(require_role(["Super Admin"])),
    db: Session = Depends(get_db)
):
    """Super Admin: Full system analytics and health metrics"""
    users = db.query(User).all()
    cases = db.query(Case).all()
    firs = db.query(FIR).all()
    docs = db.query(Document).all()
    appointments = db.query(Appointment).all()
    audit_logs = db.query(AuditLog).all()

    role_counts = {}
    for u in users:
        role = u.role or "User"
        role_counts[role] = role_counts.get(role, 0) + 1

    action_counts = {}
    for log in audit_logs:
        action_counts[log.action] = action_counts.get(log.action, 0) + 1

    return {
        "users": {
            "total": len(users),
            "by_role": role_counts,
        },
        "cases": {
            "total": len(cases),
            "open": len([c for c in cases if c.status and c.status.lower() in ["open", "pending", "hearing"]]),
            "closed": len([c for c in cases if c.status and "closed" in c.status.lower()]),
            "with_judgement": len([c for c in cases if c.status and "judgement" in c.status.lower()]),
        },
        "firs": {
            "total": len(firs),
            "under_investigation": len([f for f in firs if f.investigation_status == "Under Investigation"]),
            "charge_sheet_filed": len([f for f in firs if f.investigation_status == "Charge Sheet Filed"]),
        },
        "appointments": {
            "total": len(appointments),
            "pending": len([a for a in appointments if a.status == "Pending"]),
            "accepted": len([a for a in appointments if a.status == "Accepted"]),
            "rejected": len([a for a in appointments if a.status == "Rejected"]),
        },
        "documents": {"total": len(docs)},
        "audit": {
            "total_events": len(audit_logs),
            "by_action": action_counts
        }
    }


@app.get("/admin/security/suspicious")
def get_suspicious_activity(
    current_user=Depends(require_role(["Super Admin"])),
    db: Session = Depends(get_db)
):
    """Super Admin: Detect unusual or suspicious audit events"""
    suspicious_actions = [
        "DELETE_FIR", "ADMIN_DELETE_USER",
        "ADMIN_ROLE_UPDATE", "AUTH_FAILED"
    ]

    logs = db.query(AuditLog).filter(
        AuditLog.action.in_(suspicious_actions)
    ).order_by(AuditLog.id.desc()).limit(50).all()

    return {
        "alert_count": len(logs),
        "suspicious_events": [
            {
                "id": log.id,
                "action": log.action,
                "user_email": log.user_email,
                "user_role": log.user_role,
                "resource": log.resource,
                "details": log.details,
                "timestamp": str(log.timestamp) if hasattr(log, "timestamp") else None
            }
            for log in logs
        ]
    }

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
from rag import build_context
from twilio_service import send_sms
from sqlalchemy.orm import Session
from jwt_handler import create_access_token, verify_token


from database import SessionLocal
from models import (
    User,
    Appointment,
    FIR,
    Case,
    Document,
    Contact,
    Notification,
    Payment,
    ChatHistory,
    AuditLog,
    Hearing,
)
from schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    AuditLogResponse,
    DocumentCreate,
    ContactCreate,
    NotificationCreate,
)
from auth import hash_password, verify_password
from fastapi import Header, HTTPException, Request

VALID_ROLES = ["User", "Police", "Lawyer", "Judge", "Admin"]


def log_audit_event(
    db: Session,
    action: str,
    resource: str,
    user_id: Optional[int] = None,
    user_email: Optional[str] = None,
    user_role: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = "127.0.0.1"
):
    try:
        audit = AuditLog(
            user_id=user_id,
            user_email=user_email,
            user_role=user_role,
            action=action,
            resource=resource,
            details=details,
            ip_address=ip_address
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        print("Audit Log Failed:", str(e))


def get_current_user(
    authorization: str = Header(None)
):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    token = authorization.split(" ")[1]

    payload = verify_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or Expired Token")

    return payload


def require_role(allowed_roles: list):
    def role_checker(current_user=Depends(get_current_user)):
        user_role = current_user.get("role")
        # Direct match or Admin override
        if user_role not in allowed_roles and user_role != "Admin":
            raise HTTPException(
                status_code=403,
                detail=f"Permission Denied. Role '{user_role}' does not have access to this resource."
            )
        return current_user
    return role_checker



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(title="Legal AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# AI LEGAL ASSISTANT
# ================================

class Question(BaseModel):
    question: str


class StructuredQuery(BaseModel):
    question: str
    case_number: Optional[str] = None
    context_type: Optional[str] = "general"  # general | case | fir | hearing


STRUCTURED_AI_SYSTEM_PROMPT = """You are an expert Indian Legal AI Assistant integrated into a court and judiciary management system.

ALWAYS respond using EXACTLY this 5-section structured format with markdown headers:

## 📋 Summary
[2-3 sentence plain-language summary of the legal topic or situation]

## 📊 Current Status
[Current legal standing, applicable laws, or case status if case context provided]

## ⚙️ Next Legal Process
[Step-by-step next actions the person should take]

## 📄 Required Documents
[Bullet list of documents needed for this legal matter]

## ⚠️ Important Notes
[Critical warnings, deadlines, rights, or legal caveats]

---
Keep each section concise (2-4 bullet points or sentences). Focus on Indian law (IPC, CrPC, Constitution, etc.)."""


@app.get("/")
def home():
    return {"message": "Legal AI Backend Running Successfully"}


@app.get("/ai-chat")
def get_chat():
    return {"answer": "Welcome to AI Legal Assistant!"}


@app.post("/ai-chat")
def ai_chat(
    data: Question,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        context = build_context(data.question, top_k=2)

        if context:
            system_content = (
                "You are a helpful legal assistant for an Indian Legal & "
                "Judiciary Automation System. Use the following reference "
                "material to answer the user's question as accurately as "
                "possible. If the reference material doesn't fully answer "
                "the question, you may use your own knowledge too, but "
                "prioritize the reference material below.\n\n"
                f"REFERENCE MATERIAL:\n{context}"
            )
        else:
            system_content = (
                "You are a helpful legal assistant for an Indian Legal & "
                "Judiciary Automation System. Answer questions about Indian "
                "law, FIR, bail, IPC, CrPC, courts, and legal procedures "
                "clearly and simply. If a question is not related to law, "
                "politely say you can only help with legal topics."
            )

        response = groq_client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": data.question}
            ]
        )
        answer = response.choices[0].message.content

    except Exception as e:
        print("Groq/RAG Error:", str(e))
        answer = "Sorry, the AI assistant is temporarily unavailable."

    chat = ChatHistory(question=data.question, answer=answer)
    db.add(chat)
    db.commit()

    return {"answer": answer}


@app.post("/ai/structured-query")
def structured_ai_query(
    data: StructuredQuery,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Module 7: Structured AI Engine.
    Returns a mandatory 5-section legal analysis:
    Summary | Current Status | Next Process | Required Documents | Important Notes
    """
    try:
        # Step 1: RAG context retrieval
        rag_context = build_context(data.question, top_k=3)

        # Step 2: Case-specific context injection
        case_context = ""
        if data.case_number:
            case = db.query(Case).filter(Case.case_number == data.case_number).first()
            if case:
                case_context = (
                    f"\n\nCASE CONTEXT:\n"
                    f"Case Number: {case.case_number}\n"
                    f"Title: {case.case_title}\n"
                    f"Petitioner: {case.petitioner} vs Respondent: {case.respondent}\n"
                    f"Court: {case.court_name} | Judge: {case.judge_name}\n"
                    f"Advocate: {case.advocate_assigned}\n"
                    f"Filing Date: {case.filing_date} | Next Hearing: {case.next_hearing_date}\n"
                    f"Current Status: {case.status}\n"
                    f"Priority: {case.priority}"
                )

        full_system = STRUCTURED_AI_SYSTEM_PROMPT
        if rag_context:
            full_system += f"\n\nRAG REFERENCE MATERIAL:\n{rag_context}"
        if case_context:
            full_system += case_context

        response = groq_client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {"role": "system", "content": full_system},
                {"role": "user", "content": data.question}
            ],
            max_tokens=1200,
            temperature=0.3
        )

        structured_answer = response.choices[0].message.content

    except Exception as e:
        print("Structured AI Error:", str(e))
        structured_answer = """## 📋 Summary
The AI Legal Assistant is temporarily unavailable. Please try again shortly.

## 📊 Current Status
System under maintenance.

## ⚙️ Next Legal Process
- Contact your assigned advocate directly
- Visit the court registry for manual assistance

## 📄 Required Documents
- Government-issued ID proof
- Any relevant case documents

## ⚠️ Important Notes
- Do not miss any scheduled court dates
- All legal deadlines remain in effect"""

    log_audit_event(
        db=db,
        action="AI_STRUCTURED_QUERY",
        resource="AI Engine",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Structured query: {data.question[:100]}"
    )

    chat = ChatHistory(question=data.question, answer=structured_answer)
    db.add(chat)
    db.commit()

    return {
        "question": data.question,
        "answer": structured_answer,
        "case_number": data.case_number,
        "context_type": data.context_type,
        "rag_used": bool(rag_context) if 'rag_context' in locals() else False
    }


@app.get("/ai/case-summary/{case_number}")
def get_ai_case_summary(
    case_number: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Module 7: Generate structured AI summary for a specific case"""
    case = db.query(Case).filter(Case.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    question = f"Provide a complete legal analysis and guidance for case {case.case_number}: {case.case_title}. The case involves {case.petitioner} vs {case.respondent} in {case.court_name} with current status: {case.status}."

    case_context = (
        f"Case Number: {case.case_number} | Title: {case.case_title}\n"
        f"Petitioner: {case.petitioner} vs Respondent: {case.respondent}\n"
        f"Court: {case.court_name} | Judge: {case.judge_name}\n"
        f"Advocate: {case.advocate_assigned} | Type: {case.case_type}\n"
        f"Filing: {case.filing_date} | Next Hearing: {case.next_hearing_date}\n"
        f"Priority: {case.priority} | Status: {case.status}"
    )

    try:
        system = STRUCTURED_AI_SYSTEM_PROMPT + f"\n\nCASE CONTEXT:\n{case_context}"
        response = groq_client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": question}
            ],
            max_tokens=1000,
            temperature=0.2
        )
        summary = response.choices[0].message.content
    except Exception as e:
        print("Case summary AI error:", e)
        summary = "AI case summary unavailable. Please try again."

    return {
        "case_number": case_number,
        "case_title": case.case_title,
        "summary": summary
    }


@app.get("/chat-history")
def get_chat_history(db: Session = Depends(get_db)):
    return db.query(ChatHistory).all()


# ================================
# MODULE 8: PDF REPORT GENERATION
# ================================

@app.get("/report/case/{case_number}")
def generate_case_report(
    case_number: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a structured case report (JSON) that frontend renders as PDF"""
    case = db.query(Case).filter(Case.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Citizen isolation check
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    if user_role == "User":
        if case.petitioner_id != user_id and case.respondent_id != user_id:
            if case.petitioner_id is not None:
                raise HTTPException(status_code=403, detail="Cannot generate report for another citizen's case")

    firs = db.query(FIR).all()
    related_firs = [f for f in firs if f.status and case_number.split("/")[0] in (f.fir_number or "")]

    log_audit_event(
        db=db, action="GENERATE_CASE_REPORT", resource="Case",
        user_id=user_id, user_email=current_user.get("email"),
        user_role=user_role, details=f"Generated PDF report for case {case_number}"
    )

    return {
        "report_type": "CASE_REPORT",
        "generated_by": current_user.get("email"),
        "generated_at": str(__import__("datetime").datetime.utcnow()),
        "case": {
            "case_number": case.case_number,
            "case_title": case.case_title,
            "petitioner": case.petitioner,
            "respondent": case.respondent,
            "court_name": case.court_name,
            "judge_name": case.judge_name,
            "advocate_assigned": case.advocate_assigned,
            "case_type": case.case_type,
            "filing_date": case.filing_date,
            "next_hearing_date": case.next_hearing_date,
            "priority": case.priority,
            "status": case.status,
        }
    }


@app.get("/report/fir/{fir_number}")
def generate_fir_report(
    fir_number: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a structured FIR report"""
    fir = db.query(FIR).filter(FIR.fir_number == fir_number).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    if user_role == "User":
        if fir.complainant_id and fir.complainant_id != user_id:
            raise HTTPException(status_code=403, detail="Cannot generate report for another citizen's FIR")

    log_audit_event(
        db=db, action="GENERATE_FIR_REPORT", resource="FIR",
        user_id=user_id, user_email=current_user.get("email"),
        user_role=user_role, details=f"Generated PDF report for FIR {fir_number}"
    )

    return {
        "report_type": "FIR_REPORT",
        "generated_by": current_user.get("email"),
        "generated_at": str(__import__("datetime").datetime.utcnow()),
        "fir": {
            "fir_number": fir.fir_number,
            "police_station": fir.police_station,
            "complaint_type": fir.complaint_type,
            "date_registered": fir.date_registered,
            "investigation_status": fir.investigation_status or "Under Investigation",
            "status": fir.status,
            "complainant_name": fir.complainant_name,
        }
    }


# ================================
# ADVOCATE MODULE & APPOINTMENTS (RBAC)
# ================================

class BookingResponse(BaseModel):
    appointment_id: int
    status: str  # Accepted or Rejected
    notes: Optional[str] = None


class CaseStatusUpdate(BaseModel):
    case_number: str
    status: str
    remarks: Optional[str] = None


advocates = [
    {"id": 1, "name": "Ramesh Kumar", "specialization": "Criminal Law", "experience": 12, "rating": 4.8, "location": "Hyderabad"},
    {"id": 2, "name": "Priya Sharma",  "specialization": "Family Law",   "experience": 8,  "rating": 4.6, "location": "Secunderabad"},
    {"id": 3, "name": "Arjun Reddy",   "specialization": "Property Law", "experience": 15, "rating": 4.9, "location": "Banjara Hills"},
    {"id": 4, "name": "Sunita Rao",    "specialization": "Corporate Law","experience": 10, "rating": 4.7, "location": "Hyderabad"},
    {"id": 5, "name": "Vikram Singh",  "specialization": "Criminal Law", "experience": 6,  "rating": 4.4, "location": "Jubilee Hills"},
]


@app.get("/advocates")
def get_advocates(specialization: Optional[str] = None):
    if specialization:
        filtered = [a for a in advocates if a["specialization"].lower() == specialization.lower()]
        return filtered
    return advocates


@app.post("/book-appointment")
def book_appointment(
    data: AppointmentCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = Appointment(
        user_id=current_user.get("user_id"),
        name=data.name,
        phone=data.phone,
        advocate_name=data.advocate_name,
        appointment_date=data.date,
        time_slot=data.time_slot,
        status="Pending"
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    log_audit_event(
        db=db,
        action="BOOK_APPOINTMENT",
        resource="Appointment",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Booked appointment with {data.advocate_name} for {data.date}"
    )

    # Automated Twilio SMS Notification
    try:
        sms_message = (
            f"Hi {data.name}, your consultation request with Advocate {data.advocate_name} "
            f"for {data.date} at {data.time_slot} has been received. Status: Pending Advocate Confirmation. - Legal AI System"
        )
        send_sms(data.phone, sms_message)
    except Exception as e:
        print("Appointment SMS failed:", str(e))

    return {
        "message": "Appointment request submitted successfully",
        "appointment": {
            "id": appointment.id,
            "name": appointment.name,
            "phone": appointment.phone,
            "advocate_name": appointment.advocate_name,
            "date": appointment.appointment_date,
            "time_slot": appointment.time_slot,
            "status": appointment.status
        }
    }


@app.get("/appointments")
def get_appointments(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    user_name = current_user.get("full_name")

    all_appointments = db.query(Appointment).all()

    # Filter by role
    if user_role == "Lawyer":
        # Lawyer sees bookings assigned to their name
        filtered = [a for a in all_appointments if (a.advocate_name and user_name and a.advocate_name.lower() in user_name.lower()) or a.advocate_id == user_id or a.advocate_name is not None]
        return filtered

    if user_role == "User":
        # Citizen sees their own bookings
        filtered = [a for a in all_appointments if a.user_id == user_id or (a.name and user_name and a.name.lower() == user_name.lower())]
        return filtered

    return all_appointments


@app.post("/advocate/booking/respond")
def respond_to_booking(
    data: BookingResponse,
    current_user=Depends(require_role(["Lawyer", "Admin"])),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == data.appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    new_status = "Accepted" if data.status.lower() == "accepted" else "Rejected"
    appointment.status = new_status
    db.commit()

    log_audit_event(
        db=db,
        action="ADVOCATE_BOOKING_RESPOND",
        resource="Appointment",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Advocate updated booking #{appointment.id} status to {new_status}"
    )

    # Automated Twilio SMS & Voice Alert to Citizen
    if appointment.phone:
        try:
            sms_msg = f"Legal AI Notification: Your appointment #{appointment.id} with Advocate {appointment.advocate_name} has been {new_status.upper()}."
            send_sms(appointment.phone, sms_msg)
        except Exception as e:
            print("Twilio notification failed:", e)

    return {
        "message": f"Booking {new_status} successfully",
        "appointment": appointment
    }


@app.get("/advocate/assigned-cases")
def get_advocate_assigned_cases(
    current_user=Depends(require_role(["Lawyer", "Admin"])),
    db: Session = Depends(get_db)
):
    user_name = current_user.get("full_name")
    user_id = current_user.get("user_id")

    all_cases = db.query(Case).all()

    # Filter cases assigned to this advocate
    assigned = [
        c for c in all_cases
        if c.advocate_id == user_id
        or (c.advocate_assigned and user_name and user_name.lower() in c.advocate_assigned.lower())
        or (c.advocate_assigned is not None)  # Fallback for demo
    ]

    return assigned


@app.put("/advocate/update-case-status")
def advocate_update_case_status(
    data: CaseStatusUpdate,
    current_user=Depends(require_role(["Lawyer", "Judge", "Admin"])),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.case_number == data.case_number).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = data.status
    db.commit()

    log_audit_event(
        db=db,
        action="ADVOCATE_UPDATE_CASE_STATUS",
        resource="Case",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Advocate updated Case {case.case_number} status to {data.status}"
    )

    return {
        "message": "Case status updated successfully by Advocate",
        "case": case
    }


# ================================
# FIR TRACKING & MANAGEMENT (RBAC)
# ================================

@app.post("/add-fir")
def add_fir(
    data: FIRCreate,
    current_user=Depends(require_role(["Police", "Admin"])),
    db: Session = Depends(get_db)
):
    existing = db.query(FIR).filter(FIR.fir_number == data.fir_number).first()

    if existing:
        raise HTTPException(status_code=400, detail="FIR already exists")

    fir = FIR(
        fir_number=data.fir_number,
        police_station=data.police_station,
        complaint_type=data.complaint_type,
        date_registered=data.date_registered,
        status=data.status,
        investigation_status="Under Investigation"
    )

    db.add(fir)
    db.commit()
    db.refresh(fir)

    log_audit_event(
        db=db,
        action="CREATE_FIR",
        resource="FIR",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Registered FIR Number: {fir.fir_number}"
    )

    return {
        "message": "FIR Registered Successfully",
        "fir": {
            "fir_number": fir.fir_number,
            "police_station": fir.police_station,
            "complaint_type": fir.complaint_type,
            "date_registered": fir.date_registered,
            "status": fir.status
        }
    }


@app.get("/fir")
def get_fir(
    fir_number: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fir = db.query(FIR).filter(FIR.fir_number == fir_number).first()

    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    user_name = current_user.get("full_name")

    # Data Isolation: User role can only view their own FIR
    if user_role == "User":
        is_owner = (
            fir.complainant_id == user_id or
            (fir.complainant_name and user_name and fir.complainant_name.lower() == user_name.lower())
        )
        if not is_owner:
            # Check if this FIR has no assigned complainant ID yet; allow lookup if explicitly matched
            if fir.complainant_id is None and fir.complainant_name is None:
                pass  # allow legacy viewing if unassigned
            else:
                raise HTTPException(status_code=403, detail="Unauthorized to view another citizen's FIR record")

    return {
        "fir_number": fir.fir_number,
        "police_station": fir.police_station,
        "complaint_type": fir.complaint_type,
        "date_registered": fir.date_registered,
        "investigation_status": fir.investigation_status,
        "status": fir.status,
        "complainant_name": fir.complainant_name
    }


@app.get("/firs")
def get_all_firs(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    user_name = current_user.get("full_name")

    all_firs = db.query(FIR).all()

    # Data Isolation: Filter for Citizens (User role)
    if user_role == "User":
        user_firs = [
            f for f in all_firs
            if f.complainant_id == user_id
            or (f.complainant_name and user_name and f.complainant_name.lower() == user_name.lower())
            or (f.complainant_id is None)  # Include existing sample FIRs for demo visibility
        ]
        return [
            {
                "fir_number": f.fir_number,
                "police_station": f.police_station,
                "complaint_type": f.complaint_type,
                "date_registered": f.date_registered,
                "investigation_status": f.investigation_status or "Under Investigation",
                "status": f.status
            }
            for f in user_firs
        ]

    return [
        {
            "fir_number": f.fir_number,
            "police_station": f.police_station,
            "complaint_type": f.complaint_type,
            "date_registered": f.date_registered,
            "investigation_status": f.investigation_status or "Under Investigation",
            "status": f.status
        }
        for f in all_firs
    ]



@app.put("/update-fir")
def update_fir(
    fir_number: str,
    data: FIRStatusUpdate,
    current_user=Depends(require_role(["Police", "Judge", "Admin"])),
    db: Session = Depends(get_db)
):
    fir = db.query(FIR).filter(FIR.fir_number == fir_number).first()

    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    fir.status = data.status
    db.commit()

    log_audit_event(
        db=db,
        action="UPDATE_FIR",
        resource="FIR",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Updated FIR {fir_number} status to {data.status}"
    )

    return {
        "message": "FIR Updated Successfully",
        "fir": {
            "fir_number": fir.fir_number,
            "status": fir.status
        }
    }


@app.delete("/delete-fir")
def delete_fir(
    fir_number: str,
    current_user=Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    fir = db.query(FIR).filter(FIR.fir_number == fir_number).first()

    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    db.delete(fir)
    db.commit()

    log_audit_event(
        db=db,
        action="DELETE_FIR",
        resource="FIR",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Deleted FIR {fir_number}"
    )

    return {"message": "FIR Deleted Successfully"}
# ================================
# CASE TRACKING
# ================================

class CaseCreate(BaseModel):
    case_number: str
    case_title: str
    petitioner: str
    respondent: str
    court_name: str
    judge_name: str
    advocate_assigned: str
    case_type: str
    filing_date: str
    next_hearing_date: str
    priority: str
    status: str


class StatusUpdate(BaseModel):
    status: str


# ================================
# CASE TRACKING & MANAGEMENT (RBAC)
# ================================

@app.post("/add-case")
def add_case(
    case: CaseCreate,
    current_user=Depends(require_role(["Police", "Judge", "Admin"])),
    db: Session = Depends(get_db)
):
    existing_case = db.query(Case).filter(
        Case.case_number == case.case_number
    ).first()

    if existing_case:
        raise HTTPException(status_code=400, detail="Case number already exists")

    new_case = Case(
        case_number=case.case_number,
        case_title=case.case_title,
        petitioner=case.petitioner,
        respondent=case.respondent,
        court_name=case.court_name,
        judge_name=case.judge_name,
        advocate_assigned=case.advocate_assigned,
        case_type=case.case_type,
        filing_date=case.filing_date,
        next_hearing_date=case.next_hearing_date,
        priority=case.priority,
        status=case.status,
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    log_audit_event(
        db=db,
        action="CREATE_CASE",
        resource="Case",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Registered Case Number: {new_case.case_number}"
    )

    return {
        "message": "Case Registered Successfully",
        "case": new_case
    }


@app.get("/case")
def get_case(
    case_number: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = (
        db.query(Case)
        .filter(Case.case_number == case_number)
        .first()
    )

    if case is None:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    user_name = current_user.get("full_name")

    if user_role == "User":
        is_owner = (
            case.petitioner_id == user_id or
            case.respondent_id == user_id or
            (case.petitioner and user_name and case.petitioner.lower() == user_name.lower()) or
            (case.respondent and user_name and case.respondent.lower() == user_name.lower())
        )
        if not is_owner:
            if case.petitioner_id is None and case.respondent_id is None:
                pass  # allow demo visibility
            else:
                raise HTTPException(status_code=403, detail="Unauthorized to view another citizen's case record")

    return {
        "case_number": case.case_number,
        "case_title": case.case_title,
        "petitioner": case.petitioner,
        "respondent": case.respondent,
        "court_name": case.court_name,
        "judge_name": case.judge_name,
        "advocate_assigned": case.advocate_assigned,
        "case_type": case.case_type,
        "filing_date": case.filing_date,
        "next_hearing_date": case.next_hearing_date,
        "priority": case.priority,
        "status": case.status,
    }


@app.get("/all-cases")
def get_all_cases(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    user_name = current_user.get("full_name")

    cases = db.query(Case).all()

    # Citizen Filtering (User Role)
    if user_role == "User":
        filtered_cases = [
            c for c in cases
            if c.petitioner_id == user_id
            or c.respondent_id == user_id
            or (c.petitioner and user_name and c.petitioner.lower() == user_name.lower())
            or (c.respondent and user_name and c.respondent.lower() == user_name.lower())
            or (c.petitioner_id is None and c.respondent_id is None)  # include demo cases
        ]
        return [
            {
                "case_number": case.case_number,
                "case_title": case.case_title,
                "petitioner": case.petitioner,
                "respondent": case.respondent,
                "court_name": case.court_name,
                "judge_name": case.judge_name,
                "advocate_assigned": case.advocate_assigned,
                "case_type": case.case_type,
                "filing_date": case.filing_date,
                "next_hearing_date": case.next_hearing_date,
                "priority": case.priority,
                "status": case.status,
            }
            for case in filtered_cases
        ]

    return [
        {
            "case_number": case.case_number,
            "case_title": case.case_title,
            "petitioner": case.petitioner,
            "respondent": case.respondent,
            "court_name": case.court_name,
            "judge_name": case.judge_name,
            "advocate_assigned": case.advocate_assigned,
            "case_type": case.case_type,
            "filing_date": case.filing_date,
            "next_hearing_date": case.next_hearing_date,
            "priority": case.priority,
            "status": case.status,
        }
        for case in cases
    ]


@app.get("/case/timeline/{case_number}")
def get_case_timeline(
    case_number: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.case_number == case_number).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Build dynamic timeline milestones based on case state
    timeline = [
        {
            "step": 1,
            "title": "FIR & Complaint Registration",
            "date": case.filing_date,
            "status": "Completed",
            "description": f"Initial filing at {case.court_name} on {case.filing_date}."
        },
        {
            "step": 2,
            "title": "Investigation & Charge Sheet",
            "date": case.filing_date,
            "status": "Completed",
            "description": "Police investigation submitted to court registry."
        },
        {
            "step": 3,
            "title": "Advocate Assignment & Notice",
            "date": case.filing_date,
            "status": "Completed",
            "description": f"Advocate {case.advocate_assigned} assigned to represent petitioner."
        },
        {
            "step": 4,
            "title": "Judicial Hearing Proceedings",
            "date": case.next_hearing_date,
            "status": "In Progress" if case.status.lower() in ["open", "hearing", "pending"] else "Completed",
            "description": f"Presided by {case.judge_name} at {case.court_name}."
        },
        {
            "step": 5,
            "title": "Final Arguments & Judgement",
            "date": "Pending Scheduled Date",
            "status": "Completed" if case.status.lower() in ["closed", "judgement"] else "Upcoming",
            "description": "Final verdict reserved upon hearing conclusion."
        }
    ]

    return {
        "case_number": case.case_number,
        "case_title": case.case_title,
        "current_status": case.status,
        "timeline": timeline
    }


@app.get("/legal-awareness")
def get_legal_awareness_services():
    return {
        "title": "National Legal Awareness & Rights Portal",
        "categories": [
            {
                "id": "fir_rights",
                "title": "🚔 Citizen Rights During FIR Registration",
                "summary": "Every citizen has the constitutional right to file an FIR for cognizable offenses.",
                "key_points": [
                    "Under Section 154 CrPC, Police must register an FIR if a cognizable offense is reported.",
                    "You have the right to receive a free copy of the registered FIR immediately.",
                    "Zero FIR allows filing an FIR at any police station regardless of jurisdiction."
                ]
            },
            {
                "id": "bail_rights",
                "title": "⚖️ Bail & Legal Representation Rights",
                "summary": "Understanding bailable vs non-bailable offenses and legal aid eligibility.",
                "key_points": [
                    "Bailable offenses guarantee bail as a matter of right at the police station.",
                    "Free Legal Services are available under Legal Services Authorities Act, 1987.",
                    "You have the right to consult an advocate of your choice within 24 hours of arrest."
                ]
            },
            {
                "id": "women_cyber_safety",
                "title": "🛡️ Women & Cyber Safety Protections",
                "summary": "Specialized legal protections against harassment, cybercrime, and domestic violence.",
                "key_points": [
                    "Identity protection for victims under IPC 228A.",
                    "National Cyber Crime Portal helpline (1930) for instant financial fraud reporting.",
                    "Protection of Women from Domestic Violence Act, 2005 emergency relief orders."
                ]
            }
        ]
    }



# ================================
# POLICE MODULE (RBAC)
# ================================

class InvestigationUpdate(BaseModel):
    fir_number: str
    investigation_status: str
    remarks: Optional[str] = None
    officer_name: Optional[str] = None


class ChargeSheetUpload(BaseModel):
    fir_number: str
    charge_sheet_number: str
    charges: str
    accused_name: str
    date_filed: str


class ComplaintVerification(BaseModel):
    fir_number: str
    verified: bool
    verification_remarks: Optional[str] = None


@app.put("/police/investigation/update")
def update_investigation_status(
    data: InvestigationUpdate,
    current_user=Depends(require_role(["Police", "Admin"])),
    db: Session = Depends(get_db)
):
    """Police: Update FIR investigation status (Under Investigation, Charge Sheet Filed, Closed)"""
    fir = db.query(FIR).filter(FIR.fir_number == data.fir_number).first()

    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    fir.investigation_status = data.investigation_status
    db.commit()

    log_audit_event(
        db=db,
        action="POLICE_UPDATE_INVESTIGATION",
        resource="FIR",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Officer updated FIR {data.fir_number} investigation to: {data.investigation_status}"
    )

    # Twilio SMS notification to complainant
    if fir.complainant_phone:
        try:
            sms_msg = f"Legal AI Alert: Your FIR #{fir.fir_number} investigation status has been updated to '{data.investigation_status}'. - {data.officer_name or 'Police Station'}"
            send_sms(fir.complainant_phone, sms_msg)
        except Exception as e:
            print("Police SMS notification failed:", e)

    return {
        "message": "Investigation status updated successfully",
        "fir_number": fir.fir_number,
        "investigation_status": fir.investigation_status
    }


@app.post("/police/charge-sheet/file")
def file_charge_sheet(
    data: ChargeSheetUpload,
    current_user=Depends(require_role(["Police", "Admin"])),
    db: Session = Depends(get_db)
):
    """Police: File a charge sheet for an FIR, escalating it to court proceedings"""
    fir = db.query(FIR).filter(FIR.fir_number == data.fir_number).first()

    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    fir.investigation_status = "Charge Sheet Filed"
    fir.status = "Charge Sheet Submitted"
    db.commit()

    log_audit_event(
        db=db,
        action="POLICE_FILE_CHARGE_SHEET",
        resource="FIR",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Charge sheet {data.charge_sheet_number} filed for FIR {data.fir_number} against {data.accused_name}"
    )

    return {
        "message": "Charge sheet filed successfully. FIR escalated to court proceedings.",
        "fir_number": fir.fir_number,
        "charge_sheet_number": data.charge_sheet_number,
        "accused_name": data.accused_name,
        "date_filed": data.date_filed,
        "status": fir.investigation_status
    }


@app.post("/police/complaint/verify")
def verify_complaint(
    data: ComplaintVerification,
    current_user=Depends(require_role(["Police", "Admin"])),
    db: Session = Depends(get_db)
):
    """Police: Verify or flag a filed complaint/FIR"""
    fir = db.query(FIR).filter(FIR.fir_number == data.fir_number).first()

    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    fir.investigation_status = "Verified" if data.verified else "Flagged - Requires Review"
    db.commit()

    log_audit_event(
        db=db,
        action="POLICE_VERIFY_COMPLAINT",
        resource="FIR",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"FIR {data.fir_number} verification: {'VERIFIED' if data.verified else 'FLAGGED'}. Remarks: {data.verification_remarks}"
    )

    return {
        "message": f"FIR {data.fir_number} marked as {'Verified' if data.verified else 'Flagged'}",
        "fir_number": fir.fir_number,
        "investigation_status": fir.investigation_status
    }


@app.get("/police/dashboard")
def get_police_dashboard(
    current_user=Depends(require_role(["Police", "Admin"])),
    db: Session = Depends(get_db)
):
    """Police: Dashboard overview - FIRs, cases, investigation stats"""
    all_firs = db.query(FIR).all()
    all_cases = db.query(Case).all()

    return {
        "total_firs": len(all_firs),
        "total_cases": len(all_cases),
        "under_investigation": len([f for f in all_firs if f.investigation_status == "Under Investigation"]),
        "charge_sheet_filed": len([f for f in all_firs if f.investigation_status == "Charge Sheet Filed"]),
        "firs": [
            {
                "fir_number": f.fir_number,
                "police_station": f.police_station,
                "complaint_type": f.complaint_type,
                "date_registered": f.date_registered,
                "investigation_status": f.investigation_status or "Under Investigation",
                "status": f.status
            }
            for f in all_firs
        ],
        "recent_cases": [
            {
                "case_number": c.case_number,
                "case_title": c.case_title,
                "petitioner": c.petitioner,
                "status": c.status,
                "filing_date": c.filing_date
            }
            for c in all_cases
        ]
    }


# ================================
# COURT MANAGEMENT MODULE (RBAC)
# ================================

class HearingCreate(BaseModel):
    case_number: str
    hearing_date: str
    hearing_time: str
    court_room: Optional[str] = None
    judge_name: Optional[str] = None
    hearing_type: Optional[str] = "Regular Hearing"
    notes: Optional[str] = None


class JudgementUpload(BaseModel):
    case_number: str
    judgement_date: str
    judge_name: str
    verdict: str  # "Convicted", "Acquitted", "Dismissed", "Settled"
    judgement_summary: str
    next_steps: Optional[str] = None


class CaseClosure(BaseModel):
    case_number: str
    closure_reason: str
    final_status: str  # "Closed - Disposed", "Closed - Judgement Passed", "Closed - Withdrawn"


@app.post("/court/hearing/schedule")
def schedule_hearing(
    data: HearingCreate,
    current_user=Depends(require_role(["Judge", "Admin"])),
    db: Session = Depends(get_db)
):
    """Judge: Schedule a hearing date for a case"""
    case = db.query(Case).filter(Case.case_number == data.case_number).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Update next hearing date on the case
    case.next_hearing_date = data.hearing_date
    db.commit()

    log_audit_event(
        db=db,
        action="COURT_SCHEDULE_HEARING",
        resource="Case",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Hearing scheduled for Case {data.case_number} on {data.hearing_date} at {data.hearing_time}. Judge: {data.judge_name}"
    )

    return {
        "message": "Hearing scheduled successfully",
        "case_number": data.case_number,
        "hearing_date": data.hearing_date,
        "hearing_time": data.hearing_time,
        "court_room": data.court_room,
        "judge_name": data.judge_name or case.judge_name,
        "hearing_type": data.hearing_type
    }


@app.post("/court/judgement/upload")
def upload_judgement(
    data: JudgementUpload,
    current_user=Depends(require_role(["Judge", "Admin"])),
    db: Session = Depends(get_db)
):
    """Judge: Upload and record the final judgement for a case"""
    case = db.query(Case).filter(Case.case_number == data.case_number).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = f"Judgement Passed - {data.verdict}"
    db.commit()

    log_audit_event(
        db=db,
        action="COURT_UPLOAD_JUDGEMENT",
        resource="Case",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Judgement uploaded for Case {data.case_number}. Verdict: {data.verdict}. Judge: {data.judge_name}"
    )

    return {
        "message": "Judgement recorded successfully",
        "case_number": data.case_number,
        "verdict": data.verdict,
        "judgement_date": data.judgement_date,
        "judge_name": data.judge_name,
        "judgement_summary": data.judgement_summary,
        "next_steps": data.next_steps
    }


@app.put("/court/case/close")
def close_case(
    data: CaseClosure,
    current_user=Depends(require_role(["Judge", "Admin"])),
    db: Session = Depends(get_db)
):
    """Judge: Officially close a case"""
    case = db.query(Case).filter(Case.case_number == data.case_number).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = data.final_status
    db.commit()

    log_audit_event(
        db=db,
        action="COURT_CLOSE_CASE",
        resource="Case",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Case {data.case_number} officially closed. Reason: {data.closure_reason}. Final status: {data.final_status}"
    )

    return {
        "message": "Case closed successfully",
        "case_number": data.case_number,
        "final_status": data.final_status,
        "closure_reason": data.closure_reason
    }


@app.get("/court/dashboard")
def get_court_dashboard(
    current_user=Depends(require_role(["Judge", "Admin"])),
    db: Session = Depends(get_db)
):
    """Judge: Overview dashboard - active cases, upcoming hearings, recent verdicts"""
    all_cases = db.query(Case).all()

    active_cases = [c for c in all_cases if c.status not in ["Closed", "Closed - Disposed", "Closed - Judgement Passed", "Closed - Withdrawn"]]
    closed_cases = [c for c in all_cases if c.status in ["Closed", "Closed - Disposed", "Closed - Judgement Passed", "Closed - Withdrawn"]]
    judgement_cases = [c for c in all_cases if "Judgement" in (c.status or "")]

    return {
        "total_cases": len(all_cases),
        "active_cases": len(active_cases),
        "closed_cases": len(closed_cases),
        "judgements_passed": len(judgement_cases),
        "cases": [
            {
                "case_number": c.case_number,
                "case_title": c.case_title,
                "petitioner": c.petitioner,
                "respondent": c.respondent,
                "court_name": c.court_name,
                "judge_name": c.judge_name,
                "advocate_assigned": c.advocate_assigned,
                "next_hearing_date": c.next_hearing_date,
                "priority": c.priority,
                "status": c.status
            }
            for c in all_cases
        ]
    }


# ================================
# DOCUMENTS
# ================================

@app.post("/documents")
def add_document(data: DocumentCreate, db: Session = Depends(get_db)):

    new_document = Document(
        title=data.title,
        document_type=data.document_type,
        uploaded_by=data.uploaded_by,
        case_id=data.case_id,
        file_path=data.file_path
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    return {
        "message": "Document added successfully",
        "document": new_document
    }


@app.get("/documents")
def get_all_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).all()
    return documents


@app.get("/documents/{doc_id}")
def get_document(doc_id: int, db: Session = Depends(get_db)):

    document = db.query(Document).filter(
        Document.id == doc_id
    ).first()

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    return document


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):

    document = db.query(Document).filter(
        Document.id == doc_id
    ).first()

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(document)
    db.commit()

    return {
        "message": "Document deleted successfully"
    }
# ================================
# AUTH & SECURITY (RBAC & AUDIT LOGS)
# ================================

@app.get("/auth/roles")
def get_available_roles():
    return {
        "roles": VALID_ROLES,
        "descriptions": {
            "User": "Citizen / Petitioner / Respondent access to track cases & book advocates",
            "Police": "Police Station Officers access to register FIRs, cases & verify complaints",
            "Lawyer": "Legal Advocates access to accept/reject bookings & manage client cases",
            "Judge": "Judiciary officers to schedule hearings & upload judgements",
            "Admin": "Full system management, audit logs, analytics & security controls"
        }
    }


@app.post("/auth/register")
def register(data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == data.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    role_to_assign = data.role if data.role in VALID_ROLES else "User"

    new_user = User(
        full_name=data.full_name,
        email=data.email,
        password=hash_password(data.password),
        phone=data.phone,
        role=role_to_assign,
        police_station=data.police_station,
        bar_council_id=data.bar_council_id,
        court_id=data.court_id,
        is_verified="Verified"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_event(
        db=db,
        action="USER_REGISTER",
        resource="User",
        user_id=new_user.id,
        user_email=new_user.email,
        user_role=new_user.role,
        details=f"User registered with role {new_user.role}"
    )

    return {
        "message": "Registered Successfully",
        "user_id": new_user.id,
        "role": new_user.role
    }


@app.post("/auth/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if user is None:
        log_audit_event(
            db=db,
            action="LOGIN_FAILED",
            resource="Auth",
            details=f"Failed login attempt for email: {data.email}"
        )
        raise HTTPException(status_code=401, detail="Invalid Email")

    if not verify_password(data.password, user.password):
        log_audit_event(
            db=db,
            action="LOGIN_FAILED",
            resource="Auth",
            user_id=user.id,
            user_email=user.email,
            user_role=user.role,
            details="Invalid password attempt"
        )
        raise HTTPException(status_code=401, detail="Invalid Password")

    # Create JWT Token with complete identity claims
    token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        }
    )

    log_audit_event(
        db=db,
        action="LOGIN_SUCCESS",
        resource="Auth",
        user_id=user.id,
        user_email=user.email,
        user_role=user.role,
        details=f"User {user.email} logged in successfully with role {user.role}"
    )

    return {
        "message": "Login Successful",
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.full_name,
        "email": user.email,
        "role": user.role
    }


@app.get("/auth/me")
def get_current_user_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "police_station": user.police_station,
        "bar_council_id": user.bar_council_id,
        "court_id": user.court_id,
        "is_verified": user.is_verified,
        "created_at": user.created_at
    }


@app.get("/auth/profile/{user_id}")
def get_profile(
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only allow self profile access, or Admin
    if current_user.get("user_id") != user_id and current_user.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Unauthorized to view another user profile")

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "police_station": user.police_station,
        "bar_council_id": user.bar_council_id,
        "court_id": user.court_id
    }


@app.get("/auth/audit-logs")
def get_audit_logs(
    current_user=Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(200).all()
    return logs

# ================================
# HEALTH CHECK
# ================================

@app.get("/health")
def health(db: Session = Depends(get_db)):
    return {
        "status": "ok",
        "modules": {
            "fir": db.query(FIR).count(),
            "cases": db.query(Case).count(),
            "advocates": db.query(User).filter(User.role == "Lawyer").count(),
            "appointments": db.query(Appointment).count(),
            "documents": db.query(Document).count(),
            "users": db.query(User).count(),
            "contacts": db.query(Contact).count()
        }
    }
# ================================
# COURT SCHEDULE SERVICE
# ================================

class CourtSchedule(BaseModel):
    case_number: str
    court_name: str
    judge_name: str
    hearing_date: str
    hearing_time: str
    hearing_type: str  # e.g. Arguments, Judgment, Evidence
    notes: Optional[str] = None

court_schedules = [
    {
        "id": "1",
        "case_number": "HC2026-1001",
        "court_name": "Hyderabad High Court",
        "judge_name": "Justice Reddy",
        "hearing_date": "2026-07-15",
        "hearing_time": "10:30 AM",
        "hearing_type": "Arguments",
        "notes": "Both parties to submit written arguments"
    },
    {
        "id": "2",
        "case_number": "HC2026-1001",
        "court_name": "Hyderabad High Court",
        "judge_name": "Justice Reddy",
        "hearing_date": "2026-08-20",
        "hearing_time": "11:00 AM",
        "hearing_type": "Judgment",
        "notes": "Final judgment expected"
    }
]

@app.post("/court-schedule")
def add_court_schedule(
    data: CourtSchedule,
    current_user=Depends(get_current_user)
):
    schedule = {"id": str(uuid.uuid4()), **data.dict()}
    court_schedules.append(schedule)
    return {"message": "Court schedule added", "schedule": schedule}

@app.get("/court-schedule")
def get_court_schedules(
    case_number: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    if case_number:
        filtered = [s for s in court_schedules if s["case_number"] == case_number]
        if not filtered:
            raise HTTPException(status_code=404, detail="No schedules found for this case")
        return filtered
    return court_schedules

# GET ALL SCHEDULES OF A PARTICULAR CASE

@app.get("/court-schedule")
def get_case_schedule(
    case_number: str,
    current_user=Depends(get_current_user)
):

    schedules = []

    for schedule in court_schedules:

        if schedule["case_number"] == case_number:
            schedules.append(schedule)

    return schedules



# GET PARTICULAR SCHEDULE USING ID

@app.get("/court-schedule/{schedule_id}")
def get_schedule(
    schedule_id: str,
    current_user=Depends(get_current_user)
):

    for schedule in court_schedules:

        if schedule["id"] == schedule_id:
            return schedule

    raise HTTPException(
        status_code=404,
        detail="Schedule not found"
    )



# UPDATE PARTICULAR SCHEDULE

@app.put("/court-schedule/{schedule_id}")
def update_schedule(
    schedule_id: str,
    data: CourtSchedule,
    current_user=Depends(get_current_user)
):

    for schedule in court_schedules:

        if schedule["id"] == schedule_id:

            schedule.update(data.dict())

            return {
                "message": "Schedule updated",
                "schedule": schedule
            }

    raise HTTPException(
        status_code=404,
        detail="Schedule not found"
    )
@app.put("/court-schedule/{schedule_id}")
def update_schedule(
    schedule_id: str,
    data: CourtSchedule,
    current_user=Depends(get_current_user)
):
    for s in court_schedules:
        if s["id"] == schedule_id:
            s.update(data.dict())
            return {"message": "Schedule updated", "schedule": s}
    raise HTTPException(status_code=404, detail="Schedule not found")

@app.delete("/court-schedule/{schedule_id}")
def delete_schedule(
    schedule_id: str,
    current_user=Depends(get_current_user)
):
    for s in court_schedules:
        if s["id"] == schedule_id:
            court_schedules.remove(s)
            return {"message": "Schedule deleted"}
    raise HTTPException(status_code=404, detail="Schedule not found")
# ================================
# ANALYTICS
# ================================
@app.get("/analytics")
def get_analytics(
    current_user=Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):

    users = db.query(User).all()
    cases = db.query(Case).all()
    firs = db.query(FIR).all()
    docs = db.query(Document).all()
    appointments = db.query(Appointment).all()

    return {

        "users": {
            "total": len(users)
        },

        "advocates": {
            "total": len(
                [u for u in users if u.role == "Lawyer"]
            )
        },

        "cases": {
            "total": len(cases),

            "open": len(
                [c for c in cases
                 if c.status.lower() in
                 ["open", "pending", "in progress"]]
            ),

            "closed": len(
                [c for c in cases
                 if c.status.lower() == "closed"]
            ),

            "by_type": {
                c.case_type:
                sum(
                    1
                    for x in cases
                    if x.case_type == c.case_type
                )

                for c in cases
            }
        },

        "firs": {
            "total": len(firs),

            "pending": len(
                [f for f in firs
                 if f.status == "Pending"]
            ),

            "by_complaint": {
                f.complaint_type:
                sum(
                    1
                    for x in firs
                    if x.complaint_type ==
                    f.complaint_type
                )

                for f in firs
            }
        },

        "documents": {
            "total": len(docs)
        },

        "appointments": {
            "total": len(appointments)
        }

    }
# ================================
# SEARCH SERVICE
# ================================

@app.get("/search")
def global_search(
    q: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")

    query = q.lower()

    results = {
        "cases": [],
        "firs": [],
        "advocates": [],
        "documents": []
    }

    # CASES
    all_cases = db.query(Case).all()

    for case in all_cases:
        if (
    query in (case.case_number or "").lower()
    or query in (case.case_title or "").lower()
    or query in (case.petitioner or "").lower()
    or query in (case.respondent or "").lower()
    or query in (case.case_type or "").lower()
        ):
            results["cases"].append({
                "case_number": case.case_number,
                "case_title": case.case_title,
                "petitioner": case.petitioner,
                "respondent": case.respondent,
                "status": case.status
            })

    # FIRS
    all_firs = db.query(FIR).all()

    for fir in all_firs:
        if (
            query in (fir.fir_number or "").lower()
            or query in (fir.complaint_type or "").lower()
            or query in (fir.police_station or "").lower()
        ):
            results["firs"].append({
                "fir_number": fir.fir_number,
                "complaint_type": fir.complaint_type,
                "police_station": fir.police_station,
                "status": fir.status
            })

    # ADVOCATES
    advocates = db.query(User).filter(User.role == "Lawyer").all()

    for adv in advocates:
        if query in (adv.full_name or "").lower():
            results["advocates"].append({
                "full_name": adv.full_name,
                "email": adv.email,
                "phone": adv.phone
            })

    # DOCUMENTS
    documents = db.query(Document).all()

    for doc in documents:
        if (
            query in (doc.title or "").lower()
            or query in (doc.document_type or "").lower()
        ):
            results["documents"].append({
                "title": doc.title,
                "document_type": doc.document_type,
                "uploaded_by": doc.uploaded_by
            })

    total = sum(len(v) for v in results.values())

    return {
        "query": q,
        "total_results": total,
        "results": results
    }

# ================================
# NOTIFICATION SERVICE
# ================================

@app.post("/notify")
def send_notification(
    data: NotificationCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    status = "Queued"

    # If it's an SMS notification, actually send it via Twilio
    if data.notification_type.lower() == "sms" and data.recipient_phone:
        success, info = send_sms(data.recipient_phone, data.message)
        if success:
            status = "Sent"
        else:
            print("SMS FAILED - full error:", info)  # full detail visible in terminal only
            status = "Failed"

    new_notification = Notification(
        recipient_name=data.recipient_name,
        recipient_email=data.recipient_email,
        recipient_phone=data.recipient_phone,
        notification_type=data.notification_type,
        subject=data.subject,
        message=data.message,
        status=status
    )

    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)

    return {
        "message": "Notification processed",
        "notification": new_notification
    }

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).all()


# ================================
# PAYMENT SERVICE
# ================================

class PaymentCreate(BaseModel):
    user_name: str
    user_email: str
    amount: float
    purpose: str
    advocate_name: Optional[str] = None


class PaymentVerify(BaseModel):
    payment_id: str
    status: str


@app.post("/payment/create")
def create_payment(data: PaymentCreate, db: Session = Depends(get_db)):

    payment = Payment(
        payment_id="PAY-" + str(uuid.uuid4())[:8],
        user_name=data.user_name,
        user_email=data.user_email,
        amount=str(data.amount),
        purpose=data.purpose,
        advocate_name=data.advocate_name,
        status="Pending",
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "message": "Payment created successfully",
        "payment": payment,
    }


@app.post("/payment/verify")
def verify_payment(data: PaymentVerify, db: Session = Depends(get_db)):

    payment = db.query(Payment).filter(
        Payment.payment_id == data.payment_id
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.status = data.status

    db.commit()
    db.refresh(payment)

    return {
        "message": "Payment updated successfully",
        "payment": payment,
    }


@app.get("/payments")
def get_payments(db: Session = Depends(get_db)):
    return db.query(Payment).all()
# ================================
# CONTACT
# ================================

class ContactCreate(BaseModel):
    name: str
    email: str
    message: str


@app.post("/contact")
def send_message(data: ContactCreate, db: Session = Depends(get_db)):

    new_message = Contact(
        name=data.name,
        email=data.email,
        message=data.message
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return {
        "message": "Message sent successfully",
        "contact": new_message
    }


@app.get("/contact")
def get_messages(db: Session = Depends(get_db)):
    return db.query(Contact).all()


# ================================
# SUPER ADMIN MODULE (RBAC)
# ================================

class RoleUpdate(BaseModel):
    user_id: int
    new_role: str


class UserVerification(BaseModel):
    user_id: int
    is_verified: bool
    verification_notes: Optional[str] = None


@app.get("/admin/users")
def get_all_users(
    current_user=Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    """Admin: Get all registered users with role info"""
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "police_station": getattr(u, "police_station", None),
            "bar_council_id": getattr(u, "bar_council_id", None),
            "court_id": getattr(u, "court_id", None),
            "is_active": getattr(u, "is_active", True),
        }
        for u in users
    ]


@app.put("/admin/user/role")
def update_user_role(
    data: RoleUpdate,
    current_user=Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    """Admin: Promote/demote a user's role"""
    if data.new_role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {VALID_ROLES}")

    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = user.role
    user.role = data.new_role
    db.commit()

    log_audit_event(
        db=db,
        action="ADMIN_ROLE_UPDATE",
        resource="User",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Updated User #{data.user_id} role from '{old_role}' to '{data.new_role}'"
    )

    return {
        "message": f"User #{data.user_id} role updated to '{data.new_role}'",
        "user_id": data.user_id,
        "old_role": old_role,
        "new_role": data.new_role
    }


@app.delete("/admin/user/{user_id}")
def delete_user(
    user_id: int,
    current_user=Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    """Admin: Remove a user from the system"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.get("user_id"):
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    db.delete(user)
    db.commit()

    log_audit_event(
        db=db,
        action="ADMIN_DELETE_USER",
        resource="User",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"Deleted User #{user_id} ({user.email})"
    )

    return {"message": f"User #{user_id} deleted successfully"}


@app.get("/admin/audit-logs")
def get_all_audit_logs(
    limit: int = 100,
    current_user=Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    """Admin: View full system audit logs"""
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "user_email": log.user_email,
            "user_role": log.user_role,
            "action": log.action,
            "resource": log.resource,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": str(log.timestamp) if hasattr(log, "timestamp") else None
        }
        for log in logs
    ]


@app.get("/admin/analytics")
def get_admin_analytics(
    current_user=Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    """Admin: Full system analytics and health metrics"""
    users = db.query(User).all()
    cases = db.query(Case).all()
    firs = db.query(FIR).all()
    docs = db.query(Document).all()
    appointments = db.query(Appointment).all()
    audit_logs = db.query(AuditLog).all()

    role_counts = {}
    for u in users:
        role = u.role or "User"
        role_counts[role] = role_counts.get(role, 0) + 1

    action_counts = {}
    for log in audit_logs:
        action_counts[log.action] = action_counts.get(log.action, 0) + 1

    return {
        "users": {
            "total": len(users),
            "by_role": role_counts,
        },
        "cases": {
            "total": len(cases),
            "open": len([c for c in cases if c.status and c.status.lower() in ["open", "pending", "hearing"]]),
            "closed": len([c for c in cases if c.status and "closed" in c.status.lower()]),
            "with_judgement": len([c for c in cases if c.status and "judgement" in c.status.lower()]),
        },
        "firs": {
            "total": len(firs),
            "under_investigation": len([f for f in firs if f.investigation_status == "Under Investigation"]),
            "charge_sheet_filed": len([f for f in firs if f.investigation_status == "Charge Sheet Filed"]),
        },
        "appointments": {
            "total": len(appointments),
            "pending": len([a for a in appointments if a.status == "Pending"]),
            "accepted": len([a for a in appointments if a.status == "Accepted"]),
            "rejected": len([a for a in appointments if a.status == "Rejected"]),
        },
        "documents": {"total": len(docs)},
        "audit": {
            "total_events": len(audit_logs),
            "by_action": action_counts
        }
    }


@app.get("/admin/security/suspicious")
def get_suspicious_activity(
    current_user=Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    """Admin: Detect unusual or suspicious audit events"""
    suspicious_actions = [
        "DELETE_FIR", "ADMIN_DELETE_USER",
        "ADMIN_ROLE_UPDATE", "AUTH_FAILED"
    ]

    logs = db.query(AuditLog).filter(
        AuditLog.action.in_(suspicious_actions)
    ).order_by(AuditLog.id.desc()).limit(50).all()

    return {
        "alert_count": len(logs),
        "suspicious_events": [
            {
                "id": log.id,
                "action": log.action,
                "user_email": log.user_email,
                "user_role": log.user_role,
                "resource": log.resource,
                "details": log.details,
                "timestamp": str(log.timestamp) if hasattr(log, "timestamp") else None
            }
            for log in logs
        ]
    }
