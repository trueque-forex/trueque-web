import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="flex justify-center gap-6 py-6 text-lg font-medium">
      <Link href="/exchange">Exchange</Link>
      <Link href="/audit">Audit</Link>
      <Link href="/about">About</Link>
      <Link href="/docs">Docs</Link>
    </nav>
  )
}
