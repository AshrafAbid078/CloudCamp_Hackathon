'use client';

import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import type { SolarDataPoint } from '@/lib/types';

type Props = { data: SolarDataPoint[]; title?: string; subtitle?: string; showGridStress?: boolean; showOverlaysToggle?: boolean };

export function ForecastChart({ data, title = 'Solar forecast', subtitle = 'Archived input data', showGridStress, showOverlaysToggle }: Props) {
  void showGridStress;
  void showOverlaysToggle;
  const [metric, setMetric] = useState<'ghi' | 'carbon'>('ghi');
  return <section className="surface-panel min-w-0 space-y-5 p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{title}</h2><p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p></div><div className="flex gap-1 rounded-md bg-[var(--bg-surface-raised)] p-1 text-xs"><button onClick={() => setMetric('ghi')} aria-pressed={metric === 'ghi'} className={'rounded px-3 py-1.5 ' + (metric === 'ghi' ? 'bg-white font-bold text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]')}>Solar GHI</button><button onClick={() => setMetric('carbon')} aria-pressed={metric === 'carbon'} className={'rounded px-3 py-1.5 ' + (metric === 'carbon' ? 'bg-white font-bold text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]')}>Carbon intensity</button></div></div>
    {data.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No forecast data available.</p> : <div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{top:10,right:12,left:-18,bottom:4}}><CartesianGrid vertical={false} stroke="#e5ebef" /><XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{fontSize: 11, fill:'#718397'}} /><YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill:'#718397'}} /><Tooltip contentStyle={{border:'1px solid #dfe6ec',borderRadius:6}} /><Legend iconType="circle" wrapperStyle={{fontSize:12}} />{metric === 'ghi' ? <><Line dataKey="ghiForecast" name="GHI (W/m²)" stroke="#d6a34b" strokeWidth={3} dot={false} /><Line dataKey="ghiLowerBound" name="Fixed −15%" stroke="#b6c2ca" strokeDasharray="4 4" dot={false} /><Line dataKey="ghiUpperBound" name="Fixed +15%" stroke="#b6c2ca" strokeDasharray="4 4" dot={false} /></> : <Line dataKey="carbonIntensityGco2" name="Carbon intensity (gCO₂/kWh)" stroke="#137d76" strokeWidth={3} dot={false} />}</LineChart></ResponsiveContainer></div>}
  </section>;
}
