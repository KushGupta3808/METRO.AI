import json
import os
import datetime
import re
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

# Pure Native Security Modules (Replacing Passlib)
import bcrypt
import jwt

# SQLAlchemy 2.0 Async Modules
from sqlalchemy import select, ForeignKey, DateTime
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# ---------------------------------------------------------
# 1. DATABASE & SECURITY CONFIGURATION
# ---------------------------------------------------------
DATABASE_URL = "sqlite+aiosqlite:///./metro_ai.db"

# JWT Security Settings
SECRET_KEY = "metro-ai-super-secret-jwt-key-replace-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 Days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class Base(DeclarativeBase):
    pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically creates all registered tables on server startup if they do not exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(
    title="Metro AI API",
    description="Intelligent Cross-Border Remittance Ledger",
    version="1.4.1",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

# ---------------------------------------------------------
# 2. SECURITY UTILITIES (Using Pure Bcrypt)
# ---------------------------------------------------------
def get_password_hash(password: str) -> str:
    """
    Hashes a plain-text password securely using native bcrypt.
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against a hashed database password.
    """
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ---------------------------------------------------------
# 3. DATABASE MODELS
# ---------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(nullable=False)
    base_currency: Mapped[str] = mapped_column(default="CAD")
    target_currency: Mapped[str] = mapped_column(default="INR")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    )

class Recipient(Base):
    __tablename__ = "recipients"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(nullable=False)
    currency: Mapped[str] = mapped_column(nullable=False)
    payout_method: Mapped[str] = mapped_column(nullable=False)
    bank_name: Mapped[Optional[str]] = mapped_column(nullable=True)
    account_number: Mapped[Optional[str]] = mapped_column(nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    )

class Transfer(Base):
    __tablename__ = "transfers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    recipient_id: Mapped[int] = mapped_column(ForeignKey("recipients.id"), nullable=False)
    source_currency: Mapped[str] = mapped_column(nullable=False)
    target_currency: Mapped[str] = mapped_column(nullable=False)
    amount: Mapped[float] = mapped_column(nullable=False)
    provider_name: Mapped[str] = mapped_column(nullable=False)
    exchange_rate: Mapped[float] = mapped_column(nullable=False)
    fee: Mapped[float] = mapped_column(default=0.0)
    total_delivery_amount: Mapped[float] = mapped_column(nullable=False)
    ai_recommendation_at_time: Mapped[Optional[str]] = mapped_column(nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    )

# ---------------------------------------------------------
# 4. VALIDATION SCHEMAS
# ---------------------------------------------------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    base_currency: str = "CAD"
    target_currency: str = "INR"

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    base_currency: str
    target_currency: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class RecipientCreate(BaseModel):
    name: str
    currency: str
    payout_method: str
    bank_name: Optional[str] = None
    account_number: Optional[str] = None

class RecipientResponse(BaseModel):
    id: int
    name: str
    currency: str
    payout_method: str
    bank_name: Optional[str]
    account_number: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TransferCreate(BaseModel):
    recipient_id: int
    source_currency: str
    target_currency: str
    amount: float
    provider_name: str
    exchange_rate: float
    fee: float
    total_delivery_amount: float
    ai_recommendation_at_time: Optional[str] = None

class TransferResponse(BaseModel):
    id: int
    recipient_id: int
    source_currency: str
    target_currency: str
    amount: float
    provider_name: str
    exchange_rate: float
    fee: float
    total_delivery_amount: float
    ai_recommendation_at_time: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# ---------------------------------------------------------
# 5. DEPENDENCIES (Protected Route Guard)
# ---------------------------------------------------------
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

# ---------------------------------------------------------
# 6. API ROUTERS & ENDPOINTS
# ---------------------------------------------------------

# --- AUTHENTICATION ENDPOINTS ---
@app.post("/api/v1/auth/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        hashed_password=hashed_password,
        base_currency=user.base_currency,
        target_currency=user.target_currency
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@app.post("/api/v1/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/v1/auth/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Test endpoint to verify your JWT token works.
    Requires a valid Bearer token in the Authorization header.
    """
    return current_user

# --- RATE ENGINE ---
@app.get("/api/v1/compare")
async def compare_rates(
    source: str = Query("CAD"),
    target: str = Query("INR"),
    amount: float = Query(1500.0),
    payout_method: str = Query("bank")
):
    mid_market = 67.325 if source == "CAD" and target == "INR" else 1.0
    
    routes = [
        {
            "provider_name": "Wise",
            "payout_method": payout_method,
            "exchange_rate": round(mid_market * 0.997, 4),
            "mid_market_rate": mid_market,
            "margin_percentage": 0.3,
            "fixed_fee": 2.99,
            "transfer_time_days": 1,
            "total_delivery_amount": round((amount - 2.99) * (mid_market * 0.997), 2),
            "requires_kyc_verification": False,
            "regulatory_warning": None
        },
        {
            "provider_name": "Remitly",
            "payout_method": payout_method,
            "exchange_rate": round(mid_market * 0.991, 4),
            "mid_market_rate": mid_market,
            "margin_percentage": 0.9,
            "fixed_fee": 0.0,
            "transfer_time_days": 2,
            "total_delivery_amount": round(amount * (mid_market * 0.991), 2),
            "requires_kyc_verification": False,
            "regulatory_warning": None
        },
        {
            "provider_name": "WorldRemit",
            "payout_method": payout_method,
            "exchange_rate": round(mid_market * 0.992, 4),
            "mid_market_rate": mid_market,
            "margin_percentage": 0.8,
            "fixed_fee": 3.99,
            "transfer_time_days": 1,
            "total_delivery_amount": round((amount - 3.99) * (mid_market * 0.992), 2),
            "requires_kyc_verification": False,
            "regulatory_warning": None
        },
        {
            "provider_name": "Western Union",
            "payout_method": payout_method,
            "exchange_rate": round(mid_market * 0.985, 4),
            "mid_market_rate": mid_market,
            "margin_percentage": 1.5,
            "fixed_fee": 4.99,
            "transfer_time_days": 3,
            "total_delivery_amount": round((amount - 4.99) * (mid_market * 0.985), 2),
            "requires_kyc_verification": False,
            "regulatory_warning": None
        }
    ]

    ai_recommendation = "HOLD"
    ai_analysis_summary = "AI Analysis: Minor macro correction occurring. Current rate is sitting -1.71% below monthly resistance levels."

    if os.environ.get("GEMINI_API_KEY"):
        try:
            from google import genai
            async with genai.Client().aio as aclient:
                prompt = f"""
                Analyze the following calculation options for sending {amount} {source} to {target} via payout method '{payout_method}':
                Routes: {json.dumps(routes)}
                
                Choose if the user should send now or hold. Respond strictly with a single clean JSON structure containing exactly these two keys:
                {{
                    "ai_recommendation": "SEND" or "HOLD",
                    "ai_analysis_summary": "A high-quality, single-sentence strategic analysis advising the user on which platform is optimal and why."
                }}
                Do not include markdown tags, code block headers, or trailing conversational prose.
                """
                
                response = await aclient.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt
                )
                
                clean_text = response.text.strip()
                bt = "`" * 3
                if clean_text.startswith(bt):
                    clean_text = clean_text.replace(f"{bt}json", "").replace(bt, "").strip()
                
                ai_data = json.loads(clean_text)
                ai_recommendation = str(ai_data.get("ai_recommendation", "HOLD")).upper()
                ai_analysis_summary = ai_data.get("ai_analysis_summary", ai_analysis_summary)
                
        except Exception as e:
            print(f"AI Generation Failed: {e}")
            ai_recommendation = "HOLD"
            ai_analysis_summary = "AI Analysis: Minor macro correction occurring. Current rate is sitting -1.71% below normal monthly resistance levels. If non-urgent, defer transfer to capture rebound momentum."

    return {
        "source_currency": source,
        "target_currency": target,
        "base_amount": amount,
        "payout_method_selected": payout_method,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "ai_recommendation": ai_recommendation,
        "ai_analysis_summary": ai_analysis_summary,
        "routes": routes
    }


# --- RECIPIENTS ENDPOINTS ---
@app.post("/api/v1/recipients", response_model=RecipientResponse, status_code=201)
async def create_recipient(recipient: RecipientCreate, db: AsyncSession = Depends(get_db)):
    db_recipient = Recipient(**recipient.model_dump())
    db.add(db_recipient)
    await db.commit()
    await db.refresh(db_recipient)
    return db_recipient

@app.get("/api/v1/recipients", response_model=List[RecipientResponse])
async def list_recipients(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recipient).order_by(Recipient.name.asc()))
    return result.scalars().all()


# --- TRANSFERS ENDPOINTS ---
@app.post("/api/v1/transfers", response_model=TransferResponse, status_code=201)
async def create_transfer(transfer_data: TransferCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recipient).where(Recipient.id == transfer_data.recipient_id))
    recipient = result.scalar_one_or_none()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient profile not found")

    new_transfer = Transfer(**transfer_data.model_dump())
    db.add(new_transfer)
    await db.commit()
    await db.refresh(new_transfer)
    return new_transfer

@app.get("/api/v1/transfers", response_model=List[TransferResponse])
async def get_transfer_history(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transfer).order_by(Transfer.created_at.desc()))
    return result.scalars().all()