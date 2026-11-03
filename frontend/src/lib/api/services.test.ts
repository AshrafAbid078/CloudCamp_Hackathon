import { afterEach, expect, it, vi } from 'vitest';
import { copilotApi, dispatchApi } from './services';
import type { CopilotMessage } from '../types';

afterEach(() => vi.restoreAllMocks());

it('sends bounded prior turns and preserves the actual inference mode', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
    status: 'success', role: 'facility_manager', mode: 'local_tools', reply: 'Source-labelled answer', tool_calls: [],
  }), { status: 200 }));
  const history: CopilotMessage[] = Array.from({ length: 10 }, (_, index) => ({
    id: `turn-${index}`, sender: index % 2 ? 'assistant' : 'user',
    content: 'x'.repeat(3000), timestamp: '',
  }));
  const result = await copilotApi.sendQuery('Compare', 'facility_manager', history);
  const payload = JSON.parse(fetch.mock.calls[0][1]?.body as string);
  expect(payload.message).toBe('Compare');
  expect(payload.conversation_history).toHaveLength(6);
  expect(payload.conversation_history.every((turn: { text: string }) => turn.text.length === 2000)).toBe(true);
  expect(payload.conversation_history.at(-1).role).toBe('model');
  expect(result.inferenceMode).toBe('local_tools');
});

it('keeps a saved custom plan when its weather snapshot is old', async () => {
  const asset = { name: 'Saved machine', power_kw: 100, duration_hours: 1, deadline_hour: 24 };
  const plan = { status: 'success', region: 'bd', hours: 24, run_id: 7,
    assumptions: { custom_assets: [asset] },
    forecast_used: { timestamps: ['2020-01-01T00:00:00Z'], sources: { solar: 'open_meteo_weather_forecast', carbon: 'archived' } },
    plan: { industrial: [], batteries: [], kpis: { baseline_cost: 10, optimized_cost: 8,
      cost_saved: 2, cost_saved_usd: 2, co2_saved_kg: 0, peak_shaved_kw: 0,
      peak_baseline_kw: 10, peak_optimized_kw: 10 } } };
  const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
    const url = String(input);
    if (url.includes('/runs/latest')) return new Response(JSON.stringify(plan), { status: 200 });
    if (url.includes('/runs?')) return new Response(JSON.stringify({ runs: [] }), { status: 200 });
    throw new Error('A saved plan must not be silently replaced with a default portfolio.');
  });
  const result = await dispatchApi.getDispatchTracks(24);
  expect(result.runId).toBe(7);
  expect(result.customAssets).toEqual([asset]);
  expect(result.forecastStart).toBe('2020-01-01T00:00:00Z');
  expect(fetch).toHaveBeenCalledTimes(2);
});
