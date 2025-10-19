import React from 'react'
import AuditDashboardFilter from './AuditDashboardFilter'
import AuditDashboardSummary from './AuditDashboardSummary'
import AuditDashboardTable from './AuditDashboardTable'

type Offer = {
  offerAmount: number
  userId: string
  fee?: number
}

type Props = {
  corridor: string
  model?: string
  fee?: string
  sla?: string
  marketRate: number
  offers: Offer[]
  debug?: boolean
}

export default function AuditDashboard({
  corridor,
  model,
  fee,
  sla,
  marketRate,
  offers,
  debug = false
}: Props) {
  const [from, to] = corridor.split('-')

  if (debug) {
    console.log('Audit Dashboard:')
    console.log('Corridor:', corridor)
    console.log('Model:', model)
    console.log('Fee:', fee)
    console.log('SLA:', sla)
    console.log('Market Rate:', marketRate)
    console.log('Offers:', offers)
  }

  return (
    <div className="mt-8 border rounded p-4 bg-white shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Audit Dashboard</h3>
      <AuditDashboardFilter from={from} to={to} model={model} fee={fee} sla={sla} />
      <AuditDashboardSummary marketRate={marketRate} offers={offers} />
      <AuditDashboardTable offers={offers} />
    </div>
  )
}
