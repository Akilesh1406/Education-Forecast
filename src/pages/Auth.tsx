import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GraduationCap, ShieldCheck, UserCheck, Loader2, Zap, Mail } from 'lucide-react';
import type { UserRole } from '@/types';

const departments = [
  'Artificial Intelligence & Data Science',
  'Computer Science & Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Civil Engineering',
  'Automobile Engineering',
];

// Map each role to its dashboard route
const ROLE_ROUTES: Record<UserRole, string> = {
  student: '/student/dashboard',
  faculty: '/faculty/dashboard',
  admin: '/admin',
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [semester, setSemester] = useState('1');
  const [department, setDepartment] = useState('Artificial Intelligence & Data Science');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<UserRole | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { signIn, signUp, signInAsDemo, resendConfirmationEmail } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Demo Login (bypasses Supabase email confirmation) ──────────────────────
  const handleDemoLogin = async (demoRole: UserRole) => {
    setDemoLoading(demoRole);
    try {
      signInAsDemo(demoRole);
      toast({
        title: `Demo ${demoRole} session started`,
        description: `Logged in as ${
          demoRole === 'student'
            ? 'Priya Patel (Student)'
            : demoRole === 'faculty'
            ? 'Dr. Rajesh Kumar (Faculty)'
            : 'System Administrator'
        }. No real data is stored.`,
      });
      navigate(ROLE_ROUTES[demoRole]);
    } catch {
      toast({ title: 'Demo login failed', variant: 'destructive' });
    } finally {
      setDemoLoading(null);
    }
  };

  // ── Resend confirmation email ──────────────────────────────────────────────
  const handleResendEmail = async () => {
    if (!email) {
      toast({ title: 'Enter your email first', variant: 'destructive' });
      return;
    }
    setResendLoading(true);
    const { error } = await resendConfirmationEmail(email);
    setResendLoading(false);
    if (error) {
      toast({ title: 'Could not resend', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Confirmation email sent!',
        description: `Check your inbox at ${email} and click the link, then sign in again.`,
      });
      setShowResend(false);
    }
  };

  // ── Real Supabase login / signup ───────────────────────────────────────────
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResend(false);

    try {
      if (isLogin) {
        const { data, error } = await signIn(email, password);

        if (error) {
          // Special case: email not confirmed → show resend helper
          if (
            error.message?.toLowerCase().includes('email not confirmed') ||
            error.message?.toLowerCase().includes('email_not_confirmed')
          ) {
            setShowResend(true);
            throw new Error(
              'Your email is not yet confirmed. Please check your inbox or use "Demo Login" below to explore the app without email verification.'
            );
          }
          throw error;
        }

        if (!data?.user) throw new Error('No user session received.');

        const resolvedRole =
          (data.user.user_metadata?.role as UserRole) ||
          (email.includes('admin') ? 'admin' : 'student');

        toast({
          title: 'Welcome back!',
          description: `Signed in as ${resolvedRole}.`,
        });

        navigate(ROLE_ROUTES[resolvedRole] ?? '/student/dashboard');
      } else {
        const { error } = await signUp(email, password, name, role, department, parseInt(semester));
        if (error) throw error;

        toast({
          title: 'Account created!',
          description:
            'A confirmation email has been sent. Please verify your email, then sign in. Or use Demo Login to explore immediately.',
        });

        setIsLogin(true);
        setShowResend(true); // offer resend right away after register
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Authentication failed. Please check your credentials.';
      toast({ title: 'Authentication Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-primary/5 relative overflow-hidden">
      {/* Background ambient blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-4 relative z-10">

        {/* ── DEMO QUICK ACCESS CARD ─────────────────────────────────────── */}
        <Card className="border-primary/30 bg-primary/5 backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-primary">
                Quick Demo Access
              </CardTitle>
              <Badge variant="secondary" className="text-xs ml-auto">No signup needed</Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              Explore the full platform instantly. No email confirmation required.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="grid grid-cols-3 gap-2">
              {/* Demo Student */}
              <Button
                variant="outline"
                size="sm"
                className="flex flex-col h-auto py-2.5 gap-1 border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500"
                onClick={() => handleDemoLogin('student')}
                disabled={demoLoading !== null}
              >
                {demoLoading === 'student' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                )}
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Student
                </span>
              </Button>

              {/* Demo Faculty */}
              <Button
                variant="outline"
                size="sm"
                className="flex flex-col h-auto py-2.5 gap-1 border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-500"
                onClick={() => handleDemoLogin('faculty')}
                disabled={demoLoading !== null}
              >
                {demoLoading === 'faculty' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <UserCheck className="w-4 h-4 text-blue-600" />
                )}
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                  Faculty
                </span>
              </Button>

              {/* Demo Admin */}
              <Button
                variant="outline"
                size="sm"
                className="flex flex-col h-auto py-2.5 gap-1 border-purple-500/40 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-500"
                onClick={() => handleDemoLogin('admin')}
                disabled={demoLoading !== null}
              >
                {demoLoading === 'admin' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                )}
                <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
                  Admin
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── MAIN AUTH CARD ────────────────────────────────────────────── */}
        <Card className="border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="flex justify-center">
              <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <GraduationCap className="w-8 h-8" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">Education Forecast</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Enterprise Academic Performance &amp; CGPA Analytics
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(v) => setIsLogin(v === 'login')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Register</TabsTrigger>
              </TabsList>

              {/* Shared form for both tabs */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email-login">Institutional Email</Label>
                    <Input
                      id="email-login"
                      type="email"
                      placeholder="name@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password-login">Password</Label>
                    <Input
                      id="password-login"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      'Sign In to Dashboard'
                    )}
                  </Button>
                </form>

                {/* Resend confirmation helper — shown after "email not confirmed" error */}
                {showResend && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      Didn't receive the confirmation email, or it expired?
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                      onClick={handleResendEmail}
                      disabled={resendLoading}
                    >
                      {resendLoading ? (
                        <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Sending…</>
                      ) : (
                        'Resend Confirmation Email'
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g. Priya Sharma or Dr. Rajesh Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={(val) => setRole(val as UserRole)}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-emerald-500" />
                            <span>Student</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="faculty">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-blue-500" />
                            <span>Faculty / Professor</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-purple-500" />
                            <span>Administrator</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email-signup">Institutional Email</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="name@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input
                      id="password-signup"
                      type="password"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  {role !== 'admin' && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1.5">
                        <Label htmlFor="semester">Semester</Label>
                        <Select value={semester} onValueChange={setSemester}>
                          <SelectTrigger id="semester">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                              <SelectItem key={s} value={s.toString()}>
                                Semester {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="department">Department</Label>
                        <Select value={department} onValueChange={setDepartment}>
                          <SelectTrigger id="department" className="truncate">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account…
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>

                {showResend && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      Check your email and click the confirmation link to activate your account. Or use Demo Login above to explore immediately.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                      onClick={handleResendEmail}
                      disabled={resendLoading}
                    >
                      {resendLoading ? (
                        <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Sending…</>
                      ) : (
                        'Resend Confirmation Email'
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="relative mt-5">
              <Separator />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                or use demo above
              </span>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Real accounts require an institutional email and email confirmation from Supabase.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
