import { matchSenders } from "./MatchEngine";
import { logMatchAudit } from "../audit/AuditLogger";
import { MatchAuditEntry } from "../audit/AuditSchema";

// 🧪 Test 1: Standard match
function testStandardMatch() {
  const senderA = {
    senderId: "mx_001",
    amount: 1000,
    currency: "MXN",
    deliverySpeed: "instant",
    estimatedDeliveryMs: 25000,
  };

  const senderB = {
    senderId: "us_002",
    amount: 60,
    currency: "USD",
    deliverySpeed: "instant",
    estimatedDeliveryMs: 40000,
  };

  const match = matchSenders(senderA, senderB);
  const auditEntry: MatchAuditEntry = { ...match, timestamp: new Date().toISOString() };
  logMatchAudit(auditEntry);
}

// 🧪 Test 2: Dual SLA breach
function testDualBreach() {
  const senderA = {
    senderId: "mx_003",
    amount: 1000,
    currency: "MXN",
    deliverySpeed: "instant",
    estimatedDeliveryMs: 90000,
  };

  const senderB = {
    senderId: "us_004",
    amount: 60,
    currency: "USD",
    deliverySpeed: "instant",
    estimatedDeliveryMs: 85000,
  };

  const match = matchSenders(senderA, senderB);
  const auditEntry: MatchAuditEntry = { ...match, timestamp: new Date().toISOString() };
  logMatchAudit(auditEntry);
}

// 🧪 Test 3: Mixed delivery speeds
function testMixedSpeeds() {
  const senderA = {
    senderId: "mx_005",
    amount: 1000,
    currency: "MXN",
    deliverySpeed: "instant",
    estimatedDeliveryMs: 25000,
  };

  const senderB = {
    senderId: "us_006",
    amount: 60,
    currency: "USD",
    deliverySpeed: "next_day",
    estimatedDeliveryMs: 40000,
  };

  const match = matchSenders(senderA, senderB);
  const auditEntry: MatchAuditEntry = { ...match, timestamp: new Date().toISOString() };
  logMatchAudit(auditEntry);
}

// 🧪 Test 4: Unsupported currency
function testUnsupportedCurrency() {
  const senderA = {
    senderId: "mx_007",
    amount: 1000,
    currency: "MXN",
    deliverySpeed: "instant",
    estimatedDeliveryMs: 25000,
  };

  const senderB = {
    senderId: "jp_008",
    amount: 8000,
    currency: "JPY",
    deliverySpeed: "instant",
    estimatedDeliveryMs: 30000,
  };

  const match = matchSenders(senderA, senderB);
  const auditEntry: MatchAuditEntry = { ...match, timestamp: new Date().toISOString() };
  logMatchAudit(auditEntry);
}

// 🚀 Run all tests
testStandardMatch();
testDualBreach();
testMixedSpeeds();
testUnsupportedCurrency();