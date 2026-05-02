from datetime import datetime
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

# Shared Models
class Mission(BaseModel):
    id: str
    raw_input: str
    industry: str
    competitors: List[str]
    decision_context: str
    timeframe: str
    created_at: Optional[datetime] = None

class Signal(BaseModel):
    id: str
    source_name: str
    source_url: str
    published_at: datetime
    collected_at: datetime
    raw_summary: str
    entities_mentioned: List[str]
    signal_type: Literal["competitor_move", "market_trend", "regulatory", "sentiment_shift", "pricing", "product_launch", "other"]
    relevance_score: float = Field(ge=0.0, le=1.0, default=0.0)
    credibility_score: float = Field(ge=0.0, le=1.0, default=0.0)
    topic_tags: List[str] = Field(max_length=8, default_factory=list)
    affected_assumptions: List[str] = Field(default_factory=list)
    is_relevant: bool = False
    mission_id: str
    embedding: Optional[List[float]] = None

class Insight(BaseModel):
    id: str
    title: str = Field(max_length=100) # max 10 words roughly
    body: str
    confidence: float = Field(ge=0.0, le=1.0)
    confidence_delta: float
    supporting_signals: List[str]
    contradicting_signals: List[str]
    assumptions_affected: List[str]
    status: Literal["strengthened", "weakened", "new", "contradicted", "unchanged"]
    flags_for_human_review: bool
    flag_reason: Optional[str] = None
    last_updated: datetime
    mission_id: str

class Recommendation(BaseModel):
    id: str
    rank: int
    title: str
    action: str
    rationale: str
    supporting_insight_ids: List[str]
    confidence: float = Field(ge=0.0, le=1.0)
    assumptions: List[str]
    risk: str
    time_sensitivity: Literal["immediate", "within_week", "within_month", "monitor"]
    mission_id: str
    created_at: Optional[datetime] = None

# Agent Specific Output Schemas

class SignalScorerOutput(BaseModel):
    is_relevant: bool
    relevance_score: float = Field(ge=0.0, le=1.0)
    credibility_score: float = Field(ge=0.0, le=1.0)
    topic_tags: List[str] = Field(max_length=8)
    affected_assumptions: List[str]
    signal_summary: str
    is_duplicate_likely: bool
    reasoning: str

class PartialSignal(BaseModel):
    id: str
    source_name: str
    source_url: str
    published_at: str # Use str for ISO8601 parsing from LLM
    collected_at: str
    raw_summary: str
    entities_mentioned: List[str]
    signal_type: Literal["competitor_move", "market_trend", "regulatory", "sentiment_shift", "pricing", "product_launch", "other"]

class NewsScannerOutput(BaseModel):
    signals: List[PartialSignal]
    articles_processed: int
    articles_skipped: int
    skip_reasons: List[str]

class PartialInsight(BaseModel):
    id: str
    title: str = Field(max_length=100)
    body: str
    confidence: float = Field(ge=0.0, le=1.0)
    confidence_delta: float
    supporting_signals: List[str]
    contradicting_signals: List[str]
    assumptions_affected: List[str]
    status: Literal["strengthened", "weakened", "new", "contradicted", "unchanged"]
    last_updated: datetime
    mission_id: Optional[str] = None

class AnalystAgentOutput(BaseModel):
    action: Literal["update_existing", "create_new", "no_change"]
    updated_insight: PartialInsight
    reasoning: str
    flags_for_human_review: bool
    flag_reason: Optional[str] = None

class StrategistAgentOutput(BaseModel):
    recommendations: List[Recommendation] = Field(max_length=7)
    recommendations_count: int
    insights_used: List[str]
    insights_ignored: List[str]
    ignore_reasons: List[str]

class SimulationScenario(BaseModel):
    conditions: List[str]
    outcome: str
    probability_label: Literal["likely", "possible", "unlikely"]
    early_signal: str

class Scenarios(BaseModel):
    optimistic: SimulationScenario
    neutral: SimulationScenario
    pessimistic: SimulationScenario

class SimulationOutput(BaseModel):
    simulation_id: str
    recommendation_id: str
    scenarios: Scenarios
    critical_assumption: str
    evidence_support: float = Field(ge=0.0, le=1.0)
    verdict: str

class MissionQuality(BaseModel):
    score: float = Field(ge=0.0, le=1.0)
    level: Literal["high", "medium", "low"]
    message: str
    missing_fields: List[str] = Field(default_factory=list)
    suggested_questions: List[str] = Field(default_factory=list)
    example_prompt: str
    should_proceed: bool
    needs_clarification: bool

# Graph State Schema
class AgentState(BaseModel):
    mission: Optional[Mission] = None
    raw_signals: List[PartialSignal] = Field(default_factory=list)
    scored_signals: List[Signal] = Field(default_factory=list)
    insights: List[Insight] = Field(default_factory=list)
    recommendations: List[Recommendation] = Field(default_factory=list)
    agent_status: Dict[str, Any] = Field(default_factory=dict)
    websocket_updates: List[Dict[str, Any]] = Field(default_factory=list)
