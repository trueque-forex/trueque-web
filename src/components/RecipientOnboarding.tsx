type Props = {
  savedRecipients: RecipientProfile[];
  setSavedRecipients: (r: RecipientProfile[]) => void;
  setSelectedRecipient: (r: RecipientProfile) => void;
};

export default function RecipientOnboarding({ savedRecipients, setSavedRecipients, setSelectedRecipient }: Props) {
  // ...existing form logic...

  return (
    <>
      {/* Onboarding form */}
      {savedRecipients.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Saved Recipients</h3>
          <ul className="space-y-2">
            {savedRecipients.map((r, i) => (
              <li key={i} className="p-3 bg-gray-100 rounded border">
                <div><strong>Sender:</strong> {r.sender_name} ({r.email})</div>
                <div><strong>Recipient:</strong> {r.recipient_name} ({r.relationship})</div>
                <button
                  onClick={() => setSelectedRecipient(r)}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Use for Payout
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}