// src/lib/api.ts (or inside your component)

export async function createOffer(offerData: {
  user_id: string; // In the real app, this comes from auth context
  swap_type: 'SWAP_USD' | 'SWAP_EUR';
  amount_offered: number;
  currency_offered: string;
  amount_wanted: number;
  currency_wanted: string;
  exchange_rate: number;
}) {
  try {
    const response = await fetch('/api/offers/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...offerData,
        // We can calculate fees here or let the backend do it. 
        // For now, let's send a placeholder or 0 if the backend handles it.
        fee_total: 0, 
        fee_details: {} 
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create offer');
    }

    console.log('Offer Created Successfully:', result.offer);
    return result.offer;

  } catch (error) {
    console.error('API Error:', error);
    alert('Error creating offer. Check console for details.');
  }
}