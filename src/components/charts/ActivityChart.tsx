import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: { day: string; submissions: number; approvals: number }[];
}

const tooltipStyle = {
  backgroundColor: 'var(--tooltip-bg, rgba(255,255,255,0.97))',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: '12px',
  fontSize: '13px',
};

export default function ActivityChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.12)" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="submissions" name="Submissions" stroke="#4F46E5" strokeWidth={2.5}
          dot={{ fill: '#4F46E5', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="approvals" name="Approvals" stroke="#22C55E" strokeWidth={2.5}
          dot={{ fill: '#22C55E', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
