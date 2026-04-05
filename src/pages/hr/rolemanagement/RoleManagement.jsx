import { useState } from 'react';
import { UserCog, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoleManagement() {
  // Mock data for the table
  const [users, setUsers] = useState([
    { id: 1, name: 'Khen Joshua G. Verson', email: 'khen@example.com', role: 'HR Admin', status: 'Active' },
    { id: 2, name: 'John Doe', email: 'john@example.com', role: 'Intern', status: 'Active' },
    { id: 3, name: 'Jane Smith', email: 'jane@example.com', role: 'Intern', status: 'Inactive' },
  ]);

  const handleUpdateRole = () => {
    toast.success('User role updated successfully!');
  };
  
  const handleDeleteUser = (userId) => {
    // This uses setUsers to filter out the deleted person!
    setUsers(users.filter(user => user.id !== userId));
    toast.success('User deleted successfully!');
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <UserCog size={32} className="text-[#0B1EAE]" />
        <h1 className="text-3xl font-bold text-slate-800">Role Management</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-600">
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Email</th>
              <th className="p-4 font-semibold">Current Role</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-800 font-medium">{user.name}</td>
                <td className="p-4 text-slate-500">{user.email}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === 'HR Admin' ? 'bg-[#0B1EAE]/10 text-[#0B1EAE]' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <button onClick={handleUpdateRole} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Change Role">
                    <Shield size={18} />
                  </button>
                  
                  {/* UPDATE: Added the onClick handler here to trigger the delete function */}
                  <button 
                    onClick={() => handleDeleteUser(user.id)} 
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                    title="Delete User"
                  >
                    <Trash2 size={18} />
                  </button>
                  
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}