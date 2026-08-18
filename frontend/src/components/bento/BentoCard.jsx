export default function BentoCard({ children, className = '', colSpan = 1, rowSpan = 1, style = {} }) {
  return (
    <div
      className={`glass-card shine-sweep p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] ${className}`}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
        ...style
      }}
    >
      {children}
    </div>
  )
}
