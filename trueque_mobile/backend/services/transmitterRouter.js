"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const corridorWeights_1 = require("../../../trueque_mobile/lib/corridorWeights");
const defaultWeights = {
    senderConvenience: 0.25,
    cost: 0.25,
    trust: 0.25,
    speed: 0.15,
    receiverConvenience: 0.10
};
const weights = corridorWeights_1.corridorWeights[corridor] || defaultWeights;
const scored = candidates.map(tx => {
    const score = tx.senderConvenienceScore * weights.senderConvenience +
        (1 - tx.costPercent) * weights.cost +
        tx.userFacingTrustScore * weights.trust +
        tx.speedScore[deliverySpeed] * weights.speed +
        tx.receiverConvenienceScore * weights.receiverConvenience;
    return { transmitter: tx, score };
});
//# sourceMappingURL=transmitterRouter.js.map