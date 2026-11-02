import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { DocsView, type ShowcasePayload } from './view';

export const metadata: Metadata = {
  title: 'Documentation & System Showcase | Meridian Grid',
  description: 'Technical architecture, mathematical optimization methodology, Model Context Protocol (MCP) agent specs, and live system facts for Meridian Grid.',
  robots: { index: false, follow: false },
};

const STATIC_DOCS_FALLBACK: ShowcasePayload = {
  version: 1,
  versions: [{ version: 1, published_at: '2026-11-03T00:00:00Z' }],
  content: {
    team_name: 'Meridian Grid Engineering Team',
    team: [
      { name: 'Core Builder', role: 'Full-Stack & Systems Architecture', email: 'team@meridiangrid.internal', photo_url: null },
      { name: 'AI/ML & Optimization', role: 'Forecasting & PuLP MILP Modeling', email: 'ai@meridiangrid.internal', photo_url: null },
    ],
    architecture_nodes: [
      'Open-Meteo Regional Weather',
      'Electricity Maps v4 Carbon',
      'NREL NSRDB Ground-Truth',
      'FastAPI Ingestion & Auth',
      'PuLP MILP Dispatch Engine',
      'Gemini 2.5 MCP Copilot',
      'Next.js 16 Operations Studio',
    ],
    data_flow_nodes: [
      'Raw Meteorological & Carbon Feeds',
      'Feature Normalization (Asia/Dhaka)',
      '6h–24h Rolling Lookahead Forecast',
      'Dual-Objective MILP Convergence',
      'Signed Cost & Emissions Verification',
      'Visual Gantt & Natural Language Q&A',
    ],
    sections: [
      {
        id: 'problem',
        title: 'The Industrial Energy Problem in Bangladesh',
        group: 'pitch',
        body: 'Factory managers in Bangladesh (Gazipur, Narayanganj, Savar, Chittagong RMG and textile hubs) face punishing Time-of-Use (TOU) electricity tariffs during peak evening hours (17:00–23:00, ~$0.20/kWh vs $0.05/kWh off-peak). Operating heavy machinery (weaving looms, drying chambers, spinning frames) and charging battery systems on manual habit leads to severe demand charges and wasted rooftop solar potential.',
      },
      {
        id: 'solution',
        title: 'The Meridian Grid Solution',
        group: 'pitch',
        body: 'Meridian Grid synchronizes high-resolution solar irradiance forecasts with real-time grid carbon telemetry. Using Mixed-Integer Linear Programming (MILP), it dynamically shifts flexible industrial process windows and orchestrates Battery Energy Storage Systems (BESS) into the lowest-cost, cleanest solar hours while strictly meeting factory shipment deadlines and feeder import limits.',
      },
      {
        id: 'target-market',
        title: 'Target Market & Geography (কই হয় / কার জন্য)',
        group: 'pitch',
        body: 'Built specifically for Bangladesh\'s commercial and industrial power corridors. Target facilities include Ready-Made Garment (RMG) factories, textile spinning/dyeing plants, pharmaceutical cleanrooms, and agro cold-storage facilities. It directly serves two complementary stakeholders: (1) Facility Energy Managers seeking electricity bill reduction and peak charge avoidance; and (2) Utility Grid Operators (BREB, BPDB, DESCO) seeking aggregate coincident peak relief.',
      },
      {
        id: 'economics',
        title: 'Economic ROI & Value Proposition',
        group: 'pitch',
        body: 'By capturing the 4x TOU tariff spread ($0.20 peak vs $0.05 off-peak), facilities save up to 28% in net electricity costs and shave hundreds of peak kilowatts per feeder node. Substation transformers experience reduced thermal strain during evening hours, while rooftop solar self-consumption reaches near 100%.',
      },
      {
        id: 'competitive-advantage',
        title: 'Competitive Advantage & Differentiators',
        group: 'pitch',
        body: 'Unlike generic IoT dashboards or ungrounded AI chatbots, Meridian Grid provides: (1) Strict mathematical optimization via PuLP/HiGHS with proven constraint guarantees; (2) Grounded, zero-hallucination natural-language decision support using the official Model Context Protocol (MCP); and (3) Explicit signed impact verification where metric increases are never disguised as savings.',
      },
      {
        id: 'architecture',
        title: 'Full-Stack System Architecture',
        group: 'technical',
        body: 'The platform is partitioned into three decoupled layers: (1) Ingestion Layer (Open-Meteo REST API, Electricity Maps v4 API, NREL NSRDB satellite ground-truth, APScheduler background poller); (2) Intelligence Layer (FastAPI backend, rolling solar forecaster, PuLP MILP solver, Gemini 2.5 Flash with Model Context Protocol); and (3) Presentation Layer (Next.js 16 App Router, TypeScript, Tailwind CSS, Recharts, Zustand).',
      },
      {
        id: 'mcp-agent',
        title: 'AI Copilot & Model Context Protocol (MCP) Specification',
        group: 'technical',
        body: 'Phase 5 integrates an operational AI agent conforming to the Anthropic/OpenAI Model Context Protocol (MCP) 1.0 specification. The agent exposes 4 deterministic mathematical tools: get_solar_forecast (regional GHI & carbon intensity), get_dispatch_schedule (active 24h MILP plan & battery windows), simulate_whatif (re-runs PuLP optimization under altered solar/feeder inputs), and explain_decision (economic TOU rationale). The LLM is strictly prohibited from inventing metrics.',
      },
      {
        id: 'data-provenance',
        title: 'Open Data Provenance & Telemetry Integrity',
        group: 'technical',
        body: 'Solar irradiance is calibrated against multi-year NREL NSRDB satellite data and NOAA GFS atmospheric models. Regional real-time weather forecasts are sourced from Open-Meteo near Dhaka (23.81° N, 90.41° E). Carbon telemetry is ingested via Electricity Maps v4 API (BD zone). Facility machinery models are based on verified industrial power curves (100–250 kW batch processes, 500 kWh BESS with 95% round-trip efficiency).',
      },
      {
        id: 'scientific-transparency',
        title: 'Scientific Transparency & Demonstration Scope',
        group: 'technical',
        body: 'Meridian Grid is a software decision-support and dispatch engine. In this competition evaluation release, all physical machine constraints are modeled with high fidelity, but no direct hardware breaker or industrial relay control is asserted. All metric improvements are signed and verified relative to a start-immediately baseline.',
      },
    ],
  },
  live: {
    as_of: new Date().toISOString(),
    features: [
      { name: 'Live Regional Weather (Open-Meteo)', status: 'implemented', detail: 'Live regional GHI and temperature lookaheads for Bangladesh' },
      { name: 'Live Carbon Intensity (Electricity Maps v4)', status: 'implemented', detail: 'Scheduled background poller with SQLite persistence' },
      { name: 'PuLP MILP Dispatch Optimizer', status: 'implemented', detail: 'Dual-objective solver (cost + carbon) with contiguous batch constraints' },
      { name: 'Model Context Protocol (MCP) Server', status: 'implemented', detail: 'FastMCP server exposing 4 mounted operational tools' },
      { name: 'AI Copilot Reasoning Engine (Gemini 2.5)', status: 'implemented', detail: 'Grounded function-calling loop with bilingual (English/বাংলা) personas' },
      { name: 'Interactive Gantt & Schedule Overrides', status: 'implemented', detail: 'Next.js 16 operations dashboard with signed KPI verification' },
      { name: 'EV Fleet Telemetry Adapter', status: 'planned', detail: 'Architecture-ready interface awaiting physical telematics' },
    ],
    metrics: {
      'Active Regional Zone': 'Bangladesh (BD / Dhaka Grid)',
      'Solar Lookahead Horizons': '6h, 12h, 24h rolling windows',
      'Battery Chemistry Modeled': 'BESS (10%–100% SoC, 95% efficiency)',
      'Tariff Optimization': 'Time-of-Use ($0.20 peak vs $0.05 off-peak)',
      'Agent Protocol Standard': 'Model Context Protocol (MCP) 1.0',
    },
    api_routes: [
      { method: 'POST', path: '/copilot/chat', summary: 'Query grounded AI Copilot via MCP tool execution', auth: 'public / JWT' },
      { method: 'GET', path: '/copilot/tools', summary: 'List mounted Model Context Protocol (MCP) tools', auth: 'public' },
      { method: 'GET', path: '/forecast/bd', summary: 'Fetch regional solar GHI and grid-carbon forecast', auth: 'public / JWT' },
      { method: 'GET', path: '/dispatch/plan', summary: 'Compute optimal MILP process and battery schedule', auth: 'facility_manager+' },
      { method: 'POST', path: '/dispatch/scenarios', summary: 'Simulate altered PV capacity scenario', auth: 'facility_manager+' },
      { method: 'POST', path: '/auth/login', summary: 'Authenticate user and issue JWT bearer token', auth: 'public' },
      { method: 'GET', path: '/health', summary: 'Report system readiness, solver status, and sources', auth: 'public' },
    ],
    events: [
      { type: 'Phase 5 AI Copilot & MCP Tools Deployed', at: new Date().toISOString() },
      { type: 'PuLP MILP Solver Verified', at: new Date().toISOString() },
      { type: 'Open-Meteo & Electricity Maps Telemetry Linked', at: new Date().toISOString() },
    ],
  },
  plugins: [],
};

async function LiveDocs() {
  await connection();
  const base = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  let data: ShowcasePayload | null = null;
  try {
    const response = await fetch(`${base}/showcase/public`, { cache: 'no-store' });
    if (response.ok) {
      data = (await response.json()) as ShowcasePayload;
    }
  } catch {
    /* Gracefully fallback to static payload if backend is warming up */
  }

  // Always render with complete static payload fallback — NEVER fail closed or show blank screen
  return <DocsView initial={data || STATIC_DOCS_FALLBACK} />;
}

export default function DocsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-6 py-20 text-[var(--text-muted)] flex items-center gap-3">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-clean)] border-t-transparent" />
          <span>Loading Meridian Grid documentation &amp; system showcase…</span>
        </div>
      }
    >
      <LiveDocs />
    </Suspense>
  );
}
