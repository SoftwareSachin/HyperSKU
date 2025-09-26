import { X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  type: 'critical' | 'success' | 'info';
  title: string;
  description: string;
  timestamp: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Critical Stock Alert',
    description: 'Organic Bananas below reorder point',
    timestamp: '5 minutes ago',
  },
  {
    id: '2',
    type: 'success',
    title: 'Forecast Complete',
    description: '7-day forecasts updated for all SKUs',
    timestamp: '1 hour ago',
  },
  {
    id: '3',
    type: 'info',
    title: 'Data Sync Complete',
    description: 'POS data successfully ingested',
    timestamp: '2 hours ago',
  },
];

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-destructive/10 border-l-destructive';
      case 'success':
        return 'bg-green-50 border-l-green-600';
      default:
        return 'bg-primary/10 border-l-primary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Notifications</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-notifications"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-64">
          <div className="space-y-3">
            {mockNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-md border-l-4 ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start space-x-2">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{notification.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {notification.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {notification.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
