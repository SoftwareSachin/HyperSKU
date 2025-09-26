import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Database,
  Users,
  Bell,
  FileText,
  CheckCircle,
  ArrowRight,
  Building2,
  Clock,
  Target
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-foreground flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-background" />
              </div>
              <div>
                <span className="text-xl font-semibold text-foreground">
                  HyperLocal Forecast
                </span>
                <Badge variant="secondary" className="ml-2 text-xs">Enterprise</Badge>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = "/api/login"}
              variant="outline"
              className="font-medium"
              data-testid="button-signin"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-32">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-6 px-4 py-1.5">
            <Building2 className="w-3 h-3 mr-2" />
            Enterprise Inventory Intelligence
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground leading-tight tracking-tight">
            AI-Powered Demand Forecasting
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Eliminate stockouts and reduce overstock with probabilistic demand forecasting, 
            automated reorder suggestions, and real-time anomaly detection for retail operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 font-medium"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-get-started"
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Enterprise-Grade Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete inventory intelligence platform built for retail operations
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          <Card className="border border-border shadow-sm hover:shadow-md transition-all duration-200 p-6">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6">
              <TrendingUp className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Probabilistic Forecasting</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              7-day per-SKU demand forecasts with confidence intervals (P10, P50, P90) using advanced statistical models
            </p>
          </Card>

          <Card className="border border-border shadow-sm hover:shadow-md transition-all duration-200 p-6">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6">
              <Target className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Smart Reorder Engine</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Lead-time aware replenishment suggestions with conservative and aggressive strategies
            </p>
          </Card>

          <Card className="border border-border shadow-sm hover:shadow-md transition-all duration-200 p-6">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6">
              <Shield className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Anomaly Detection</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Real-time detection of demand spikes, inventory discrepancies, and forecast accuracy issues
            </p>
          </Card>

          <Card className="border border-border shadow-sm hover:shadow-md transition-all duration-200 p-6">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6">
              <Database className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Multi-Tenant Architecture</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Organization-level data isolation with role-based access control for teams
            </p>
          </Card>

          <Card className="border border-border shadow-sm hover:shadow-md transition-all duration-200 p-6">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6">
              <FileText className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Data Integration</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              CSV upload, REST API endpoints, and automated validation for POS/ERP data ingestion
            </p>
          </Card>

          <Card className="border border-border shadow-sm hover:shadow-md transition-all duration-200 p-6">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6">
              <Bell className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Smart Notifications</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Automated email alerts for critical stockouts, anomalies, and forecast accuracy issues
            </p>
          </Card>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
              <Clock className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Reduce Stockouts</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Prevent lost sales with accurate demand predictions</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Optimize Inventory</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Minimize excess stock while maintaining service levels</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Enterprise Ready</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Multi-store operations with role-based permissions</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Ready to Transform Your Inventory Management?
          </h2>
          <p className="text-xl mb-10 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Get started with intelligent demand forecasting and automated reorder management
          </p>
          <Button 
            size="lg"
            className="text-lg px-8 py-6 font-medium"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-start-trial"
          >
            Get Started
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-xl bg-foreground flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-background" />
              </div>
              <span className="text-lg font-semibold text-foreground">HyperLocal Forecast</span>
            </div>
            <p className="text-muted-foreground text-sm">
              &copy; 2025 HyperLocal Forecast. Enterprise inventory intelligence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
