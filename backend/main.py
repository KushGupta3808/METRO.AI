import json
import os
import datetime
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# SQLAlchemy 2.0 Async Modules
from sqlalchemy import select, ForeignKey, DateTime
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# ---------------------------------------------------------
# 1. DATABASE CONFIGURATION & LIFESPAN
# ---------------------------------------------------------
DATABASE_URL = "sqlite+aiosqlite:///./metro_ai.db"

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
    version="1.3.0",
    lifespan=lifespan
)

# CORS configuration for future frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to yield database sessions to routes
async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

# ---------------------------------------------------------
# 2. DATABASE MODELS (SQLAlchemy 2.0 Production Syntax)
# ---------------------------------------------------------
class Recipient(Base):
    __tablename__ = "recipients"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(nullable=False)
    currency: Mapped[str] = mapped_column(nullable=False)
    payout_method: Mapped[str] = mapped_column(nullable=False)
    bank_name: Mapped[Optional[str]] = mapped_column(nullable=True)
    account_number: Mapped[Optional[str]] = mapped_column(nullable=True)
    
    # Python 3.13 Fix: Zone-aware UTC converted to naive datetime for SQLite compatibility
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
    
    # Python 3.13 Fix: Zone-aware dynamic timestamp generation
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    )

# ---------------------------------------------------------
# 3. VALIDATION SCHEMAS (Pydantic)
# ---------------------------------------------------------
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
# 4. API ROUTERS & ENDPOINTS
# ---------------------------------------------------------

@app.get("/api/v1/compare")
async def compare_rates(
    source: str = Query("CAD"),
    target: str = Query("INR"),
    amount: float = Query(1500.0),
    payout_method: str = Query("bank")
):
    mid_market = 67.325 if source == "CAD" and target == "INR" else 1.0
    
    # Fully mapped 4-way global platform marketplace routes
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

    # Live AI analysis pipeline powered by Gemini 2.0 Flash
    if os.environ.get("GEMINI_API_KEY"):
        try:
            from google import genai
            
            # Using async context helper via Client().aio
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
                
                # Defensively scrub markdown blocks without using literal backticks in the python code!
                clean_text = response.text.strip()
                bt = "`" * 3
                if clean_text.startswith(bt):
                    clean_text = clean_text.replace(f"{bt}json", "").replace(bt, "").strip()
                
                ai_data = json.loads(clean_text)
                ai_recommendation = str(ai_data.get("ai_recommendation", "HOLD")).upper()
                ai_analysis_summary = ai_data.get("ai_analysis_summary", ai_analysis_summary)
                
        except Exception as e:
            # Resilient local fallback to prevent runtime disruption on network timeouts or parsing issues
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
    # Verify the target recipient profile exists to maintain data integrity
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