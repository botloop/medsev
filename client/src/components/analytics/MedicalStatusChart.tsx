/**
 * Medical Status Chart
 * Bar chart showing medical step completion
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
import type { MedicalStatusData } from '@shared/types/common.types';

interface MedicalStatusChartProps {
  data: MedicalStatusData | null;
}

export const MedicalStatusChart: React.FC<MedicalStatusChartProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const chartData = [
    { step: 'Step 1', count: data.step1, name: 'Initial Exam' },
    { step: 'Step 2', count: data.step2, name: 'Lab Tests' },
    { step: 'Step 3', count: data.step3, name: 'X-Ray' },
    { step: 'Step 4', count: data.step4, name: 'Dental' },
    { step: 'Step 5', count: data.step5, name: 'Vision/Hearing' },
    { step: 'Step 6', count: data.step6, name: 'Psych Eval' },
    { step: 'Step 7', count: data.step7, name: 'Drug Test' },
    { step: 'Step 8', count: data.step8, name: 'Clearance' }
  ];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="step" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#ef4444" name="Completed Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
