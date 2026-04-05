// src/pages/dashboard/DashboardHome.jsx
export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Overview</h1>
      
      {/* A simple grid for future stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Active Interns</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">24</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Present Today</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">18</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Pending Approvals</h3>
          <p className="text-3xl font-bold text-orange-500 mt-2">3</p>
        </div>
      </div>
    </div>
  );
}