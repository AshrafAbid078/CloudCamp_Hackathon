import type { SolarDataPoint, DispatchInterval } from '../types';

/**
 * Calculates Root Mean Squared Error (RMSE) between actual and forecasted GHI
 */
export function calculateGhiRmse(data: SolarDataPoint[]): number {
  const pointsWithActual = data.filter((d) => d.ghiActual !== undefined);
  if (pointsWithActual.length === 0) return 0;

  const sumSquares = pointsWithActual.reduce((acc, point) => {
    const diff = (point.ghiActual ?? 0) - point.ghiForecast;
    return acc + diff * diff;
  }, 0);

  return Math.sqrt(sumSquares / pointsWithActual.length);
}

/**
 * Calculates Mean Absolute Percentage Error (MAPE)
 */
export function calculateGhiMape(data: SolarDataPoint[]): number {
  const validPoints = data.filter((d) => d.ghiActual !== undefined && (d.ghiActual ?? 0) > 20);
  if (validPoints.length === 0) return 0;

  const sumPct = validPoints.reduce((acc, point) => {
    const actual = point.ghiActual ?? 1;
    const err = Math.abs(actual - point.ghiForecast) / actual;
    return acc + err;
  }, 0);

  return (sumPct / validPoints.length) * 100;
}

/**
 * Calculates total projected daily revenue from dispatch schedule
 */
export function calculateDailyRevenue(intervals: DispatchInterval[]): number {
  return intervals.reduce((acc, curr) => acc + curr.projectedRevenueUSD, 0);
}
