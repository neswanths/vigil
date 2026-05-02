create extension if not exists vector;

create table signals (
  id text primary key,
  source_name text,
  source_url text,
  published_at timestamptz,
  collected_at timestamptz,
  raw_summary text,
  entities_mentioned text[],
  signal_type text,
  relevance_score float,
  credibility_score float,
  topic_tags text[],
  affected_assumptions text[],
  is_relevant boolean,
  mission_id text,
  embedding vector(1536)
);

create unique index if not exists signals_mission_source_url_unique
  on signals (mission_id, source_url)
  where source_url is not null and source_url <> '';

create index if not exists signals_mission_relevance_idx
  on signals (mission_id, relevance_score desc, published_at desc);

create table insights (
  id text primary key,
  title text,
  body text,
  confidence float,
  confidence_delta float,
  supporting_signals text[],
  contradicting_signals text[],
  assumptions_affected text[],
  status text,
  flags_for_human_review boolean,
  flag_reason text,
  last_updated timestamptz,
  mission_id text
);

create index if not exists insights_mission_updated_idx
  on insights (mission_id, last_updated desc);

create table recommendations (
  id text primary key,
  rank integer,
  title text,
  action text,
  rationale text,
  supporting_insight_ids text[],
  confidence float,
  assumptions text[],
  risk text,
  time_sensitivity text,
  mission_id text,
  created_at timestamptz default now()
);

create index if not exists recommendations_mission_rank_idx
  on recommendations (mission_id, rank);

create table missions (
  id text primary key,
  raw_input text,
  industry text,
  competitors text[],
  decision_context text,
  timeframe text,
  created_at timestamptz default now()
);

create or replace function match_signals(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table(id text, raw_summary text, similarity float)
language sql stable as $$
  select id, raw_summary,
    1 - (embedding <=> query_embedding) as similarity
  from signals
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
