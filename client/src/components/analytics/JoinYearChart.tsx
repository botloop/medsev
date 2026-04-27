/**
 * Join Year Chart
 * Bar chart showing personnel count by join year
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { JoinYearData } from '@shared/types/common.types';

interface JoinYearChartProps {
  data: JoinYearData[];
}

export const JoinYearChart: React.FC<JoinYearChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#10b981" name="Personnel Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
