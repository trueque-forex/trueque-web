// src/protocol/matching/MatchEngine.ts

console.log('✅ MatchEngine.ts loaded');
export function match() {
  return {
    sender: { id: 'A', country: 'MX', amount: 100 },
    receiver: { id: 'B', country: 'US', amount: 100 }
  };
}

export function matchSenders(
  sender: { id: string; country: string; amount: number },
  receiver: { id: string; country: string; amount: number }
) {
  return { sender, receiver };
}
