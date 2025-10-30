import React from 'react'
import Link from 'next/link'
import CorridorSelector from '@/components/CorridorSelector'

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-sky-50 to-white py-20 px-6 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Streamlining the currency exchange business with transparency and trust.
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Trueque empowers senders and receivers with instant matching, audit-grade fairness, and corridor-specific clarity.
      </p>
      <div className="mb-8">
        <CorridorSelector />
      </div>
      <Link href="/send">
        <a className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition">
          Get Started
        </a>
      </Link>
    </section>
  )
}
