import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const crowdData = [
  { time: '10:00', density: 20, panic: 5 },
  { time: '10:05', density: 25, panic: 8 },
  { time: '10:10', density: 40, panic: 12 },
  { time: '10:15', density: 55, panic: 25 },
  { time: '10:20', density: 80, panic: 65 }, // Spike
  { time: '10:25', density: 75, panic: 55 },
  { time: '10:30', density: 60, panic: 40 },
];

const threatData = [
  { name: 'UAV', count: 12, risk: 85 },
  { name: 'Drone', count: 8, risk: 65 },
  { name: 'Bird', count: 24, risk: 5 },
  { name: 'Plane', count: 3, risk: 10 },
];

export function StatsPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* Crowd Density Chart */}
      <div className="glass-panel p-4 rounded-lg flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full" />
            CROWD DYNAMICS
          </h3>
          <span className="text-xs font-mono text-muted-foreground">REAL-TIME METRICS</span>
        </div>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={crowdData}>
              <defs>
                <linearGradient id="colorPanic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-destructive)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-destructive)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="var(--color-muted-foreground)" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="var(--color-muted-foreground)" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-card)', 
                  borderColor: 'var(--color-border)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="density" 
                stroke="var(--color-primary)" 
                fillOpacity={1} 
                fill="url(#colorDensity)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="panic" 
                stroke="var(--color-destructive)" 
                fillOpacity={1} 
                fill="url(#colorPanic)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Threat Classification */}
      <div className="glass-panel p-4 rounded-lg flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <span className="w-1 h-4 bg-destructive rounded-full" />
            THREAT CLASSIFICATION
          </h3>
          <span className="text-xs font-mono text-muted-foreground">LAST 24H</span>
        </div>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={threatData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} horizontal={false} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="var(--color-muted-foreground)" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                width={50}
                fontFamily="var(--font-mono)"
              />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ 
                  backgroundColor: 'var(--color-card)', 
                  borderColor: 'var(--color-border)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }}
              />
              <Bar dataKey="risk" name="Risk Score" fill="var(--color-destructive)" radius={[0, 4, 4, 0]} barSize={10} />
              <Bar dataKey="count" name="Detections" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
