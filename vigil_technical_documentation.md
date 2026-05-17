# Vigil Market Intelligence Platform
## Technical Implementation & Stack Documentation

The Vigil Market Intelligence Platform is a full-stack, real-time, agent-driven application. It leverages a modern React frontend and a Python FastAPI backend powered by LangGraph to orchestrate multiple LLM agents (running on Groq and Cerebras) for real-time market signal ingestion, analysis, and strategy generation.

---

## 1. Technology Stack

### Frontend (Client-Side)
The frontend is built for high-performance, real-time data visualization with a minimal, "strategic command" style light theme.

*   **Core Framework**: React 19 + TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS (configured for a clean, notion-like minimal UI) + PostCSS
*   **State Management**: Zustand (for managing real-time WebSocket data streams and UI state)
*   **Routing**: React Router DOM
*   **Data Visualization**: React Flow (for visualizing agentic pipelines and data nodes)
*   **Icons**: Lucide React
*   **Code Quality**: ESLint, TypeScript-ESLint

### Backend (Server-Side)
The backend is an asynchronous, event-driven service orchestrating large language models and external data APIs.

*   **Core Framework**: Python + FastAPI
*   **Server**: Uvicorn (ASGI)
*   **Agentic Framework**: LangGraph (for orchestrating the multi-agent pipeline)
*   **Data Validation**: Pydantic
*   **LLM Inference Providers**:
    *   **Groq** (`groq` SDK) - Used for low-latency reasoning and synthesis.
    *   **Cerebras** (`cerebras_cloud_sdk`) - Used for high-throughput language tasks.
*   **Data & News APIs**:
    *   **Currents API** (News scanning and market signals)
    *   **Finnhub API** (Market pricing and financial data)
*   **Database & Persistence**: Supabase (`supabase` SDK)
*   **Caching & Queueing**: Upstash Redis (`upstash-redis`)
*   **Testing**: Pytest

---

## 2. System Architecture

The platform follows a decoupled client-server architecture with real-time bi-directional communication capabilities.

### 2.1 Backend Architecture

The backend is modularized into several key directories:
*   `agents/`: Contains the logic for the LangGraph-based multi-agent system.
*   `routers/`: Defines the FastAPI endpoints (REST and WebSockets).
*   `models/`: Pydantic data models for request/response validation.
*   `memory/`: Short-term and long-term memory management for the agents.

#### The Agentic Pipeline
The core of the system is the intelligence pipeline defined in `agents/fast_pipeline.py` and `agents/graph.py`. The pipeline consists of specialized LLM agents working in sequence or parallel:
1.  **News Scanner (`news_scanner.py`)**: Continuously fetches and parses market news using the Currents API.
2.  **Pricing Scout (`pricing_scout.py`)**: Retrieves real-time stock/market pricing data using Finnhub.
3.  **Signal Scorer (`signal_scorer.py`)**: Evaluates incoming data feeds to filter out noise and identify high-value market signals.
4.  **Analyst (`analyst.py`)**: Synthesizes the scored signals into actionable market insights.
5.  **Strategist (`strategist.py`)**: Formulates, ranks, and recommends specific strategic actions based on the analyst's insights.
6.  **Fault Tolerance (`fault_tolerance.py`)**: Ensures pipeline resilience against API rate limits or LLM hallucination/failure loops.

#### Communication Layer
The backend exposes its functionality via two primary methods:
*   **REST API**: Handles synchronous requests such as initializing a mission (`/mission`), querying specific insights (`/insights`), or retrieving static historical data.
*   **WebSockets (`/ws`)**: Pushes real-time updates to the frontend. As the agentic pipeline progresses, it streams state changes, newly discovered signals, and strategy formulations directly to the client UI.

### 2.2 Frontend Architecture

The React application is structured to consume the heavy data streams from the backend seamlessly.
*   `src/components/`: Reusable UI elements (cards, buttons, modal dialogs) strictly adhering to the light-theme design system.
*   `src/store/`: Zustand stores that hold the active WebSocket connection state and aggregate the incoming agent data.
*   `src/pages/`: Main application views (e.g., Dashboard, Answer View, Simulation View).
*   `src/lib/`: Helper utilities, formatting functions, and API clients.

#### Real-Time Data Flow
1.  The frontend initiates a WebSocket connection to `ws://<backend-url>/ws`.
2.  Zustand store listeners capture incoming payloads (e.g., `strategy_data`, `signal_update`).
3.  The UI automatically re-renders, displaying live insights in Action Cards and updating React Flow graph nodes without requiring manual browser refreshes.

---

## 3. Environment & Configuration

The system relies heavily on environment variables for API keys and service configurations (`backend/config.py`).
Key environment variables include:
*   `GROQ_API_KEY`, `CEREBRAS_API_KEY` (LLM inference)
*   `CURRENTS_API_KEY`, `FINNHUB_API_KEY` (Market Data)
*   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Database)
*   `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (Redis Cache)
*   `MOCK_MODE` (Toggle for offline/testing scenarios)

## 4. Summary

Vigil is designed as a highly scalable, AI-native application. By leveraging LangGraph for complex agent orchestration and a reactive Vite/React frontend, the platform provides users with an instant, continuously updating stream of synthesized market intelligence.
