-- Add employee_id column to employees table
ALTER TABLE public.employees ADD COLUMN employee_id text;

-- Create index for faster lookups
CREATE INDEX idx_employees_employee_id ON public.employees(employee_id);