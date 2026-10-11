'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button, Input, Chip } from '@/components/common';
import { useRole } from '@/hooks';
import { dispatchApi } from '@/lib/api';
import type { BatteryAction } from '@/lib/types';

interface OverridePanelProps {
  onSuccess?: (msg: string) => void;
}

export function OverridePanel({ onSuccess }: OverridePanelProps) {
  const { role, canOverrideDispatch } = useRole();
  const [action, setAction] = useState<BatteryAction>('discharge');
  const [powerMW, setPowerMW] = useState<number>(25.0);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [reason, setReason] = useState<string>('ISO Frequency Response Directive');
  const [interlockConfirmed, setInterlockConfirmed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canOverrideDispatch) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await dispatchApi.submitManualOverride({
        intervalId: `override-${Date.now()}`,
        action,
        batteryPowerMW: action === 'charge' ? -Math.abs(powerMW) : Math.abs(powerMW),
        durationMinutes,
        reason,
        operatorId: `${role}-station-01`,
      });

      setFeedback({ type: 'success', message: res.message });
      if (onSuccess) onSuccess(res.message);
    } catch {
      setFeedback({ type: 'error', message: 'Override rejected by SCADA safety bus interlock.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Manual Dispatch Override Panel
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Intervene directly in battery inverter dispatch schedule with SCADA audit logging.
            </p>
          </div>
        </div>
        <Chip variant={canOverrideDispatch ? 'success' : 'danger'} size="sm">
          {canOverrideDispatch ? 'Authorized (Operator)' : 'Read-Only Role'}
        </Chip>
      </div>

      {!canOverrideDispatch ? (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300">
            <span className="font-bold">Elevated Privilege Required:</span> Your current role ({role}) does not have write access to trigger physical inverter dispatches. Switch to <strong>Operator</strong> or <strong>Engineer</strong> in the top header.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Dispatch Mode
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as BatteryAction)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="discharge">Forced Discharge (Inject)</option>
                <option value="charge">Forced Charge (Absorb)</option>
                <option value="hold">Hold / Idle Mode</option>
              </select>
            </div>

            <div>
              <Input
                label="Target Power (MW)"
                type="number"
                min={0}
                max={40}
                step={0.5}
                value={powerMW}
                onChange={(e) => setPowerMW(parseFloat(e.target.value))}
                required
              />
            </div>

            <div>
              <Input
                label="Duration (Minutes)"
                type="number"
                min={15}
                max={240}
                step={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                required
              />
            </div>
          </div>

          <div>
            <Input
              label="Audit Log Justification / Directive Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. CAISO Emergency Alert, High Local Inverter Temp..."
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <label className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={interlockConfirmed}
                onChange={(e) => setInterlockConfirmed(e.target.checked)}
                className="rounded border-zinc-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <span>Verify Thermal & Frequency Interlock Limits before arming SCADA line</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAction('discharge');
                setPowerMW(25.0);
                setInterlockConfirmed(false);
                setFeedback(null);
              }}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={!interlockConfirmed || isSubmitting}
              isLoading={isSubmitting}
            >
              Arm & Execute Dispatch Override
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
