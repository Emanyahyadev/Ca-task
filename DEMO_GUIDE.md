# CA Firm Manager - Complete User Guide

**Version:** 2.0  
**Last Updated:** December 2024

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Technology Stack](#3-technology-stack)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Getting Started](#5-getting-started)
6. [Database Configuration](#6-database-configuration)
7. [Authentication Setup](#7-authentication-setup)
8. [Feature Walkthrough](#8-feature-walkthrough)
9. [Demo Script](#9-demo-script)
10. [Edge Function Setup](#10-edge-function-setup)
11. [Troubleshooting](#11-troubleshooting)
12. [Quick Reference](#12-quick-reference)

---

## 1. Introduction

CA Firm Manager is a comprehensive task and client management system designed for Chartered Accountant firms. It enables managers to efficiently manage clients, assign tasks to employees, and track work progress with real-time updates.

---

## 2. System Overview

### Core Features

- **Client Management**: Add, edit, and manage client information
- **Task Management**: Create, assign, edit, and track tasks with due dates and priorities
- **Employee Management**: Create employee accounts, manage access, and track assignments
- **Document Management**: Upload and manage task-related documents
- **Real-time Updates**: Instant synchronization across all users
- **Role-based Access Control**: Different views and permissions for Managers and Employees
- **Due Date Enforcement**: Employees cannot update overdue tasks

---

## 3. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Real-time | Supabase Realtime |
| Email Service | Resend API |
| Build Tool | Vite |

---

## 4. User Roles & Permissions

The system has **two primary user roles**: Manager and Employee.

> **Note:** The `admin` role exists in the database enum but functionally, Managers have full administrative control. The admin role can be used if hierarchical admin access is needed in the future.

### Manager Role (Full Administrative Control)

Managers have **complete control** over the system:

| Feature | Create | Read | Update | Delete |
|---------|--------|------|--------|--------|
| Dashboard | - | Full View (all data) | - | - |
| Clients | ✅ | ✅ | ✅ | ✅ |
| Tasks | ✅ | ✅ | ✅ | ✅ |
| Employees | ✅ | ✅ | ✅ (Activate/Deactivate) | ✅ |
| Documents | ✅ | ✅ | - | - |

### Employee Role (Limited Access)

Employees have **restricted access** focused on their assigned work:

| Feature | Create | Read | Update | Delete |
|---------|--------|------|--------|--------|
| Dashboard | - | Personal Only (own tasks) | - | - |
| Clients | ❌ | View Only | ❌ | ❌ |
| Tasks | ❌ | Assigned Only | Status Only* | ❌ |
| Employees | ❌ | ❌ | ❌ | ❌ |
| Documents | ✅ | Assigned Tasks | - | - |

**\*Due Date Restriction:** Employees can only update task status if the task is **NOT overdue**. Once the due date passes, status buttons are disabled and a warning is shown.

### Key Differences

| Capability | Manager | Employee |
|------------|---------|----------|
| View all clients | ✅ | ✅ (read-only) |
| Create/Edit/Delete clients | ✅ | ❌ |
| View all tasks | ✅ | ❌ (own only) |
| Create/Edit/Delete tasks | ✅ | ❌ |
| Update task status | ✅ (always) | ✅ (before due date only) |
| Manage employees | ✅ | ❌ |
| Access Employees section | ✅ | ❌ (hidden) |
| Full dashboard statistics | ✅ | ❌ (personal only) |

---

## 5. Getting Started

### Prerequisites

- Node.js 18+ and npm/bun
- Supabase account (or Lovable Cloud)
- Resend account (for forgot password emails - optional)
- Code editor (VS Code recommended)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ca-firm-manager

# Install dependencies
npm install
# or
bun install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

**Where to find these values:**
- Go to your Supabase Dashboard → Project Settings → API
- `Project ID` is in the URL: `https://supabase.com/dashboard/project/YOUR-PROJECT-ID`
- `anon key` is under "Project API keys"
- `URL` is under "Project URL"

---

## 6. Database Configuration

### Tables Overview

| Table | Purpose |
|-------|---------|
| `profiles` | User profile information (auto-created on signup) |
| `user_roles` | User role assignments (manager/employee) |
| `employees` | Employee records with contact details and Employee ID |
| `clients` | Client information, PAN, GST, and status |
| `tasks` | Task details, assignments, priority, and status |
| `documents` | File metadata for uploads |

### Enums

| Enum | Values |
|------|--------|
| `app_role` | admin, manager, employee |
| `task_status` | Not started, In progress, Waiting for client, Completed |
| `priority` | Low, Medium, High |
| `client_status` | Active, Inactive |

### Real-time Enabled Tables

The following tables have real-time updates enabled:
- `clients`
- `tasks`
- `employees`
- `documents`

Any changes to these tables are instantly reflected across all connected users.

---

## 7. Authentication Setup

### Email Auto-Confirm

Email confirmation is **disabled** for seamless user creation. New users can log in immediately after account creation.

To verify this is set:
1. Go to Supabase Dashboard → Authentication → Providers → Email
2. Ensure "Confirm email" is **OFF**

### Creating the First Manager

1. Sign up through the application with any email
2. Run this SQL in Supabase SQL Editor:

```sql
-- Replace 'manager@example.com' with your email
UPDATE public.user_roles 
SET role = 'manager' 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'manager@example.com'
);
```

3. Log out and log back in to apply the new role

### New User Flow

When a new user signs up:
1. A profile record is automatically created
2. Default role of `employee` is assigned via trigger
3. Manager must separately create an employee record for the user

---

## 8. Feature Walkthrough

### 8.1 Dashboard

**Manager View:**
- Total Active Clients count
- Open Tasks count (all tasks)
- Overdue Tasks count (all tasks)
- Recent Tasks list showing all tasks
- Quick Actions: Tasks, Clients, Employees

**Employee View:**
- Open Tasks count (personal only)
- Overdue Tasks count (personal only)
- Recent Tasks list showing only assigned tasks
- Quick Actions: Tasks only
- **Note:** Employees cannot see other employees' data or global statistics

### 8.2 Clients Management

**Access:** Managers can create/edit/delete. Employees can view only.

**View Clients:**
- Search bar for filtering by name
- Table showing: Client Code, Name, Contact Person, Phone, Status
- Action buttons (managers only): Edit (pencil icon), Delete (trash icon)

**Create Client (Manager):**
1. Click "Add Client" button
2. Fill in fields:
   - **Client Code** (required, unique identifier)
   - **Client Name** (required)
   - Contact Person
   - Contact Email
   - Contact Phone
   - PAN Number
   - GST Number
   - Notes
3. Click "Save"

**Edit Client (Manager):**
1. Click the pencil icon on client row
2. Modify fields as needed
3. Click "Save"

**Delete Client (Manager):**
1. Click the trash icon on client row
2. Confirm deletion in alert dialog
3. **Warning:** Deleting a client will also delete associated tasks

### 8.3 Tasks Management

**View Tasks:**
- Filter tabs: All, Not started, In progress, Waiting for client, Completed
- Each task card displays:
  - Title
  - Client name
  - Status badge (color-coded)
  - Due date
  - Priority badge (High = red border)
  - Assignee (managers only)
- Action buttons (managers only): Edit (pencil icon), Delete (trash icon)

**Create Task (Manager):**
1. Click "Add Task" button
2. Fill in fields:
   - **Title** (required)
   - **Client** (required, dropdown)
   - **Assignee** (dropdown of active employees)
   - **Priority** (Low/Medium/High)
   - **Due Date** (required)
   - Description
   - Status
3. Click "Save"

**Edit Task (Manager):**
1. Click the pencil icon on task card
2. Modify any fields: Title, Client, Assignee, Priority, Due Date, Description, Status
3. Click "Save"
4. Changes are reflected immediately via real-time updates

**Delete Task (Manager):**
1. Click the trash icon on task card
2. Confirm deletion in alert dialog

**Task Detail Page:**
- Click on any task card to open detailed view
- Shows full description, status, due date, priority
- Status update buttons for changing task status
- Document upload section
- List of uploaded documents with download links

**Update Task Status:**

| User Type | Before Due Date | After Due Date |
|-----------|-----------------|----------------|
| Manager | ✅ Can update | ✅ Can update |
| Employee | ✅ Can update | ❌ Disabled + Warning |

**Employee Due Date Restriction:**
- If current date is past the due date, status buttons are **disabled**
- Warning message: "Task overdue! You cannot update the status. Please contact your manager."
- This ensures employees communicate with managers about overdue tasks

### 8.4 Employees Management (Manager Only)

**Access:** Only visible to managers. Hidden from employee navigation.

**View Employees:**
- Table showing: Name, Email, Designation, Phone, Status, Actions
- Status badge: Active (green) or Inactive (red)

**Create Employee:**
1. Click "Add Employee" button
2. Fill in fields:
   - **Full Name** (required)
   - **Email** (required, must be unique and valid)
   - Designation
   - Phone
   - **Employee ID** (required, **minimum 6 characters** - this becomes their password)
3. Click "Save"
4. On success, a toast message displays the login credentials:
   ```
   Employee created successfully!
   Login credentials:
   Email: [entered email]
   Password: [Employee ID]
   ```

**Important Notes:**
- Employee ID serves as the initial password
- Minimum 6 characters required for security
- If the email already exists in auth.users, the system links to the existing account
- The edge function `create-employee` handles user creation atomically

**Activate/Deactivate Employee:**
- Click "Deactivate" button to disable employee access
- Button changes to "Activate" with green color
- Click "Activate" to re-enable access
- Deactivated employees cannot log in

**Delete Employee:**
1. Click "Delete" button
2. Confirm deletion in alert dialog
3. **Warning:** This removes the employee record but keeps the auth user

### 8.5 Document Management

**Upload Document:**
1. Navigate to Task Detail page (click on a task)
2. In the Documents section, click "Choose File"
3. Select a file from your computer
4. Click "Upload"
5. Document appears in the list below

**View/Download Document:**
- Click on the document name to download
- Documents are stored in Supabase Storage

### 8.6 Forgot Password Feature

**For Employees:**
1. On the login page, click "Forgot password?"
2. Enter your registered email address
3. Click "Send Password"
4. Check your email for a message containing your Employee ID (password)
5. Use the Employee ID to log in

**Note:** This feature uses Resend API to send emails. See Edge Function Setup section.

---

## 9. Demo Script

### Part 1: Manager Demo

**Step 1: Login as Manager**
1. Navigate to login page
2. Enter manager credentials
3. Observe the full dashboard with all statistics

**Step 2: Create a Client**
1. Click "Clients" in sidebar
2. Click "Add Client"
3. Enter:
   - Client Code: `CL001`
   - Name: `ABC Corporation`
   - Contact Person: `John Doe`
   - Email: `john@abccorp.com`
   - Phone: `9876543210`
4. Click "Save"
5. Verify client appears in the list

**Step 3: Create an Employee**
1. Click "Employees" in sidebar
2. Click "Add Employee"
3. Enter:
   - Full Name: `Jane Smith`
   - Email: `jane@example.com`
   - Designation: `Junior Accountant`
   - Phone: `9123456789`
   - Employee ID: `EMP001` (min 6 characters)
4. Click "Save"
5. **Note the success message** showing login credentials:
   - Email: jane@example.com
   - Password: EMP001

**Step 4: Create and Assign a Task**
1. Click "Tasks" in sidebar
2. Click "Add Task"
3. Enter:
   - Title: `Q4 GST Filing`
   - Client: `ABC Corporation`
   - Assignee: `Jane Smith`
   - Priority: `High`
   - Due Date: (set to a future date)
   - Description: `Complete Q4 GST return filing`
4. Click "Save"
5. Verify task appears with High priority badge

**Step 5: Edit a Task**
1. On the task card, click the pencil icon
2. Change Priority from `High` to `Medium`
3. Click "Save"
4. Verify the priority badge updates

**Step 6: Delete a Task (Optional)**
1. On a task card, click the trash icon
2. Confirm deletion
3. Verify task is removed

### Part 2: Employee Demo

**Step 1: Login as Employee**
1. Logout from manager account
2. Login with employee credentials:
   - Email: `jane@example.com`
   - Password: `EMP001`
3. Observe the limited dashboard (personal tasks only)
4. Note: Employees section is NOT visible in sidebar

**Step 2: View Assigned Tasks**
1. Click "Tasks" in sidebar
2. Only see tasks assigned to you
3. Note: No Add/Edit/Delete buttons visible

**Step 3: Update Task Status**
1. Click on your assigned task to open Task Detail
2. Click "In progress" button to update status
3. Verify status badge changes
4. Status change is visible to managers in real-time

**Step 4: Test Due Date Restriction**
1. Ask manager to create a task with a **past due date** assigned to employee
2. Login as employee
3. Open the overdue task
4. Observe:
   - Status buttons are **disabled**
   - Warning message appears: "Task overdue! You cannot update the status."
5. This demonstrates the due date enforcement feature

### Part 3: Forgot Password Demo

**Step 1: Initiate Password Reset**
1. On login page, click "Forgot password?"
2. Enter employee email: `jane@example.com`
3. Click "Send Password"

**Step 2: Receive Email**
1. Check the email inbox (or spam folder)
2. Email contains the Employee ID (password)
3. Use it to log in

---

## 10. Edge Function Setup

### Forgot Password Edge Function

Location: `supabase/functions/send-password-email/index.ts`

This function:
1. Receives an email address
2. Looks up the employee record by email
3. Sends an email with the Employee ID (password) via Resend API

**Setup Steps:**

1. **Get Resend API Key:**
   - Sign up at [resend.com](https://resend.com)
   - Create an API key in the dashboard
   - Free tier: 100 emails/day

2. **Add Secret:**
   - In Supabase Dashboard → Project Settings → Secrets
   - Add: `RESEND_API_KEY` with your API key value

3. **Domain Verification (Optional):**
   - For production, verify your sending domain in Resend
   - Without verification, emails are sent from `onboarding@resend.dev`

### Create Employee Edge Function

Location: `supabase/functions/create-employee/index.ts`

This function:
1. Creates an auth user with email and Employee ID as password
2. Creates the employee record in the database
3. Links existing auth users to new employee records if email exists
4. Uses service role key to avoid session conflicts

**Why Edge Function?**
Using regular `supabase.auth.signUp()` from the frontend would:
- Log out the current manager
- Create a session for the new employee

The edge function uses service role key to create users without affecting the manager's session.

---

## 11. Troubleshooting

### Common Issues

#### Login Fails
- **Cause:** Incorrect credentials or account not created
- **Solution:** Verify email and password. For employees, password is the Employee ID.

#### "Permission Denied" Error
- **Cause:** RLS policies blocking access
- **Solution:** Verify user role is correctly set in `user_roles` table

#### No Data Displaying
- **Cause:** RLS policies or no data exists
- **Solution:** 
  - Check if data exists in the tables
  - Verify user has appropriate role
  - Check browser console for errors

#### Task Status Buttons Disabled
- **Cause:** Task is overdue and user is an employee
- **Solution:** This is **expected behavior**. Contact manager to either:
  - Extend the due date
  - Update the status on behalf of the employee

#### "A user with this email address has already been registered"
- **Cause:** Email already exists in auth.users
- **Solution:** The system automatically links to the existing user. If the employee record was created successfully, the employee can log in with their existing password or the new Employee ID.

#### Forgot Password Email Not Received
- **Cause:** Email not in employees table, Resend API issue, or spam filter
- **Solution:**
  1. Verify email exists in employees table
  2. Check RESEND_API_KEY secret is configured
  3. Check spam/junk folder
  4. Verify Resend account is active

#### Real-time Updates Not Working
- **Cause:** Supabase Realtime not configured for tables
- **Solution:** Verify tables are added to `supabase_realtime` publication

#### Employees Section Not Visible
- **Cause:** User has employee role, not manager
- **Solution:** This is **expected behavior**. Only managers can access employee management.

#### Employee ID Too Short Error
- **Cause:** Employee ID must be minimum 6 characters
- **Solution:** Use a longer Employee ID (e.g., `EMP001` instead of `E01`)

### Checking Logs

- **Browser Console:** Press F12 → Console tab
- **Network Tab:** Press F12 → Network tab to see API responses
- **Supabase Logs:** Dashboard → Logs → Edge Functions

---

## 12. Quick Reference

### Actions & Permissions

| Action | Who Can Do It | How |
|--------|---------------|-----|
| View Full Dashboard | Manager | Login → Dashboard shows all data |
| View Personal Dashboard | Employee | Login → Dashboard shows own tasks |
| Create Client | Manager | Clients → Add Client |
| Edit Client | Manager | Clients → Pencil icon |
| Delete Client | Manager | Clients → Trash icon → Confirm |
| View Clients | Manager, Employee | Clients (employees: read-only) |
| Create Task | Manager | Tasks → Add Task |
| Edit Task | Manager | Tasks → Pencil icon |
| Delete Task | Manager | Tasks → Trash icon → Confirm |
| View All Tasks | Manager | Tasks → All tab |
| View Own Tasks | Employee | Tasks (only assigned tasks shown) |
| Update Task Status | Manager (always), Employee (before due date) | Task Detail → Status buttons |
| Create Employee | Manager | Employees → Add Employee |
| Deactivate Employee | Manager | Employees → Deactivate button |
| Delete Employee | Manager | Employees → Delete → Confirm |
| Upload Document | Manager, Employee | Task Detail → Choose File → Upload |
| Download Document | Manager, Employee | Task Detail → Click document name |
| Forgot Password | Employee | Login → Forgot password? → Enter email |

### Task Status Flow

```
Not started → In progress → Waiting for client → Completed
```

### Priority Levels

| Level | Badge Color | Usage |
|-------|-------------|-------|
| Low | Gray | Routine, non-urgent tasks |
| Medium | Default | Standard priority tasks |
| High | Red border | Urgent, time-sensitive tasks |

### Default Credentials Pattern

| Role | Email | Password |
|------|-------|----------|
| Manager | Set during first signup | User chosen during signup |
| Employee | Set by manager | Employee ID (min 6 chars) |

### Status Badge Colors

| Status | Color |
|--------|-------|
| Not started | Gray |
| In progress | Blue |
| Waiting for client | Yellow |
| Completed | Green |

---

## Support

For additional help:
1. Check browser console (F12) for JavaScript errors
2. Check Network tab for API response errors
3. Review Supabase Edge Function logs
4. Ensure all environment variables are set correctly
5. Verify database migrations are applied

---

*This guide covers CA Firm Manager v2.0 - December 2024*
