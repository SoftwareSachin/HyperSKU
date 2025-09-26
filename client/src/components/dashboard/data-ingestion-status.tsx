import { Check, Clock, Pause } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusData = [
  {
    title: "POS Data Sync",
    description: "Last sync: 5 minutes ago",
    status: "active",
    icon: Check,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Inventory Update",
    description: "In progress: 2.3k records",
    status: "processing",
    icon: Clock,
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    title: "ERP Connector",
    description: "Next sync: in 1 hour",
    status: "scheduled",
    icon: Pause,
    bgColor: "bg-muted",
    iconColor: "text-muted-foreground",
  },
];

export default function DataIngestionStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Ingestion Status</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {statusData.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`flex items-center justify-between p-3 rounded-md ${
                  item.status === 'active' ? 'bg-green-50' :
                  item.status === 'processing' ? 'bg-orange-50' :
                  'bg-muted/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`h-8 w-8 ${item.bgColor} rounded-full flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${item.iconColor}`} />
                  </div>
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-medium capitalize ${item.iconColor}`}>
                  {item.status}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
