import { useState, useMemo } from 'react';

// --- HELPER: FINANCIAL MATH ---
function calculateBreakdown(amountSent: number, amountReceived: number, totalFee: number) {
    const absoluteCost = totalFee;
    const rawRate = amountReceived / amountSent;
    
    // Effective Rate = Amount Received / (Amount Swapped + Fees)
    const totalInput = amountSent + totalFee;
    const effectiveRate = amountReceived / totalInput;

    const costIncreasePct = ((rawRate - effectiveRate) / rawRate) * 100;

    return { absoluteCost, rawRate, effectiveRate, costIncreasePct };
}

export default function Home() {
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [responseLog, setResponseLog] = useState<string>('');
  const [lastOfferId, setLastOfferId] = useState<string>('');
  const [mySwaps, setMySwaps] = useState<any[]>([]);
  const [currentViewUser, setCurrentViewUser] = useState<string>('');

  // CONFIG: Your Real User IDs
  const SWAPPER_A_ID = '6979be29-1878-462e-a8db-652db70bc7a2'; 
  const SWAPPER_B_ID = '014a429d-db7a-475a-9a3f-e816dfc73185'; 

  // --- LIVE QUOTE DATA WITH DETAILED FEES ---
  const quoteData = {
    swap: 1000.00,
    currencySwap: 'USD',
    receive: 920.00,
    currencyReceive: 'EUR',
    fees: {
        inbound: 0.50,
        gateway: 0.50,
        liquidity: 1.00,
        network: 1.00, 
        outbound: 0.50,
        symmetri: 1.50
    }
  };

  const totalFee = Object.values(quoteData.fees).reduce((a, b) => a + b, 0);

  const stats = useMemo(() => 
    calculateBreakdown(quoteData.swap, quoteData.receive, totalFee), 
  [quoteData, totalFee]);

  // --- ACTION 1: CREATE SWAP ---
  async function handleCreateTestOffer() {
    setStatus('LOADING');
    setResponseLog('Creating Swap Proposal...');
    try {
      const res = await fetch('/api/offers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: SWAPPER_A_ID,
          swap_type: 'SWAP_USD',       
          amount_offered: quoteData.swap,     
          currency_offered: quoteData.currencySwap,
          amount_wanted: quoteData.receive,       
          currency_wanted: quoteData.currencyReceive,
          exchange_rate: stats.rawRate,
          fee_total: totalFee,
          fee_details: quoteData.fees 
        }),
      });
      const data = await res.json();
      setResponseLog(JSON.stringify(data, null, 2));
      if (res.ok) {
        setStatus('SUCCESS');
        setLastOfferId(data.offer.id); 
        handleListSwaps(SWAPPER_A_ID);
      } else {
        setStatus('ERROR');
      }
    } catch (error: any) {
      setStatus('ERROR');
      setResponseLog(error.toString());
    }
  }

  // --- ACTION 2: ACCEPT SWAP ---
  async function handleAcceptOffer() {
    if (!lastOfferId) return alert('Please create a swap proposal first.');
    setStatus('LOADING');
    setResponseLog(`Attempting to Match Swap ${lastOfferId}...`);
    try {
      const res = await fetch('/api/matches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: lastOfferId, taker_id: SWAPPER_B_ID }),
      });
      const data = await res.json();
      setResponseLog(JSON.stringify(data, null, 2));
      if (res.ok) {
        setStatus('SUCCESS');
        handleListSwaps(SWAPPER_B_ID); 
      } else {
        setStatus('ERROR');
      }
    } catch (error: any) {
      setStatus('ERROR');
      setResponseLog(error.toString());
    }
  }

  // --- HELPER: LIST SWAPS ---
  async function handleListSwaps(userId: string) {
    setCurrentViewUser(userId);
    try {
      const res = await fetch(`/api/matches/list?user_id=${userId}`);
      const data = await res.json();
      if (data.success) setMySwaps(data.swaps);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Symmetri Developer Console</h1>
      <p>Test the full lifecycle: Proposal &rarr; Handshake &rarr; Secure Trade Room.</p>
      <hr style={{ margin: '2rem 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '2rem' }}>
        
        {/* SWAPPER A CARD */}
        <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
            <h3>1. Swapper A (The Proposal)</h3>
            <div style={{ background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#666' }}>You Swap:</span>
                    <strong>{quoteData.swap} {quoteData.currencySwap}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#666' }}>Beneficiary Receives:</span>
                    <strong>{quoteData.receive} {quoteData.currencyReceive}</strong>
                </div>
                <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0' }}></div>
                <div style={{ fontSize: '0.85em', color: '#666' }}>
                    <FeeRow label="Inbound Fee" amount={quoteData.fees.inbound} />
                    <FeeRow label="Gateway Fee" amount={quoteData.fees.gateway} />
                    <FeeRow label="Liquidity Fee" amount={quoteData.fees.liquidity} />
                    <FeeRow label="VisaDirect/MCSend" amount={quoteData.fees.network} />
                    <FeeRow label="Outbound Fee" amount={quoteData.fees.outbound} />
                    <FeeRow label="Symmetri Fee" amount={quoteData.fees.symmetri} />
                    <div style={{ borderTop: '1px solid #eee', margin: '5px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#d32f2f' }}>
                        <span>Total Fees:</span>
                        <span>${totalFee.toFixed(2)}</span>
                    </div>
                </div>
                <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}>
                    <span>Mid-Market Rate:</span>
                    <span>{stats.rawRate.toFixed(4)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', fontWeight: 'bold', marginTop: '5px' }}>
                    <span>Effective Rate:</span>
                    <span style={{ color: '#2e7d32' }}>{stats.effectiveRate.toFixed(4)}</span>
                </div>
            </div>
            <button onClick={handleCreateTestOffer} style={buttonStyle}>Confirm & Create</button>
        </div>

        {/* SWAPPER B CARD */}
        <div style={{ background: '#e6f7ff', padding: '1rem', borderRadius: '8px', border: '1px solid #91d5ff' }}>
            <h3>2. Swapper B (The Handshake)</h3>
            <p style={{fontSize: '0.9rem'}}>Review the breakdown before accepting.</p>
            <input 
                type="text" value={lastOfferId} onChange={(e) => setLastOfferId(e.target.value)}
                placeholder="Proposal ID..." style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
            />
            <button onClick={handleAcceptOffer} style={{ ...buttonStyle, background: '#0050b3' }}>Accept Swap</button>
        </div>
      </div>

      {/* DASHBOARD */}
      <div style={{ marginTop: '2rem' }}>
        <h3>3. Symmetrical Dashboard</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
          <button onClick={() => handleListSwaps(SWAPPER_A_ID)} style={currentViewUser === SWAPPER_A_ID ? activeBtn : secondaryBtn}>
            View as Swapper A
          </button>
          <button onClick={() => handleListSwaps(SWAPPER_B_ID)} style={currentViewUser === SWAPPER_B_ID ? activeBtn : secondaryBtn}>
            View as Swapper B
          </button>
        </div>

        {mySwaps.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid #ddd' }}>
            <thead style={{ background: '#f9f9f9' }}>
              <tr>
                <th style={thStyle}>Swap ID</th>
                <th style={thStyle}>You Swapped</th>
                <th style={thStyle}>&harr;</th>
                <th style={thStyle}>Beneficiary Receives</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {mySwaps.map((swap) => (
                <tr key={swap.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{swap.id.slice(0, 8)}...</td>
                  <td style={{ ...tdStyle, color: '#d32f2f', fontWeight: 'bold' }}>-{swap.sent_amount} {swap.sent_currency}</td>
                  <td style={tdStyle}>&harr;</td>
                  <td style={{ ...tdStyle, color: '#2e7d32', fontWeight: 'bold' }}>+{swap.received_amount} {swap.received_currency}</td>
                  <td style={tdStyle}><StatusBadge status={swap.status} /></td>
                  <td style={tdStyle}>
                    {/* THIS IS THE CHANGE: LINK TO THE ROOM */}
                    <a 
                        href={`/trade/${swap.id}?viewer=${currentViewUser}`}
                        target="_blank"
                        rel="noreferrer"
                        style={roomLinkBtn}
                    >
                        {swap.status === 'COMPLETED' ? 'View Receipt' : 'Enter Room →'}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px', color: '#888' }}>
            Click a "View as" button to load data.
          </div>
        )}
      </div>

      {status !== 'IDLE' && (
        <div style={{ marginTop: '2rem', background: '#1a1a1a', color: '#52c41a', padding: '1rem', borderRadius: '8px', overflowX: 'auto' }}>
            <pre>{responseLog}</pre>
        </div>
      )}
    </div>
  );
}

function FeeRow({ label, amount }: { label: string, amount: number }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>{label}:</span>
            <span>${amount.toFixed(2)}</span>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const isDone = status === 'COMPLETED';
    return (
        <span style={{ 
            padding: '4px 8px', borderRadius: '12px', fontSize: '0.85em', fontWeight: 'bold',
            background: isDone ? '#e6fffa' : '#fff7e6',
            color: isDone ? '#006d75' : '#d46b08',
        }}>
            {status}
        </span>
    );
}

const thStyle = { padding: '12px', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '12px' };
const buttonStyle = { padding: '10px 20px', fontSize: '16px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' };
const roomLinkBtn = { display: 'inline-block', padding: '6px 12px', fontSize: '14px', background: '#101d2d', color: 'white', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' };
const secondaryBtn = { padding: '8px 16px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', color: '#333' };
const activeBtn = { ...secondaryBtn, background: '#e6f7ff', borderColor: '#1890ff', color: '#1890ff', fontWeight: 'bold' };