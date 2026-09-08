import type { ReactNode } from 'react'
import './ScreenHeader.css'

export function ScreenHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <header className="shead">
      <div className="shead__left">
        <h1 className="shead__title">{title}</h1>
        {subtitle && <p className="shead__sub">{subtitle}</p>}
      </div>
      {children && <div className="shead__right">{children}</div>}
    </header>
  )
}

/** A labelled number. Used across every screen's header strip. */
export function Figure({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'gain' | 'loss' | 'brass'
}) {
  return (
    <div className="figure">
      <span className="figure__label">{label}</span>
      <span className={`figure__value${tone ? ` figure__value--${tone}` : ''}`}>{value}</span>
    </div>
  )
}
