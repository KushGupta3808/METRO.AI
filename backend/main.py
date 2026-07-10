from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import datetime
import httpx

app = FastAPI(
    title="METRO AI API",
    description="Money Exchange & Transfer Routing Optimizer Engine (Global Production Engine)",
    version="2.0.0"
)

# --- GLOBAL PROVIDER REGISTRY MATRIX ---
# To add more apps in the future, simply drop a new block into this array!
PROVIDERS_CONFIG = [
    {
        "name": "Wise",
        "supported_payouts": ["bank"],
        "bank_margin": 0.003,      # 0.3% fee spread
        "cash_margin": 0.0,
        "bank_fee": 2.99,
        "cash_fee": 0.0,
        "bank_days": 1,
        "cash_days": 0
    },
    {
        "name": "Remitly",
        "supported_payouts": ["bank", "cash"],
        "bank_margin": 0.009,      # 0.9% fee spread
        "cash_margin": 0.012,     # 1.2% fee spread for cash
        "bank_fee": 0.00,          # Handled conditionally in loop if amount < 1000
        "cash_fee": 3.99,
        "bank_days": 2,
        "cash_days": 0
    },
    {
        "name": "WorldRemit",
        "supported_payouts": ["bank", "cash"],
        "bank_margin": 0.008,      # 0.8% spread
        "cash_margin": 0.015,      # 1.5% spread
        "bank_fee": 3.99,
        "cash_fee": 4.99,
        "bank_days": 1,
        "cash_days": 0
    },
    {
        "name": "Western Union",
        "supported_payouts": ["bank", "cash"],
        "bank_margin": 0.015,      # 1.5% spread
        "cash_margin": 0.022,      # 2.2% retail network spread
        "bank_fee": 4.99,
        "cash_fee": 1.99,
        "bank_days": 3,
        "cash_days": 0
    }
]

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
    ai_recommendation: str
    ai_analysis_summary: str
    routes: List[ProviderRateResult]


# --- DYNAMIC CURRENCY-AGNOSTIC AI ANALYTICS ---
def generate_ai_insight(source: str, target: str, current_rate: float, baseline_rate: float) -> tuple[str, str]:
    """Evaluates momentum based on genuine historical lookbacks instead of hardcoded numbers."""
    variance_pct = ((current_rate - baseline_rate) / baseline_rate) * 100

    if variance_pct > 2.0:
        recommendation = "FORCE_SEND"
        summary = f"AI Analysis: The current {source}/{target} exchange rate ({round(current_rate, 4)}) is highly extended (+{round(variance_pct, 2)}%) above its 30-day historical baseline of {round(baseline_rate, 4)}. Capitalize on this premium conversion window."
    elif variance_pct >= 0.0:
        recommendation = "SEND"
        summary = f"AI Analysis: Market conditions stable. The current market pricing index of {round(current_rate, 4)} matches or slightly exceeds standard 30-day target baselines. Spreads are highly competitive."
    elif variance_pct > -2.0:
        recommendation = "HOLD"
        summary = f"AI Analysis: Minor macro correction occurring. Current rate is sitting -{round(abs(variance_pct), 2)}% below normal monthly resistance levels. If non-urgent, defer transfer to capture rebound momentum."
    else:
        recommendation = "WAIT"
        summary = f"AI Analysis: Adverse volatility spike detected. Current values are depressed by {round(variance_pct, 2)}% relative to monthly benchmarks. Avoid processing capital volume under these heavy market margin drops."
        
    return recommendation, summary


@app.get("/api/v1/compare", response_model=GlobalComparisonResponse)
async def compare_rates(
    source: str = Query(..., min_length=3, max_length=3, description="Source currency, e.g., CAD, USD, GBP"),
    target: str = Query(..., min_length=3, max_length=3, description="Target currency, e.g., INR, EUR, JPY"),
    amount: float = Query(..., gt=0, description="Amount to transfer"),
    payout_method: str = Query("bank", description="Fulfillment: 'bank' or 'cash'")
):
    source = source.upper()
    target = target.upper()
    payout_method = payout_method.lower()
    
    if payout_method not in ["bank", "cash"]:
        raise HTTPException(status_code=400, detail="Invalid payout method. Select 'bank' or 'cash'.")

    # Determine dynamic historical date strings for lookback queries (30 days ago)
    today = datetime.date.today()
    past_date = today - datetime.timedelta(days=30)
    past_date_str = past_date.isoformat()

    live_mid_market_rate = 1.0
    historical_baseline_rate = 1.0

    if source != target:
        async with httpx.AsyncClient() as client:
            # Task 1: Fetch Live Current Rates
            try:
                url_live = f"https://api.frankfurter.dev/v1/latest?base={source}&symbols={target}"
                res_live = await client.get(url_live, timeout=4.0)
                if res_live.status_code == 200:
                    live_mid_market_rate = res_live.json()["rates"][target]
                else:
                    raise HTTPException(status_code=400, detail=f"Currency pair {source} to {target} not supported by market registries.")
            except httpx.RequestError:
                raise HTTPException(status_code=503, detail="Global currency network Registry currently unreachable.")

            # Task 2: Fetch Live Historical Baseline 30 Days Ago for this exact pair
            try:
                url_hist = f"https://api.frankfurter.dev/v1/{past_date_str}?base={source}&symbols={target}"
                res_hist = await client.get(url_hist, timeout=4.0)
                if res_hist.status_code == 200:
                    historical_baseline_rate = res_hist.json()["rates"][target]
                else:
                    historical_baseline_rate = live_mid_market_rate  # Safe fallback if weekend adjustments glitch
            except httpx.RequestError:
                historical_baseline_rate = live_mid_market_rate

    # Generate genuine dynamic AI insights
    ai_rec, ai_sum = generate_ai_insight(source, target, live_mid_market_rate, historical_baseline_rate)

    is_large_transfer = amount >= 10000.0
    warning_text = f"Large volume threshold reached for {source}. Strict verification required." if is_large_transfer else None

    # --- DYNAMIC PROCESSING MATRIX LOOP ---
    routes = []
    for provider in PROVIDERS_CONFIG:
        # Skip app completely if it doesn't offer the requested payout system (like Wise for cash)
        if payout_method not in provider["supported_payouts"]:
            continue

        # Extract context attributes dynamically
        if payout_method == "bank":
            margin = provider["bank_margin"]
            days = provider["bank_days"]
            # Apply dynamic custom fee structures (like Remitly's waiver rule)
            if provider["name"] == "Remitly":
                fee = 0.00 if amount >= 1000.0 else 4.99
            else:
                fee = provider["bank_fee"]
        else:
            margin = provider["cash_margin"]
            days = provider["cash_days"]
            fee = provider["cash_fee"]

        # Run financial execution equations
        effective_exchange_rate = live_mid_market_rate * (1.0 - margin)
        total_delivery_amount = (amount - fee) * effective_exchange_rate

        routes.append(ProviderRateResult(
            provider_name=provider["name"],
            payout_method=payout_method,
            exchange_rate=round(effective_exchange_rate, 4),
            mid_market_rate=round(live_mid_market_rate, 4),
            margin_percentage=round(margin * 100, 2),
            fixed_fee=fee,
            transfer_time_days=days,
            total_delivery_amount=round(max(0.0, total_delivery_amount), 2),
            requires_kyc_verification=is_large_transfer,
            regulatory_warning=warning_text
        ))

    # Re-rank providers dynamically based on highest final payout value
    routes.sort(key=lambda x: x.total_delivery_amount, reverse=True)

    return GlobalComparisonResponse(
        source_currency=source, target_currency=target, base_amount=amount,
        payout_method_selected=payout_method, timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        ai_recommendation=ai_rec, ai_analysis_summary=ai_sum, routes=routes
    )