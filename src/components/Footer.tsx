import React from 'react'

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
      </div>
      <div>
        Built with ❤️ by the Trueque team. Empowering global remittance with transparency and trust.
      </div>
    </footer>
  )
}
