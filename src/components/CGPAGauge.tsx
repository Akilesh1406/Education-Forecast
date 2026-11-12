import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CGPAGaugeProps {
  value: number;
  target?: number;
}

export default function CGPAGauge({ value, target = 10 }: CGPAGaugeProps) {
  const percentage = (value / target) * 100;
  const rotation = (percentage / 100) * 180;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-center">Predicted CGPA</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-64 h-32 mx-auto">
          {/* Gauge background */}
          <div className="absolute inset-0 flex items-end justify-center">
            <div className="w-full h-1/2 rounded-t-full border-8 border-muted" />
          </div>
          
          {/* Gauge fill */}
          <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
            <div 
              className="w-full h-1/2 rounded-t-full border-8 border-primary transition-transform duration-1000 origin-bottom"
              style={{
                transform: `rotate(${rotation - 180}deg)`,
                clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 0)'
              }}
            />
          </div>

          {/* Center display */}
          <div className="absolute inset-0 flex items-end justify-center pb-4">
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">{value.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">out of {target}</div>
            </div>
          </div>

          {/* Scale markers */}
          <div className="absolute bottom-0 left-0 text-xs text-muted-foreground">0</div>
          <div className="absolute bottom-0 right-0 text-xs text-muted-foreground">{target}</div>
        </div>

        {value >= 9.5 && (
          <p className="text-center text-sm text-green-600 dark:text-green-400 mt-4 font-medium">
            🎉 Excellent! On track for top performance!
          </p>
        )}
        {value >= 8 && value < 9.5 && (
          <p className="text-center text-sm text-blue-600 dark:text-blue-400 mt-4">
            Great progress! Keep pushing forward.
          </p>
        )}
        {value < 8 && (
          <p className="text-center text-sm text-amber-600 dark:text-amber-400 mt-4">
            Focus on improvement areas below.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
