export function MiniSparkline({ values, positive }: { values: number[]; positive: boolean }) {
  const min = Math.min(...values); const max = Math.max(...values); const span = max - min || 1
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 72},${18 - ((value - min) / span) * 16}`).join(' ')
  return <svg viewBox="0 0 72 20" className="h-5 w-[72px]" aria-hidden="true"><polyline points={points} fill="none" stroke={positive ? '#23d9a4' : '#ff5d72'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
}
