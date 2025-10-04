"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRateIntegrity = fetchRateIntegrity;
const axios_1 = __importDefault(require("axios"));
async function fetchRateIntegrity(matchId) {
    const response = await axios_1.default.get(`/api/match/${matchId}/integrity`);
    return response.data;
}
//# sourceMappingURL=match.js.map