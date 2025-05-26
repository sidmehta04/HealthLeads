// TestActivityStatus.jsx
import React from 'react';
import { Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date(dateString));
};

const getEmailWithoutDomain = (email) => {
  return email ? email.split('@')[0] : '-';
};

const StatusBadge = ({ status, className = "" }) => {
  const displayStatus = status || "pending";

  const getStatusColor = () => {
    switch (displayStatus.toLowerCase()) {
      case "completed":
      case "submitted":
      case "sent":
        return "bg-green-100 text-green-800 border border-green-200";
      case "pending":
      case "not_completed":
      case "not_submitted":
      case "not_sent":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getDisplayText = () => {
    if (displayStatus === "not_completed" || 
        displayStatus === "not_submitted" || 
        displayStatus === "not_sent" ||
        displayStatus === "pending") {
      return "Pending";
    }
    return displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1).toLowerCase();
  };

  return (
    <span 
      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()} ${className}`}
    >
      {getDisplayText()}
    </span>
  );
};

const UserActivityInfo = ({ timestamp, email, label }) => {
  if (!timestamp || !email) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          <Clock className="w-3 h-3" />
          <span>{getEmailWithoutDomain(email)}</span>
          <span>•</span>
          <span>{formatDateTime(timestamp)}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-white p-3 rounded-lg shadow-lg border">
          <div className="text-sm">
            <p className="font-medium">{label}</p>
            <p className="text-gray-600">User: {email}</p>
            <p className="text-gray-600">Time: {formatDateTime(timestamp)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { StatusBadge, UserActivityInfo, formatDateTime };