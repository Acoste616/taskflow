import { Box, Heading, SimpleGrid, Text, Flex, Select } from '@chakra-ui/react';
import React, { useState, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import { useTaskContext } from '../contexts/TaskContext';
import { useProjectContext } from '../contexts/ProjectContext';
import { formatTimeSpent } from '../utils/dateUtils';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AnalyticsPage = () => {
  const { tasks } = useTaskContext();
  const { projects } = useProjectContext();
  
  // Filter state
  const [timeRange, setTimeRange] = useState('all'); // 'week', 'month', 'year', 'all'
  
  // Filter tasks based on time range
  const filteredTasks = useMemo(() => {
    if (timeRange === 'all') return tasks;
    
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return tasks;
    }
    
    return tasks.filter(task => {
      const taskDate = new Date(task.updatedAt);
      return taskDate >= startDate;
    });
  }, [tasks, timeRange]);
  
  // Task status distribution
  const statusData = useMemo(() => {
    const completed = filteredTasks.filter(task => task.status === 'COMPLETED').length;
    const inProgress = filteredTasks.filter(task => task.status === 'IN_PROGRESS').length;
    const todo = filteredTasks.filter(task => task.status === 'TODO').length;
    
    return {
      labels: ['Completed', 'In Progress', 'To Do'],
      datasets: [
        {
          data: [completed, inProgress, todo],
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
  }, [filteredTasks]);
  
  // Priority distribution
  const priorityData = useMemo(() => {
    const high = filteredTasks.filter(task => task.priority === 'HIGH').length;
    const medium = filteredTasks.filter(task => task.priority === 'MEDIUM').length;
    const low = filteredTasks.filter(task => task.priority === 'LOW').length;
    
    return {
      labels: ['High', 'Medium', 'Low'],
      datasets: [
        {
          data: [high, medium, low],
          backgroundColor: [
            'rgba(231, 76, 60, 0.8)',  // Red for high
            'rgba(243, 156, 18, 0.8)',  // Orange for medium
            'rgba(46, 204, 113, 0.8)',  // Green for low
          ],
          borderColor: [
            'rgba(231, 76, 60, 1)',
            'rgba(243, 156, 18, 1)',
            'rgba(46, 204, 113, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTasks]);
  
  // Project distribution (top 5 projects by task count)
  const projectData = useMemo(() => {
    const projectTaskCounts = projects.map(project => {
      const taskCount = filteredTasks.filter(task => task.projectId === project.id).length;
      return { project, taskCount };
    });
    
    // Sort by task count and take top 5
    const topProjects = [...projectTaskCounts]
      .sort((a, b) => b.taskCount - a.taskCount)
      .slice(0, 5);
    
    return {
      labels: topProjects.map(item => item.project.name),
      datasets: [
        {
          label: 'Number of Tasks',
          data: topProjects.map(item => item.taskCount),
          backgroundColor: 'rgba(52, 152, 219, 0.8)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTasks, projects]);
  
  // Time spent data
  const timeSpentData = useMemo(() => {
    // Group by project and calculate total time
    const projectTimeSpent = projects.map(project => {
      const totalMinutes = filteredTasks
        .filter(task => task.projectId === project.id)
        .reduce((total, task) => total + task.timeSpent, 0);
      
      return { project, totalMinutes };
    });
    
    // Sort by time spent and take top 5
    const topTimeProjects = [...projectTimeSpent]
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 5);
    
    return {
      labels: topTimeProjects.map(item => item.project.name),
      datasets: [
        {
          label: 'Time Spent (minutes)',
          data: topTimeProjects.map(item => item.totalMinutes),
          backgroundColor: 'rgba(155, 89, 182, 0.8)',
          borderColor: 'rgba(155, 89, 182, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTasks, projects]);
  
  // Chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };
  
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  // Calculate overall stats
  const stats = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.status === 'COMPLETED').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const totalTimeSpent = filteredTasks.reduce((total, task) => total + task.timeSpent, 0);
    
    return {
      totalTasks,
      completedTasks,
      completionRate: completionRate.toFixed(1),
      totalTimeSpent: formatTimeSpent(totalTimeSpent),
    };
  }, [filteredTasks]);
  
  return (
    <Layout>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Analytics</Heading>
          
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            width="200px"
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </Select>
        </Flex>
        
        {/* Stats Summary */}
        <SimpleGrid columns={{ base: 1, md: 4 }} gap={6} mb={8}>
          <Card>
            <Text fontSize="sm" color="gray.500">Total Tasks</Text>
            <Text fontSize="2xl" fontWeight="bold">{stats.totalTasks}</Text>
          </Card>
          
          <Card>
            <Text fontSize="sm" color="gray.500">Completed Tasks</Text>
            <Text fontSize="2xl" fontWeight="bold">{stats.completedTasks}</Text>
          </Card>
          
          <Card>
            <Text fontSize="sm" color="gray.500">Completion Rate</Text>
            <Text fontSize="2xl" fontWeight="bold">{stats.completionRate}%</Text>
          </Card>
          
          <Card>
            <Text fontSize="sm" color="gray.500">Total Time Spent</Text>
            <Text fontSize="2xl" fontWeight="bold">{stats.totalTimeSpent}</Text>
          </Card>
        </SimpleGrid>
        
        {/* Charts */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mb={8}>
          <Card>
            <Heading size="md" mb={4}>Task Status</Heading>
            <Box height="300px">
              <Pie data={statusData} options={pieOptions} />
            </Box>
          </Card>
          
          <Card>
            <Heading size="md" mb={4}>Priority Distribution</Heading>
            <Box height="300px">
              <Pie data={priorityData} options={pieOptions} />
            </Box>
          </Card>
        </SimpleGrid>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          <Card>
            <Heading size="md" mb={4}>Tasks by Project</Heading>
            <Box height="300px">
              <Bar data={projectData} options={barOptions} />
            </Box>
          </Card>
          
          <Card>
            <Heading size="md" mb={4}>Time Spent by Project</Heading>
            <Box height="300px">
              <Bar data={timeSpentData} options={barOptions} />
            </Box>
          </Card>
        </SimpleGrid>
      </Box>
    </Layout>
  );
};

export default AnalyticsPage; 