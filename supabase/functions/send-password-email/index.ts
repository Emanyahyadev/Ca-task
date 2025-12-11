import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ForgotPasswordRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: ForgotPasswordRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Processing forgot password request for:", email);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find employee by email
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("email, full_name, employee_id")
      .eq("email", email)
      .single();

    if (employeeError || !employee) {
      console.log("Employee not found for email:", email);
      // Return success even if email not found (security best practice)
      return new Response(
        JSON.stringify({ 
          message: "If an account exists with this email, you will receive your login credentials shortly." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Employee found:", employee.full_name);

    // Send email with the employee_id (password)
    const emailResponse = await resend.emails.send({
      from: "CA Task Management System <onboarding@resend.dev>",
      to: [email],
      subject: "Your CA Firm Manager Login Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">Password Recovery</h1>
          <p style="color: #666; font-size: 16px;">Hello ${employee.full_name},</p>
          <p style="color: #666; font-size: 16px;">You requested your login credentials for CA Firm Manager. Here are your details:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${employee.employee_id}</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">For security reasons, we recommend you log in immediately and contact your manager if you didn't request this email.</p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">This is an automated message from CA Firm Manager. Please do not reply to this email.</p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        message: "If an account exists with this email, you will receive your login credentials shortly." 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
