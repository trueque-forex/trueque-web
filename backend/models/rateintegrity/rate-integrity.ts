export function validateRateIntegrity(rate: {
  corridor: string;
  baseRate: number;
  fee: number;
  total: number;
}): boolean {
  return Math.abs(rate.baseRate + rate.fee - rate.total) < 0.001;
}