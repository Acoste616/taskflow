import { Box, Heading } from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import Card from '../../common/Card';
import { useTaskContext } from '../../../contexts/TaskContext';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ProgressChart = () => {
  const { tasks } = useTaskContext();
  
  // Calculate task counts by status
  const taskCounts = useMemo(() => {
    const completed = tasks.filter(task => task.status === 'COMPLETED').length;
    const inProgress = tasks.filter(task => task.status === 'IN_PROGRESS').length;
    const todo = tasks.filter(task => task.status === 'TODO').length;
    
    return {
      completed,
      inProgress,
      todo,
      total: completed + inProgress + todo
    };
  }, [tasks]);
  
  // Prepare chart data
  const chartData = {
    labels: ['Completed', 'In Progress', 'To Do'],
    datasets: [
      {
        data: [taskCounts.completed, taskCounts.inProgress, taskCounts.todo],
        backgroundColor: [
          'rgba(46, 204, 113, 0.8)',  // Green for completed
          'rgba(52, 152, 219, 0.8)',  // Blue for in progress
          'rgba(189, 195, 199, 0.8)', // Gray for todo
        ],
        borderColor: [
          'rgba(46, 204, 113, 1)',
          'rgba(52, 152, 219, 1)',
          'rgba(189, 195, 199, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = taskCounts.total > 0 
              ? Math.round((value / taskCounts.total) * 100) 
              : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };
  
  return (
    <Card>
      <Heading size="md" mb={4}>Task Progress</Heading>
      <Box height="300px" position="relative">
        <Pie data={chartData} options={chartOptions} />
      </Box>
    </Card>
  );
};

export default ProgressChart; 