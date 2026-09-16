from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


# ==================================
# AUDIT LOGS
# ==================================
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(100), nullable=True)
    user_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


# ==================================
# USERS
# ==================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone = Column(String(20))
    role = Column(String(50), default="User")  # Roles: User, Police, Advocate, Court Management, Super Admin
    police_station = Column(String(100), nullable=True)
    bar_council_id = Column(String(100), nullable=True)
    court_id = Column(String(100), nullable=True)
    is_verified = Column(String(20), default="Verified")
    created_at = Column(DateTime, default=datetime.utcnow)


# ==================================
# APPOINTMENTS
# ==================================
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    name = Column(String(100))
    phone = Column(String(20))
    advocate_id = Column(Integer, nullable=True)
    advocate_name = Column(String(100))
    appointment_date = Column(String(50))
    time_slot = Column(String(50))
    status = Column(String(30), default="Pending")  # Pending, Accepted, Rejected, Completed


# ==================================
# FIRS
# ==================================
class FIR(Base):
    __tablename__ = "firs"

    id = Column(Integer, primary_key=True, index=True)
    fir_number = Column(String(50), unique=True, nullable=False)
    complainant_id = Column(Integer, nullable=True)
    complainant_name = Column(String(100), nullable=True)
    complainant_phone = Column(String(20), nullable=True)
    police_station = Column(String(100))
    complaint_type = Column(String(100))
    date_registered = Column(String(50))
    investigation_status = Column(String(100), default="Under Investigation")
    status = Column(String(50), default="Registered")  # Registered, In Progress, Closed


# ==================================
# CASES
# ==================================
class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, nullable=False)
    case_title = Column(String(200))
    petitioner_id = Column(Integer, nullable=True)
    petitioner = Column(String(100))
    respondent_id = Column(Integer, nullable=True)
    respondent = Column(String(100))
    court_name = Column(String(100))
    judge_name = Column(String(100))
    advocate_id = Column(Integer, nullable=True)
    advocate_assigned = Column(String(100))
    case_type = Column(String(50))
    filing_date = Column(String(50))
    next_hearing_date = Column(String(50))
    priority = Column(String(30))
    status = Column(String(30), default="Open")  # Open, Pending, In Hearing, Judgement Reserved, Closed


# ==================================
# HEARINGS
# ==================================
class Hearing(Base):
    __tablename__ = "hearings"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), nullable=False)
    court_name = Column(String(100))
    judge_name = Column(String(100))
    hearing_date = Column(String(50))
    hearing_time = Column(String(50))
    hearing_type = Column(String(100))  # Arguments, Evidence, Judgement, Preliminary
    notes = Column(Text, nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==================================
# LEGAL DOCUMENTS
# ==================================
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    document_type = Column(String(100))
    uploaded_by = Column(String(100))
    user_id = Column(Integer, nullable=True)
    case_id = Column(String(100))
    file_path = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)


# ==================================
# CONTACT
# ==================================
class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==================================
# NOTIFICATIONS
# ==================================
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    recipient_name = Column(String(100))
    recipient_email = Column(String(100))
    recipient_phone = Column(String(20))
    notification_type = Column(String(20))
    subject = Column(String(200))
    message = Column(String(500))
    status = Column(String(30), default="Queued")
    created_at = Column(DateTime, default=datetime.utcnow)






# ==============================
# AI CHAT HISTORY
# ==============================
class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    question = Column(Text)
    answer = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)