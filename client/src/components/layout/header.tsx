import { useState } from "react";
import { Bell, ChartLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import NotificationModal from "@/components/common/notification-modal";
import type { Store } from "@shared/schema";

interface HeaderProps {
  stores: Store[];
  selectedStoreId: string;
  onStoreChange: (storeId: string) => void;
}

export default function Header({ stores, selectedStoreId, onStoreChange }: HeaderProps) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="border-b border-border bg-card shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <ChartLine className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">HyperLocal Forecast</span>
            </div>
            
            {/* Store Selector */}
            {stores.length > 0 && (
              <div className="ml-8">
                <Select value={selectedStoreId} onValueChange={onStoreChange}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name} ({store.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => setShowNotifications(true)}
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs text-destructive-foreground flex items-center justify-center">
                3
              </span>
            </Button>
            
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user?.role || "User"}
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>
          </div>
        </div>
      </header>

      <NotificationModal 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
