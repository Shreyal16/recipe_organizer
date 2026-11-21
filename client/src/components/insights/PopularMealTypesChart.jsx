import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { Clock } from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ec4899'];
const DARK_COLORS = ['#34d399', '#fbbf24', '#818cf8', '#f472b6'];

export default function PopularMealTypesChart({ data = [] }) {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[300px] text-center">
        <Clock className="w-10 h-10 text-surface-muted mb-2 opacity-50" />
        <h4 className="text-sm font-semibold text-surface-text">No Meal Type Data</h4>
        <p className="text-xs text-surface-muted mt-1">Meal type distribution will appear once recipes are available.</p>
      </div>
    );
  }

  const palette = isDark ? DARK_COLORS : COLORS;
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  const chartData = data.map((item) => ({
    name: item.mealType,
    value: item.count,
  }));

  const totalRecipes = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-surface-text flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Recipe Collection by Meal Type
          </h3>
          <p className="text-xs text-surface-muted mt-0.5">
            Distribution of catalog recipes across meal categories (not scheduled meals)
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-subtle text-surface-muted border border-surface-border">
          {totalRecipes} Total
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`meal-cell-${index}`} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: '0.75rem',
                color: isDark ? '#f8fafc' : '#0f172a',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value, name) => [
                `${value} recipes (${Math.round((value / totalRecipes) * 100)}%)`,
                name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{
                fontSize: '12px',
                color: isDark ? '#94a3b8' : '#64748b',
                paddingTop: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
