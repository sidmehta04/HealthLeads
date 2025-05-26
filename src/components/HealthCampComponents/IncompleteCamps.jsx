// CampStatusView.jsx
import React, { useState, useEffect } from 'react';
import { database } from '../../firebase/config';
import { ref, onValue } from 'firebase/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CampTable from './SubComponents/UpdateBy';

// Utility function to format date and check overdue status
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const isCurrentDay = (campDate) => {
  const today = new Date();
  const campDateTime = new Date(campDate);
  return (
    today.getDate() === campDateTime.getDate() &&
    today.getMonth() === campDateTime.getMonth() &&
    today.getFullYear() === campDateTime.getFullYear()
  );
};

const isOverdue = (campDate, status, reportStatus) => {
  const today = new Date();
  const campDateTime = new Date(campDate);
  
  // For scheduled camps
  if (status !== 'completed') {
    // Skip overdue check if it's the current day
    if (isCurrentDay(campDate)) return false;
    
    // Check if camp date has passed and it's not completed
    const nextDay = new Date(campDateTime);
    nextDay.setDate(nextDay.getDate() + 1);
    return today >= nextDay;
  }
  
  // For pending closure camps
  if (status === 'completed' && !reportStatus) {
    // Check if it's been more than 3 days since camp date
    const threeDaysAfterCamp = new Date(campDateTime);
    threeDaysAfterCamp.setDate(threeDaysAfterCamp.getDate() + 3);
    return today > threeDaysAfterCamp;
  }
  
  return false;
};

const StatusSummary = ({ camps, type }) => {
  if (!camps || camps.length === 0) return null;

  const overdueCount = camps.filter(camp => camp.isOverdue).length;
  const currentDayCount = type === 'incomplete' ? 
    camps.filter(camp => camp.isCurrentDay).length : 0;

  return (
    <div className="flex gap-2 items-center text-xs">
      {currentDayCount > 0 && (
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700">
          Today: {currentDayCount}
        </span>
      )}
      {overdueCount > 0 && (
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-700">
          Overdue: {overdueCount}
        </span>
      )}
    </div>
  );
};

const CampStatusView = ({ activeContext, onCampCodeClick }) => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const campsRef = ref(database, 'healthCamps');
  
    const handleValue = (snapshot) => {
      try {
        if (snapshot.exists()) {
          const allCamps = Object.entries(snapshot.val())
            .map(([key, camp]) => ({
              id: key,
              ...camp,
              date: formatDate(camp.date),
              isOverdue: isOverdue(camp.date, camp.status, camp.reportStatus),
              isCurrentDay: isCurrentDay(camp.date)
            }))
            .filter(camp => camp.status !== 'cancelled')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          setCamps(allCamps);
        } else {
          setCamps([]);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch camps: ' + err.message);
        setLoading(false);
      }
    };
  
    const unsubscribe = onValue(campsRef, handleValue, (error) => {
      setError('Failed to fetch camps: ' + error.message);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Common header component
  const CardHeaderComponent = () => (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle>Health Camps Overview</CardTitle>
      {!loading && !error && camps.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      )}
    </CardHeader>
  );

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeaderComponent />
        <CardContent>
          <div className="flex justify-center items-center h-48" role="status">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeaderComponent />
        <CardContent>
          <div className="bg-red-50 border-l-4 border-red-400 p-4" role="alert">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!camps || camps.length === 0) {
    return (
      <Card className="w-full">
        <CardHeaderComponent />
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No health camps found
          </div>
        </CardContent>
      </Card>
    );
  }

  const incompleteCamps = camps.filter(camp => 
    camp.status !== 'completed' && camp.status !== 'pending'
  );
  const pendingCamps = camps.filter(camp => camp.status === 'pending');
  const pendingClosureCamps = camps.filter(camp => 
    camp.status === 'completed' && !camp.reportStatus
  );
  const closedCamps = camps.filter(camp => 
    camp.status === 'completed' && camp.reportStatus === 'sent'
  );


  const getContextTabs = () => {
    switch (activeContext) {
      case 'schedule':
        return ['pending','incomplete']; // Add pending tab for schedule context
      case 'complete':
        return ['incomplete', 'pendingClosure'];
      case 'close':
        return ['pendingClosure', 'closed'];
      default:
        return ['incomplete', 'pending', 'pendingClosure', 'closed'];
    }
  };

  const getDefaultTab = () => {
    switch (activeContext) {
      case 'schedule':
        return 'incomplete';
      case 'complete':
        return 'incomplete';
      case 'close':
        return 'pendingClosure';
      default:
        return 'incomplete';
    }
  };

  const tabLabels = {
    incomplete: {
      label: 'Scheduled Camps',
      count: incompleteCamps.length,
      data: incompleteCamps,
    },
    pending: {
      label: 'Pending Approval',
      count: pendingCamps.length,
      data: pendingCamps,
    },
    pendingClosure: {
      label: 'Report Pending',
      count: pendingClosureCamps.length,
      data: pendingClosureCamps,
    },
    closed: {
      label: 'Closed',
      count: closedCamps.length,
      data: closedCamps,
    },
  };

  const contextTabs = getContextTabs();
  const gridColumns = `grid-cols-${contextTabs.length}`;

  return (
    <Card className="w-full">
      <CardHeaderComponent />
      <CardContent>
        {isExpanded && (
          <Tabs defaultValue={getDefaultTab()} className="w-full">
            <TabsList className={`mb-4 grid w-full ${gridColumns}`}>
              {contextTabs.map((tabKey) => (
                <TabsTrigger key={tabKey} value={tabKey}>
                  {tabLabels[tabKey].label} ({tabLabels[tabKey].count})
                </TabsTrigger>
              ))}
            </TabsList>
            {contextTabs.map((tabKey) => (
              <TabsContent key={tabKey} value={tabKey}>
                {tabLabels[tabKey].data.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No {tabLabels[tabKey].label.toLowerCase()} found
                  </div>
                ) : (
                  <div className="space-y-4">
                    <StatusSummary 
                      camps={tabLabels[tabKey].data}
                      type={tabKey}
                    />
                    <CampTable 
                      camps={tabLabels[tabKey].data} 
                      type={tabKey}
                      onCampCodeClick={onCampCodeClick}
                    />
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default CampStatusView;