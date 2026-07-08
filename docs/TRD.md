# Technical Requirements Document (TRD) 🛠️
## Project: METRO AI (Money Exchange & Transfer Routing Optimizer)
**Author:** Kush Gupta  
**Status:** Architecture Draft (Phase 1)

This document establishes the definitive technical specifications, architectural designs, data models, and system boundaries for the METRO AI remittance aggregator platform.

---

## 1. System Architecture & Component Breakdown

METRO AI utilizes a fully decoupled, micro-services-ready architecture designed to maximize horizontal scalability, minimize user-facing latency, and handle I/O-bound tasks concurrently.

```text
                                 ┌──────────────────────────────────┐
                                 │       React Frontend (UI)        │
                                 │ (Stateless SPA / Component-Driven)│
                                 └─────────────────┬────────────────┘
                                                   │
                                            HTTPS / JSON
                                                   │
                                                   ▼
                                 ┌──────────────────────────────────┐
                                 │     FastAPI Gateway Backend      │
                                 │     (Asynchronous ASGI Loop)     │
                                 └───────┬─────────┬─────────┬──────┘
                                         │         │         │
                   ┌─────────────────────┘         │         └─────────────────────┐
                   ▼                               ▼                               ▼
     ┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
     │  PostgreSQL Database     │    │  Redis In-Memory Cache   │    │   Multi-Agent AI Engine  │
     │  (ACID User & Meta Data) │    │  (Rate TTL / Rate Limit) │    │ (LangGraph / Struct Out) │
     └──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘
```
---


1.1 Interface Layer (Frontend) Technology Stack: React, **HTML5**, Tailwind **CSS**.

Architecture Pattern: Stateless Single Page Application (**SPA**). Communicates with the **API** layer via structured RESTful **JSON** requests.

Core Responsibilities: Client-side routing, financial data visualization (live currency graphs), input form parsing, and rendering asynchronous notification states.

1.2 Application & Logic Layer (Backend) Technology Stack: Python 3.11+, FastAPI, Uvicorn (**ASGI** Server), Pydantic v2.

Architecture Pattern: Asynchronous **API** Gateway utilizing Python's asyncio event loop for non-blocking I/O operations.

Core Responsibilities: Orchestrating third-party provider data ingestion, computing real mathematical yield spreads, verifying cryptographic session signatures, and serving structured outputs from the AI models.

1.3 Data & Storage Layer PostgreSQL: Relational database for persistent storage of transaction-critical data requiring absolute **ACID** compliance (e.g., user records, account settings, notification parameters).

Redis: High-performance in-memory key-value store utilized as an caching layer for volatile financial rates and an ephemeral token bucket for **API** rate limiting.

## Data Ingestion & Caching Topology

Fetching foreign exchange rates from multiple external digital platforms simultaneously introduces critical performance bottlenecks and vendor **API** rate-limit exhaustion. **METRO** AI systematically mitigates this via an aggressive, intelligent caching policy.

2.1 The Asynchronous Ingestion Pipeline When a user requests a currency corridor mapping (e.g., **CAD** to **INR**), the backend initiates an asynchronous fan-out call using asyncio.gather(). It requests spreads from multiple external provider hooks simultaneously, processing raw payload arrays in parallel rather than sequentially, reducing total interface load time down to the slowest single provider response.

2.2 Redis Cache Architecture Cache Strategy: Cache-Aside (Lazy Loading).

Time-To-Live (**TTL**): **900** seconds (15 minutes). Exchange corridors do not undergo dramatic minute-by-minute shifts in retail remittance spaces; a 15-minute window protects external **API** consumer limits while ensuring fresh data.

Key Namespacing Scheme: rates:{base_currency}:{target_currency} (e.g., rates:**CAD**:**INR**).
```text
Plaintext
User Request ──► Check Redis Cache ─┬─► [Cache Hit] ──► Return In-Memory **JSON** (1ms)
    │
    └─► [Cache Miss] ─► Async Scrape ──► Seed Redis (**TTL** 15m) ──► Return (800ms)
## RESTful API Endpoint Specification
All **API** communication must be strictly versioned (/api/v1) and pass data strictly inside **JSON** standard schemas.
```
3.1 Live Aggregator Rates Endpoint: **GET** /api/v1/rates/live

Query Parameters:

source_ccy (string, required, e.g., *CAD*)

target_ccy (string, required, e.g., *INR*)

amount (float, required, e.g., **1000**.00)

Response Payload Example (**200** OK):

**JSON**
```
{
    *timestamp*: ***2026**-07-**08T03**:22:**00Z***,
    *source_currency*: *CAD*,
    *target_currency*: *INR*,
    *input_amount*: **1000**.00,
    *mid_market_rate*: 61.25,
    *routings*: [
    {
    *provider_name*: *Wise*,
    *exchange_rate*: 61.10,
    *upfront_fee*: 2.50,
    *hidden_markup_fee*: 1.50,
    *true_yield_amount*: **60947**.25,
    *rank*: 1
    },
    {
    *provider_name*: *Remitly (Economy)*,
    *exchange_rate*: 60.85,
    *upfront_fee*: 0.00,
    *hidden_markup_fee*: 4.00,
    *true_yield_amount*: **60850**.00,
    *rank*: 2
    }
    ]
}
```
3.2 AI Forecast & Market Timing
Endpoint: **GET** /api/v1/ai/forecast

Query Parameters:

pair (string, required, e.g., *CAD_INR*)

Response Payload Example (**200** OK):

**JSON**
```
{
    *currency_pair*: *CAD_INR*,
    *generated_at*: ***2026**-07-**08T01**:00:**00Z***,
    *macro_sentiment*: *BULLISH_FOR_SOURCE*,
    *recommendation*: *HOLD*,
    *confidence_score*: 0.88,
    *analysis_summary*: "The Bank of Canada hints at an impending interest rate hike tomorrow. Historical trends show this correlates with a 0.5-1.2% strengthening of **CAD** against **INR** within 48 hours. Suggest delaying larger transfers until Friday."
}
```
## Relational Database Schema Design (PostgreSQL)
To preserve transactional integrity for user accounts, profile definitions, and historical alert settings, the physical schema enforces strict relational constraints and indexing.
```
Plaintext
    ┌────────────────────────┐             ┌────────────────────────┐
    │         users          │             │    user_preferences    │
    ├────────────────────────┤             ├────────────────────────┤
    │ PK  id (**UUID**)          │◄──┐         │ PK  id (**SERIAL**)        │
    │     email (**VARCHAR**)    │   └─────────┤ FK  user_id (**UUID**)     │
    │     password_hash (VC) │             │     base_ccy (**VARCHAR**) │
    │     created_at (TS)    │             │     target_ccy (**VARCHAR**)│
    └────────────────────────┘             └────────────────────────┘
```
4.1 Table: users
Tracks unique corporate authentication accounts.

id: **UUID** (Primary Key, Defaults to gen_random_uuid())

email: **VARCHAR**(**255**) (Unique, Indexed, Enforces strict syntax compliance)

password_hash: **VARCHAR**(**255**) (Stores cryptographically salted binary hashes)

created_at: **TIMESTAMP** **WITH** **TIME** **ZONE** (Defaults to CURRENT_TIMESTAMP)

4.2 Table: user_preferences Maintains notification configurations for targeted rate shifts.

id: **SERIAL** (Primary Key)

user_id: **UUID** (Foreign Key referencing users.id on delete **CASCADE**)

default_base_ccy: **VARCHAR**(3) (Defaults to '**CAD**')

default_target_ccy: **VARCHAR**(3) (Defaults to '**INR**')

alert_threshold_rate: **NUMERIC**(10, 4) (User-defined floor value to fire webhooks)

## Security & Authentication Framework

Financial software demands resilient defense-in-depth vectors across data parsing pipelines and connection layers.

Cryptographic Password Hashing: Raw strings are scrubbed instantly at the gateway. The authentication engine applies Bcrypt (utilizing a minimum work factor of 12) to salt and transform text before interacting with PostgreSQL.

Stateless Token Lifetime: Employs stateless **JWT** (**JSON** Web Tokens) implementing a symmetric **HS256** signature algorithm. Tokens are configured with a strict expiration window of 15 minutes. Long-lived access requires explicit refresh tokens stored inside secure, **HTTP**-only, anti-**CSRF** cookies.

**CORS** Protection Boundary: The FastAPI server explicitly drops any cross-origin script execution targeting resource gateways unless originating from a cryptographically verified white-listed domain (e.g., the production React domain).

## Fault Tolerance & Resiliency Patterns

6.1 The Circuit Breaker Implementation If an external remittance platform alters its server landscape or experiences internal outages, raw **HTTP** calls will trigger failures. **METRO** AI incorporates a Circuit Breaker Pattern:

Closed State: Normal system execution. All providers are called seamlessly.

Open State: If a single provider **API** registers 5 successive failures within a 60-second window, the circuit breaker *trips* open for 10 minutes.

System Action: During the open phase, backend requests ignore the broken vendor completely, immediately returning remaining operational aggregator lists. This ensures an external failure never causes cascading **500** errors across **METRO** AI interfaces.

## Multi-Agent AI Engine Architecture

The intelligence framework is orchestrating using structured, deterministic multi-agent layers instead of singular open-ended chat strings:

Ingestion Agent: Periodically reads **RSS** global business news and currency tickers.

Structural Transformer (Instructor + Pydantic): Takes raw text from the Ingestion Agent and parses it into strict, validated **JSON** models mapping specific currency codes to weighted sentiment numbers (-1.0 to +1.0).

Synthesis Engine: Compares the updated sentiment vector against the 30-day historical trend matrix to output the final, highly definitive execution recommendations seen on user dashboards.
