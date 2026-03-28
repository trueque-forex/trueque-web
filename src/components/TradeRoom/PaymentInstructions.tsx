
import { PaymentInstructions as PaymentInstructionsType } from '@/types/trade';

interface InstructionProps {
    data: PaymentInstructionsType;
}

export const PaymentInstructions = ({ data }: InstructionProps) => {
    if (!data) return null;

    const isVoucher = data.rail === 'RETAILER_API' || !!data.voucher_code;

    return (
        <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${isVoucher ? 'border-green-500' : 'border-blue-500'}`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                    {isVoucher ? 'Redeem Voucher' : `Pay with ${data.rail}`}
                </h3>
                {isVoucher && (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase">
                        Success
                    </span>
                )}
            </div>

            {isVoucher ? (
                /* State A: Voucher */
                <div className="space-y-4">
                    <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-200 text-center">
                        <p className="text-sm text-gray-500 mb-2 uppercase tracking-widest font-bold">Voucher Code</p>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-3xl font-mono font-bold text-gray-900 break-all">
                                {data.voucher_code}
                            </span>
                            <button
                                onClick={() => data.voucher_code && navigator.clipboard.writeText(data.voucher_code)}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy Code
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Retailer:</span>
                        <span className="font-bold text-gray-800">{data.bank_name}</span>
                    </div>
                    <p className="text-center text-green-700 font-medium">
                        Present this code at any {data.bank_name} checkout.
                    </p>
                </div>
            ) : (
                /* State B: Bank Transfer */
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Recipient:</span>
                        <span className="font-mono font-medium">{data.bank_name}</span>
                    </div>

                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <span className="text-gray-500">Number/Account:</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold tracking-wider text-blue-600">
                                {data.account_identifier}
                            </span>
                            <button
                                onClick={() => navigator.clipboard.writeText(data.account_identifier)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Copy to clipboard"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-yellow-50 p-3 rounded border border-yellow-100">
                        <span className="text-yellow-700 font-bold">Concept / Memo:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-lg font-bold text-gray-900">
                                {data.concept_code}
                            </span>
                            <button
                                onClick={() => navigator.clipboard.writeText(data.concept_code)}
                                className="p-1 hover:bg-yellow-200 rounded transition-colors"
                                title="Copy to clipboard"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-blue-600 italic mt-2 animate-pulse">
                        Transfer funds to start matching engine.
                    </p>
                </div>
            )}

            {/* The Dynamic Step-by-Step Guide */}
            <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 italic">
                    {data.step_by_step}
                </p>
            </div>
        </div>
    );
};
