import { useEffect, useRef, type ReactNode } from 'react'
import { useGame } from '@/state/store'
import { Backdrop } from './Backdrop'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import './AppShell.css'

export function AppShell({ children }: { children: ReactNode }) {
  const screen = useGame((s) => s.screen)
  const main = useRef<HTMLElement>(null)

  // The scroll container persists across screen changes, so without this a
  // deep scroll on one screen hides the next screen's header.
  useEffect(() => {
    main.current?.scrollTo({ top: 0 })
  }, [screen])

  return (
    <>
      <Backdrop />
      <div className="shell">
        <TopBar />
        <main className="shell__main" ref={main}>
          <div className="shell__inner">{children}</div>
        </main>
        <BottomNav />
      </div>
    </>
  )
}
