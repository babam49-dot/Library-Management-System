import React, { useEffect } from 'react'

/**
 * A beautiful localized bubble popup that mounts above a relative container,
 * shows a success or error message, and auto-dismisses itself.
 */
export default function BubblePopup({ msg, onClear, duration = 3500 }) {
  useEffect(() => {
    if (!msg) return
    const timer = setTimeout(onClear, duration)
    return () => clearTimeout(timer)
  }, [msg, duration, onClear])

  if (!msg) return null

  const isErr = msg.toLowerCase().includes('error') || msg.includes('❌')
  const bg = isErr ? '#ef4444' : '#10b981'
  const shadow = isErr ? 'rgba(239,68,68,0.45)' : 'rgba(16,185,129,0.45)'

  return (
    <div
      className="bubble-popup"
      style={{
        background: bg,
        boxShadow: `0 8px 24px ${shadow}`,
        border: `1.5px solid rgba(255,255,255,0.2)`
      }}
    >
      <span style={{ marginRight: 6 }}>{isErr ? '❌' : '✅'}</span>
      {msg.replace(/^error:\s*/i, '').replace(/^[✅❌]\s*/, '')}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '6px 6px 0 6px',
          borderColor: `${bg} transparent transparent transparent`
        }}
      />
    </div>
  )
}
