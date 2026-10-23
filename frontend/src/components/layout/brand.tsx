export function Brand({ inverse = false }: { inverse?: boolean }) {
  return <span className={`inline-flex items-center gap-3 ${inverse ? 'text-white' : 'text-[var(--navy)]'}`}>
    <span className="brand-mark" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</span>
    <span className="brand-word">MERIDIAN<small>GRID</small></span>
  </span>;
}
