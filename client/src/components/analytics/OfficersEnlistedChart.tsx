/**
 * Officers vs Enlisted Chart
 * Pie chart showing distribution of officers and enlisted personnel
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { OfficersEnlistedData } from '@shared/types/common.types';

interface OfficersEnlistedChartProps {
  data: OfficersEnlistedData | null;
}

export const OfficersEnlistedChart: React.FC<OfficersEnlistedChartProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const chartData = [
    { name: 'Officers', value: data.officers, color: '#3b82f6' },
    { name: 'Enlisted', value: data.enlisted, color: '#6b7280' }
  ];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
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
