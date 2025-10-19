import { useRouter } from 'next/router';

export default function PreviewPage() {
  const router = useRouter();
  const {
    from, to, amountSender, delivery, marketRate,
    truequeFee, transmitterFee, totalCost,
    recipientAmount, costIncrease, userId
  } = router.query;

  const rate = parseFloat(marketRate as string);
  const inverseRate = 1 / rate;

  const handleConfirm = () => {
    alert(`✅ Transaction confirmed: ${amountSender} ${from} sent to ${to}.`);
    router.push('/history');
  };

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">📄 Transaction Preview</h1>
      <p><strong>Trueque ID:</strong> {userId}</p>
      <p><strong>From:</strong> {from}</p>
      <p><strong>To:</strong> {to}</p>
      <p><strong>Amount to Send:</strong> {amountSender} {from}</p>
      <p><strong>Delivery Method:</strong> {delivery}</p>

      <div className="mt-4 border p-4 rounded bg-gray-50 space-y-2">
        <p><strong>Market Rate:</strong> 1 {from} = {rate.toFixed(4)} {to}</p>
        <p><strong>Inverse Rate:</strong> 1 {to} = {inverseRate.toFixed(4)} {from}</p>
        <p><strong>Estimated to Receive (at Market Rate):</strong> {recipientAmount} {to}</p>
        <p><strong>Trueque Fee:</strong> {truequeFee} {from}</p>
        <p><strong>Transmitter Fee:</strong> {transmitterFee} {from}</p>
        <p><strong>Total Cost to Sender:</strong> {totalCost} {from}</p>
        <p><strong>Amount to Receive After Fees:</strong> {recipientAmount} {to}</p>
        <p><strong>Cost Increase:</strong> {costIncrease}%</p>
      </div>

      <button onClick={handleConfirm} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mt-4">
        Confirm & Send
      </button>
    </main>
  );
}
