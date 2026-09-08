import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import './EmptyState.css'

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <span className="empty__mark">
        <Icon name={icon} size={28} />
      </span>
      <span className="empty__title">{title}</span>
      <p className="empty__body">{body}</p>
      {action}
    </div>
  )
}
