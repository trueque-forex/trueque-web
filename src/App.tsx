import { useState } from "react";
import RecipientOnboarding from "./components/RecipientOnboarding";
import RecipientForm from "./components/RecipientForm";
import TransactionHistory from "./components/TransactionHistory";
import ComplianceDashboard from "./components/ComplianceDashboard";

export default function App() {
  const [savedRecipients, setSavedRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const handleNewTransaction = (tx) => {
    setTransactions((prev) => [tx, ...prev]);
  };

  return (
    <div className="p-6 space-y-10">
      <RecipientOnboarding
        savedRecipients={savedRecipients}
        setSavedRecipients={setSavedRecipients}
        setSelectedRecipient={setSelectedRecipient}
      />

      {selectedRecipient && (
        <RecipientForm
          selectedRecipient={selectedRecipient}
          onNewTransaction={handleNewTransaction}
        />
      )}

      <TransactionHistory transactions={transactions} />
      <ComplianceDashboard transactions={transactions} />
    </div>
  );
}