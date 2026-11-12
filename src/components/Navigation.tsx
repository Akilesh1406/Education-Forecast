import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { GraduationCap, LayoutDashboard, LogOut, Settings, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Navigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkRole = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!data);
    };

    checkRole();
  }, [user]);

  if (!user) return null;

  return (
    <nav className="border-b bg-card sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/student/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
          <GraduationCap className="w-6 h-6" />
          Score Forecast
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/student/dashboard">
            <Button 
              variant={location.pathname === '/student/dashboard' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          
          {isAdmin && (
            <Link to="/admin">
              <Button 
                variant={location.pathname === '/admin' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Admin
              </Button>
            </Link>
          )}

          <Button 
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
