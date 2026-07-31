import Link from 'next/link';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  const productLinks = [
    { label: 'How It Works',   href: '/#how-it-works' },
    { label: 'FAQ',            href: '/faq' },
    { label: 'Create Account', href: '/signup' },
    { label: 'Sign In',        href: '/signin' },
  ];

  const companyLinks = [
    { label: 'About Us',       href: '/about' },
    { label: 'For Partners',   href: '/partners' },
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Terms of Service', href: '/legal/terms' },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

          {/* Brand column */}
          <div className="md:col-span-5">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-brand rounded-[10px] flex items-center justify-center shadow-md shadow-brand/20">
                <span className="text-white font-extrabold text-sm">S</span>
              </div>
              <span className="text-primary font-bold text-lg">Symmetri</span>
            </Link>
            <p className="text-secondary text-sm leading-relaxed max-w-xs">
              A technological swap currency platform. Symmetri is the digital rail between your hard work and your family's daily needs.
            </p>
            <a
              href="mailto:partners@symmetri.org"
              className="inline-block mt-4 text-secondary hover:text-brand text-xs transition-colors"
            >
              partners@symmetri.org
            </a>
          </div>

          {/* Product links */}
          <div className="md:col-span-3">
            <h3 className="text-primary font-semibold text-xs uppercase tracking-widest mb-4">Product</h3>
            <ul className="space-y-3">
              {productLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-secondary hover:text-primary text-sm transition-colors duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div className="md:col-span-4">
            <h3 className="text-primary font-semibold text-xs uppercase tracking-widest mb-4">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-secondary hover:text-primary text-sm transition-colors duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-gray-500 text-xs leading-relaxed max-w-2xl">
            © {year} Symmetri. All rights reserved. Symmetri is a technology platform, not a
            financial institution or money transmitter. All payments are processed by licensed,
            regulated payment providers. Symmetri does not hold, store, or custody user funds.
          </p>
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link href="/legal/privacy" className="text-gray-500 hover:text-primary text-xs transition-colors">Privacy</Link>
            <span className="text-gray-300">·</span>
            <Link href="/legal/terms"   className="text-gray-500 hover:text-primary text-xs transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
