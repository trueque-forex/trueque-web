<<<<<<< HEAD
import { useRouter } from 'next/router'

export default function FeesPage() {
  const router = useRouter()
  const { corridor, amount, recipient } = router.query

  const parsedAmount = parseFloat(amount as string) || 0

  // Fee logic (can be updated dynamically later)
  const truequeFeeRate = 0.015 // 1.5%
  const deliveryFee = 5 // flat BRL
  const transmitterFee = corridor === 'BR-US' ? 3 : 4 // example logic

  const truequeFee = parsedAmount * truequeFeeRate
  const totalFees = truequeFee + deliveryFee + transmitterFee
  const totalCost = parsedAmount + totalFees

  // Mock rate for BR-US
  const rate = 0.18
  const estimatedReceived = parsedAmount * rate
=======
import { useRouter } from 'next/router';

export default function FeesPage() {
  const router = useRouter();
  const { corridor, amount, recipient } = router.query;

  const corridorStr =
    typeof corridor === 'string' ? corridor : Array.isArray(corridor) ? corridor[0] : undefined;

  const parsedAmount = parseFloat((Array.isArray(amount) ? amount[0] : amount) as string) || 0;

  // Fee logic (can be updated dynamically later)
  const truequeFeeRate = 0.015; // 1.5%
  const deliveryFee = 5; // flat BRL
  const transmitterFee = corridorStr === 'BR-US' ? 3 : 4; // example logic

  const truequeFee = parsedAmount * truequeFeeRate;
  const totalFees = truequeFee + deliveryFee + transmitterFee;
  const totalCost = parsedAmount + totalFees;

  // Mock rate for BR-US
  const rate = 0.18;
  const estimatedReceived = parsedAmount * rate;
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

  const handleBack = () => {
    router.push({
      pathname: '/',
      query: {
        corridor,
<<<<<<< HEAD
        fromCountry: corridor?.split('-')[0],
        toCountry: corridor?.split('-')[1],
=======
        fromCountry: corridorStr?.split('-')[0],
        toCountry: corridorStr?.split('-')[1],
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
        resume: 'true',
        amount,
        recipient,
      },
<<<<<<< HEAD
    })
  }
=======
    });
  };
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

  const handleContinue = () => {
    router.push({
      pathname: '/preview',
      query: {
        corridor,
        amount,
        recipient,
        rate,
        truequeFee: truequeFee.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        transmitterFee: transmitterFee.toFixed(2),
        totalFees: totalFees.toFixed(2),
        estimatedReceived: estimatedReceived.toFixed(2),
      },
<<<<<<< HEAD
    })
  }
=======
    });
  };
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">💸 Fee Breakdown</h1>

      <div className="bg-gray-50 p-4 rounded shadow-sm space-y-2">
<<<<<<< HEAD
        <p><strong>Corridor:</strong> {corridor}</p>
        <p><strong>Amount to Send:</strong> {parsedAmount} BRL</p>
        <p><strong>Trueque Fee (1.5%):</strong> BRL {truequeFee.toFixed(2)}</p>
        <p><strong>Delivery Fee:</strong> BRL {deliveryFee.toFixed(2)}</p>
        <p><strong>Transmitter Fee:</strong> BRL {transmitterFee.toFixed(2)}</p>
        <p><strong>Total Fees:</strong> BRL {totalFees.toFixed(2)}</p>
        <p><strong>Total Cost to Sender:</strong> BRL {totalCost.toFixed(2)}</p>
        <p><strong>Estimated Received:</strong> USD {estimatedReceived.toFixed(2)}</p>
        <p className="text-sm text-gray-600">
          💱 Market Rate: <strong>${rate.toFixed(2)}/BRL</strong> or <strong>BRL{(1 / rate).toFixed(2)}/$</strong>
=======
        <p>
          <strong>Corridor:</strong> {corridorStr ?? corridor ?? '—'}
        </p>
        <p>
          <strong>Amount to Send:</strong> {parsedAmount} BRL
        </p>
        <p>
          <strong>Trueque Fee (1.5%):</strong> BRL {truequeFee.toFixed(2)}
        </p>
        <p>
          <strong>Delivery Fee:</strong> BRL {deliveryFee.toFixed(2)}
        </p>
        <p>
          <strong>Transmitter Fee:</strong> BRL {transmitterFee.toFixed(2)}
        </p>
        <p>
          <strong>Total Fees:</strong> BRL {totalFees.toFixed(2)}
        </p>
        <p>
          <strong>Total Cost to Sender:</strong> BRL {totalCost.toFixed(2)}
        </p>
        <p>
          <strong>Estimated Received:</strong> USD {estimatedReceived.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">
          💱 Market Rate: <strong>${rate.toFixed(2)}/BRL</strong> or{' '}
          <strong>BRL{(1 / rate).toFixed(2)}/$</strong>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
        </p>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleBack}
          className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
        >
          ⬅ Back
        </button>
        <button
          onClick={handleContinue}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Continue to Preview
        </button>
      </div>
    </main>
<<<<<<< HEAD
  )
}	
=======
  );
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
