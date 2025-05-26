import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ScheduledCamp from './HealthCampComponents/ScheduledCamp';
import CompleteCamp from './HealthCampComponents/CompleteCamp';
import ClosedCamp from './HealthCampComponents/ClosedCamp';
import { Calendar, CheckSquare, XSquare, User, ChevronRight, Building2 } from 'lucide-react';

const HealthCampForm=() =>{
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('schedule');

  const tabs = [
    { 
      id: 'schedule',
      name: 'Schedule Camp', 
      component: ScheduledCamp,
      icon: Calendar,
      description: 'Plan and organize new health camps'
    },
    { 
      id: 'complete',
      name: 'Complete Camp', 
      component: CompleteCamp,
      icon: CheckSquare,
      description: 'Mark camps as completed'
    },
    { 
      id: 'close',
      name: 'Close Camp', 
      component: ClosedCamp,
      icon: XSquare,
      description: 'Archive and close camps'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100">
      <div className="h-full flex flex-col">
        {/* Header Section */}
        <header className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-6 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/10 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Health Camp Management
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  Organize and manage community health initiatives
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2.5 backdrop-blur-sm">
              <User className="w-5 h-5 text-white" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">
                  {currentUser?.email}
                </span>
                
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="max-w-9xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              {/* Navigation Breadcrumb */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center space-x-2 text-sm">
                <span className="text-gray-600">Dashboard</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-blue-600 font-medium">Health Camps</span>
              </div>

              {/* Main Content Area */}
              <div className="p-6">
                {/* Enhanced Tab Navigation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/50 p-2 rounded-xl">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      disabled={!tab.component}
                      className={`
                        flex flex-col items-center gap-1.5 
                        rounded-xl py-3 px-4 
                        transition-all duration-200 ease-in-out
                        ${
                          !tab.component 
                            ? 'opacity-50 cursor-not-allowed bg-gray-50'
                            : activeTab === tab.id
                              ? 'bg-white shadow-lg ring-2 ring-blue-600/10 scale-100'
                              : 'hover:bg-white/80 hover:shadow-md scale-95 hover:scale-100'
                        }
                      `}
                    >
                      <div className={`
                        p-2 rounded-lg 
                        ${
                          !tab.component
                            ? 'bg-gray-200 text-gray-400'
                            : activeTab === tab.id 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-600'
                        }
                      `}>
                        <tab.icon className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <div className={`
                          font-medium 
                          ${
                            !tab.component
                              ? 'text-gray-400'
                              : activeTab === tab.id 
                                ? 'text-blue-600' 
                                : 'text-gray-700'
                          }
                        `}>
                          {tab.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {tab.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Tab Content with Animation */}
                <div className="mt-6">
                  {tabs.map((tab) => (
                    <div
                      key={tab.id}
                      className={`
                        transform transition-all duration-300
                        ${activeTab === tab.id 
                          ? 'opacity-100 translate-y-0' 
                          : 'opacity-0 translate-y-4 hidden'
                        }
                      `}
                    >
                      <div className="bg-white rounded-xl p-6 ring-1 ring-gray-100">
                        {tab.component ? (
                          <tab.component />
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <div className="bg-gray-100 p-4 rounded-full mb-4">
                              <tab.icon className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-lg font-medium text-gray-600">
                              {tab.name} functionality coming soon...
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                              This feature is currently under development
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default HealthCampForm;