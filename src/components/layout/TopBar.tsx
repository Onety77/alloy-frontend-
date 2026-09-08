import { useEffect, useState } from 'react'
import { useGame } from '@/state/store'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { compact, countdown } from '@/lib/format'
import './TopBar.css'

function ForgeMark() {
  return (
    <svg className="wordmark__mark" viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="wm-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brass-100)" />
          <stop offset="55%" stopColor="var(--brass-300)" />
          <stop offset="100%" stopColor="var(--brass-600)" />
        </linearGradient>
        <radialGradient id="wm-heat" cx="50%" cy="72%">
          <stop offset="0%" stopColor="var(--core)" />
          <stop offset="45%" stopColor="var(--ember-300)" />
          <stop offset="100%" stopColor="var(--ember-600)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="46" rx="21" ry="11" fill="url(#wm-heat)" opacity="0.85" />
      <path d="M32 7 47 19.5 41 24l6 16-15 10-15-10 6-16-6-4.5Z" fill="url(#wm-brass)" />
      <path d="M32 15.5 38 24l-6 16-6-16Z" fill="#0d0d11" opacity="0.5" />
    </svg>
  )
}

function Balance({
  icon,
  value,
  label,
  variant,
}: {
  icon: IconName
  value: string
  label: string
  variant: string
}) {
  return (
    <div className={`balance balance--${variant}`}>
      <Icon name={icon} size={15} className="balance__icon" />
      <span className="balance__body">
        <span className="balance__value">{value}</span>
        <span className="balance__label">{label}</span>
      </span>
    </div>
  )
}

export function TopBar() {
  const wallet = useGame((s) => s.wallet)
  const nextOracleAt = useGame((s) => s.nextOracleAt)
  const connect = useGame((s) => s.connect)

  // Local ticker so the countdown reads smoothly between market steps.
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <header className="topbar">
      <div className="wordmark">
        <ForgeMark />
        <span className="wordmark__text">
          <span className="wordmark__name">FORGE</span>
          <span className="wordmark__sub">METALLIC ALCHEMY</span>
        </span>
      </div>

      <div className="spacer" />

      <div className="oracle" title="Chainlink oracle heartbeat">
        <span className="oracle__dot" />
        <span className="oracle__label">Oracle push</span>
        <span className="oracle__time">{countdown(nextOracleAt - now)}</span>
      </div>

      <div className="balances">
        <Balance variant="alloy" icon="ingot" value={compact(wallet.alloyToken)} label="$ALLOY" />
        <Balance variant="shard" icon="shard" value={compact(wallet.shards)} label="Shards" />
        <Balance variant="cinder" icon="flame" value={`${wallet.cinder}`} label="Cinder" />
        <Balance variant="eth" icon="eth" value={wallet.eth.toFixed(3)} label="ETH" />
      </div>

      {wallet.connected ? (
        <span className="wallet-chip">
          <span className="wallet-chip__dot" />
          {wallet.address}
        </span>
      ) : (
        <Button size="sm" onClick={connect}>
          Connect
        </Button>
      )}
    </header>
  )
}
