export const corridorRegistry = {
    "MX-US": {
        corridorId: "MX-US",
        supportedCurrencies: ["MXN", "USD"],
        maxDeliveryMs: 60000,
        fallbackSpeed: "next_day",
        feeAttribution: "split",
    },
    "JP-US": {
        corridorId: "JP-US",
        supportedCurrencies: ["JPY", "USD"],
        maxDeliveryMs: 50000,
        fallbackSpeed: "standard",
        feeAttribution: "receiver",
    }
};
