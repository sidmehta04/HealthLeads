// CampTable.jsx
import React, { memo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Utility Functions
const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    
    const options = includeTime ? 
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      } : 
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      };
    
    return new Intl.DateTimeFormat("en-IN", options).format(date);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "-";
  }
};

const formatEmail = (email) => {
  if (!email || typeof email !== "string") return "-";
  return email.split("@")[0];
};

const getStatusColor = (status) => {
  const statusColors = {
    sent: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
  };
  return statusColors[status] || "bg-gray-100 text-gray-800";
};

// User Activity Info Component
const UserActivityInfo = memo(({ label, timestamp, user }) => {
  if (!timestamp || !user) return null;
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="flex flex-col text-xs cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={`${label} information for ${formatEmail(user)}`}
          >
            <span className="font-medium">{formatEmail(user)}</span>
            <span className="text-gray-500">{formatDate(timestamp, true)}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-sm">
            <p className="font-medium">{label}</p>
            <p>User: {user}</p>
            <p>Time: {formatDate(timestamp, true)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
UserActivityInfo.displayName = "UserActivityInfo";

// Status Badge Component
const StatusBadge = memo(({ status }) => (
  <Badge
    variant="outline"
    className={cn(
      "px-2 py-1 text-xs font-semibold rounded-full",
      getStatusColor(status)
    )}
  >
    {status === "sent" ? "Completed" : "Pending"}
  </Badge>
));
StatusBadge.displayName = "StatusBadge";

// Table Header Component
const TableHeaderRow = memo(({ type }) => (
  <TableRow>
    <TableHead className="whitespace-nowrap sticky top-0 bg-white z-10">Camp Code</TableHead>
    <TableHead className="whitespace-nowrap sticky top-0 bg-white z-10">Camp Date</TableHead>
    <TableHead className="whitespace-nowrap sticky top-0 bg-white z-10">Location</TableHead>
    <TableHead className="whitespace-nowrap sticky top-0 bg-white z-10">Created</TableHead>
    {(type === "pendingClosure" || type === "closed") && (
      <TableHead className="whitespace-nowrap sticky top-0 bg-white z-10">Completed</TableHead>
    )}
    {type === "closed" && (
      <>
        <TableHead className="whitespace-nowrap sticky top-0 bg-white z-10">Report Status</TableHead>
        <TableHead className="whitespace-nowrap sticky top-0 bg-white z-10">Report Updated</TableHead>
      </>
    )}
  </TableRow>
));
TableHeaderRow.displayName = "TableHeaderRow";

// Camp Row Component
const CampRow = memo(({ camp, type, onCampCodeClick }) => {
  const rowClassName = cn(
    "hover:bg-gray-50",
    camp.isOverdue && (
      type === "incomplete" ? "bg-red-50" :
      type === "pendingClosure" ? "bg-red-50" : ""
    ),
    camp.isCurrentDay && type === "incomplete" && "bg-green-50"
  );

  return (
    <TableRow className={rowClassName}>
      <TableCell>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onCampCodeClick) onCampCodeClick(camp.campCode);
          }}
          type="button"
          className={cn(
            "text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1 font-medium",
            camp.isOverdue && "text-red-600 hover:text-red-800",
            camp.isCurrentDay && "text-green-600 hover:text-green-800"
          )}
          aria-label={`View details for camp ${camp.campCode}`}
        >
          {camp.campCode}
        </button>
      </TableCell>
      <TableCell>
        <span className={cn(
          "text-sm",
          camp.isOverdue && "text-red-600 font-medium",
          camp.isCurrentDay && "text-green-600 font-medium"
        )}>
          {formatDate(camp.date, false)}
        </span>
        {camp.isCurrentDay && type === "incomplete" && (
          <span className="ml-2 text-xs text-green-600">(Today)</span>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{camp.district || "-"}</div>
          <div className="text-gray-500">{camp.state || "-"}</div>
        </div>
      </TableCell>
      <TableCell>
        <UserActivityInfo
          label="Created"
          timestamp={camp.createdAt}
          user={camp.createdBy}
        />
      </TableCell>
      {(type === "pendingClosure" || type === "closed") && (
        <TableCell>
          <UserActivityInfo
            label="Completed"
            timestamp={camp.completedAt}
            user={camp.completedBy}
          />
        </TableCell>
      )}
      {type === "closed" && (
        <>
          <TableCell>
            <StatusBadge status={camp.reportStatus} />
          </TableCell>
          <TableCell>
            <UserActivityInfo
              label="Report Updated"
              timestamp={camp.reportStatusUpdatedAt}
              user={camp.reportStatusUpdatedBy}
            />
          </TableCell>
        </>
      )}
    </TableRow>
  );
});
CampRow.displayName = "CampRow";

// Main Camp Table Component
const CampTable = ({ camps = [], type, onCampCodeClick }) => {
  const [showAll, setShowAll] = useState(false);
  
  if (!Array.isArray(camps)) {
    console.error("Camps prop must be an array");
    return null;
  }

  const displayCamps = showAll ? camps : camps.slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <div 
        className="relative overflow-hidden shadow-md sm:rounded-lg"
        role="region"
        aria-label="Health camps table"
      >
        <div className="overflow-y-auto max-h-96">
          <Table>
            <TableHeader>
              <TableHeaderRow type={type} />
            </TableHeader>
            <TableBody>
              {displayCamps.map((camp) => (
                <CampRow
                  key={camp.id || camp.campCode}
                  camp={camp}
                  type={type}
                  onCampCodeClick={onCampCodeClick}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {camps.length > 5 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAll(!showAll);
            }}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            {showAll ? "Show Less" : `Show All (${camps.length})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(CampTable);