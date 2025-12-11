import React, { useState, useEffect } from 'react';
import { User, Task, Client, Employee } from '@/types';
import { getTasks, getClients, getEmployees, saveTask, getEmployeeByUserId, deleteTask } from '@/services/api';
import { Card, Button, Input, Modal, Label, Badge } from '@/components/ca/ui';
import { Search, Plus, Filter, Trash2, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Tasks: React.FC<{ user: User }> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({});
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadData = async () => {
    try {
      const [t, c, e] = await Promise.all([
        getTasks(user),
        getClients(),
        getEmployees()
      ]);

      // Get employee record for non-admin users
      if (!isAdminOrManager) {
        const myEmp = await getEmployeeByUserId(user.id);
        if (myEmp) {
          setMyEmployeeId(myEmp.id);
          setTasks(t.filter(task => task.assignee_employee_id === myEmp.id));
        } else {
          setTasks([]);
        }
      } else {
        setTasks(t);
      }
      
      setClients(c);
      setEmployees(e);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.client_id || !newTask.due_date) return;

    setLoading(true);
    try {
      await saveTask({
        ...(editingTaskId && { id: editingTaskId }),
        client_id: newTask.client_id,
        assignee_employee_id: newTask.assignee_employee_id || null,
        title: newTask.title,
        description: newTask.description || '',
        status: newTask.status || 'Not started',
        priority: newTask.priority || 'Medium',
        due_date: newTask.due_date
      });
      setIsModalOpen(false);
      setNewTask({});
      setEditingTaskId(null);
      toast({ title: 'Success', description: editingTaskId ? 'Task updated successfully' : 'Task created successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTask({
      title: task.title,
      client_id: task.client_id,
      assignee_employee_id: task.assignee_employee_id,
      priority: task.priority,
      due_date: task.due_date,
      description: task.description,
      status: task.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTask(deleteId);
      toast({ title: 'Success', description: 'Task deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown';
  const getEmpName = (id: string | null) => id ? employees.find(e => e.id === id)?.full_name || 'Unassigned' : 'Unassigned';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">{isAdminOrManager ? 'All Tasks' : 'My Tasks'}</h2>
        {isAdminOrManager && (
          <Button onClick={() => { setNewTask({}); setEditingTaskId(null); setIsModalOpen(true); }} className="flex items-center gap-2">
            <Plus size={16} /> Create Task
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 flex-1 border rounded-md px-3 py-2">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="flex-1 outline-none text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select
            className="border-none bg-transparent text-sm font-medium focus:outline-none"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Not started">Not started</option>
            <option value="In progress">In progress</option>
            <option value="Waiting for client">Waiting</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.map(task => (
          <Link key={task.id} to={`/tasks/${task.id}`}>
            <Card className="hover:border-blue-300 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{task.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">Client: {getClientName(task.client_id)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge color={task.status === 'Completed' ? 'green' : task.status === 'In progress' ? 'blue' : task.status === 'Waiting for client' ? 'yellow' : 'gray'}>
                    {task.status}
                  </Badge>
                  {isAdminOrManager && (
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(task); }}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(task.id); }}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  <span className={`px-2 py-0.5 rounded text-xs border ${task.priority === 'High' ? 'border-red-200 text-red-700 bg-red-50' : 'border-gray-200'}`}>
                    {task.priority}
                  </span>
                </div>
                {isAdminOrManager && <span>Assignee: {getEmpName(task.assignee_employee_id)}</span>}
              </div>
            </Card>
          </Link>
        ))}
        {filteredTasks.length === 0 && <p className="text-center text-gray-500 py-10">No tasks found.</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTaskId(null); setNewTask({}); }} title={editingTaskId ? "Edit Task" : "Create New Task"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label>Task Title *</Label>
            <Input value={newTask.title || ''} onChange={e => setNewTask({...newTask, title: e.target.value})} required placeholder="e.g. March GST Return" />
          </div>
          <div>
            <Label>Client *</Label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={newTask.client_id || ''}
              onChange={e => setNewTask({...newTask, client_id: e.target.value})}
              required
            >
              <option value="">Select Client</option>
              {clients.filter(c => c.status === 'Active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assign To</Label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={newTask.assignee_employee_id || ''}
                onChange={e => setNewTask({...newTask, assignee_employee_id: e.target.value || null})}
              >
                <option value="">Unassigned</option>
                {employees.filter(e => e.active).map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <Label>Priority</Label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={newTask.priority || 'Medium'}
                onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Due Date *</Label>
            <Input 
              type="date" 
              value={newTask.due_date ? newTask.due_date.split('T')[0] : ''} 
              onChange={e => setNewTask({...newTask, due_date: e.target.value})} 
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm h-24"
              value={newTask.description || ''}
              onChange={e => setNewTask({...newTask, description: e.target.value})}
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setEditingTaskId(null); setNewTask({}); }}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? (editingTaskId ? 'Updating...' : 'Creating...') : (editingTaskId ? 'Update Task' : 'Create Task')}</Button>
          </div>
        </form>
      </Modal>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task and all associated documents from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tasks;