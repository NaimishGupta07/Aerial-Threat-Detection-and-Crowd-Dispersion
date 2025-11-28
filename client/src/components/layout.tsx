import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  BarChart3, 
  Settings, 
  ShieldAlert, 
  Users,
  Radio,
  Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isMobile = useIsMobile();

  const navItems = [
    { icon: LayoutDashboard, label: "Command Center", href: "/" },
    { icon: MapIcon, label: "Tactical Map", href: "/map" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: Users, label: "Crowd Control", href: "/crowd" },
    { icon: Settings, label: "System Config", href: "/settings" },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full bg-background border-r border-border">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-sm border border-primary/20">
          <Radio className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl tracking-wider text-foreground">AEROGUARD</h1>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-status-ok animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground tracking-widest">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={`
                flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition-all duration-200
                border border-transparent
                ${isActive 
                  ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }
              `}>
                <Icon className={`h-5 w-5 ${isActive ? "text-primary drop-shadow-[0_0_5px_currentColor]" : ""}`} />
                <span className={`font-medium tracking-wide ${isActive ? "font-display" : "font-sans"}`}>
                  {item.label}
                </span>
                {isActive && <div className="ml-auto w-1 h-4 bg-primary rounded-full shadow-[0_0_8px_currentColor]" />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-border">
        <div className="bg-card p-4 rounded-md border border-border bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">THREAT LEVEL</span>
          </div>
          <div className="text-2xl font-display font-bold text-status-ok drop-shadow-[0_0_5px_currentColor]">
            LEVEL 5
          </div>
          <div className="w-full bg-muted/50 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-status-ok w-[20%] h-full shadow-[0_0_10px_currentColor]" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-72 h-full shrink-0">
        <NavContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background border-border">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r border-border bg-background">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-auto relative scroll-smooth">
        <div className="scanlines absolute inset-0 pointer-events-none z-50 opacity-20 mix-blend-overlay" />
        {children}
      </main>
    </div>
  );
}
