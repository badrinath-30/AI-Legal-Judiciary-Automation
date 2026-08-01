from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str
    phone: str
    role: Optional[str] = "User"  # User, Police, Advocate, Court Management, Super Admin
    police_station: Optional[str] = None
    bar_council_id: Optional[str] = None
    court_id: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    role: str
    police_station: Optional[str] = None
    bar_council_id: Optional[str] = None
    court_id: Optional[str] = None

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    user_role: Optional[str]
    action: str
    resource: str
    details: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

class DocumentCreate(BaseModel):
    title: str
    document_type: str
    uploaded_by: str
    case_id: Optional[str] = None
    file_path: str


class DocumentResponse(BaseModel):
    id: int
    title: str
    document_type: str
    uploaded_by: str
    case_id: Optional[str]
    file_path: str

    class Config:
        from_attributes = True

class ContactCreate(BaseModel):
    name: str
    email: str
    message: str

    class Config:
        from_attributes = True
class NotificationCreate(BaseModel):
    recipient_name: str
    recipient_email: str
    recipient_phone: Optional[str] = None
    notification_type: str
    subject: str
    message: str

class NotificationResponse(NotificationCreate):
    id: int
    status: str

    class Config:
        from_attributes = True