// src/pages/dashboard/interns/InternsList.jsx
import { useState } from 'react';
import { Search, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';

export default function InternsList() {
  // Mock Data: We will replace this with real data from Laravel later
  const [interns] = useState([
    { id: 1, name: 'Joshua Verson', email: 'joshua@ustp.edu.ph', school: 'USTP', dept: 'IT / Dev', status: 'Active', hours: 120 },
    { id: 2, name: 'Anna Bella', email: 'anna@xu.edu.ph', school: 'Xavier University', dept: 'Marketing', status: 'Active', hours: 85 },
    { id: 3, name: 'Mark Reyes', email: 'mark@liceo.edu.ph', school: 'Liceo de Cagayan', dept: 'HR', status: 'Inactive', hours: 486 },
  ]);

  return (
    <div className="flex flex-col h-full">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Interns Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track all CLIMBS interns</p>
        </div>
        
        <button className="flex items-center gap-2 bg-[#003399] hover:bg-[#002277] text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={18} />
          Add New Intern
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search interns by name or school..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#003399] focus:ring-1 focus:ring-[#003399]"
          />
        </div>
        
        <div className="flex gap-2">
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none">
            <option>All Departments</option>
            <option>IT / Dev</option>
            <option>Marketing</option>
            <option>HR</option>
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-b-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4 font-semibold">Intern Name</th>
              <th className="px-6 py-4 font-semibold">School</th>
              <th className="px-6 py-4 font-semibold">Department</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-center">Hours Rendered</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {interns.map((intern) => (
              <tr key={intern.id} className="hover:bg-slate-50 transition-colors">
                
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-800">{intern.name}</div>
                  <div className="text-slate-500 text-xs">{intern.email}</div>
                </td>
                
                <td className="px-6 py-4 text-slate-600">{intern.school}</td>
                
                <td className="px-6 py-4">
                  <span className="bg-blue-50 text-[#003399] px-2.5 py-1 rounded-full text-xs font-semibold">
                    {intern.dept}
                  </span>
                </td>
                
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    intern.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {intern.status}
                  </span>
                </td>
                
                <td className="px-6 py-4 text-center">
                  <div className="font-semibold text-slate-700">{intern.hours} <span className="text-xs text-slate-400 font-normal">/ 486</span></div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-green-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min((intern.hours / 486) * 100, 100)}%` }}
                    ></div>
                  </div>
                </td>
                
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-[#003399] transition-colors"><Edit size={16} /></button>
                    <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"><MoreVertical size={16} /></button>
                  </div>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}