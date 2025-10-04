"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchConfirmationScreen = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_i18next_1 = require("react-i18next");
const match_1 = require("../lib/services/match");
const RateIntegrityCard_1 = require("../components/RateIntegrityCard");
const RateIntegrityCardSimple_1 = require("../components/RateIntegrityCardSimple");
const MatchConfirmationScreen = ({ route }) => {
    const { matchId, userRole, userProfile } = route.params; // 'sender' or 'receiver'
    const { t } = (0, react_i18next_1.useTranslation)();
    const [integrityData, setIntegrityData] = (0, react_1.useState)(null);
    const [viewMode, setViewMode] = (0, react_1.useState)(userProfile.literacyLevel === 'low' || userProfile.isFirstTime ? 'simple' : 'detailed');
    (0, react_1.useEffect)(() => {
        async function loadIntegrity() {
            const data = await (0, match_1.fetchRateIntegrity)(matchId);
            setIntegrityData(data);
        }
        loadIntegrity();
    }, [matchId]);
    if (!integrityData)
        return (0, jsx_runtime_1.jsx)(react_native_1.ActivityIndicator, {});
    const view = userRole === 'sender'
        ? {
            fx_rate_market: integrityData.fx_rate_market,
            rate: integrityData.bid_rate,
            effective_rate: integrityData.effective_rate_user_A,
            fee_breakdown: {
                trueque_fee: integrityData.trueque_fee_A,
                transmitter_fee: integrityData.transmitter_fee_A,
                delivery_premium: integrityData.delivery_premium_A,
                total: integrityData.total_fee_A,
                country_model: integrityData.country_model_A,
                delivery_choice: integrityData.delivery_choice_A
            }
        }
        : {
            fx_rate_market: integrityData.fx_rate_market,
            rate: integrityData.ask_rate,
            effective_rate: integrityData.effective_rate_user_B,
            fee_breakdown: {
                trueque_fee: integrityData.trueque_fee_B,
                transmitter_fee: integrityData.transmitter_fee_B,
                delivery_premium: integrityData.delivery_premium_B,
                total: integrityData.total_fee_B,
                country_model: integrityData.country_model_B,
                delivery_choice: integrityData.delivery_choice_B
            }
        };
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { padding: 16 }, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: { fontSize: 20, fontWeight: 'bold' }, children: ["\u2705 ", t('match.confirmed')] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { marginVertical: 8 }, children: t('match.message') }), (0, jsx_runtime_1.jsx)(react_native_1.Button, { title: viewMode === 'detailed' ? t('match.simplify') : t('match.details'), onPress: () => setViewMode(viewMode === 'detailed' ? 'simple' : 'detailed') }), viewMode === 'simple' ? ((0, jsx_runtime_1.jsx)(RateIntegrityCardSimple_1.RateIntegrityCardSimple, { fx_rate_market: view.fx_rate_market, user_rate: view.rate, fee_total: view.fee_breakdown.total, userRole: userRole })) : ((0, jsx_runtime_1.jsx)(RateIntegrityCard_1.RateIntegrityCard, { fx_rate_market: view.fx_rate_market, user_rate: view.rate, effective_rate: view.effective_rate, fee_breakdown: view.fee_breakdown, userRole: userRole }))] }));
};
exports.MatchConfirmationScreen = MatchConfirmationScreen;
//# sourceMappingURL=MatchConfirmationScreen.js.map