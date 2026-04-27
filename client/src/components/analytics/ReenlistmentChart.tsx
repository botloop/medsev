/**
 * Re-enlistment Chart
 * Pie chart showing re-enlistment status distribution
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { ReenlistmentData } from '@shared/types/common.types';

interface ReenlistmentChartProps {
  data: ReenlistmentData | null;
}

export const ReenlistmentChart: React.FC<ReenlistmentChartProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const chartData = [
    { name: 'First Term', value: data.firstTerm, color: '#a855f7' },
    { name: 'Re-enlisted', value: data.reenlisted, color: '#6366f1' },
    { name: 'Eligible', value: data.eligible, color: '#3b82f6' }
  ];

  // Filter out zero values
  const filteredData = chartData.filter((item) => item.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No re-enlistment data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
