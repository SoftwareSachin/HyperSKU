import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartLine, TrendingUp, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <ChartLine className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">HyperLocal Forecast</span>
            </div>
            <Button onClick={() => window.location.href = "/api/login"}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">
            Enterprise Inventory Forecasting Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Stop stockouts and overstock with AI-powered demand forecasting, 
            probabilistic predictions, and automated reorder suggestions for your stores.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-4"
            onClick={() => window.location.href = "/api/login"}
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose HyperLocal Forecast?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>7-Day Forecasts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Per-SKU probabilistic forecasts with 50% and 95% prediction intervals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Smart Reorders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Lead-time aware suggestions with conservative and aggressive options
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Anomaly Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automatic detection of demand spikes, drops, and unusual patterns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <ChartLine className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Real-time Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                CSV upload, API integration, and automated data sync capabilities
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to optimize your inventory?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of stores already using HyperLocal Forecast
          </p>
          <Button 
            variant="secondary" 
            size="lg"
            onClick={() => window.location.href = "/api/login"}
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2025 HyperLocal Forecast. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
