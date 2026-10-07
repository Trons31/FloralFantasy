'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FiChevronRight } from 'react-icons/fi'

/**
 * Fila de pestanas que avisa cuando hay mas fuera de la vista.
 *
 * En movil las pestanas se desbordan y la barra de scroll del navegador es casi
 * invisible: el usuario no sabe que hay contenido a la derecha. Aqui se pinta un
 * degradado con una flecha en el borde correspondiente, y solo mientras quede
 * algo por ver hacia ese lado.
 *
 * El aviso es puramente visual (`aria-hidden`): el desplazamiento real ya lo
 * gestiona el contenedor con scroll, que es accesible por teclado.
 */
export default function ScrollableTabs({
  children,
  ariaLabel,
  className = '',
}: {
  children: ReactNode
  ariaLabel: string
  className?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return

    function update() {
      if (!node) return
      // Un margen de 2px absorbe el redondeo a subpixel: sin el, la flecha
      // parpadeaba al llegar al final del recorrido.
      setCanScrollLeft(node.scrollLeft > 2)
      setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 2)
    }

    update()
    node.addEventListener('scroll', update, { passive: true })

    // El ancho disponible cambia al girar el telefono o al redimensionar, y con
    // el cambia si sobra o falta espacio.
    const observer = new ResizeObserver(update)
    observer.observe(node)

    return () => {
      node.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [children])

  function scrollBy(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * 160, behavior: 'smooth' })
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollRef}
        role="tablist"
        aria-label={ariaLabel}
        className="flex gap-1 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-y-0 left-0 flex w-10 items-center justify-start bg-gradient-to-r from-white via-white/90 to-transparent"
        >
          <FiChevronRight className="h-4 w-4 rotate-180 text-brand-500" />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-end bg-gradient-to-l from-white via-white/90 to-transparent"
        >
          <FiChevronRight className="h-4 w-4 animate-pulse text-brand-500" />
        </button>
      )}
    </div>
  )
}
