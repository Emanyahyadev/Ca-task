export type AppRole = 'admin' | 'manager' | 'employee';

export type TaskStatus = 'Not started' | 'In progress' | 'Waiting for client' | 'Completed';
export type Priority = 'Low' | 'Medium' | 'High';
export type ClientStatus = 'Active' | 'Inactive';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';

export interface User {
  id: string;
  email: string;
  role: AppRole;
  name: string;
}

export interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  designation: string | null;
  active: boolean;
  email: string;
}

export interface Client {
  id: string;
  name: string;
  client_code: string;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  pan_number: string | null;
  gst_number: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  client_id: string;
  assignee_employee_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string;
  completed_at: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  client_id: string | null;
  task_id: string | null;
  uploaded_by_user_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  uploaded_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string | null;
  task_id: string | null;
  amount: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  description: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface DashboardStats {
  activeClients: number;
  openTasks: number;
  overdueTasks: number;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}
