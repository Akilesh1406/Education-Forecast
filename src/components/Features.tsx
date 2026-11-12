import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, BarChart3, Target } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "CGPA Prediction",
    description: "Advanced machine learning models predict your semester CGPA using attendance, study hours, confidence levels, and historical exam scores.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track institution average and topper scores. Visualize subject-wise performance trends with interactive charts and real-time dashboards.",
  },
  {
    icon: TrendingUp,
    title: "Smart Recommendations",
    description: "Get personalized study hour suggestions to reach your target CGPA. AI identifies focus subjects and improvement areas automatically.",
  },
  {
    icon: Target,
    title: "Credit-Weighted CGPA",
    description: "Accurate calculations based on course credits and semester-specific grading. Supports internal exams for Semester 1 and final exams thereafter.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Powered by ML Algorithms
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Predictive analytics and personalized insights to optimize your academic performance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="bg-card border border-border hover:shadow-lg transition-all duration-300 group"
              >
                <CardHeader>
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
