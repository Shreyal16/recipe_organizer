import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { Utensils } from 'lucide-react';

const COLORS = ['#10b981', '#059669', '#14b8a6', '#0d9488', '#06b6d4', '#0284c7'];
const DARK_COLORS = ['#34d399', '#10b981', '#2dd4bf', '#14b8a6', '#22d3ee', '#38bdf8'];

export default function CuisineDistributionChart({ data = [] }) {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[300px] text-center">
        <Utensils className="w-10 h-10 text-surface-muted mb-2 opacity-50" />
        <h4 className="text-sm font-semibold text-surface-text">No Cuisine Data</h4>
        <p className="text-xs text-surface-muted mt-1">Cuisine distribution will appear once recipes are loaded.</p>
      </div>
    );
  }

  const palette = isDark ? DARK_COLORS : COLORS;
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-surface-text flex items-center gap-2">
            <Utensils className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Preferred Cuisines Distribution
          </h3>
          <p className="text-xs text-surface-muted mt-0.5">
            Recipe collection volume across culinary cuisines
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-subtle text-surface-muted border border-surface-border">
          {data.length} Cuisines
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <XAxis
              dataKey="cuisine"
              tick={{ fill: textColor, fontSize: 12 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              axisLine={{ stroke: gridColor }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: textColor, fontSize: 12 }}
              allowDecimals={false}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: '0.75rem',
                color: isDark ? '#f8fafc' : '#0f172a',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => [`${value} recipes`, 'Total']}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cuisine-cell-${index}`} fill={palette[index % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
