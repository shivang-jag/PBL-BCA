import { useEffect, useId, useRef, useState } from 'react'

export default function Dropdown({
  button,
  children,
  align = 'right',
  widthClassName = 'w-64',
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const id = useId()

  useEffect(() => {
    function onDocMouseDown(e) {
      const root = rootRef.current
      if (!root) return
      if (root.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  const side = align === 'left' ? 'left-0' : 'right-0'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
      >
        {typeof button === 'function' ? button({ open }) : button}
      </button>

      <div
        id={id}
        role="menu"
        aria-hidden={!open}
        className={
          `absolute ${side} mt-2 origin-top ${widthClassName} rounded-2xl ` +
          'border border-purple-200 bg-white/95 p-2 shadow-xl backdrop-blur ' +
          'transition-all duration-200 ' +
          (open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0')
        }
      >
        {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
      </div>
    </div>
  )
}
