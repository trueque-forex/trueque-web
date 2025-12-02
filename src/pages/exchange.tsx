// src/pages/exchange.tsx
import React from 'react';
import { useRouter } from 'next/router';
import AuditPreview from '@/components/AuditPreview';

export default function ExchangePage() {
  const router = useRouter();
  const { corridor, amount, rate, sendCurrency, receiveCurrency, sender, recipient } = router.query;

  const corridorStr =
    typeof corridor === 'string' ? corridor : Array.isArray(corridor) ? corridor[0] : 'USD-MXP';

  const safeAmount = typeof amount === 'string' ? Number(amount) : typeof amount === 'number' ? amount : 0;
  const safeRate = typeof rate === 'string' ? Number(rate) : typeof rate === 'number' ? rate : 0;

  return (
    <div>
      <h1>Exchange</h1>

      <AuditPreview
        corridor={corridorStr}
        amount={(Number.isFinite(safeAmount) ? safeAmount : 0).toString()}
        rate={Number.isFinite(safeRate) ? safeRate : 0}
        sendCurrency={typeof sendCurrency === 'string' ? sendCurrency : String(sendCurrency ?? 'USD')}
        receiveCurrency={typeof receiveCurrency === 'string' ? receiveCurrency : String(receiveCurrency ?? 'MXN')}
        sender={typeof sender === 'string' ? sender : String(sender ?? 'unknown')}
        recipient={typeof recipient === 'string' ? recipient : String(recipient ?? 'unknown')}
      />
    </div>
  );
}
