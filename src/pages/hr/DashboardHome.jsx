import React from 'react';

export default function DashboardHome() {
  // Get user data to personalize the dashboard
  const user = JSON.parse(localStorage.getItem('cims_user')) || {};
  const isSuperAdmin = user.role === 'superadmin';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
            {isSuperAdmin ? "System Administrator Overview" : "HR Dashboard Overview"}
        </h1>
        {isSuperAdmin && (
            <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold shadow-sm">
                FULL ACCESS MODE
            </span>
        )}
      </div>
      
      {/* A simple grid for future stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Active Interns</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">24</p>
          <p className="text-[10px] text-gray-400 mt-1 italic">Across all departments</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 text-sm font-medium">Present Today</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">18</p>
          <p className="text-[10px] text-gray-400 mt-1 italic">Timed in within last 4 hours</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 text-sm font-medium">Pending Approvals</h3>
          <p className="text-3xl font-bold text-orange-500 mt-2">3</p>
          <p className="text-[10px] text-gray-400 mt-1 italic">Awaiting document review</p>
        </div>
      </div>

      {isSuperAdmin && (
          <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl border-dashed">
              <p className="text-sm text-slate-500 text-center">
                  Superadmin logs: Database connection healthy. System uptime: 99.9%
              </p>
          </div>
      )}
    </div>
  );
}