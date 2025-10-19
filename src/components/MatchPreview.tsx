import React, { useEffect, useMemo, useState, useRef } from "react";
import axios, { AxiosResponse } from "axios";
import crypto from "crypto";

/** Types */
type PreviewPayload = {
  matchId: string;
  previewHash: string;
  senderCountry: string;
  senderCurrency: string; // e.g. "NGN"
  recipientCountry: string;
  recipientCurrency: string; // e.g. "GHS"
  senderAmount: number;
  estimatedDeliveredAmount: number;
  feeBreakdown: { transmitterFee: number; fxMarginPercent: number; railFee: number };
  ttlExpiresAt: string; // ISO
  localeHint?: string; // optional locale hint like "en-NG" or "en-GB"
};

type OrchestrationResponse = {
  orchestrationId: string;
  transmitterOrderId?: string;
  status: "CONFIRM_PENDING" | "ORDER_CREATED" | "SENT" | "SETTLED" | "FAILED";
};

type SignedReceipt = {
  matchId: string;
  transmitterOrderId: string;
  rail: string;
  debitTimestamp: string;
  creditTimestamp: string;
  amountSent: number;
  amountDelivered: number;
  amountSentCurrency?: string;
  amountDeliveredCurrency?: string;
  feeBreakdown: { transmitterFee: number; fxMargin: number; railFee: number };
  fxRate: { baseRate: number; appliedRate: number; source: string };
  signedBy: string;
  signature: string;
  canonical?: string;
};

type MatchEvent =
  | { type: "order.created"; transmitterOrderId: string; timestamp: string }
  | { type: "order.sent"; transmitterOrderId: string; debitTimestamp: string }
  | { type: "order.settled"; receipt: SignedReceipt }
  | { type: "order.failed"; code: string; reason: string };

/** Config / Utilities (replace / secure for production) */
const API_BASE = process.env.REACT_APP_API_BASE ?? "https://api.trueque.example";
const WS_BASE = process.env.REACT_APP_WS_BASE ?? "wss://api.trueque.example/ws";
const AUTH_TOKEN = () => localStorage.getItem("tq_token") ?? "";

function generateIdempotencyKey(matchId: string, userId: string): string {
  const payload = `${matchId}:${userId}:${Date.now()}:${Math.random()}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/** Currency formatter: accepts currency code and optional locale hint */
function formatCurrency(value: number, currency: string, localeHint?: string) {
  try {
    const nf = new Intl.NumberFormat(localeHint ?? undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
    return nf.format(value);
  } catch (e) {
    // fallback to simple formatting
    return `${currency} ${value.toFixed(2)}`;
  }
}

/** Placeholder signature verifier (replace with real cryptography) */
async function verifySignedReceipt(receipt: SignedReceipt): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 50));
  return !!receipt.signature;
}

/** FinalConfirmation component */
function FinalConfirmation({
  preview,
  signedReceipt,
  timeline,
  onClose,
}: {
  preview: PreviewPayload;
  signedReceipt: SignedReceipt | null;
  timeline: Array<{ label: string; ts?: string }>;
  onClose: () => void;
}) {
  return (
    <div className="final-confirmation card" style={{ border: "1px solid #ddd", padding: 12 }}>
      <h3>Final Confirmation</h3>

      <section style={{ marginBottom: 8 }}>
        <strong>Match</strong>: {preview.matchId}
        <div>
          <strong>Sender</strong>: {preview.senderCountry} —{" "}
          {formatCurrency(preview.senderAmount, preview.senderCurrency, preview.localeHint)}
        </div>
        <div>
          <strong>Estimated Delivered</strong>:{" "}
          {formatCurrency(preview.estimatedDeliveredAmount, preview.recipientCurrency, preview.localeHint)}
        </div>
      </section>

      <section style={{ marginBottom: 8 }}>
        <h4>Timeline</h4>
        <ul>
          {timeline.map((t, i) => (
            <li key={i}>
              <span>{t.label}</span> {t.ts ? <small> — {new Date(t.ts).toISOString()}</small> : null}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 8 }}>
        <h4>Signed Receipt</h4>
        {signedReceipt ? (
          <>
            <div>
              <strong>Transmitter Order</strong>: {signedReceipt.transmitterOrderId}
            </div>
            <div>
              <strong>Rail</strong>: {signedReceipt.rail}
            </div>
            <div>
              <strong>Amount Sent</strong>:{" "}
              {formatCurrency(
                signedReceipt.amountSent,
                signedReceipt.amountSentCurrency ?? preview.senderCurrency,
                preview.localeHint
              )}
            </div>
            <div>
              <strong>Amount Delivered</strong>:{" "}
              {formatCurrency(
                signedReceipt.amountDelivered,
                signedReceipt.amountDeliveredCurrency ?? preview.recipientCurrency,
                preview.localeHint
              )}
            </div>
            <div>
              <strong>Debit</strong>: {new Date(signedReceipt.debitTimestamp).toISOString()}
            </div>
            <div>
              <strong>Credit</strong>: {new Date(signedReceipt.creditTimestamp).toISOString()}
            </div>
            <div>
              <strong>Signature</strong>: <code style={{ wordBreak: "break-all" }}>{signedReceipt.signature}</code>
            </div>
            <details>
              <summary>Full JSON</summary>
              <pre style={{ maxHeight: 400, overflow: "auto" }}>{JSON.stringify(signedReceipt, null, 2)}</pre>
            </details>
          </>
        ) : (
          <div>No signed receipt available yet.</div>
        )}
      </section>

      <div style={{ marginTop: 8 }}>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/** Main component: MatchPreview wired to FinalConfirmation (dynamic currencies) */
export default function MatchPreview({
  preview,
  userId,
  onPersistLedger,
}: {
  preview: PreviewPayload;
  userId: string;
  onPersistLedger?: (payload: any) => Promise<void>;
}) {
  const [status, setStatus] = useState<OrchestrationResponse | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [signedReceipt, setSignedReceipt] = useState<SignedReceipt | null>(null);
  const [timeline, setTimeline] = useState<Array<{ label: string; ts?: string }>>([
    { label: "Preview generated", ts: new Date().toISOString() },
  ]);
  const wsRef = useRef<WebSocket | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const matchExpired = useMemo(() => new Date(preview.ttlExpiresAt) < new Date(), [preview.ttlExpiresAt]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  function appendTimeline(label: string, ts?: string) {
    setTimeline((t) => [...t, { label, ts }]);
  }

  async function openWsSubscription(matchId: string) {
    if (wsRef.current) return;
    const ws = new WebSocket(`${WS_BASE}/matches/${matchId}?token=${encodeURIComponent(AUTH_TOKEN())}`);
    wsRef.current = ws;
    ws.addEventListener("message", (ev) => {
      try {
        const parsed: { type: string; payload: any } = JSON.parse(ev.data);
        handleMatchEvent(parsed.type as string, parsed.payload);
      } catch (e) {
        console.error("ws parse error", e);
      }
    });
    ws.addEventListener("close", () => {
      wsRef.current = null;
    });
  }

  function handleMatchEvent(type: string, payload: any) {
    switch (type) {
      case "order.created":
        setStatus((s) => ({ ...(s ?? { orchestrationId: preview.matchId, status: "ORDER_CREATED" }), transmitterOrderId: payload.transmitterOrderId, status: "ORDER_CREATED" }));
        appendTimeline("Order created by transmitter", payload.timestamp ?? new Date().toISOString());
        break;
      case "order.sent":
        setStatus((s) => ({ ...(s ?? { orchestrationId: preview.matchId, status: "SENT" }), status: "SENT" }));
        appendTimeline("Funds debited", payload.debitTimestamp ?? new Date().toISOString());
        break;
      case "order.settled":
        setStatus((s) => ({ ...(s ?? { orchestrationId: preview.matchId, status: "SETTLED" }), status: "SETTLED" }));
        const receipt: SignedReceipt = payload.receipt;
        setSignedReceipt(receipt);
        appendTimeline("Funds settled", receipt.creditTimestamp);
        (async () => {
          const verified = await verifySignedReceipt(receipt);
          appendTimeline(verified ? "Receipt signature verified" : "Receipt verification failed", new Date().toISOString());
          try {
            if (onPersistLedger) {
              await onPersistLedger({ preview, receipt, verified });
            }
          } catch (err) {
            console.error("ledger persist failed", err);
          }
        })();
        break;
      case "order.failed":
        setStatus((s) => ({ ...(s ?? { orchestrationId: preview.matchId, status: "FAILED" }), status: "FAILED" }));
        appendTimeline(`Order failed: ${payload.reason}`, new Date().toISOString());
        break;
      default:
        console.warn("Unknown match event", type);
    }
  }

  async function callConfirm() {
    if (matchExpired) {
      appendTimeline("Attempted confirm but preview TTL expired", new Date().toISOString());
      return;
    }
    setIsConfirming(true);
    appendTimeline("User confirmed match", new Date().toISOString());

    const idempotencyKey = generateIdempotencyKey(preview.matchId, userId);
    idempotencyKeyRef.current = idempotencyKey;

    try {
      await openWsSubscription(preview.matchId);

      const resp: AxiosResponse<OrchestrationResponse> = await axios.post(
        `${API_BASE}/v1/matches/${preview.matchId}/confirm`,
        {
          matchId: preview.matchId,
          initiatorUserId: userId,
          previewHash: preview.previewHash,
        },
        {
          headers: {
            Authorization: `Bearer ${AUTH_TOKEN()}`,
            "Idempotency-Key": idempotencyKey,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const orchestration = resp.data;
      setStatus(orchestration);
      appendTimeline(`Orchestration ${orchestration.status}`, new Date().toISOString());
      if (orchestration.transmitterOrderId) {
        appendTimeline("Provider acknowledged order", new Date().toISOString());
      }
    } catch (err: any) {
      console.error("confirm error", err);
      appendTimeline("Confirm call failed", new Date().toISOString());
      setStatus({ orchestrationId: preview.matchId, status: "FAILED" });
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="match-preview card" style={{ border: "1px solid #eee", padding: 12 }}>
      <h3>Match Preview</h3>

      <div style={{ marginBottom: 8 }}>
        <div>
          <strong>Match</strong>: {preview.matchId}
        </div>
        <div>
          <strong>Sender</strong>: {preview.senderCountry} —{" "}
          {formatCurrency(preview.senderAmount, preview.senderCurrency, preview.localeHint)}
        </div>
        <div>
          <strong>Estimated Delivered</strong>:{" "}
          {formatCurrency(preview.estimatedDeliveredAmount, preview.recipientCurrency, preview.localeHint)}
        </div>
        <div>
          <strong>Fees</strong>: transmitter {formatCurrency(preview.feeBreakdown.transmitterFee, preview.senderCurrency, preview.localeHint)} + rail fee{" "}
          {formatCurrency(preview.feeBreakdown.railFee, preview.senderCurrency, preview.localeHint)}
        </div>
        <div>
          <strong>Expires</strong>: {new Date(preview.ttlExpiresAt).toLocaleString()}
          {matchExpired ? <span style={{ color: "red" }}> — expired</span> : null}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={callConfirm} disabled={isConfirming || matchExpired}>
          {isConfirming ? "Confirming…" : "Confirm and Send"}
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>Orchestration Status</h4>
        <div>{status ? status.status : "Preview only"}</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>Timeline</h4>
        <ul>
          {timeline.map((t, i) => (
            <li key={i}>
              <span>{t.label}</span> {t.ts ? <small> — {new Date(t.ts).toLocaleString()}</small> : null}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 20 }}>
        <FinalConfirmation
          preview={preview}
          signedReceipt={signedReceipt}
          timeline={timeline}
          onClose={() => {
            window.location.href = "/app/dashboard";
          }}
        />
      </div>
    </div>
  );
}
