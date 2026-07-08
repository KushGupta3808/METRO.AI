# Technical Requirements Document (TRD) 🛠️
## Project: METRO AI

This document details the system architecture, database specifications, API routing schema, and algorithmic logic supporting the METRO AI remittance aggregator.

---

## 1. System Architecture (Decoupled Design)

The system utilizes a fully decoupled modern web stack architecture, prioritizing performance isolation and horizontal scalability.

```text
[ React Frontend (UI) ] ──(HTTP/JSON)──> [ FastAPI Backend (API) ] ───┬──> [ PostgreSQL DB ]
                                                                      │
                                                                      ├──> [ Redis (Caching) ]
                                                                      │
                                                                      └──> [ Multi-Agent AI (LLM) ]
