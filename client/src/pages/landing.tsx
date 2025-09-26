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
      <section className="container mx-auto px-6 py-20 md:py-32">
        <div className="text-center max-w-5xl mx-auto">
          <div className="mb-8">
            <Badge variant="outline" className="mb-6 px-6 py-2 text-sm font-medium border-2">
              <Building2 className="w-4 h-4 mr-2" />
              Enterprise Inventory Intelligence Platform
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-foreground leading-[1.1] tracking-tight">
            Precision Demand Forecasting
            <span className="block text-primary mt-2">for Modern Retail</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            Transform your inventory management with probabilistic demand forecasting, intelligent reorder automation, 
            and real-time anomaly detection. Built for enterprise retail operations that demand accuracy and efficiency.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="text-lg px-10 py-4 h-14 font-semibold min-w-[200px]"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-get-started"
            >
              Start Free Trial
              <ArrowRight className="ml-3 w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-10 py-4 h-14 font-semibold min-w-[200px] border-2"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-view-demo"
            >
              View Platform
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>No setup required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>Enterprise security</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 px-4 py-2">
              Platform Capabilities
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Enterprise-Grade Intelligence
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Comprehensive demand forecasting and inventory optimization platform designed 
              for retail enterprises requiring precision, scalability, and operational excellence.
            </p>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            <Card className="bg-background border-0 shadow-lg hover:shadow-xl transition-all duration-300 p-8 h-full group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary/15 transition-colors">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">Probabilistic Forecasting</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Advanced statistical modeling delivers 7-day per-SKU demand forecasts with confidence intervals (P10, P50, P90), enabling precise inventory planning and risk assessment.
              </p>

            </Card>

            <Card className="bg-background border-0 shadow-lg hover:shadow-xl transition-all duration-300 p-8 h-full group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary/15 transition-colors">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">Smart Reorder Engine</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Intelligent replenishment automation with lead-time optimization, safety stock calculations, and configurable strategies for different risk tolerance levels.
              </p>

            </Card>

            <Card className="bg-background border-0 shadow-lg hover:shadow-xl transition-all duration-300 p-8 h-full group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary/15 transition-colors">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">Anomaly Detection</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Real-time monitoring identifies demand spikes, inventory discrepancies, and forecast accuracy deviations with intelligent alerting and automated response protocols.
              </p>

            </Card>

            <Card className="bg-background border-0 shadow-lg hover:shadow-xl transition-all duration-300 p-8 h-full group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary/15 transition-colors">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">Multi-Tenant Architecture</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Enterprise-grade data isolation with organization-level segmentation, role-based access control, and granular permissions for complex retail organizational structures.
              </p>

            </Card>

            <Card className="bg-background border-0 shadow-lg hover:shadow-xl transition-all duration-300 p-8 h-full group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary/15 transition-colors">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">Data Integration</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Comprehensive data ingestion through secure API endpoints, automated CSV processing, and real-time validation with support for major POS and ERP systems.
              </p>

            </Card>

            <Card className="bg-background border-0 shadow-lg hover:shadow-xl transition-all duration-300 p-8 h-full group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary/15 transition-colors">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">Smart Notifications</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Intelligent alerting system with configurable thresholds, multi-channel delivery, and contextual insights for critical stockouts and operational anomalies.
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/20 py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-8 px-4 py-2">
              Ready to Get Started?
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-foreground leading-tight">
              Transform Your Inventory Operations
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Join retail organizations transforming their inventory operations with intelligent forecasting and automated optimization. Experience precision inventory management built for modern commerce.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <Button 
                size="lg"
                className="text-lg px-12 py-4 h-16 font-semibold min-w-[250px]"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-start-trial"
              >
                Start Free Trial
                <ArrowRight className="ml-3 w-5 h-5" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="text-lg px-12 py-4 h-16 font-semibold min-w-[250px] border-2"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-contact-sales"
              >
                Contact Sales
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border/50">
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground mb-2">Reduce Stockouts</div>
                <div className="text-sm text-muted-foreground">Minimize lost sales with precise demand forecasting</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground mb-2">Optimize Inventory</div>
                <div className="text-sm text-muted-foreground">Right-size stock levels with intelligent automation</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground mb-2">Enhance Operations</div>
                <div className="text-sm text-muted-foreground">Streamline workflows with enterprise-grade tools</div>
              </div>
            </div>
          </div>
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
