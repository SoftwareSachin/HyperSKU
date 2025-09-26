import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Boxes, 
  Upload, 
  AlertTriangle, 
  Settings,
  Code,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Forecasts", href: "/forecasts", icon: TrendingUp },
  { name: "Reorder Suggestions", href: "/reorders", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "SKU Management", href: "/skus", icon: Boxes },
  { name: "Data Import", href: "/data-import", icon: Upload },
  { name: "Anomalies", href: "/anomalies", icon: AlertTriangle },
  { name: "Settings", href: "/settings", icon: Settings },
];

const secondaryNavigation = [
  { name: "API & Webhooks", href: "/api", icon: Code },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-card min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
        
        <div className="pt-4 mt-4 border-t border-border">
          {secondaryNavigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
