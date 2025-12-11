import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Task, Client, Document } from '@/types';
import { getTaskById, getClients, saveTask, getDocuments, uploadDocument } from '@/services/api';
import { Card, Button, Badge } from '@/components/ca/ui';
import { ArrowLeft, Upload, FileText, Download, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TaskDetail: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const { toast } = useToast();

  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    if (id) loadTask(id);

    const channel = supabase
      .channel('task-detail')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `id=eq.${id}` },
        () => id && loadTask(id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents', filter: `task_id=eq.${id}` },
        () => id && loadDocuments(id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const loadTask = async (taskId: string) => {
    try {
      const t = await getTaskById(taskId);
      if (t) {
        setTask(t);
        const allClients = await getClients();
        setClient(allClients.find(c => c.id === t.client_id) || null);
        loadDocuments(taskId);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const loadDocuments = async (taskId: string) => {
    try {
      const docs = await getDocuments(taskId);
      setDocuments(docs);
    } catch (error: any) {
      console.error('Error loading documents:', error);
    }
  };

  // Check if task is past due date
  const isPastDue = task ? new Date() > new Date(task.due_date + 'T23:59:59') : false;
  const isEmployee = user.role === 'employee';
  const canUpdateStatus = !isPastDue || isAdminOrManager;

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;
    
    // Check if employee is trying to update past due date
    if (isPastDue && isEmployee) {
      toast({ 
        title: 'Task Overdue', 
        description: 'You cannot update the status of an overdue task. Please contact your manager.',
        variant: 'destructive' 
      });
      return;
    }

    setStatusLoading(true);
    try {
      const updatedTask = { 
        ...task, 
        status: newStatus as Task['status'],
        completed_at: newStatus === 'Completed' ? new Date().toISOString() : null
      };
      await saveTask(updatedTask);
      setTask(updatedTask);
      toast({ title: 'Success', description: 'Status updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && task) {
      const file = e.target.files[0];
      try {
        await uploadDocument({
          task_id: task.id,
          client_id: task.client_id,
          uploaded_by_user_id: user.id,
          file_name: file.name,
          file_url: '#', // In real app, this would be storage URL
          file_type: 'working'
        });
        toast({ title: 'Success', description: 'Document uploaded' });
        loadDocuments(task.id);
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    }
  };

  if (!task) return <div className="p-8">Loading task...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="secondary" onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4">
        <ArrowLeft size={16} /> Back
      </Button>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                <p className="text-gray-500 mt-1">Client: <span className="font-medium text-gray-900">{client?.name}</span></p>
              </div>
              <Badge color={task.status === 'Completed' ? 'green' : task.status === 'In progress' ? 'blue' : 'gray'}>
                {task.status}
              </Badge>
            </div>

            <div className="prose text-sm text-gray-700 bg-gray-50 p-4 rounded-md border border-gray-100 mb-6">
              <h4 className="text-xs uppercase text-gray-400 font-bold mb-2">Description</h4>
              <p>{task.description || 'No description provided.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p className="text-gray-500">Due Date</p>
                <p className={`font-medium ${isPastDue ? 'text-red-600' : ''}`}>
                  {new Date(task.due_date).toLocaleDateString()}
                  {isPastDue && <span className="ml-2 text-xs">(Overdue)</span>}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Priority</p>
                <p className={`font-medium ${task.priority === 'High' ? 'text-red-600' : ''}`}>{task.priority}</p>
              </div>
            </div>

            {/* Overdue warning for employees */}
            {isPastDue && isEmployee && task.status !== 'Completed' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-red-800">Task Overdue</h4>
                  <p className="text-sm text-red-600">
                    This task is past its due date. You cannot update the status. Please contact your manager for assistance.
                  </p>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {(['Not started', 'In progress', 'Waiting for client', 'Completed'] as const).map(s => (
                  <button
                    key={s}
                    disabled={statusLoading || !canUpdateStatus}
                    onClick={() => handleStatusChange(s)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      task.status === s 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : !canUpdateStatus
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="w-full md:w-80 space-y-6">
          <Card>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText size={18} /> Documents
            </h3>

            <div className="space-y-3 mb-4">
              {documents.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No files uploaded yet.</p>
              ) : (
                documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                    <span className="truncate flex-1 pr-2" title={doc.file_name}>{doc.file_name}</span>
                    <a href={doc.file_url} className="text-blue-600 hover:text-blue-800">
                      <Download size={16} />
                    </a>
                  </div>
                ))
              )}
            </div>

            <div className="relative">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-colors"
              >
                <Upload size={18} /> Upload File
              </label>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;