'use client';

import React, { useState } from 'react';
import { Button, Input, Modal } from '@/components/common';
import { dispatchApi } from '@/lib/api';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { useRole } from '@/hooks';

interface OverridePanelProps {
  initialAssetId?: string;
  initialAssetName?: string;
  initialWindow?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: (message: string) => void;
}

export function OverridePanel({
  initialAssetId = 'ind-vat-2',
  initialAssetName = 'Textile Finishing Dye-Vat #2',
  initialWindow = '11:30 – 15:00',
  isOpen = false,
  onClose,
  onSuccess,
}: OverridePanelProps) {
  const { role } = useRole();
  const assetName = initialAssetName;
  const [proposedWindow, setProposedWindow] = useState('13:30 – 17:00');
  const [overrideAction, setOverrideAction] = useState<'approve' | 'shift' | 'reject'>('shift');
  const [rejectionReason, setRejectionReason] = useState('Customer rush order requires earlier batch run');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const REASONS = [
    'Customer rush delivery deadline',
    'Unplanned machine calibration / maintenance window',
    'Grid operator feeder curtailment request',
    'Facility rooftop solar inverter thermal throttling',
    'Factory shift change schedule constraint',
  ];

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
        overrideType: overrideAction,
        rejectionReason: overrideAction === 'reject' || overrideAction === 'shift' ? rejectionReason : undefined,
        operatorNotes: `Authorized by ${role}`,
      });
      onSuccess?.(res.message);
      onClose?.();
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
        {/* Action Choice */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
            Override Action Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setOverrideAction('approve')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                overrideAction === 'approve'
                  ? 'border-[var(--accent-clean)] bg-[var(--accent-clean)]/15 text-[var(--text-primary)] shadow-sm'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-base)] text-[var(--text-muted)]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-[var(--accent-clean)]" />
              <div className="font-bold">Approve Plan</div>
              <span className="text-[10px] text-[var(--text-muted)]">Lock optimal slot</span>
            </button>

            <button
              type="button"
              onClick={() => setOverrideAction('shift')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                overrideAction === 'shift'
                  ? 'border-[var(--accent-solar)] bg-[var(--accent-solar)]/15 text-[var(--text-primary)] shadow-sm'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-base)] text-[var(--text-muted)]'
              }`}
            >
              <Clock className="w-4 h-4 mx-auto mb-1 text-[var(--accent-solar)]" />
              <div className="font-bold">Shift Window</div>
              <span className="text-[10px] text-[var(--text-muted)]">Re-slot execution</span>
            </button>

            <button
              type="button"
              onClick={() => setOverrideAction('reject')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                overrideAction === 'reject'
                  ? 'border-[var(--accent-stress)] bg-[var(--accent-stress)]/15 text-[var(--text-primary)] shadow-sm'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-base)] text-[var(--text-muted)]'
              }`}
            >
              <XCircle className="w-4 h-4 mx-auto mb-1 text-[var(--accent-stress)]" />
              <div className="font-bold">Cancel / Reject</div>
              <span className="text-[10px] text-[var(--text-muted)]">Hold asset idle</span>
            </button>
          </div>
        </div>

        {/* Time Window (if shift) */}
        {overrideAction === 'shift' && (
          <Input
            label="Requested New Run Window"
            value={proposedWindow}
            onChange={(e) => setProposedWindow(e.target.value)}
            helperText="Must satisfy minimum duration without violating shift deadline."
          />
        )}

        {/* Rejection / Shift Reason */}
        {(overrideAction === 'reject' || overrideAction === 'shift') && (
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
              Rejection / Operational Reason Prompt
            </label>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-solar)]"
            >
              {REASONS.map((r) => (
                <option key={r} value={r} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Warning Interlock */}
        <div className="p-3 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[11px] text-[var(--text-muted)] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--accent-solar)] shrink-0 mt-0.5" />
          <p>
            Manual overrides trigger immediate re-convergence of the MILP solver across other enrolled assets. Shifting this asset away from peak solar hours may increase monthly demand tariff charges.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-hairline)]">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={overrideAction === 'reject' ? 'stress' : 'solar'}
            size="sm"
            isLoading={isSubmitting}
          >
            Confirm & Broadcast Override
          </Button>
        </div>
      </form>
    </Modal>
  );
}
