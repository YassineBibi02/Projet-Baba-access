import './Topbar.css'
import type { ReactNode } from 'react'

interface TopbarProps {
  title: string
  onBack: () => void
  children?: ReactNode
}

export function Topbar({ title, onBack, children }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="topbar-left">
          <button className="topbar-back" onClick={onBack} type="button" title="Retour">
            <svg className="topbar-back-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="topbar-title">{title}</h1>
        </div>
        {children && <div className="topbar-actions">{children}</div>}
      </div>
    </div>
  )
}
