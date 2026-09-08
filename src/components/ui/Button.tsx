import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  tone?: 'iron' | 'ember' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
}

export function Button({
  children,
  tone = 'iron',
  size = 'md',
  block = false,
  className = '',
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    tone !== 'iron' && `btn--${tone}`,
    size !== 'md' && `btn--${size}`,
    block && 'btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} {...rest}>
      <span className="btn__sheen" aria-hidden />
      {children}
    </button>
  )
}
