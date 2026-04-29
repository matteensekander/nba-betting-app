import { useId } from 'react';

export default function Sparkline({ data, width = 80, height = 28, color = '#5b73ff' }) {
  const uid = useId();
  const gradId = `spark-grad-${uid.replace(/:/g, '')}`;

  if (!data || data.length < 2) return null;

  const values = data.map(Number).filter(v => !isNaN(v) && isFinite(v));
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * w,
    pad + h - ((v - min) / range) * h,
  ]);

  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;

  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg width={width} height={height} overflow="visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r="2.5" fill={color} />
    </svg>
  );
}
