// src/utils/generateUserId.ts

export function generateUserId({
  year,
  countryCode,
  corridorCode,
  sequenceNumber,
}: {
  year: number // e.g. 2025
  countryCode: number // ISO numeric, e.g. 076 for Brazil
  corridorCode: number // e.g. 01 for BR-US
  sequenceNumber: number // e.g. 42
}): string {
  const YY = String(year).slice(-2)
  const CC = String(countryCode).padStart(3, '0')
  const RR = String(corridorCode).padStart(2, '0')
  const UUUUUU = String(sequenceNumber).padStart(6, '0')

  const baseId = `${YY}${CC}${RR}${UUUUUU}`

  // Simple checksum: sum of digits mod 10
  const checksum = baseId
    .split('')
    .map(Number)
    .reduce((sum, digit) => sum + digit, 0) % 10

  return `${baseId}-${checksum}`
}
