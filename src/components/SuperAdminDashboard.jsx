import React, { useState } from 'react';
import { HealthCampDashboard } from './dashboards/HealthCampDashboard';
import { HomeTestDashboard } from './dashboards/HomeTestDashboard';
import { Layout, Users, Database, CreditCard } from 'lucide-react';
import Dashboard from './Dashboard';
import { SubscriptionDashboard } from './dashboards/SubscriptionDashboard';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('healthcamp');

  const tabs = [
    {
      id: 'healthcamp',
      name: 'Health Camp Dashboard',
      icon: Layout,
      component: HealthCampDashboard
    },
    {
      id: 'hometest',
      name: 'Individual Tests',
      icon: Users,
      component: HomeTestDashboard
    },
    {
      id: 'database',
      name: 'Database',
      icon: Database,
      component: Dashboard
    },
    {
      id: 'subscriptions',
      name: 'Subscription Dashboard',
      icon: CreditCard,
      component: SubscriptionDashboard
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SuperAdmin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 
                    ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="mt-6">
          {tabs.map((tab) => (
            activeTab === tab.id && (
              <div key={tab.id}>
                <tab.component />
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;