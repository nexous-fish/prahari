import { useEffect } from 'react'
import { useApp } from '../lib/store.jsx'
import { cx } from '../lib/util.js'

// Live alert feed simulating SMS/email/API pushes to LEA and bank roles.
export default function ToastHost() {
  const { toasts, dismissToast } = useApp()
  const visible = toasts.slice(-4)

  useEffect(() => {
    if (!toasts.length) return
    const last = toasts[toasts.length - 1]
    const timer = setTimeout(() => dismissToast(last.id), 7000)
    return () => clearTimeout(timer)
  }, [toasts, dismissToast])

  if (!visible.length) return null

  const chanLabel = (c) =>
    ({ LEA: 'SMS → Duty Officer', BANK: 'API → Bank FRM', MODEL: 'System', bank: 'Bank action', lea: 'LEA action' }[c] || c)

  return (
    <div className="toast-host" aria-live="polite">
      {visible.map((t) => (
        <div key={t.id} className={cx('toast', t.level)}>
          <div className="toast-top">
            <span className="toast-chan">{chanLabel(t.channel)}</span>
            <button className="toast-x" onClick={() => dismissToast(t.id)} aria-label="Dismiss">×</button>
          </div>
          <div className="toast-title">{t.title}</div>
          <div className="toast-body">{t.body}</div>
        </div>
      ))}
    </div>
  )
}
