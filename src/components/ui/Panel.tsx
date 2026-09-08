import type { CSSProperties, ReactNode } from 'react'

type PanelProps = {
  children: ReactNode
  /** `sunk` reads as pressed into the plate, `raised` as sitting proud of it. */
  variant?: 'default' | 'sunk' | 'raised' | 'flush'
  /** Brass studs at the corners. Costs nothing, sells the join. */
  rivets?: boolean
  className?: string
  style?: CSSProperties
}

export function Panel({ children, variant = 'default', rivets = false, className = '', style }: PanelProps) {
  const variantClass = variant === 'default' ? '' : ` panel--${variant}`
  return (
    <div className={`panel${variantClass} ${className}`} style={style}>
      {rivets && (
        <>
          <span className="rivet rivet--tl" />
          <span className="rivet rivet--tr" />
          <span className="rivet rivet--bl" />
          <span className="rivet rivet--br" />
        </>
      )}
      {children}
    </div>
  )
}

type HeadingProps = {
  children: ReactNode
  /** Rules flanking the label. `both` matches the mockup's plate headers. */
  rules?: 'both' | 'right' | 'none'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SectionHeading({ children, rules = 'both', size = 'md', className = '' }: HeadingProps) {
  const sizeClass = size === 'md' ? '' : ` heading--${size}`
  return (
    <div className={`heading${sizeClass} ${className}`}>
      {rules === 'both' && (
        <>
          <span className="heading__rule" />
          <span className="heading__lozenge" />
        </>
      )}
      <span className="heading__text">{children}</span>
      {rules !== 'none' && (
        <>
          <span className="heading__lozenge" />
          <span className="heading__rule" />
        </>
      )}
    </div>
  )
}
