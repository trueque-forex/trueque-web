import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useMarket } from '../../context/MarketContext';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'] 
});

// ─── Browser-safe SID generator ───────────────────────────────────────────────
function browserChecksum(payload: string): string {
  const chars = payload.trim().toUpperCase();
  let h = 0x811c9dc5;
  for (let i = 0; i < chars.length; i++) {
    h ^= chars.charCodeAt(i);
    h = (Math.imul(h, 0x01000193) >>> 0);
  }
  return (Math.abs(h % 36)).toString(36).toUpperCase();
}
function generateSID(countryCode = 'MX', seq = 1): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear().toString();
  const mm   = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd   = String(now.getUTCDate()).padStart(2, '0');
  const seqStr = String(seq).padStart(4, '0');
  const cc   = countryCode.toUpperCase().slice(0, 2);
  const payload = `S${yyyy}${mm}${dd}${cc}${seqStr}`;
  return `${payload}${browserChecksum(payload)}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const USD_TO_MXN = 17.32;
// Phase 1 (Voucher): ZERO user fees.
// Revenue = retailer_wholesale_margin (B2B procurement discount agreed with partner).
// SYMMETRI_SWAP_FEE_PCT (1.5%) applies ONLY to Phase 2 P2P swaps — never in Phase 1.

// ─────────────────────────────────────────────────────────────────────────────
// 🎯  CHANGE THIS ONE LINE TO REBRAND THE ENTIRE DEMO FOR A NEW RETAILER
//     Use the short id, NOT the display name. Available ids:
//     abarrey · alsuper · calimax · casaley · chedraui · dunosusa · elflorido
//     fbenavides · fahorro · fguadalajara · heb · kiosko · lacomer
//     merco · merza · oxxo · smart · soriana · walmart
const TARGET_RETAILER = 'merco'; // ← swap this id to rebrand the whole demo
// ─────────────────────────────────────────────────────────────────────────────

const ORCHESTRATION_STEPS = [
  { icon: '🔐', label: 'Autenticando identidad del remitente…'           },
  { icon: '📡', label: 'Obteniendo tasa de mercado en tiempo real…'      },
  { icon: '⚖️',  label: 'Tasa bloqueada — sin diferencial aplicado'       },
  { icon: '🏦', label: 'Registrando instrucción de cobro…'                },
  { icon: '📲', label: 'Notificando al beneficiario en México…'           },
  { icon: '🎫', label: 'Emitiendo vale de circuito cerrado Symmetri…'    },
];

const RETAILERS = [
  { id: 'abarrey',      name: 'Abarrey',               flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Hermosillo, Son.',  category: 'Supermercado' },
  { id: 'aki',          name: 'AKI',                   flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Mérida, Yuc.',      category: 'Supermercado' },
  { id: 'alsuper',      name: 'Alsuper',               flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Hermosillo, Son.',  category: 'Supermercado' },
  { id: 'calimax',      name: 'Calimax',               flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Tijuana, BC',       category: 'Supermercado' },
  { id: 'casaley',      name: 'Casa Ley',              flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Culiacán, Sin.',    category: 'Supermercado' },
  { id: 'chedraui',     name: 'Chedraui',              flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Nacional',          category: 'Supermercado' },
  { id: 'dunosusa',     name: 'Dunosusa Abarrotes',    flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Mérida, Yuc.',      category: 'Abarrotes'    },
  { id: 'elflorido',    name: 'El Florido',            flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Tijuana, BC',       category: 'Supermercado' },
  { id: 'fbenavides',   name: 'Farmacias Benavides',   flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Monterrey, NL',     category: 'Farmacia'     },
  { id: 'fahorro',      name: 'Farmacias del Ahorro',  flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Nacional',          category: 'Farmacia'     },
  { id: 'fguadalajara', name: 'Farmacias Guadalajara', flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Guadalajara, Jal.', category: 'Farmacia'     },
  { id: 'heb',          name: 'HEB',                   flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Monterrey, NL',     category: 'Supermercado' },
  { id: 'kiosko',       name: 'Kiosko',                flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Colima / Jalisco',  category: 'Conveniencia' },
  { id: 'lacomer',      name: 'La Comer',              flag: '\ud83c\uddf2\ud83c\uddfd', city: 'CDMX',              category: 'Supermercado' },
  { id: 'merco',        name: 'Merco Supermercado',    flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Apodaca, NL',       category: 'Supermercado' },
  { id: 'merza',        name: 'Merza',                 flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Morelia, Mich.',    category: 'Supermercado' },
  { id: 'oxxo',         name: 'OXXO',                  flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Nacional',          category: 'Conveniencia' },
  { id: 'smart',        name: 'S-Mart',                flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Chihuahua, Chih.',  category: 'Supermercado' },
  { id: 'soriana',      name: 'Soriana',               flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Nacional',          category: 'Supermercado' },
  { id: 'walmart',      name: 'Walmart MX',            flag: '\ud83c\uddf2\ud83c\uddfd', city: 'Nacional',          category: 'Supermercado' },
  { id: 'exito',        name: 'Grupo Éxito',           flag: '🇨🇴', city: 'Nacional',          category: 'Supermercado' },
  { id: 'latorre',      name: 'Supermercados La Torre',flag: '🇬🇹', city: 'Nacional',          category: 'Supermercado' },
  { id: 'sirena',       name: 'Sirena',                flag: '🇩🇴', city: 'Nacional',          category: 'Supermercado' },
];

// ─── Barcode: dark bars on white — clearly visible ────────────────────────────
function Barcode() {
  const pattern = [4,2,6,2,4,2,2,6,4,2,6,4,2,2,4,6,2,4,6,2,4,2,6,4,2,4,6,2,4,2,6,4];
  return (
    <div style={{ background: '#fff', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
      {pattern.map((w, i) => (
        <div key={i} style={{
          width: i % 2 === 0 ? w : Math.max(w - 2, 1),
          background: i % 2 === 0 ? '#0f172a' : '#fff',
          height: `${70 + (i % 5) * 5}%`,
          borderRadius: 1,
          flexShrink: 0,
        }} />
      ))}
    </div>
  );
}

export default function RetailerDemo() {
  const { originMarket, destRegion } = useMarket();
  const isES = originMarket === 'ES';

  const [step, setStep]             = useState<1 | 2 | 3>(1);
  const [amount, setAmount]         = useState('200');
  const [phone, setPhone]           = useState('');
  
  // Dynamic market variables mapped from bilateral origin + dest state
  let targetId = TARGET_RETAILER;
  let originText = 'EE.UU.';
  let destText = 'México';
  let srcCurrency = 'USD';
  let destCurrency = 'MXN';
  let currencyRate = USD_TO_MXN;
  let countryCode = 'MX';

  if (isES) {
    originText = 'Europa';
    srcCurrency = 'EUR';
    if (destRegion === 'DO') {
      targetId = 'sirena';
      destText = 'República Dominicana';
      destCurrency = 'DOP';
      currencyRate = 63.00;
      countryCode = 'DO';
    } else { // Default to CO for ES
      targetId = 'exito';
      destText = 'Colombia';
      destCurrency = 'COP';
      currencyRate = 4250.50;
      countryCode = 'CO';
    }
  } else {
    originText = 'EE.UU.';
    srcCurrency = 'USD';
    if (destRegion === 'DO') {
      targetId = 'sirena';
      destText = 'República Dominicana';
      destCurrency = 'DOP';
      currencyRate = 59.00;
      countryCode = 'DO';
    } else if (destRegion === 'GT') {
      targetId = 'latorre';
      destText = 'Guatemala';
      destCurrency = 'GTQ';
      currencyRate = 7.80;
      countryCode = 'GT';
    } else { // Default to MX for US
      targetId = TARGET_RETAILER;
      destText = 'México';
      destCurrency = 'MXN';
      currencyRate = USD_TO_MXN;
      countryCode = 'MX';
    }
  }

  const retailer = RETAILERS.find(r => r.id === targetId) ?? RETAILERS[0];

  const [logVisible, setLogVisible] = useState<number[]>([]);
  const [sid, setSid]               = useState('');
  const timerRef                    = useRef<ReturnType<typeof setTimeout>[]>([]);

  const usdAmt = parseFloat(amount) || 0;
  // Phase 1: beneficiary always receives FULL face value. No deduction from user.
  const localAmt = usdAmt * currencyRate;

  useEffect(() => () => { timerRef.current.forEach(clearTimeout); }, []);

  function startOrchestration() {
    setStep(2);
    setLogVisible([]);
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];

    ORCHESTRATION_STEPS.forEach((_, i) => {
      const t = setTimeout(() => setLogVisible(prev => [...prev, i]), i * 620);
      timerRef.current.push(t);
    });

    const finish = setTimeout(() => {
      setSid(generateSID(countryCode, Math.floor(Math.random() * 8000) + 1000));
      setStep(3);
    }, ORCHESTRATION_STEPS.length * 620 + 500);
    timerRef.current.push(finish);
  }

  function reset() {
    timerRef.current.forEach(clearTimeout);
    setStep(1);
    setLogVisible([]);
    setPhone('');
    setAmount('200');
    // retailer is constant — no reset needed
  }

  // ─── Symmetri.org color tokens ───────────────────────────────────────────────
  const blue     = '#3b4aad';   // brand blue (from logo + highlights)
  const navy     = '#0f172a';   // headings / CTA button bg
  const body     = '#475569';   // body text
  const muted    = '#94a3b8';   // secondary labels
  const pageBg   = '#e8eaf6';   // hero tinted bg matching symmetri.org
  const cardBg   = '#ffffff';   // card surface
  const border   = '#e2e8f0';   // card border
  const green    = '#16a34a';   // success
  const greenBg  = '#f0fdf4';
  const greenBdr = '#bbf7d0';

  // Shared input style — larger font
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 10,
    border: `1.5px solid ${border}`, fontSize: 17, fontFamily: 'inherit',
    color: navy, outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
    transition: 'border-color .15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 700, color: muted,
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
  };

  return (
    <>
      <Head>
        <title>Symmetri — Demo para Tiendas</title>
        <meta name="description" content={`Symmetri: envíos ${originText}→${destText} sin comisión — demo para socios comerciales`} />
      </Head>

      <div className={plusJakarta.className} style={{ minHeight: '100vh', background: pageBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>

        {/* Sandbox badge */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 18px', borderRadius: 100, background: '#fff', border: `1px solid ${border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: body, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sandbox en Vivo — No es Asesoría Financiera</span>
        </div>

        {/* Cards — flex row; value panel slides in as a sibling card at Step 3 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>

        {/* Left: Voucher card */}
        <div style={{ width: step === 1 ? 820 : 460, flexShrink: 0, background: cardBg, borderRadius: 20, border: `1px solid ${border}`, boxShadow: '0 4px 24px rgba(59,74,173,0.10), 0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }}>

          {/* Header */}
          <div style={{ padding: '30px 34px 24px', borderBottom: `1px solid ${border}`, textAlign: 'center' }}>
            {/* Logo mark */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: blue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 800 }}>S</div>
              <span style={{ fontSize: 22, fontWeight: 800, color: navy, letterSpacing: '-0.02em' }}>Symmetri</span>
              <span style={{ color: muted, fontWeight: 300, fontSize: 20 }}>×</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: blue, letterSpacing: '-0.01em' }}>{retailer.name}</span>
            </div>
            <p style={{ fontSize: 14, color: muted, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
              {originText} → {destText} · Vale Electrónico
            </p>

            {/* Step progress */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 }}>
              {[1,2,3].map(s => (
                <React.Fragment key={s}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, transition: 'all .4s',
                    background: step === s ? blue : step > s ? green : border,
                    color: step >= s ? '#fff' : muted,
                    transform: step === s ? 'scale(1.12)' : 'scale(1)',
                  }}>
                    {step > s ? '✓' : s}
                  </div>
                  {s < 3 && <div style={{ width: 36, height: 2, background: step > s ? green : border, transition: 'background .4s' }} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── STEP 1: Sender Form — Landscape two-column layout ─────────────── */}
          {step === 1 && (
            <div style={{ padding: '26px 34px 32px' }}>
              {/* Title row — spans full width */}
              <h2 style={{ fontSize: 20, fontWeight: 700, color: navy, textAlign: 'center', margin: '0 0 5px' }}>
                Envía dinero a las cajas de {retailer.name}
              </h2>
              <p style={{ fontSize: 15, color: body, textAlign: 'center', margin: '0 0 22px', lineHeight: 1.5 }}>
                Tú envías desde {originText} — tu familia recibe en su teléfono y redime en la tienda. Sin comisiones y a la tasa cambiaria del mercado.
              </p>

              {/* ── Two-column landscape body ─────────────────────────────────────── */}
              <div style={{ display: 'flex', gap: 26, alignItems: 'flex-start' }}>

                {/* LEFT column: retailer panel + amount */}
                <div style={{ flex: 1, minWidth: 0 }}>

                  {/* Dedicated partner display */}
                  <div style={{
                    marginBottom: 20, padding: '13px 16px', borderRadius: 10,
                    background: `${blue}08`, border: `1.5px solid ${blue}25`,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ fontSize: 28, lineHeight: 1 }}>{retailer.flag}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: navy, letterSpacing: '-0.01em' }}>
                        {retailer.name}
                      </div>
                      <div style={{ fontSize: 13, color: muted, marginTop: 2 }}>
                        {retailer.category} · {retailer.city}
                      </div>
                    </div>
                    <div style={{
                      padding: '5px 12px', borderRadius: 20,
                      background: `${blue}15`, border: `1px solid ${blue}30`,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: blue, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                        Socio
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ marginBottom: 0 }}>
                    <label style={labelStyle}>Monto a Enviar ({srcCurrency})</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: muted, fontWeight: 700, fontSize: 17 }}>{isES ? '€' : '$'}</span>
                      <input
                        id="demo-amount"
                        type="number" value={amount} min="20" max="2000"
                        onChange={e => {
                          const num = parseFloat(e.target.value);
                          setAmount(!isNaN(num) && num > 2000 ? '2000' : e.target.value);
                        }}
                        style={{ ...inputStyle, paddingLeft: 32 }}
                        required
                      />
                    </div>
                    <p style={{ fontSize: 12, color: muted, margin: '6px 0 0', fontStyle: 'italic' }}>
                      Envío típico {originText} → {countryCode}: 20 – 2,000 por transacción
                    </p>
                    {usdAmt > 0 && (
                      <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: greenBg, border: `1px solid ${greenBdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: green }}>El beneficiario recibe</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: green, fontFamily: 'monospace' }}>
                          {destCurrency}${localAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vertical divider */}
                <div style={{ width: 1, alignSelf: 'stretch', background: border, flexShrink: 0 }} />

                {/* RIGHT column: phone + fee breakdown + CTA */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Phone */}
                  <div>
                    <label style={labelStyle}>Teléfono del Beneficiario ({destText})</label>
                    <input
                      id="demo-phone"
                      type="tel" placeholder={countryCode === 'CO' ? "+57 300 123 4567" : countryCode === 'DO' ? "+1 809 123 4567" : countryCode === 'GT' ? "+502 1234 5678" : "+52 664 123 4567"}
                      value={phone} onChange={e => setPhone(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>

                  {/* Phase 1 fee transparency */}
                  <div style={{ padding: '14px 16px', borderRadius: 10, background: '#f8fafc', border: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: body, marginBottom: 8 }}>
                      <span>Tasa de mercado (en vivo)</span>
                      <span style={{ fontFamily: 'monospace', color: navy, fontWeight: 600 }}>1 {srcCurrency} = {currencyRate} {destCurrency}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: body, marginBottom: 8 }}>
                      <span>Diferencial cambiario</span>
                      <span style={{ color: green, fontWeight: 700 }}>$0.00 — Cero</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: body, marginBottom: 8 }}>
                      <span>Comisión al usuario</span>
                      <span style={{ color: green, fontWeight: 700 }}>$0.00 — Gratis</span>
                    </div>
                    <div style={{ borderTop: `1px solid ${border}`, paddingTop: 10, marginTop: 2, display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                      <span style={{ fontWeight: 700, color: navy }}>El beneficiario recibe</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: usdAmt >= 20 ? green : muted }}>
                        {usdAmt >= 20 ? `${destCurrency}$${localAmt.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div>
                    <button
                      id="demo-route-btn"
                      disabled={!phone || usdAmt < 20}
                      onClick={startOrchestration}
                      style={{
                        width: '100%', padding: '15px', borderRadius: 10, border: 'none',
                        background: (!phone || usdAmt < 20) ? '#cbd5e1' : navy,
                        color: '#fff', fontFamily: 'inherit', fontSize: 17, fontWeight: 700,
                        cursor: (!phone || usdAmt < 20) ? 'not-allowed' : 'pointer', transition: 'all .15s',
                      }}
                    >
                      Envía fondos a {retailer.name} →
                    </button>
                    {usdAmt < 20 && usdAmt > 0 && (
                      <p style={{ textAlign: 'center', fontSize: 14, color: '#f59e0b', marginTop: 8, fontWeight: 600 }}>
                        El monto mínimo es $20.00 USD
                      </p>
                    )}
                  </div>

                </div>
              </div>{/* end two-column */}
            </div>
          )}

          {/* ── STEP 2: Orchestration ───────────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ padding: '30px 34px 36px' }}>
              <div style={{ textAlign: 'center', marginBottom: 26 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: `${blue}15`, border: `1px solid ${blue}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>⚡</div>
                <h2 style={{ fontSize: 21, fontWeight: 700, color: navy, margin: '0 0 5px' }}>Planificando la Transferencia</h2>
                <p style={{ fontSize: 15, color: body, margin: 0 }}>
                  Enviando {usdAmt.toFixed(2)} {srcCurrency} a {retailer.name}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ORCHESTRATION_STEPS.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10,
                    background: logVisible.includes(i) ? greenBg : '#f8fafc',
                    border: `1px solid ${logVisible.includes(i) ? greenBdr : border}`,
                    opacity: logVisible.includes(i) ? 1 : 0.3,
                    transform: `translateX(${logVisible.includes(i) ? 0 : -8}px)`,
                    transition: 'all 0.4s ease',
                  }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: logVisible.includes(i) ? navy : muted, flex: 1 }}>{s.label}</span>
                    {logVisible.includes(i) && <span style={{ fontSize: 14, fontWeight: 700, color: green }}>✓</span>}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 22 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: blue, animation: `bounce 1s ${i * 0.15}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Voucher Issued ──────────────────────────────────────────────── */}
          {step === 3 && (
            <div style={{ padding: '22px 28px 28px' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: greenBg, border: `2px solid ${greenBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 10px' }}>✅</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: navy, margin: '0 0 4px' }}>¡Vale Emitido!</h2>
                <p style={{ fontSize: 14, color: body, margin: 0 }}>
                  Vale digital a ser redimido en cualquiera de las cajas de <strong style={{ color: blue }}>{retailer.name}</strong>.
                </p>
              </div>

              {/* Voucher card */}
              <div style={{ borderRadius: 12, border: `1.5px solid ${border}`, overflow: 'hidden', marginBottom: 14, boxShadow: '0 2px 12px rgba(59,74,173,0.08)' }}>
                <div style={{ padding: '14px 18px', background: navy, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Vale Symmetri</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'monospace', lineHeight: 1 }}>
                      {destCurrency}${localAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Redimible en</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>{retailer.name}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{retailer.flag} {retailer.city}</div>
                  </div>
                </div>
                <div style={{ padding: '14px 18px', background: cardBg, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <Barcode />
                  <div style={{ padding: '6px 14px', borderRadius: 6, background: '#f1f5f9', border: `1px solid ${border}`, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>ID Privado Symmetri (SID)</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, color: navy, fontSize: 16, letterSpacing: '0.14em' }}>{sid}</div>
                  </div>
                </div>
                <div style={{ padding: '8px 18px', background: '#f8fafc', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: muted }}>
                  <span>Tasa fija: 1 {srcCurrency} = {currencyRate} {destCurrency}</span>
                  <span style={{ color: green, fontWeight: 700 }}>Sin comisión ✓</span>
                </div>
              </div>

              {/* Cashier instruction */}
              <div style={{ padding: '11px 14px', borderRadius: 9, background: `${blue}0a`, border: `1px solid ${blue}25`, fontSize: 14, color: body, marginBottom: 18 }}>
                📲 <strong style={{ color: blue }}>Cajero:</strong> Escanea el código o ingresa el SID para liberar {destCurrency}${localAmt.toFixed(2)}.
              </div>

              <button onClick={reset} style={{ width: '100%', background: 'none', border: 'none', fontSize: 14, color: muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, textDecoration: 'underline' }}>
                ← Hacer Otra Demostración
              </button>
            </div>
          )}
        </div> {/* end left voucher card */}

        {/* Right: Business case card — independent sibling, slides in when voucher confirms */}
        {step === 3 && (
          <div style={{
            width: 420, flexShrink: 0,
            background: cardBg, borderRadius: 20,
            border: `1px solid ${border}`,
            boxShadow: '0 4px 24px rgba(59,74,173,0.10), 0 1px 4px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            animation: 'slideInRight 0.45s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {/* Header */}
            <div style={{ padding: '16px 22px', background: navy, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>📈</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  ¿Qué significa esto para {retailer.name}?
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Propuesta de valor · {retailer.city}</div>
              </div>
            </div>

            {/* Value props */}
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '🚶', title: 'Tráfico garantizado',                   desc: 'Cada vale lleva un comprador a tu tienda — con intención de compra certificada.' },
                { icon: '🛒', title: 'Mayor Monto de compra',                desc: 'Los beneficiarios gastan más del valor del vale. Tú capturas la venta adicional.' },
                { icon: '⚡',    title: 'Liquidación el mismo día (T+0)',       desc: 'Usando pagos instantáneos locales. Sin retrasos en conciliación.' },
                { icon: '🎯', title: 'Cero costo de adquisición de clientes', desc: `Symmetri adquiere al remitente en ${originText}. Tú recibes al comprador — sin costo.` },
                { icon: '📦', title: 'Optimización de inventario y uso de empleados', desc: 'Anticipa la demanda antes de que llegue a tus cajas.' },
                { icon: '🧠', title: 'Inteligencia del consumidor',           desc: 'Datos anónimos sobre qué, cuándo y dónde compran los beneficiarios — para planeación de demanda y personal.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${blue}12`, border: `1px solid ${blue}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: navy, marginBottom: 3 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: body, lineHeight: 1.55 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div style={{ padding: '13px 22px', background: `${blue}08`, borderTop: `1px solid ${blue}20`, textAlign: 'center' }}>
              <span style={{ fontSize: 13, color: blue, fontWeight: 700 }}>Conviértete en socio de Symmetri → </span>
              <a href="https://symmetri.org" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: blue, fontWeight: 800, textDecoration: 'underline' }}>symmetri.org</a>
            </div>
          </div>
        )}

        </div> {/* end cards container */}

        {/* Footer */}
        <p style={{ marginTop: 20, fontSize: 13, color: muted, textAlign: 'center' }}>
          Symmetri actúa únicamente como planeador tecnológico. No custodia ni retiene fondos. © 2026 Symmetri.
        </p>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
          @keyframes slideInRight { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        `}</style>
      </div>
    </>
  );
}
