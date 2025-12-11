import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateEmployeeRequest {
  full_name: string;
  email: string;
  phone?: string;
  designation?: string;
  employee_id: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify they're a manager
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error("Failed to get user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin or manager
    const { data: roleData, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError || !roleData || (roleData.role !== "admin" && roleData.role !== "manager")) {
      console.error("User is not admin/manager:", roleError || roleData);
      return new Response(
        JSON.stringify({ error: "Only managers can create employees" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { full_name, email, phone, designation, employee_id }: CreateEmployeeRequest = await req.json();

    if (!full_name || !email || !employee_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: full_name, email, employee_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (employee_id.length < 6) {
      return new Response(
        JSON.stringify({ error: "Employee ID must be at least 6 characters (used as password)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for admin operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if user already exists
    console.log("Checking if user exists:", email);
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      console.log("User already exists, checking for employee record:", existingUser.id);
      
      // Check if employee record already exists
      const { data: existingEmployee } = await adminClient
        .from("employees")
        .select("id")
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingEmployee) {
        return new Response(
          JSON.stringify({ error: "An employee with this email already exists" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // User exists but no employee record - use existing user
      userId = existingUser.id;
      console.log("Using existing auth user:", userId);
    } else {
      // Create new auth user
      console.log("Creating new auth user for:", email);
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: email,
        password: employee_id,
        email_confirm: true,
        user_metadata: { full_name: full_name }
      });

      if (authError) {
        console.error("Auth error:", authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!authData.user) {
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = authData.user.id;
      console.log("Auth user created:", userId);
    }

    // Create employee record
    const { error: empError } = await adminClient
      .from("employees")
      .insert({
        user_id: userId,
        full_name: full_name,
        email: email,
        phone: phone || null,
        designation: designation || "Staff",
        employee_id: employee_id
      });

    if (empError) {
      console.error("Employee insert error:", empError);
      return new Response(
        JSON.stringify({ error: empError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Employee created successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Employee created! Login: ${email} | Password: ${employee_id}`,
        employee: {
          email: email,
          password: employee_id
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in create-employee function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
