import { supabase } from '@/integrations/supabase/client';
import { Client, Task, Employee, Document, DashboardStats, User, AppRole, Invoice, Payment, InvoiceStats } from '@/types';

// --- Clients ---
export const getClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(c => ({
    ...c,
    status: c.status as 'Active' | 'Inactive'
  }));
};

export const saveClient = async (client: Partial<Client> & { id?: string }): Promise<void> => {
  if (client.id) {
    const { error } = await supabase
      .from('clients')
      .update({
        name: client.name,
        client_code: client.client_code,
        contact_person: client.contact_person,
        contact_phone: client.contact_phone,
        contact_email: client.contact_email,
        pan_number: client.pan_number,
        gst_number: client.gst_number,
        status: client.status,
        notes: client.notes
      })
      .eq('id', client.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('clients')
      .insert({
        name: client.name!,
        client_code: client.client_code!,
        contact_person: client.contact_person,
        contact_phone: client.contact_phone,
        contact_email: client.contact_email,
        pan_number: client.pan_number,
        gst_number: client.gst_number,
        status: client.status || 'Active',
        notes: client.notes
      });
    if (error) throw error;
  }
};

// --- Tasks ---
export const getTasks = async (currentUser?: User): Promise<Task[]> => {
  let query = supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(t => ({
    ...t,
    status: t.status as Task['status'],
    priority: t.priority as Task['priority']
  }));
};

export const getTaskById = async (id: string): Promise<Task | null> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data ? {
    ...data,
    status: data.status as Task['status'],
    priority: data.priority as Task['priority']
  } : null;
};

export const saveTask = async (task: Partial<Task> & { id?: string }): Promise<void> => {
  if (task.id) {
    const { error } = await supabase
      .from('tasks')
      .update({
        client_id: task.client_id,
        assignee_employee_id: task.assignee_employee_id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        completed_at: task.completed_at
      })
      .eq('id', task.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('tasks')
      .insert({
        client_id: task.client_id!,
        assignee_employee_id: task.assignee_employee_id,
        title: task.title!,
        description: task.description,
        status: task.status || 'Not started',
        priority: task.priority || 'Medium',
        due_date: task.due_date!
      });
    if (error) throw error;
  }
};

// --- Employees ---
export const getEmployees = async (): Promise<Employee[]> => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createEmployee = async (employeeData: Partial<Employee>, email: string, password: string): Promise<void> => {
  // Create user in auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: employeeData.full_name }
    }
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Failed to create user');

  // Create employee record
  const { error: empError } = await supabase
    .from('employees')
    .insert({
      user_id: authData.user.id,
      full_name: employeeData.full_name!,
      email: email,
      phone: employeeData.phone,
      designation: employeeData.designation || 'Staff'
    });

  if (empError) throw empError;
};

export const updateEmployee = async (employee: Employee): Promise<void> => {
  const { error } = await supabase
    .from('employees')
    .update({
      full_name: employee.full_name,
      phone: employee.phone,
      designation: employee.designation,
      active: employee.active
    })
    .eq('id', employee.id);

  if (error) throw error;
};

// --- Documents ---
export const getDocuments = async (taskId?: string): Promise<Document[]> => {
  let query = supabase.from('documents').select('*');

  if (taskId) {
    query = query.eq('task_id', taskId);
  }

  const { data, error } = await query.order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const uploadDocument = async (doc: Omit<Document, 'id' | 'uploaded_at'>): Promise<void> => {
  const { error } = await supabase
    .from('documents')
    .insert(doc);

  if (error) throw error;
};

export const deleteDocument = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// --- Dashboard Stats ---
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [clientsRes, tasksRes] = await Promise.all([
    supabase.from('clients').select('status'),
    supabase.from('tasks').select('status, due_date')
  ]);

  const clients = clientsRes.data || [];
  const tasks = tasksRes.data || [];
  const now = new Date();

  return {
    activeClients: clients.filter(c => c.status === 'Active').length,
    openTasks: tasks.filter(t => t.status === 'Not started' || t.status === 'In progress').length,
    overdueTasks: tasks.filter(t => new Date(t.due_date) < now && t.status !== 'Completed').length,
  };
};

// --- Get employee by user_id ---
export const getEmployeeByUserId = async (userId: string): Promise<Employee | null> => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
};

// --- Delete operations ---
export const deleteClient = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const deleteTask = async (id: string): Promise<void> => {
  // First delete associated documents
  await supabase
    .from('documents')
    .delete()
    .eq('task_id', id);

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// --- Invoices ---
export const getInvoices = async (): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(inv => ({
    ...inv,
    amount: Number(inv.amount),
    status: inv.status as Invoice['status']
  }));
};

export const saveInvoice = async (invoice: Partial<Invoice> & { id?: string }): Promise<void> => {
  if (invoice.id) {
    const { error } = await supabase
      .from('invoices')
      .update({
        client_id: invoice.client_id,
        task_id: invoice.task_id,
        amount: invoice.amount,
        status: invoice.status,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        paid_date: invoice.paid_date,
        description: invoice.description,
        notes: invoice.notes
      })
      .eq('id', invoice.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoice.invoice_number!,
        client_id: invoice.client_id,
        task_id: invoice.task_id,
        amount: invoice.amount!,
        status: invoice.status || 'Draft',
        issue_date: invoice.issue_date,
        due_date: invoice.due_date!,
        description: invoice.description,
        notes: invoice.notes,
        created_by: invoice.created_by!
      });
    if (error) throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// --- Payments ---
export const getPayments = async (invoiceId?: string): Promise<Payment[]> => {
  let query = supabase.from('payments').select('*');

  if (invoiceId) {
    query = query.eq('invoice_id', invoiceId);
  }

  const { data, error } = await query.order('payment_date', { ascending: false });
  if (error) throw error;
  return (data || []).map(p => ({
    ...p,
    amount: Number(p.amount)
  }));
};

export const savePayment = async (payment: Omit<Payment, 'id' | 'created_at'>): Promise<void> => {
  const { error } = await supabase
    .from('payments')
    .insert(payment);

  if (error) throw error;
};

// --- Invoice Stats ---
export const getInvoiceStats = async (): Promise<InvoiceStats> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('amount, status');

  if (error) throw error;

  const invoices = data || [];

  return {
    totalInvoices: invoices.length,
    totalPaid: invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + Number(i.amount), 0),
    totalPending: invoices.filter(i => i.status === 'Draft' || i.status === 'Sent').reduce((sum, i) => sum + Number(i.amount), 0),
    totalOverdue: invoices.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + Number(i.amount), 0)
  };
};
