import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { ThemeColorPicker } from "@/components/ThemeColorPicker";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/student/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <ThemeColorPicker />
      <Hero />
      <Features />
    </div>
  );
};

export default Index;
