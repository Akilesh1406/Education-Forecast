import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight text-foreground">
          Education Score
          <br />
          Forecasting System
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
          Predict your CGPA with AI-powered analytics. Track performance metrics, get personalized study 
          recommendations, and achieve academic excellence with data-driven insights.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/auth">
            <Button variant="hero" size="lg" className="group min-w-[200px]">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg" className="min-w-[200px]">
              Learn More
            </Button>
          </a>
        </div>

        {/* Stats Grid */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { value: "95%", label: "Prediction Accuracy" },
            { value: "5+", label: "Departments" },
            { value: "8", label: "Semesters" },
            { value: "10.0", label: "Target CGPA" },
          ].map((stat, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
