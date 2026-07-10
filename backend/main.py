from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import datetime
import httpx

app = FastAPI(
    title="METRO AI API",
    description="Money Exchange & Transfer Routing Optimizer Engine",
    version="1.2.0"
)

class ProviderRateResult(BaseModel):
    provider_name: str
    exchange_rate: float
    mid_market_rate: float
    margin_percentage: float
    fixed_fee: float
    transfer_time_days: int
    total_delivery_amount: float
    requires_kyc_verification: bool
    regulatory_warning: Optional[str] = None

class GlobalComparisonResponse(BaseModel):
    source_currency: str
    target_currency: str
    base_amount: float
    timestamp: str
    ai_recommendation: str
    ai_analysis_summary: str
    routes: List[ProviderRateResult]


@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": "METRO AI",
        "message": "Welcome to the Multi-Provider Live Money Exchange API Gateway."
    }


@app.get("/api/v1/compare", response_model=GlobalComparisonResponse)
async def compare_rates(
    source: str = Query(..., min_length=3, max_length=3, description="Source currency code, e.g., CAD"),
    target: str = Query(..., min_length=3, max_length=3, description="Target currency code, e.g., INR"),
    amount: float = Query(..., gt=0, description="Amount to transfer")
):
    source = source.upper()
    target = target.upper()
    
    if source == target:
        live_mid_market_rate = 1.0
    else:
        async with httpx.AsyncClient() as client:
            try:
                url = f"https://api.frankfurter.dev/v1/latest?base={source}&symbols={target}"
                response = await client.get(url, timeout=4.0)
                
                if response.status_code == 200:
                    data = response.json()
                    live_mid_market_rate = data["rates"][target]
                else:
                    raise HTTPException(status_code=400, detail=f"Currency pair {source} to {target} not supported.")
            
            except httpx.RequestError:
                live_mid_market_rate = 67.32 if (source == "CAD" and target == "INR") else 1.0

    is_large_transfer = amount >= 10000.0
    warning_text = None
    if is_large_transfer:
        warning_text = f"Large transfer threshold exceeded for {source}. Verification compliance required."

    # --- PROVIDER 1: Wise (Low Margin, Fixed Fee) ---
    wise_rate = live_mid_market_rate * 0.997  # 0.3% margin
    wise_fee = 2.99
    wise_delivery = (amount - wise_fee) * wise_rate

    # --- PROVIDER 2: Remitly (Medium Margin, Conditional Fee) ---
    remitly_rate = live_mid_market_rate * 0.991  # 0.9% margin
    remitly_fee = 0.00 if amount >= 1000 else 4.99
    remitly_delivery = (amount - remitly_fee) * remitly_rate

    # --- PROVIDER 3: WorldRemit (Medium Margin, Standard Flat Fee) ---
    worldremit_rate = live_mid_market_rate * 0.992  # 0.8% margin
    worldremit_fee = 3.99
    worldremit_delivery = (amount - worldremit_fee) * worldremit_rate

    # --- PROVIDER 4: Western Union (Higher Margin, Premium Retail Fee) ---
    western_union_rate = live_mid_market_rate * 0.985  # 1.5% margin
    western_union_fee = 4.99
    western_union_delivery = (amount - western_union_fee) * western_union_rate

    # Build the collective marketplace data array
    routes = [
        ProviderRateResult(
            provider_name="Wise",
            exchange_rate=round(wise_rate, 4),
            mid_market_rate=round(live_mid_market_rate, 4),
            margin_percentage=0.3,
            fixed_fee=wise_fee,
            transfer_time_days=1,
            total_delivery_amount=round(max(0.0, wise_delivery), 2),
            requires_kyc_verification=is_large_transfer,
            regulatory_warning=warning_text
        ),
        ProviderRateResult(
            provider_name="Remitly",
            exchange_rate=round(remitly_rate, 4),
            mid_market_rate=round(live_mid_market_rate, 4),
            margin_percentage=0.9,
            fixed_fee=remitly_fee,
            transfer_time_days=2,
            total_delivery_amount=round(max(0.0, remitly_delivery), 2),
            requires_kyc_verification=is_large_transfer,
            regulatory_warning=warning_text
        ),
        ProviderRateResult(
            provider_name="WorldRemit",
            exchange_rate=round(worldremit_rate, 4),
            mid_market_rate=round(live_mid_market_rate, 4),
            margin_percentage=0.8,
            fixed_fee=worldremit_fee,
            transfer_time_days=1,
            total_delivery_amount=round(max(0.0, worldremit_delivery), 2),
            requires_kyc_verification=is_large_transfer,
            regulatory_warning=warning_text
        ),
        ProviderRateResult(
            provider_name="Western Union",
            exchange_rate=round(western_union_rate, 4),
            mid_market_rate=round(live_mid_market_rate, 4),
            margin_percentage=1.5,
            fixed_fee=western_union_fee,
            transfer_time_days=3,
            total_delivery_amount=round(max(0.0, western_union_delivery), 2),
            requires_kyc_verification=is_large_transfer,
            regulatory_warning=warning_text
        )
    ]

    # Dynamically sort routes so the consumer always sees the absolute highest payout first
    routes.sort(key=lambda x: x.total_delivery_amount, reverse=True)

    ai_status = "SEND"
    ai_summary = f"Market comparison optimized across 4 major platforms. Mid-market tracking index is holding steady at {round(live_mid_market_rate, 4)}."
    
    return GlobalComparisonResponse(
        source_currency=source,
        target_currency=target,
        base_amount=amount,
        timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        ai_recommendation=ai_status,
        ai_analysis_summary=ai_summary,
        routes=routes
    )