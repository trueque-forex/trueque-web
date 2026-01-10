import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext'; // Import Auth Hook

// Types
interface SwapIntent {
    amount: number;
    currencyFrom: string;
    currencyTo: string;
    rate: number;
    timeFrame?: number | string;
    provider?: string;
    offerType?: 'bank' | 'retail_voucher' | 'wallet' | 'merchant_voucher';
}

interface BeneficiaryData {
    personal: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
    };
    banking: {
        deliveryMethod: string;
        cbu: string;
        alias: string;
        bankName: string;
        accountType: string;
        cardNumber: string; // For privacy, maybe only last4 in real app, but full for now as per previous code
        walletProvider: string;
        walletId: string;
        iban?: string;           // Optional: EU
        accountNumber?: string;  // Optional: US/MX
        cardExpiry?: string;     // Optional: Card
        cvv?: string;            // Optional: Card
        clabe?: string;          // Optional: MX
    };
    // NEW: Support for Delivery Switcher Persistence
    saved_methods?: Record<string, any>;
}

interface UserStats {
    successfulSwaps: number;
}

interface SwapContextType {
    swapIntent: SwapIntent | null;
    setSwapIntent: (intent: SwapIntent) => void;
    beneficiary: BeneficiaryData;
    setBeneficiary: (data: React.SetStateAction<BeneficiaryData>) => void;
    updateBeneficiary: (part: Partial<BeneficiaryData['personal']> | Partial<BeneficiaryData['banking']>) => void;
    userStats: UserStats;
    validateSwapLimit: (amount: number, currencyCode?: string) => { allowed: boolean; reason?: string };
    savedBeneficiaries: BeneficiaryData[];
    saveCurrentBeneficiary: () => void;
    editingIndex: number | null;
    setEditingIndex: (index: number | null) => void;
    resetFlow: () => void; // New Reset Method
}

const defaultBeneficiary: BeneficiaryData = {
    personal: { firstName: '', lastName: '', phone: '', email: '' },
    banking: {
        deliveryMethod: 'bank_rtp',
        cbu: '', alias: '', bankName: '', accountType: 'savings',
        cardNumber: '', walletProvider: '', walletId: '',
        iban: '', accountNumber: '', cardExpiry: '', cvv: '', clabe: ''
    }
};

const SwapContext = createContext<SwapContextType | undefined>(undefined);

export const SwapProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth(); // Access User State
    const [swapIntent, setSwapIntentState] = useState<SwapIntent | null>(null);
    const [beneficiary, setBeneficiary] = useState<BeneficiaryData>(defaultBeneficiary);
    // NEW USER GUARDRAIL STATE
    const [userStats, setUserStats] = useState<UserStats>({ successfulSwaps: 0 }); // Default to New User
    // BENEFICIARY PERSISTENCE
    const [savedBeneficiaries, setSavedBeneficiaries] = useState<BeneficiaryData[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Persistence: Load from SessionStorage on Mount
    useEffect(() => {
        const savedIntent = sessionStorage.getItem('trueque_swap_intent');
        const savedBeneficiary = sessionStorage.getItem('trueque_beneficiary_data');

        if (savedIntent) {
            try { setSwapIntentState(JSON.parse(savedIntent)); } catch { }
        }
        if (savedBeneficiary) {
            try { setBeneficiary(prev => ({ ...prev, ...JSON.parse(savedBeneficiary) })); } catch { }
        }

        // Mock: Retrieve user stats and beneficiaries from local storage
        const savedStats = localStorage.getItem('trueque_user_stats');
        if (savedStats) {
            try { setUserStats(JSON.parse(savedStats)); } catch { }
        }

        // Initial Load from LocalStorage (Fallback)
        const savedBens = localStorage.getItem('trueque_saved_beneficiaries');
        if (savedBens) {
            try { setSavedBeneficiaries(JSON.parse(savedBens)); } catch { }
        }
    }, []);

    // NEW: Sync from API on Login
    useEffect(() => {
        if (user) {
            console.log("SwapContext: User logged in, fetching beneficiaries...");
            fetch('/api/beneficiaries')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        // Parse API format to Internal Format (if needed, but usually matches)
                        // API returns flat-ish structure. Map it if needed.
                        // Current API returns { id, personal..., banking... } structure?
                        // Lets check the API GET again.
                        // API GET: { id, user_id, name, country, method, identifiers: {...}, saved_methods: {...} }
                        // Context expects: { personal: { firstName... }, banking: { ... }, saved_methods }

                        const mapped = data.map((b: any) => {
                            // Heuristic Name Split
                            const [first, ...rest] = (b.name || '').split(' ');
                            const last = rest.join(' ');

                            return {
                                id: b.id, // Keep ID for updates
                                personal: {
                                    firstName: first || '',
                                    lastName: last || '',
                                    phone: b.identifiers?.phone_number || '', // Map Check
                                    email: b.identifiers?.email || ''
                                },
                                banking: {
                                    deliveryMethod: b.method,
                                    bankName: b.identifiers?.bank_name || '',
                                    accountNumber: b.identifiers?.account_number || '',
                                    cbu: b.identifiers?.cbu || '',
                                    alias: b.identifiers?.alias || '',
                                    walletProvider: b.identifiers?.wallet_provider || '',
                                    walletId: b.identifiers?.wallet_id || '', // Check backend naming?
                                    // ... map others
                                    accountType: 'checking', // Default or fetch
                                    iban: b.identifiers?.iban || '',
                                    clabe: b.identifiers?.clabe || '',
                                    cardNumber: b.identifiers?.card_number || ''
                                },
                                saved_methods: b.saved_methods
                            };
                        });

                        setSavedBeneficiaries(mapped);
                        localStorage.setItem('trueque_saved_beneficiaries', JSON.stringify(mapped));
                    }
                })
                .catch(err => console.error("Failed to fetch beneficiaries", err));
        }
    }, [user]);

    // Persistence: Save to SessionStorage on Change
    const setSwapIntent = (intent: SwapIntent) => {
        setSwapIntentState(intent);
        sessionStorage.setItem('trueque_swap_intent', JSON.stringify(intent));
    };

    // GUARDRAIL LOGIC
    const validateSwapLimit = (amount: number, currencyCode: string = 'USD') => {
        if (userStats.successfulSwaps === 0) {
            // Normalize to USD for strict checking
            const getApproximateUSD = (amt: number, code: string) => {
                // Handle complex formats "Argentina-ARS" or just "ARS"
                const cleanCode = code.includes('-') ? code.split('-')[1] : code;
                const c = (cleanCode || 'USD').toUpperCase();

                // Conservatively safe rates for limit checking
                const rates: Record<string, number> = {
                    'ARS': 0.0010, // ~1000 ARS = 1 USD (Conservative)
                    'EUR': 1.10,   // 1 EUR = 1.1 USD
                    'USD': 1.0,
                    'BRL': 0.20,   // 5 BRL = 1 USD
                    'MXN': 0.06,   // 16 MXN = 1 USD
                    'COP': 0.00025,
                    'BOB': 0.15,
                    'VES': 0.00001,
                    'GTQ': 0.13,
                    'CLP': 0.0012,
                    'PEN': 0.27
                };
                const rate = rates[c] || 1.0; // Default 1:1 if unknown
                return amt * rate;
            };

            const usdValue = getApproximateUSD(amount, currencyCode);

            // Strict $200 USD Limit
            if (usdValue > 200) {
                return {
                    allowed: false,
                    reason: `New Account Limit: Your first swap is capped at $200.00 USD for security.`
                };
            }
        }
        return { allowed: true };
    };

    // SAVE BENEFICIARY
    const saveCurrentBeneficiary = () => {
        if (!beneficiary.personal.firstName) return;

        setSavedBeneficiaries(prev => {
            // 1. UPDATE MODE
            if (editingIndex !== null && prev[editingIndex]) {
                const newList = [...prev];
                newList[editingIndex] = beneficiary;
                localStorage.setItem('trueque_saved_beneficiaries', JSON.stringify(newList));
                return newList;
            }

            // 2. CREATE MODE (Avoid duplicates based on CBU/Alias/Email)
            const exists = prev.some(b =>
                (b.banking.cbu && b.banking.cbu === beneficiary.banking.cbu) ||
                (b.personal.email && b.personal.email === beneficiary.personal.email)
            );

            if (exists) return prev;

            const newList = [...prev, beneficiary];
            localStorage.setItem('trueque_saved_beneficiaries', JSON.stringify(newList));
            return newList;
        });
    };

    // Wrapper for setBeneficiary to ensure persistence
    const setBeneficiaryWrapper: typeof setBeneficiary = (value) => {
        setBeneficiary(prev => {
            const definedValue = value instanceof Function ? value(prev) : value;
            sessionStorage.setItem('trueque_beneficiary_data', JSON.stringify(definedValue));
            return definedValue;
        });
    };

    // RESET FLOW
    const resetFlow = () => {
        setSwapIntentState(null);
        setBeneficiary(defaultBeneficiary);
        sessionStorage.removeItem('trueque_swap_intent');
        sessionStorage.removeItem('trueque_beneficiary_data');
        localStorage.removeItem('trueque_swap_state_persistent');
    };

    return (
        <SwapContext.Provider value={{
            swapIntent,
            setSwapIntent,
            beneficiary,
            setBeneficiary: setBeneficiaryWrapper,
            updateBeneficiary: () => { }, // Deprecated, use setBeneficiary
            userStats,
            validateSwapLimit,
            savedBeneficiaries,
            saveCurrentBeneficiary,
            editingIndex,
            setEditingIndex,
            resetFlow // Exported
        }}>
            {children}
        </SwapContext.Provider>
    );
};

export const useSwap = () => {
    const context = useContext(SwapContext);
    if (context === undefined) {
        throw new Error('useSwap must be used within a SwapProvider');
    }
    return context;
};
