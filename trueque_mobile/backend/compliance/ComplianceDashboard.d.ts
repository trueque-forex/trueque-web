type Transaction = {
    tx_id: string;
    gateway: string;
    status: string;
    timestamp: string;
    recipient?: string;
    relationship?: string;
};
type Props = {
    transactions: Transaction[];
};
export default function ComplianceDashboard({ transactions }: Props): any;
export {};
//# sourceMappingURL=ComplianceDashboard.d.ts.map