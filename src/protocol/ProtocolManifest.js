export const protocolManifest = {
    "MX-US": {
        corridorId: "MX-US",
        deliverySpeeds: ["instant", "next_day"],
        fallbackRules: [
            "Fallback to next_day if SLA breached",
            "Split fee attribution between sender and receiver"
        ],
        breachFlags: [
            "SLA_BREACH_A",
            "SLA_BREACH_B",
            "SPEED_MISMATCH",
            "UNSUPPORTED_CURRENCY_A",
            "UNSUPPORTED_CURRENCY_B"
        ],
        feeAttribution: "split",
        auditFields: [
            "matchId",
            "corridorId",
            "breachFlags",
            "fallbackUsed",
            "feeAttribution",
            "timestamp"
        ]
    },
    "JP-US": {
        corridorId: "JP-US",
        deliverySpeeds: ["instant", "standard"],
        fallbackRules: [
            "Fallback to standard if unsupported speed",
            "Receiver pays fee if fallback triggered"
        ],
        breachFlags: [
            "SLA_BREACH_A",
            "SLA_BREACH_B",
            "UNSUPPORTED_CORRIDOR"
        ],
        feeAttribution: "receiver",
        auditFields: [
            "matchId",
            "corridorId",
            "breachFlags",
            "fallbackUsed",
            "feeAttribution",
            "timestamp"
        ]
    }
};
