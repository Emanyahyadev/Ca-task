-- Invoice status enum
CREATE TYPE invoice_status AS ENUM ('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled');

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'Draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  description TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices (Manager only)
CREATE POLICY "Admin/Manager can view all invoices"
ON public.invoices FOR SELECT
USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can create invoices"
ON public.invoices FOR INSERT
WITH CHECK (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can update invoices"
ON public.invoices FOR UPDATE
USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can delete invoices"
ON public.invoices FOR DELETE
USING (is_admin_or_manager(auth.uid()));

-- RLS Policies for payments (Manager only)
CREATE POLICY "Admin/Manager can view all payments"
ON public.payments FOR SELECT
USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can create payments"
ON public.payments FOR INSERT
WITH CHECK (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can update payments"
ON public.payments FOR UPDATE
USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can delete payments"
ON public.payments FOR DELETE
USING (is_admin_or_manager(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;