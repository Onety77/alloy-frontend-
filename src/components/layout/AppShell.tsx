import type { ReactNode } from 'react'
import { Backdrop } from './Backdrop'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import './AppShell.css'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Backdrop />
      <div className="shell">
        <TopBar />
        <main className="shell__main">
          <div className="shell__inner">{children}</div>
        </main>
        <BottomNav />
      </div>
    </>
  )
}
