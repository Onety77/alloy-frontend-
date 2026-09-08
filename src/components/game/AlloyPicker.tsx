import { useState } from 'react'
import type { Alloy, Quote } from '@/lib/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { AlloyCard } from './AlloyCard'

/**
 * Shared chooser for anything that consumes ingots — smithy slots, expedition
 * crews, contract deliveries. `need` of 1 confirms on click; more than that
 * builds a selection and waits.
 */
export function AlloyPicker({
  open,
  title,
  blurb,
  candidates,
  quotes,
  need = 1,
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  blurb: string
  candidates: Alloy[]
  quotes: Record<string, Quote>
  need?: number
  confirmLabel?: string
  onConfirm: (alloyIds: string[]) => void
  onClose: () => void
}) {
  const [picked, setPicked] = useState<string[]>([])

  const close = () => {
    setPicked([])
    onClose()
  }

  const toggle = (id: string) => {
    if (need === 1) {
      onConfirm([id])
      setPicked([])
      return
    }
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : prev.length >= need ? prev : [...prev, id],
    )
  }

  return (
    <Modal open={open} onClose={close} maxWidth={780}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 20 }}>{title}</h2>
          <p style={{ fontSize: 12.5, color: 'var(--ink-400)', marginTop: 4 }}>{blurb}</p>
        </div>

        {candidates.length === 0 ? (
          <EmptyState
            icon="chest"
            title="No eligible ingots"
            body="Nothing on the bench qualifies right now. Forge something, or free up an ingot that is already committed."
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(196px, 1fr))',
              gap: 11,
            }}
          >
            {candidates.map((alloy) => (
              <AlloyCard
                key={alloy.id}
                alloy={alloy}
                quotes={quotes}
                selected={picked.includes(alloy.id)}
                onClick={() => toggle(alloy.id)}
              />
            ))}
          </div>
        )}

        {need > 1 && (
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <span className="label">
              {picked.length}/{need} chosen
            </span>
            <div className="spacer" />
            <Button onClick={close}>Cancel</Button>
            <Button
              tone="ember"
              disabled={picked.length !== need}
              onClick={() => {
                onConfirm(picked)
                setPicked([])
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
