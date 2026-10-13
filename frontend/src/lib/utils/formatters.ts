/**
 * Formats a number to GHI (W/m²)
 */
export function formatGhi(wattsPerM2: number): string {
  return `${Math.round(wattsPerM2)} W/m²`;
}

/**
 * Formats power in MW or kW
 */
export function formatPowerMW(mw: number, decimals: number = 1): string {
  if (Math.abs(mw) < 1 && mw !== 0) {
    return `${(mw * 1000).toFixed(0)} kW`;
  }
  return `${mw.toFixed(decimals)} MW`;
}

/**
 * Formats Energy in MWh
 */
export function formatEnergyMWh(mwh: number, decimals: number = 1): string {
  return `${mwh.toFixed(decimals)} MWh`;
}

/**
 * Formats currency in USD
 */
export function formatCurrency(amount: number, minimumFractionDigits: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formats standard ISO timestamp to readable time HH:mm
 */
export function formatTime(timestamp: string): string {
  try {
    if (timestamp.includes('T')) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return timestamp;
  } catch {
    return timestamp;
  }
}
