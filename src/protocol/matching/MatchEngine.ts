export function match() {
  console.log('✅ match() called');
  return {
    sender: { id: 'A', country: 'MX', amount: 100 },
    receiver: { id: 'B', country: 'US', amount: 100 }
  };
}
export function matchSenders(sender: any, receiver: any) {
  console.log('✅ matchSenders() called');
  return { sender, receiver };
}
