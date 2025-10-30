// src/protocol/matching/TestHarness.ts
export type Party = { id: string; country?: string; amount?: number; [k: string]: any };
export type MatchResult = { sender: Party; receiver: Party; success?: boolean; [k: string]: any };

export function match(a?: Party, b?: Party): MatchResult {
  if (!a && !b) {
    return { sender: { id: 'A' }, receiver: { id: 'B' }, success: true };
  }
  return {
    sender: a ?? { id: 'A' },
    receiver: b ?? { id: 'B' },
    success: true,
  };
}

export function matchSenders(sender: Party, receiver?: Party): MatchResult {
  return {
    sender: sender ?? { id: 'X' },
    receiver: receiver ?? { id: 'Y' },
    success: true,
  };
}

export default { match, matchSenders };