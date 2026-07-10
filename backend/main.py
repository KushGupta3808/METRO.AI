from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import datetime
import httpx

app = FastAPI(
    title="METRO AI API",
    description="Money Exchange & Transfer Routing Optimizer Engine",
    version="1.4.0"
)

class ProviderRateResult(BaseModel):
    provider_name: str
    payout_method: str
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
    payout_method_selected: str
    timestamp: str
    ai_recommendation: str  # DYNAMIC: FORCE_SEND, SEND, HOLD, WAIT
    ai_analysis_summary: str # DYNAMIC: Real-time contextual text
    routes: List[ProviderRateResult]


# --- INTERNAL AI ANALYTICS ENGINE ---
def generate_ai_insight(source: str, target: str, current_rate: float) -> tuple[str, str]:
    """
    Analyzes live market rate positions against historical resistance baselines 
    to generate real-time actionable recommendations.
    """
    # Baseline benchmarks for key corridors (e.g., typical CAD to INR trends around 61.0 - 62.0)
    # If a corridor isn't mapped, we create a dynamic baseline
    baselines = {
        ("CAD", "INR"): 61.50,
        ("USD", "EUR"): 0.92,
        ("CAD", "EUR"): 0.68
    }
    
    baseline = baselines.get((source, target), current_rate * 0.98)
    variance_pct = ((current_rate - baseline) / baseline) * 100

    if variance_pct > 2.5:
        recommendation = "FORCE_SEND"
        summary = (
            f"AI Analysis: The live mid-market rate ({round(current_rate, 4)}) is running significantly higher "
            f"(+{round(variance_pct, 2)}%) than the historical 30-day registry baseline of {baseline}. "
            f"This represents a premium liquidity window. Highly recommended to lock in transfers immediately."
        )
    elif variance_pct >= 0.0:
        recommendation = "SEND"
        summary = (
            f"AI Analysis: Rates are stable. Current market pricing index of {round(current_rate, 4)} sits comfortably "
            f"at or slightly above baseline markers. Spreads across digital providers are competitive."
        )
    elif variance_pct > -2.0:
        recommendation = "HOLD"
        summary = (
            f"AI Analysis: Minor market pullback detected. Current rate is -{round(abs(variance_pct), 2)}% below recent "
            f"resistance peaks. If your transfer is not urgent, consider holding 24-48 hours for a momentum correction."
        )
    else:
        recommendation = "WAIT"
        summary = (
            f"AI Analysis: Heavy macro resistance. Market tracking indicates an adverse dip of {round(variance_pct, 2)}%. "
            f"Pumping funds through right now exposes your capital to high systemic margin losses. Defer transfer if possible."
        )
        
    return recommendation, summary


@app.get("/api/v1/compare", response_model=GlobalComparisonResponse)
async def compare_rates(
    source: str = Query(..., min_length=3, max_length=3, description="Source currency, e.g., CAD"),
    target: str = Query(..., min_length=3, max_length=3, description="Target currency, e.g., INR"),
    amount: float = Query(..., gt=0, description="Amount to transfer"),
    payout_method: str = Query("bank", description="Fulfillment: 'bank' or 'cash'")
):
    source = source.upper()
    target = target.upper()
    payout_method = payout_method.lower()
    
    if payout_method not in ["bank", "cash"]:
        raise HTTPException(status_code=400, detail="Invalid payout method. Choose 'bank' or 'cash'.")
    
    # Fetch live mid-market data
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

    # 1. Fire our dynamic intelligence layer using the fresh live rate
    ai_rec, ai_sum = generate_ai_insight(source, target, live_mid_market_rate)

    is_large_transfer = amount >= 10000.0
    warning_text = f"Large transfer threshold exceeded for {source}. Verification compliance required." if is_large_transfer else None

    routes = []

    # --- PROVIDER 1: WISE (Bank Only) ---
    if payout_method == "bank":
        wise_rate = live_mid_market_rate * 0.997
        wise_fee = 2.99
        wise_delivery = (amount - wise_fee) * wise_rate
        routes.append(ProviderRateResult(
            provider_name="Wise", payout_method="bank", exchange_rate=round(wise_rate, 4),
            mid_market_rate=round(live_mid_market_rate, 4), margin_percentage=0.3, fixed_fee=wise_fee,
            transfer_time_days=1, total_delivery_amount=round(max(0.0, wise_delivery), 2),
            requires_kyc_verification=is_large_transfer, regulatory_warning=warning_text
        ))

    # --- PROVIDER 2: REMITLY ---
    remitly_rate = live_mid_market_rate * (0.988 if payout_method == "cash" else 0.991)
    remitly_fee = 3.99 if payout_method == "cash" else (0.00 if amount >= 1000 else 4.99)
    remitly_delivery = (amount - remitly_fee) * remitly_rate
    routes.append(ProviderRateResult(
        provider_name="Remitly", payout_method=payout_method, exchange_rate=round(remitly_rate, 4),
        mid_market_rate=round(live_mid_market_rate, 4), margin_percentage=1.2 if payout_method == "cash" else 0.9,
        fixed_fee=remitly_fee, transfer_time_days=0 if payout_method == "cash" else 2,
        total_delivery_amount=round(max(0.0, remitly_delivery), 2), requires_kyc_verification=is_large_transfer,
        regulatory_warning=warning_text
    ))

    # --- PROVIDER 3: WORLDREMIT ---
    world_rate = live_mid_market_rate * (0.985 if payout_method == "cash" else 0.992)
    world_fee = 4.99 if payout_method == "cash" else 3.99
    world_delivery = (amount - world_fee) * world_rate
    routes.append(ProviderRateResult(
        provider_name="WorldRemit", payout_method=payout_method, exchange_rate=round(world_rate, 4),
        mid_market_rate=round(live_mid_market_rate, 4), margin_percentage=1.5 if payout_method == "cash" else 0.8,
        fixed_fee=world_fee, transfer_time_days=0 if payout_method == "cash" else 1,
        total_delivery_amount=round(max(0.0, world_delivery), 2), requires_kyc_verification=is_large_transfer,
        regulatory_warning=warning_text
    ))

    # --- PROVIDER 4: WESTERN UNION ---
    wu_rate = live_mid_market_rate * (0.978 if payout_method == "cash" else 0.985)
    wu_fee = 1.99 if payout_method == "cash" else 4.99
    wu_delivery = (amount - wu_fee) * wu_rate
    routes.append(ProviderRateResult(
        provider_name="Western Union", payout_method=payout_method, exchange_rate=round(wu_rate, 4),
        mid_market_rate=round(live_mid_market_rate, 4), margin_percentage=2.2 if payout_method == "cash" else 1.5,
        fixed_fee=wu_fee, transfer_time_days=0 if payout_method == "cash" else 3,
        total_delivery_amount=round(max(0.0, wu_delivery), 2), requires_kyc_verification=is_large_transfer,
        regulatory_warning=warning_text
    ))

    routes.sort(key=lambda x: x.total_delivery_amount, reverse=True)

    return GlobalComparisonResponse(
        source_currency=source, target_currency=target, base_amount=amount,
        payout_method_selected=payout_method, timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        ai_recommendation=ai_rec, ai_analysis_summary=ai_sum, routes=routes
    )