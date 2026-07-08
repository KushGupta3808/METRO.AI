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
