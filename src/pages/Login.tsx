import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Briefcase, Mail, Lock, ArrowRight, ArrowLeft, Shield, Users, ClipboardList } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { signIn } = useAuth();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('send-password-email', {
        body: { email: forgotEmail }
      });

      if (error) throw error;

      toast.success('If an account exists with this email, you will receive your login credentials shortly.');
      setIsForgotPassword(false);
      setForgotEmail('');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send password recovery email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 shrink-0">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-white text-xs sm:text-sm">{title}</h3>
        <p className="text-blue-200/70 text-[10px] sm:text-xs mt-1">{description}</p>
      </div>
    </div>
  );

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Branding */}
        <div className="hidden md:flex md:w-full lg:w-1/2 gradient-dark relative overflow-hidden md:min-h-[280px] lg:min-h-screen">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 md:top-20 md:left-20 w-40 md:w-72 h-40 md:h-72 bg-blue-500 rounded-full filter blur-[60px] md:blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-10 right-10 md:bottom-20 md:right-20 w-52 md:w-96 h-52 md:h-96 bg-cyan-500 rounded-full filter blur-[80px] md:blur-[120px] animate-pulse-slow" />
          </div>

          <div className="relative z-10 flex flex-col justify-center p-6 sm:p-8 md:p-12 xl:p-20 w-full">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 md:mb-8">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-elegant">
                <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-white">CA Task Manager</h1>
                <p className="text-blue-200/70 text-xs sm:text-sm">Task Management System</p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-display font-bold text-white leading-tight mb-3 md:mb-6">
              Streamline Your<br />
              <span className="text-gradient">CA Practice</span>
            </h2>

            <p className="text-blue-200/80 text-sm md:text-lg mb-6 md:mb-10 max-w-md hidden lg:block">
              Manage clients, track tasks, and boost productivity with our comprehensive task management solution.
            </p>

            <div className="space-y-3 md:space-y-4 hidden lg:block">
              <FeatureCard
                icon={Users}
                title="Client Management"
                description="Organize and track all your clients in one place"
              />
              <FeatureCard
                icon={ClipboardList}
                title="Task Tracking"
                description="Assign, monitor, and complete tasks efficiently"
              />
              <FeatureCard
                icon={Shield}
                title="Secure & Reliable"
                description="Enterprise-grade security for your data"
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Forgot Password Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 bg-background min-h-[calc(100vh-280px)] md:min-h-0 lg:min-h-screen">
          <div className="w-full max-w-md animate-fade-in">
            <div className="md:hidden flex items-center gap-2 sm:gap-3 mb-6 sm:mb-10 justify-center">
              <div className="p-2 sm:p-3 rounded-xl gradient-primary shadow-elegant">
                <Briefcase className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-display font-bold text-foreground">CA Task Manager</span>
            </div>

            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                Forgot Password?
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Enter your email to receive your login credentials
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <label htmlFor="forgotEmail" className="text-xs sm:text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <input
                    id="forgotEmail"
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSendingEmail}
                className="w-full py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl font-semibold text-white gradient-primary shadow-elegant hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isSendingEmail ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Password
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>

              <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                Note: Password recovery emails are sent to registered employee emails only.
              </p>

              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(''); setForgotEmail(''); }}
                className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="hidden md:flex md:w-full lg:w-1/2 gradient-dark relative overflow-hidden md:min-h-[280px] lg:min-h-screen">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 md:top-20 md:left-20 w-40 md:w-72 h-40 md:h-72 bg-blue-500 rounded-full filter blur-[60px] md:blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-10 right-10 md:bottom-20 md:right-20 w-52 md:w-96 h-52 md:h-96 bg-cyan-500 rounded-full filter blur-[80px] md:blur-[120px] animate-pulse-slow" />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-6 sm:p-8 md:p-12 xl:p-20 w-full">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 md:mb-8">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-elegant">
              <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-white">CA Task Manager</h1>
              <p className="text-blue-200/70 text-xs sm:text-sm">Task Management System</p>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-display font-bold text-white leading-tight mb-3 md:mb-6">
            Streamline Your<br />
            <span className="text-gradient">CA Practice</span>
          </h2>

          <p className="text-blue-200/80 text-sm md:text-lg mb-6 md:mb-10 max-w-md hidden lg:block">
            Manage clients, track tasks, and boost productivity with our comprehensive task management solution.
          </p>

          <div className="space-y-3 md:space-y-4 hidden lg:block">
            <FeatureCard
              icon={Users}
              title="Client Management"
              description="Organize and track all your clients in one place"
            />
            <FeatureCard
              icon={ClipboardList}
              title="Task Tracking"
              description="Assign, monitor, and complete tasks efficiently"
            />
            <FeatureCard
              icon={Shield}
              title="Secure & Reliable"
              description="Enterprise-grade security for your data"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 bg-background min-h-[calc(100vh-280px)] md:min-h-0 lg:min-h-screen">
        <div className="w-full max-w-md animate-fade-in">
          <div className="md:hidden flex items-center gap-2 sm:gap-3 mb-6 sm:mb-10 justify-center">
            <div className="p-2 sm:p-3 rounded-xl gradient-primary shadow-elegant">
              <Briefcase className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-display font-bold text-foreground">CA Task Manager</span>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs sm:text-sm font-medium text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs sm:text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl font-semibold text-white gradient-primary shadow-elegant hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setIsForgotPassword(true); setError(''); }}
              className="w-full text-center text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </button>

            <div className="pt-3 sm:pt-4 border-t border-border">
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                Only registered employees can access this system.<br />
                Contact your manager if you need an account.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;