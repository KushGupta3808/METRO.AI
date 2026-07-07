# Product Requirements Document (PRD)
## Project: METRO AI (Money Exchange & Transfer Routing Optimizer)

---

## 1. Problem Statement
* **The Challenge:** International students and expatriates face highly volatile currency exchange corridors. Remittance platforms continuously manipulate retail conversion rates, hiding profit margins behind "zero-fee" marketing campaigns and temporary promotional brackets.
* **The Impact:** Users lose hundreds of dollars due to poor market timing and a lack of centralized, transparent rate aggregation.

---

## 2. Target Audience, Personas & User Stories

### Target Corridors
The initial launch of the application will optimize the high-volume **CAD to INR (Canadian Dollar to Indian Rupee)** corridor, with structural architecture built to scale to any global currency pair natively.

### Core Personas
* **Persona 1: The Budget-Conscious International Student**
    * *Profile:* Living and working part-time abroad, managing tight personal savings, tuition timelines, and periodically transferring larger lump sums home to support family or pay down local accounts.
    * *Core Need:* High-precision market-timing to maximize the destination currency yield down to the single cent.
* **Persona 2: The High-Frequency Family Supporter**
    * *Profile:* Working professional sending fixed portions of their paycheck home on strict monthly schedules.
    * *Core Need:* Rapid identification of active promotional coupon codes and the lowest structural platform fees available *today*.

### User Stories (The Product Scope)
1.  **As a student saving money from my job,** I want to track the CAD to INR exchange rate over a 30-to-90 day window so that I can transfer a lump sum (e.g., $10,000 CAD) home when the rate hits its peak, rather than being forced to transfer during a market dip.
2.  **As a user looking for the absolute highest payout,** I want a system that calculates the *real* mid-market rate vs. retail platform rates (like Remitly or Wise) including hidden margins, so I know exactly how much money lands in the destination account.
3.  **As a busy user,** I want an AI agent to monitor global macroeconomic news headlines daily and send me a clear push notification or alert saying "Hold" or "Send" based on economic shifts.

---

## 3. Detailed Functional Requirements & Feature Matrix

### Tier 1: Core Aggregator Engine (MVP)
* **Live Rate Ingestion:** Backend must fetch real-time mid-market rates from a reliable currency API every 15 minutes.
* **Competitor Fee Scraping:** A pipeline to ingest or simulate the conversion spreads of major remittance providers.
* **The "True Yield" Calculator:** A mathematical function that processes an input amount (e.g., $10,000 CAD), subtracts the respective platform's fee + exchange rate markup, and ranks the providers by actual output amount.

### Tier 2: Historical Analytics & UI Components
* **Interactive Trend Graphs:** A clean, time-interval chart (Daily, Weekly, Monthly views) allowing users to visually monitor rate fluctuations.
* **Spread Visualizer:** A metric display highlighting the exact gap between the current market peak and the provider's offered retail rate.

### Tier 3: Predictive AI & Notification Orchestrator
* **Macroeconomic News Fetcher:** An autonomous agent that scrapes daily financial news headlines related to central bank announcements and inflation metrics.
* **Sentiment Classifier:** An LLM module utilizing structured outputs to weigh news sentiment as Positive, Neutral, or Negative for the target currency.
* **Smart Alert Engine:** Triggers a user alert if an unusually high rate peak is detected or if a competitor launches a verified zero-fee promotion.

---

## 4. Out of Scope (Future Phases)
* Directly executing financial transfers inside the METRO AI application (the app remains a pure aggregator and decision engine; it will link out to the chosen provider instead).
* Handling multi-currency wallets or holding funds.
