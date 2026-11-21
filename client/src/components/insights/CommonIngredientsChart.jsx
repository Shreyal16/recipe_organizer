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
import { Apple } from 'lucide-react';

export default function CommonIngredientsChart({ data = [] }) {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[300px] text-center">
        <Apple className="w-10 h-10 text-surface-muted mb-2 opacity-50" />
        <h4 className="text-sm font-semibold text-surface-text">No Ingredient Data</h4>
        <p className="text-xs text-surface-muted mt-1">Common ingredients will appear once recipes are added.</p>
      </div>
    );
  }

  // Capitalize ingredient name for clean presentation
  const formattedData = data.slice(0, 8).map((item) => ({
    ...item,
    displayName: item.ingredient.charAt(0).toUpperCase() + item.ingredient.slice(1),
  }));

  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const barColor = isDark ? '#10b981' : '#059669';

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-surface-text flex items-center gap-2">
            <Apple className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Most Common Ingredients
          </h3>
          <p className="text-xs text-surface-muted mt-0.5">
            Top staple ingredients across the entire recipe collection
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-subtle text-surface-muted border border-surface-border">
          Top {formattedData.length} Staples
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={formattedData}
            margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
          >
            <XAxis
              type="number"
              tick={{ fill: textColor, fontSize: 11 }}
              allowDecimals={false}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="displayName"
              tick={{ fill: textColor, fontSize: 11 }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
              width={75}
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
              formatter={(value) => [`${value} recipes`, 'Appears in']}
            />
            <Bar dataKey="count" fill={barColor} radius={[0, 6, 6, 0]}>
              {formattedData.map((_, index) => (
                <Cell
                  key={`ing-cell-${index}`}
                  fill={isDark ? (index % 2 === 0 ? '#34d399' : '#10b981') : (index % 2 === 0 ? '#059669' : '#10b981')}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
