// src/app/(marketing)/legal/terms/page.tsx
// Terms of Service — required for Moov production environment approval.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Symmetri Terms of Service — rules and conditions governing use of the Symmetri platform.',
};

const EFFECTIVE_DATE = 'July 25, 2026';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-primary">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-24">
        <div className="mb-10">
          <p className="text-brand text-sm font-bold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-extrabold text-primary mb-3">Terms of Service</h1>
          <p className="text-secondary text-sm">Effective Date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="space-y-10">
          {[
            {
              title: '1. Acceptance of Terms',
              body: `By creating an account or using the Symmetri platform ("Service"), operated by Trueque, Inc. ("Symmetri," "we," "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.

We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance.`,
            },
            {
              title: '2. Description of Service',
              body: `Symmetri is a technological swap currency platform that enables users ("Senders") to generate digital retail vouchers redeemable by designated beneficiaries at participating retail locations.

Symmetri is NOT a bank, money transmitter, or financial institution. Symmetri does not hold, store, or custody user funds at any point. All payments are processed by licensed, regulated third-party payment providers ("Payment Partners"). Symmetri's role is limited to orchestrating the transaction flow between Senders, Payment Partners, and retail networks.`,
            },
            {
              title: '3. Eligibility',
              body: `You must be at least 18 years of age to use the Service. By using the Service, you represent that you are 18 or older and have the legal capacity to enter into a binding agreement.

The Service is currently available to users residing in the United States and Spain. Use of the Service from other jurisdictions is at your own risk and may not comply with local laws.`,
            },
            {
              title: '4. Account Registration and KYC',
              body: `To use the full functionality of the Service, you must register an account and complete identity verification (KYC — Know Your Customer). You agree to:

• Provide accurate, complete, and current information.
• Maintain the security of your account credentials.
• Notify us immediately of any unauthorized access.
• Complete KYC verification as required by applicable law.

We reserve the right to suspend or terminate accounts that provide false information or fail to complete required KYC steps. KYC requirements are non-negotiable compliance obligations, not optional features.`,
            },
            {
              title: '5. Transaction Rules',
              body: `• Minimum Order Value (MOV): The minimum voucher amount is $20.00 USD equivalent. Transactions below this threshold will be rejected.
• No Cancellations After Issuance: Once a voucher code is generated and sent to the beneficiary, the transaction cannot be reversed or cancelled.
• Synchronous Lock: All transactions require confirmed, settled payment before a voucher is issued. Symmetri does not extend credit.
• Voucher Validity: Voucher codes expire 30 days from issuance if not redeemed.
• Single Use: Each voucher code is valid for a single redemption at the designated retailer.`,
            },
            {
              title: '6. Prohibited Uses',
              body: `You agree not to use the Service to:

• Violate any applicable law or regulation, including anti-money laundering (AML) and sanctions laws.
• Send value to OFAC-sanctioned individuals, entities, or jurisdictions.
• Conduct structuring activities (breaking large transactions into smaller ones to evade reporting).
• Fund illegal activities of any kind.
• Attempt to defraud Symmetri, retail partners, or other users.
• Use automated systems, bots, or scrapers to access the Service.
• Reverse-engineer, decompile, or attempt to extract source code from the platform.`,
            },
            {
              title: '7. Fees and Pricing',
              body: `Symmetri charges no fees to beneficiaries (recipients). Sender fees, if applicable, are disclosed transparently before transaction confirmation. Symmetri generates revenue through B2B commercial arrangements with retail partners (wholesale procurement discounts) — this arrangement has no impact on the exchange rate shown to users.

All fees are shown in the total cost before you confirm a transaction. By confirming a transaction, you agree to pay the total amount displayed.`,
            },
            {
              title: '8. Intellectual Property',
              body: `All content, software, trademarks, and intellectual property on the Service are owned by Trueque, Inc. You are granted a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial purposes. You may not copy, modify, distribute, or create derivative works from our content without prior written permission.`,
            },
            {
              title: '9. Disclaimer of Warranties',
              body: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, SYMMETRI DISCLAIMS ALL WARRANTIES, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

We do not warrant that the Service will be uninterrupted, error-free, or completely secure.`,
            },
            {
              title: '10. Limitation of Liability',
              body: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SYMMETRI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR YOUR USE OF THE SERVICE.

OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM THESE TERMS OR YOUR USE OF THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) $100 USD.`,
            },
            {
              title: '11. Governing Law and Dispute Resolution',
              body: `These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles. Any disputes arising from these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved, disputes shall be submitted to binding arbitration under the rules of the American Arbitration Association (AAA).`,
            },
            {
              title: '12. Contact',
              body: `For questions about these Terms, contact us at:

Trueque, Inc. dba Symmetri
Email: legal@symmetri.org
Web: symmetri.org/legal/terms`,
            },
          ].map((sec) => (
            <section key={sec.title}>
              <h2 className="text-xl font-bold text-primary mb-3">{sec.title}</h2>
              <div className="text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                {sec.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-secondary text-xs">
            © {new Date().getFullYear()} Trueque, Inc. dba Symmetri. All rights reserved.
          </p>
        </div>
      </article>
    </div>
  );
}
