'use client';

import React, { useState } from 'react';
import { Button, Input, Modal } from '@/components/common';
import { dispatchApi } from '@/lib/api';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useRole } from '@/hooks';

interface OverridePanelProps {
  initialAssetId?: string;
  initialAssetName?: string;
  initialWindow?: string;
  horizonHours: number;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: (message: string) => void;
}

export function OverridePanel({
  initialAssetId = 'ind-vat-2',
  initialAssetName = 'Textile Finishing Dye-Vat #2',
  initialWindow = '11:30 – 15:00',
  horizonHours,
  isOpen = false,
  onClose,
  onSuccess,
}: OverridePanelProps) {
  const { role } = useRole();
  const assetName = initialAssetName;
  const [proposedWindow, setProposedWindow] = useState(initialWindow);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await dispatchApi.submitManualOverride({
        actionId: `override-${Date.now()}`,
        assetId: initialAssetId,
        assetName: assetName,
        originalWindow: initialWindow,
        proposedWindow: proposedWindow,
        horizonHours,
        overrideType: 'shift',
        rejectionReason: reason,
        operatorNotes: `Authorized by ${role}`,
      });
      if (!res.success || !res.plan?.run_id) {
        throw new Error(res.message || 'The backend failed to apply the requested schedule override.');
      }
      onSuccess?.(res.message);
      onClose?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Override failed. No changes were applied.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose?.()}
      title="Manual Dispatch Override & Constraint Validation"
      description={`Asset: ${assetName} • Currently scheduled: ${initialWindow}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs text-[var(--text-primary)]">
        <Input label="Requested horizon slots" value={proposedWindow} onChange={(e) => setProposedWindow(e.target.value)} helperText="Use slot HH:00 - HH:00 within the asset operating window." />
        <Input label="Reason / notes (optional)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Scheduled maintenance window" />
        {error && (
          <div role="alert" className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-semibold text-red-200">Override Rejected</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Warning Interlock */}
        <div className="p-3 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[11px] text-[var(--text-muted)] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--accent-solar)] shrink-0 mt-0.5" />
          <p>
            A shift saves a new demo plan. Review the returned schedule and metrics before using it for any decision.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-hairline)]">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="solar"
            size="sm"
            isLoading={isSubmitting}
          >
            Shift schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
