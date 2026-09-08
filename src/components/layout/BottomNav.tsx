import { useGame } from '@/state/store'
import { Icon, type IconName } from '@/components/ui/Icon'
import type { ScreenId } from '@/lib/types'
import { CONTRACTS } from '@/state/content'
import './BottomNav.css'

const TABS: { id: ScreenId; label: string; icon: IconName }[] = [
  { id: 'forge', label: 'Forge', icon: 'anvil' },
  { id: 'inventory', label: 'Inventory', icon: 'chest' },
  { id: 'smithy', label: 'Smithy', icon: 'hammer' },
  { id: 'market', label: 'Market', icon: 'scales' },
  { id: 'contracts', label: 'Contracts', icon: 'scroll' },
  { id: 'research', label: 'Research', icon: 'rune' },
  { id: 'hall', label: 'Hall of Ingots', icon: 'crown' },
]

export function BottomNav() {
  const screen = useGame((s) => s.screen)
  const setScreen = useGame((s) => s.setScreen)
  const alloys = useGame((s) => s.alloys)
  const fulfilled = useGame((s) => s.fulfilled)
  const unclaimed = useGame((s) => s.unclaimed)

  const idle = alloys.filter((a) => a.slot === null && !a.expeditionId).length
  const openContracts = CONTRACTS.length - fulfilled.length

  const badgeFor = (id: ScreenId): number => {
    if (id === 'inventory') return idle
    if (id === 'contracts') return openContracts
    if (id === 'smithy') return unclaimed >= 1 ? Math.floor(unclaimed) : 0
    return 0
  }

  return (
    <nav className="nav" aria-label="Main">
      {TABS.map((tab) => {
        const active = screen === tab.id
        const badge = badgeFor(tab.id)
        return (
          <button
            key={tab.id}
            className={`nav__item${active ? ' nav__item--active' : ''}`}
            onClick={() => setScreen(tab.id)}
            aria-current={active ? 'page' : undefined}
            /* The visible label is hidden on narrow viewports, so the name has
               to come from here or the tab becomes an unlabelled icon. */
            aria-label={tab.label}
          >
            <Icon name={tab.icon} size={21} />
            <span className="nav__label">{tab.label}</span>
            {badge > 0 && (
              <span className="nav__badge" aria-hidden>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
