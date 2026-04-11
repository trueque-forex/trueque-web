import React from 'react'
import brandConfig from '../config/brand_config.json'

export default function Footer() {
  return (
    <footer className="bg-gray-100 py-6 px-4 text-center text-sm text-gray-600">
      <div className="mb-2">
        <a
          href="https://github.com/trueque-forex/trueque-web/actions"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <img
            src="https://github.com/trueque-forex/trueque-web/workflows/CI/badge.svg"
            alt="CI Status"
            className="h-5"
          />
        </a>
      </div>
      <div className="mb-2">
        <a
          href="https://github.com/trueque-forex/trueque-web#reproducibility"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Reproducibility Summary
        </a>
        <span className="mx-2">|</span>
        <a href="/compliance/about" className="hover:underline">About {brandConfig.appName}</a>
        <span className="mx-2">|</span>
        <a href="/compliance/terms" className="hover:underline">Terms</a>
      </div>
      <div>
        We reduce the cost of sending money by offering fair rates, zero hidden costs, and a technological platform that ensures each transfer is in perfect "Symmetri".
      </div>
    </footer>
  )
}
