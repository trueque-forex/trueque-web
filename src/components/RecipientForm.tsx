type Props = {
  selectedRecipient: RecipientProfile;
  onNewTransaction: (tx: Transaction) => void;
};

export default function RecipientForm({ selectedRecipient, onNewTransaction }: Props) {
  const recipient = {
    email: selectedRecipient.email,
    country: selectedRecipient.destination_country,
    type: selectedRecipient.destination_type,
    ...selectedRecipient.destination_details,
    recipient_name: selectedRecipient.recipient_name,
    relationship: selectedRecipient.relationship,
  };

  const handleSubmit = async () => {
    const res = await fetch("http://localhost:8000/simulate-payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipient),
    });
    const data = await res.json();
    const timestamp = new Date().toLocaleString();
    onNewTransaction({ ...data, timestamp });
    alert(`✅ Payout sent via ${data.gateway}\nTransaction ID: ${data.tx_id}`);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Simulate Payout</h2>
      <div className="mb-4">
        <strong>Recipient:</strong> {recipient.recipient_name} ({recipient.relationship})
      </div>
      <button onClick={handleSubmit} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        Simulate Payout
      </button>
    </div>
  );
}