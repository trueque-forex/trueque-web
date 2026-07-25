// src/app/(marketing)/legal/privacy/page.tsx
// Privacy Policy — required for Moov production environment approval.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Symmetri Privacy Policy — how we collect, use, and protect your personal information.',
};

const EFFECTIVE_DATE = 'July 25, 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-primary">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-24">
        <div className="mb-10">
          <p className="text-brand text-sm font-bold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-extrabold text-primary mb-3">Privacy Policy</h1>
          <p className="text-secondary text-sm">Effective Date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="prose-custom space-y-10">
          {[
            {
              title: '1. Introduction',
              body: `Symmetri ("we," "us," or "our") is a technological swap currency platform operated by Trueque, Inc. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our platform at symmetri.org and any related applications or services (collectively, the "Service").

By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this policy, please do not access the Service.`,
            },
            {
              title: '2. Information We Collect',
              body: `We collect information you provide directly to us, including:

• Identity Information: Full legal name, date of birth, government-issued ID (for KYC compliance).
• Contact Information: Email address, phone number, country of residence.
• Transaction Information: Amounts sent, destination country, retailer selected, transaction history.
• Payment Information: We do not store card numbers or bank credentials. Payments are processed by licensed third-party providers (e.g., Moov Financial). We receive only transaction confirmation tokens.
• Device & Usage Data: IP address, browser type, operating system, pages visited, session duration. This data is collected to prevent fraud and improve the Service.`,
            },
            {
              title: '3. How We Use Your Information',
              body: `We use the information we collect to:

• Verify your identity and comply with applicable Anti-Money Laundering (AML) and Know Your Customer (KYC) regulations.
• Process transactions and deliver voucher codes to beneficiaries.
• Detect and prevent fraudulent activity, unauthorized access, and financial crime.
• Communicate service updates, security alerts, and account-related notifications.
• Improve, analyze, and personalize the Service.
• Comply with legal obligations, including regulatory reporting requirements.

We do not sell your personal data to third parties. We do not use your data for advertising purposes.`,
            },
            {
              title: '4. Data Sharing and Disclosure',
              body: `We may share your information with:

• Licensed Payment Processors: To facilitate the transaction (e.g., Moov Financial, ACH processors, card networks). These providers are contractually bound to use your data only for the services they provide to us.
• KYC / Identity Verification Providers: To fulfill our regulatory obligations.
• Law Enforcement and Regulatory Bodies: When required by applicable law, court order, or government regulation (e.g., OFAC sanctions screening, FinCEN reporting).
• Retail Partners: Only the information necessary to fulfill a voucher redemption (voucher code, face value, destination store). No PII is shared with retail partners.
• Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.`,
            },
            {
              title: '5. Data Security',
              body: `We implement industry-standard security measures to protect your personal information:

• All data in transit is encrypted using TLS 1.2 or higher.
• Sensitive data at rest is encrypted using AES-256.
• Access to user data is restricted to authorized personnel on a need-to-know basis.
• We conduct regular security reviews and penetration testing.

Despite these measures, no security system is impenetrable. We cannot guarantee absolute security of your information.`,
            },
            {
              title: '6. Data Retention',
              body: `We retain your personal information for as long as your account is active or as needed to provide the Service. We also retain information as required by applicable financial regulations (typically 5–7 years for transaction records). Upon account deletion request, we will anonymize or delete data that is not subject to legal hold requirements within 30 days.`,
            },
            {
              title: '7. Your Rights',
              body: `Depending on your jurisdiction, you may have the right to:

• Access the personal information we hold about you.
• Request correction of inaccurate personal information.
• Request deletion of your personal information (subject to legal retention obligations).
• Object to the processing of your personal information.
• Data portability — receive a machine-readable copy of your data.

To exercise these rights, contact us at: privacy@symmetri.org`,
            },
            {
              title: '8. Cookies and Tracking',
              body: `We use strictly necessary cookies to maintain your session and authentication state. We do not use advertising cookies, cross-site tracking cookies, or third-party analytics cookies that share data with advertisers. Session cookies are deleted when you close your browser. Persistent cookies (used to remember your market region) expire after 12 months.`,
            },
            {
              title: '9. Children\'s Privacy',
              body: `The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has provided us with personal information, we will take steps to delete such information immediately.`,
            },
            {
              title: '10. Changes to This Policy',
              body: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the Effective Date. Your continued use of the Service after any changes constitutes your acceptance of the new terms.`,
            },
            {
              title: '11. Contact Us',
              body: `If you have any questions about this Privacy Policy or our data practices, please contact us at:

Trueque, Inc. dba Symmetri
Email: privacy@symmetri.org
Web: symmetri.org/legal/privacy`,
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

        <div className="mt-16 pt-8 border-t border-slate-200 text-center">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} Trueque, Inc. dba Symmetri. All rights reserved.
          </p>
        </div>
      </article>
    </div>
  );
}
