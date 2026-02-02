import React, {
  useRef,
  type PropsWithChildren,
  useState,
  useEffect,
} from 'react'

interface HorizontalScrollContainerProps {
  className?: string
}

const HorizontalScrollContainer: React.FC<
  PropsWithChildren<HorizontalScrollContainerProps>
> = ({ children, className }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(false)

  useEffect(() => {
    const element = scrollContainerRef.current
    if (!element) return

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = element
      const tolerance = 1 // 1px tolerance for floating point inaccuracies
      setShowLeftShadow(scrollLeft > tolerance)
      setShowRightShadow(scrollLeft < scrollWidth - clientWidth - tolerance)
    }

    handleScroll() // Initial check
    element.addEventListener('scroll', handleScroll)
    // Optional: Re-check on window resize
    window.addEventListener('resize', handleScroll)

    return () => {
      element.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  const scrollShadowClassName = [
    showLeftShadow ? 'scroll-shadow-left' : '',
    showRightShadow ? 'scroll-shadow-right' : '',
  ]
    .join(' ')
    .trim()

  return (
    <div
      className={`horizontal-scroll-container scroll-shadow-container ${scrollShadowClassName} ${
        className || ''
      }`}
    >
      <div
        ref={scrollContainerRef}
        className="horizontal-scroll-container__content"
      >
        {children}
      </div>
    </div>
  )
}

export default HorizontalScrollContainer
