'use client';

import React, { useState } from 'react';
import { Button, Input, Modal } from '@/components/common';
import { dispatchApi } from '@/lib/api';
import { AlertTriangle } from 'lucide-react';
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
      onSuccess?.(res.message);
      onClose?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Override failed.');
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
        <p className="text-[var(--text-muted)]">Only whole-hour schedule shifts are supported by the backend. Approval and rejection actions are unavailable.</p>
        <Input label="Requested horizon slots" value={proposedWindow} onChange={(e) => setProposedWindow(e.target.value)} helperText="Use slot HH:00 - HH:00 within the asset operating window." />
        <label className="block text-xs">Reason for shift<textarea required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-base)] p-3" /></label>
        {error && <p role="alert" className="text-red-400">{error}</p>}

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
