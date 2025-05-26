// components/MetricCard.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

export const MetricCard = ({ title, value, description, change }) => (
  <Card className="bg-white">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-2">
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <ArrowUpIcon size={16} /> : <ArrowDownIcon size={16} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);