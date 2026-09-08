import { motion } from 'framer-motion'
import type { Alloy } from '@/lib/types'
import { RARITIES, lockedValue } from '@/lib/rarity'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { AlloyIngot } from '@/components/game/AlloyIngot'
import { usd } from '@/lib/format'
import './CraftReveal.css'

export type CraftPhase = { kind: 'idle' } | { kind: 'pouring' } | { kind: 'result'; alloy: Alloy }

export function CraftReveal({
  phase,
  onClose,
  onForgeAgain,
  onViewInventory,
}: {
  phase: CraftPhase
  onClose: () => void
  onForgeAgain: () => void
  onViewInventory: () => void
}) {
  const pouring = phase.kind === 'pouring'
  const alloy = phase.kind === 'result' ? phase.alloy : null
  const rarity = alloy ? RARITIES[alloy.rarity]! : null

  return (
    <Modal
      open={phase.kind !== 'idle'}
      onClose={onClose}
      dismissable={!pouring}
      maxWidth={470}
    >
      {pouring && (
        <div className="pour">
          <div className="pour__vessel">
            <div className="pour__ring" />
          </div>
          <span className="pour__label">Pouring the melt…</span>
        </div>
      )}

      {alloy && rarity && (
        <div className="reveal" style={{ ['--rarity' as string]: rarity.color }}>
          <div className="reveal__burst" />

          <motion.span
            className="reveal__tier"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            {rarity.name}
          </motion.span>

          <motion.div
            className="reveal__art"
            initial={{ opacity: 0, scale: 0.5, y: 26 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }}
          >
            <AlloyIngot alloy={alloy} size={168} animate />
          </motion.div>

          <motion.h2
            className="reveal__name"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
          >
            {alloy.name}
          </motion.h2>

          {alloy.cracked && (
            <div className="reveal__crack">
              <Icon name="skull" size={14} />
              The vessel cracked. Yield is halved — your escrow is untouched.
            </div>
          )}

          {alloy.coldForged && !alloy.cracked && (
            <p className="reveal__sub">
              Cold-forged against a red tape. Lower tier ceiling, richer daily draw.
            </p>
          )}

          <motion.div
            className="reveal__grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
          >
            <div className="reveal__cell">
              <span className="reveal__cell-label">Purity</span>
              <span className="reveal__cell-value">{alloy.purity}</span>
            </div>
            <div className="reveal__cell">
              <span className="reveal__cell-label">Daily yield</span>
              <span className="reveal__cell-value">{alloy.yieldPerDay.toFixed(1)}</span>
            </div>
            <div className="reveal__cell">
              <span className="reveal__cell-label">Resonance</span>
              <span className="reveal__cell-value">{alloy.resonance}</span>
            </div>
            <div className="reveal__cell">
              <span className="reveal__cell-label">Integrity</span>
              <span className="reveal__cell-value">{alloy.integrity}</span>
            </div>
            <div className="reveal__cell" style={{ gridColumn: '1 / -1' }}>
              <span className="reveal__cell-label">Stock locked inside</span>
              <span className="reveal__cell-value">{usd(lockedValue(alloy))}</span>
            </div>
          </motion.div>

          <div className="reveal__actions">
            <Button block onClick={onViewInventory}>
              <Icon name="chest" size={14} />
              Inventory
            </Button>
            <Button tone="ember" block onClick={onForgeAgain}>
              <Icon name="anvil" size={14} />
              Forge again
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
