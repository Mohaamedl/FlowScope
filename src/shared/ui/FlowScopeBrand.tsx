import logoUrl from '../../assets/logo.png'

interface FlowScopeBrandProps {
  compact?: boolean
  showTagline?: boolean
  className?: string
}

export function FlowScopeBrand({ compact = false, showTagline = true, className }: FlowScopeBrandProps) {
  return (
    <div className={['flow-brand', compact ? 'flow-brand--compact' : '', className].filter(Boolean).join(' ')}>
      <img
        className="flow-brand__mark"
        src={logoUrl}
        role="img"
        aria-label="FlowScope logo"
      />

      <div className="flow-brand__copy">
        {showTagline && <div className="flow-brand__tagline">See how your processes evolve.</div>}
      </div>
    </div>
  )
}
