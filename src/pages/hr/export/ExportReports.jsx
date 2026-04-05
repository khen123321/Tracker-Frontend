import { FileDown, FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExportReports() {
  
  const handleExport = (type) => {
    toast.loading(`Preparing ${type} export...`, { duration: 1500 });
    setTimeout(() => {
      toast.success(`${type} downloaded successfully!`);
    }, 1500);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <FileDown size={32} className="text-[#0B1EAE]" />
        <h1 className="text-3xl font-bold text-slate-800">Export Reports</h1>
      </div>

      <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Attendance & Time Logs</h2>
        
        {/* Date Filters */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-600 mb-2">Start Date</label>
            <div className="relative">
              <input type="date" className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1EAE] outline-none" />
              <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-600 mb-2">End Date</label>
            <div className="relative">
              <input type="date" className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1EAE] outline-none" />
              <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-4">
          <button 
            onClick={() => handleExport('CSV')}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-3 rounded-lg font-medium transition-colors border border-emerald-200"
          >
            <FileSpreadsheet size={20} />
            Export as CSV (Excel)
          </button>
          
          <button 
            onClick={() => handleExport('PDF')}
            className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 py-3 rounded-lg font-medium transition-colors border border-red-200"
          >
            <FileText size={20} />
            Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
}