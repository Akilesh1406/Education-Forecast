
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const departments = [
  'AI & DS',
  'Information Technology',
  'Automobile Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [semester, setSemester] = useState('1');
  const [department, setDepartment] = useState('AI & DS');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await signIn(email, password);

        if (error) throw error;
        if (!data?.user) throw new Error('No user session found');

        // Fetch student profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
          toast({
            title: 'Error',
            description: 'Student record not found — please contact admin.',
            variant: 'destructive',
          });

          await supabase.auth.signOut();
          return;
        }

        toast({
          title: `Welcome back, ${profile.name}!`,
          description: 'Logged in successfully.',
        });

        navigate('/student/dashboard');
      } else {
        const { error } = await signUp(
          email,
          password,
          name,
          parseInt(semester),
          department
        );

        if (error) throw error;

        toast({
          title: 'Account created!',
          description: 'You can now log in.',
        });

        setIsLogin(true);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <Card className="w-full max-w-md glass-card relative z-10 border-primary/20">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm animate-pulse">
              <GraduationCap className="w-12 h-12 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold gradient-text">
              Education Score Forecasting
            </CardTitle>
            <CardDescription className="text-base">
              CGPA Prediction & Performance Analytics
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs
            value={isLogin ? 'login' : 'signup'}
            onValueChange={(v) => setIsLogin(v === 'login')}
          >
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select
                      value={semester}
                      onValueChange={setSemester}
                    >
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

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={department}
                      onValueChange={setDepartment}
                    >
                      <SelectTrigger id="department">
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

                <Button
                  type="submit"
                  className="w-full mt-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
