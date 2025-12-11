import React, { useEffect, useState } from 'react';
import { User, DashboardStats, Task, Client } from '@/types';
import { getDashboardStats, getTasks, getClients, getEmployeeByUserId } from '@/services/api';
import { Card, Badge } from '@/components/ca/ui';
import { Briefcase, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<string, string>>({});

  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    const fetchData = async () => {
      const clients = await getClients();
      const cMap: Record<string, string> = {};
      clients.forEach(c => cMap[c.id] = c.name);
      setClientsMap(cMap);

      if (isAdminOrManager) {
        const s = await getDashboardStats();
        setStats(s);
        const tasks = await getTasks(user);
        setRecentTasks(tasks.slice(0, 5));
      } else {
        const myEmployee = await getEmployeeByUserId(user.id);
        if (myEmployee) {
          const tasks = await getTasks(user);
          const myTasks = tasks.filter(t => t.assignee_employee_id === myEmployee.id);
          const now = new Date();
          setStats({
            activeClients: 0,
            openTasks: myTasks.filter(t => t.status === 'In progress' || t.status === 'Not started').length,
            overdueTasks: myTasks.filter(t => new Date(t.due_date) < now && t.status !== 'Completed').length,
          });
          setRecentTasks(myTasks.slice(0, 5));
        }
      }
    };
    fetchData();

    // Real-time subscription for tasks
    const channel = supabase
      .channel('dashboard-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card className="flex items-center gap-4">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isAdminOrManager ? 'Admin Dashboard' : 'My Work Overview'}
        </h2>
        <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isAdminOrManager && (
            <StatCard
              title="Total Active Clients"
              value={stats.activeClients}
              icon={Briefcase}
              color="bg-blue-500"
            />
          )}
          <StatCard
            title={isAdminOrManager ? "Open Tasks (Total)" : "My Open Tasks"}
            value={stats.openTasks}
            icon={CheckCircle}
            color="bg-yellow-500"
          />
          <StatCard
            title="Overdue Tasks"
            value={stats.overdueTasks}
            icon={AlertCircle}
            color="bg-red-500"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
              <Link to="/tasks" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-2">Task</th>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Due Date</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentTasks.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        <Link to={`/tasks/${task.id}`} className="hover:text-blue-600">{task.title}</Link>
                      </td>
                      <td className="px-4 py-3">{clientsMap[task.client_id] || 'Unknown'}</td>
                      <td className="px-4 py-3">{new Date(task.due_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Badge color={task.status === 'Completed' ? 'green' : task.status === 'In progress' ? 'blue' : 'gray'}>
                          {task.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {recentTasks.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-3 text-center text-gray-500">No tasks found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/tasks" className="block w-full text-center py-2 px-4 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 font-medium">
                View All Tasks
              </Link>
              {isAdminOrManager && (
                <Link to="/clients" className="block w-full text-center py-2 px-4 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 font-medium">
                  Manage Clients
                </Link>
              )}
              {isAdminOrManager && (
                <Link to="/employees" className="block w-full text-center py-2 px-4 bg-green-50 text-green-700 rounded-md hover:bg-green-100 font-medium">
                  Manage Employees
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
