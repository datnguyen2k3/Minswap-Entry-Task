export function parseFraction(fraction: string): number {
  const [numerator, denominator] = fraction.split('/').map(Number);
  return numerator / denominator;
}