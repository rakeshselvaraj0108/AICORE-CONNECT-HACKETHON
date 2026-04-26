import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { name: string; value: number }[];
  color?: string;
}

const tooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.97)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: '12px',
  fontSize: '13px',
};

export default function PointsChart({ data, color }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 16, left: -16 }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.12)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
          angle={-20} textAnchor="end" height={52} interval={0} />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48} fill={color ?? 'url(#barGrad)'} />
      </BarChart>
    </ResponsiveContainer>
  );
}
