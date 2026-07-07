# METRO AI 🚀
### **M**oney **E**xchange & **T**ransfer **R**outing **O**ptimizer

---

## 📖 Executive Summary

**METRO AI** is an intelligent, production-grade cross-border remittance aggregator and market-timing platform engineered to optimize international wealth distribution. 

Unlike generic fintech tools that obscure true markup percentages behind short-lived promotions, METRO AI brings complete transparency to the remittance landscape. Built on a fully **decoupled architecture**, the platform pairs an asynchronous, high-concurrency **FastAPI backend** with an interactive **React frontend**. To provide true utility, METRO AI features a **Multi-Agent AI Engine** that continuously parses global macroeconomic news headlines, matches sentiment against historical trends, and outputs precise market-timing recommendations—helping international students and expats maximize every transfer.

---

## 🏗️ Technical Architecture & Core Design Decisions

This system is built from the ground up prioritizing scalability, performance isolation, and clean software engineering principles:

* **Decoupled Architecture:** Complete separation of concerns. The frontend layer acts as a stateless visual shell, while the backend focuses exclusively on data ingestion, routing algorithms, database manipulation, and AI orchestration over structured JSON endpoints.
* **Asynchronous Concurrency:** Built with **FastAPI** to allow simultaneous, non-blocking HTTP requests to multiple third-party exchange rate engines and fintech data hooks.
* **Intellectual Caching Layer:** Minimizes latency and protects external API rate limits by maintaining a strict caching mechanism that serves live currency spreads without redundant upstream network calls.
* **Structured Multi-Agent AI:** Orchestrated via advanced LLM abstraction tools (**Pydantic** + **Instructor**) to force machine-readable sentiment outputs, enabling autonomous agents to safely trigger predictive alerts based on shifting economic climates.

---

## 🗂️ Repository Directory Structure

```text
├── docs/                 # Core system documentation and specifications
│   ├── PRD.md            # Product Requirements (Target Audience, Use Cases, Scope)
│   ├── TRD.md            # Technical Requirements (DB Schemas, API Specs, System Design)
│   └── BRANDING.md       # Design Psychology, Typography, Visual Trust Patterns
├── backend/              # Asynchronous FastAPI Engine (Core Codebase)
├── frontend/             # Component-Driven React UI Application
└── README.md             # Repository Gateway & Portfolio Overview
