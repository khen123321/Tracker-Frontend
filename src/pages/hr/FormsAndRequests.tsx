import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Download, Eye, Check, X, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import PageHeader from '../../components/layout/PageHeader';

// ─── TYPES & INTERFACES ───
interface InternUser {
  first_name: string;
  last_name: string;
}

interface Intern {
  id: number | string;
  user: InternUser;
}

interface RequestItem {
  id: number | string;
  intern?: Intern;
  status?: string;
  appeal_status?: string;
  type?: string;
  date?: string;
  target_date?: string;
  created_at?: string;
  appeal_submitted_at?: string;
  appeal_text?: string;
  reason?: string;
  additional_details?: string;
  appeal_file_path?: string;
  attachment_path?: string;
  appeal_rejection_reason?: string;
  hr_remarks?: string;
  [key: string]: any; // Catch-all for dynamic Laravel data
}

// ─── SKELETON PRIMITIVES ───
interface SkProps {
  w?: string;
  h?: string;
  r?: string;
  mb?: string;
}

function Sk({ w = '100%', h = '16px', r = '8px', mb = '0' }: SkProps) {
  return (
    <div 
      className="shrink-0 bg-gradient-to-r from-[#e8ecf2] via-[#f4f6fa] to-[#e8ecf2] bg-[length:700px_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" 
      style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} 
    />
  );
}

function FormsSkeleton() {
  return (
    <div className="flex flex-col gap-[5px] p-3 bg-slate-50 min-h-screen font-sans text-slate-900">
      {/* Skeleton Header */}
      <div className="flex justify-between items-center py-3.5 px-5 bg-white rounded-[10px] border border-slate-200 mb-6">
        <Sk w="240px" h="26px" r="6px" />
        <div className="flex gap-3">
          <Sk w="36px" h="36px" r="8px" />
          <Sk w="210px" h="36px" r="999px" />
        </div>
      </div>

      {/* Skeleton Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[5px] mb-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-5 rounded-[10px] border border-slate-200 shadow-sm flex flex-col justify-center">
            <Sk w="40px" h="32px" mb="8px" />
            <Sk w="80px" h="14px" />
          </div>
        ))}
      </div>

      {/* Skeleton Main Card */}
      <div className="bg-white rounded-[10px] border border-slate-200 shadow-sm p-5 flex flex-col flex-1">
        <div className="flex gap-4 border-b border-slate-200 pb-3 mb-5">
          <Sk w="120px" h="20px" />
          <Sk w="120px" h="20px" />
          <Sk w="120px" h="20px" />
        </div>
        <div className="flex gap-3 mb-5">
          {[1, 2, 3, 4].map(i => <Sk key={i} w="80px" h="34px" r="6px" />)}
        </div>
        <Sk w="100%" h="300px" r="8px" />
      </div>
    </div>
  );
}

const FormsAndRequests: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('appeals'); // 'appeals', 'leaves', 'overtime'
  
  const [appeals, setAppeals] = useState<RequestItem[]>([]);
  const [generalRequests, setGeneralRequests] = useState<RequestItem[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  const [selectedItem, setSelectedItem] = useState<RequestItem | null>(null); 
  const [showModal, setShowModal] = useState<boolean>(false);
  const [hrRemarks, setHrRemarks] = useState<string>(''); 
  const [processingId, setProcessingId] = useState<number | string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all'); 

  useEffect(() => {
    if (activeTab === 'appeals') {
      fetchAppeals();
    } else {
      fetchGeneralRequests();
    }
  }, [activeTab]);

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/hr/appeals');
      const fetchedData = response.data.data?.data || response.data.data || [];
      setAppeals(fetchedData);
    } catch (err: any) {
      console.error('Error fetching appeals:', err);
      toast.error(`Failed to load appeals. Endpoint hit: ${err.config?.url || 'Unknown'}`);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchGeneralRequests = async () => {
    setLoading(true);
    try {
      // 💡 If 404 persists, this is the endpoint you need to check in your Laravel routes/api.php file
      const response = await api.get('/hr/forms-requests'); 
      setGeneralRequests(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      // 💡 Improved error message to specifically print out the URL it tried to hit
      toast.error(`Failed to load requests (404). Tried hitting: ${err.config?.url || '/hr/forms-requests'}`);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // ─── UNIFIED FILTERING ───
  const currentDataList = activeTab === 'appeals'
    ? appeals.filter(a => filterStatus === 'all' || a.appeal_status?.toLowerCase() === filterStatus)
    : generalRequests.filter(req => {
        const reqStatus = req.status?.toLowerCase() || 'pending';
        const matchesStatus = filterStatus === 'all' || reqStatus === filterStatus;
        if (!matchesStatus) return false;

        if (activeTab === 'leaves') return req.type === 'absent' || req.type === 'half-day';
        if (activeTab === 'overtime') return req.type === 'overtime' || req.type === 'correction';
        return false;
      });

  // Calculate stats based on current tab
  const getStatusCount = (status: string) => {
    const rawData = activeTab === 'appeals' ? appeals : generalRequests.filter(req => {
        if (activeTab === 'leaves') return req.type === 'absent' || req.type === 'half-day';
        if (activeTab === 'overtime') return req.type === 'overtime' || req.type === 'correction';
        return false;
    });

    if (activeTab === 'appeals') {
        return rawData.filter(item => item.appeal_status?.toLowerCase() === status).length;
    }
    return rawData.filter(item => item.status?.toLowerCase() === status).length;
  };

  const handleViewDetails = (item: RequestItem) => {
    setSelectedItem(item);
    setShowModal(true);
    setHrRemarks('');
  };

  // ─── UNIFIED PROCESSING ───
  const handleProcessRequest = async (action: 'approved' | 'rejected') => {
    if (!selectedItem) return;
    if (action === 'rejected' && !hrRemarks.trim()) {
      toast.error('Please provide a rejection reason/remark');
      return;
    }

    try {
      setProcessingId(selectedItem.id);
      const isAppeal = activeTab === 'appeals';

      if (isAppeal) {
        const endpoint = action === 'approved' 
            ? `/hr/appeals/${selectedItem.id}/approve` 
            : `/hr/appeals/${selectedItem.id}/reject`;
        await api.post(endpoint, { rejection_reason: hrRemarks });
      } else {
        await api.post(`/hr/forms-requests/${selectedItem.id}/process`, { 
            status: action, 
            remarks: hrRemarks 
        });
      }

      toast.success(action === 'approved' ? 'Approved successfully' : 'Rejected successfully');
      setShowModal(false);
      isAppeal ? fetchAppeals() : fetchGeneralRequests();
    } catch (err: any) {
      console.error('Error processing:', err);
      toast.error(`Failed to process. Endpoint: ${err.config?.url}`);
    } finally {
      setProcessingId(null);
    }
  };

  // ─── SECURE DOWNLOAD ───
  const handleDownload = async (id: number | string, isAppeal: boolean) => {
    const loadingToast = toast.loading("Downloading evidence...");
    try {
        const endpoint = isAppeal ? `/appeals/${id}/download` : `/hr/forms-requests/${id}/download`;
        const response = await api.get(endpoint, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Attachment_${id}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("Download complete", { id: loadingToast });
    } catch (err: any) {
        toast.error(`File download failed. Endpoint: ${err.config?.url}`, { id: loadingToast });
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-[11px] font-semibold tracking-[0.02em] bg-amber-50 text-amber-700 border border-amber-200";
      case 'approved': return "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-[11px] font-semibold tracking-[0.02em] bg-green-50 text-green-700 border border-green-200";
      case 'rejected': return "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-[11px] font-semibold tracking-[0.02em] bg-red-50 text-red-700 border border-red-200";
      default: return "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-[11px] font-semibold tracking-[0.02em] bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  const getStatusDotClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return "bg-amber-500";
      case 'approved': return "bg-green-500";
      case 'rejected': return "bg-red-500";
      default: return "bg-slate-400";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (initialLoad) return <FormsSkeleton />;

  return (
    <div className="flex flex-col gap-[5px] p-3 bg-slate-50 min-h-screen font-sans text-slate-900">
      
      {/* Required for skeleton shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -700px 0; }
          100% { background-position: 700px 0; }
        }
      `}</style>

      <Toaster position="top-right" />

      {/* ✨ REPLACED HEADER WITH YOUR NEW PAGEHEADER COMPONENT ✨ */}
      <PageHeader title="Forms & Requests" />

      {/* ✨ MOVED STATS INTO A SEPARATE ROW TO MATCH DASHBOARD STYLE ✨ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[5px]">
        <div className="bg-white p-5 rounded-[10px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-center">
          <span className="text-[28px] font-bold leading-none mb-1 text-amber-600">{getStatusCount('pending')}</span>
          <span className="text-[13px] text-slate-500 font-medium">Pending Review</span>
        </div>
        <div className="bg-white p-5 rounded-[10px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-center">
          <span className="text-[28px] font-bold leading-none mb-1 text-green-600">{getStatusCount('approved')}</span>
          <span className="text-[13px] text-slate-500 font-medium">Approved</span>
        </div>
        <div className="bg-white p-5 rounded-[10px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-center">
          <span className="text-[28px] font-bold leading-none mb-1 text-red-600">{getStatusCount('rejected')}</span>
          <span className="text-[13px] text-slate-500 font-medium">Rejected</span>
        </div>
      </div>

      {/* ✨ WRAPPED TABS & TABLE IN A MAIN UNIFIED CARD ✨ */}
      <div className="bg-white rounded-[10px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 flex flex-col flex-1">
        
        {/* ─── TABS ─── */}
        <div className="flex gap-6 border-b border-slate-200 mb-5 overflow-x-auto whitespace-nowrap">
            <button 
                onClick={() => { setActiveTab('appeals'); setFilterStatus('all'); }}
                className={`bg-transparent border-none pb-3 text-sm font-semibold cursor-pointer relative transition-colors hover:text-slate-900 ${activeTab === 'appeals' ? 'text-[#0B1EAE] after:content-[""] after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-[#0B1EAE] after:rounded-t-[2px]' : 'text-slate-500'}`}
            >
                Attendance Appeals
            </button>
            <button 
                onClick={() => { setActiveTab('leaves'); setFilterStatus('all'); }}
                className={`bg-transparent border-none pb-3 text-sm font-semibold cursor-pointer relative transition-colors hover:text-slate-900 ${activeTab === 'leaves' ? 'text-[#0B1EAE] after:content-[""] after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-[#0B1EAE] after:rounded-t-[2px]' : 'text-slate-500'}`}
            >
                Leave & Absent Forms
            </button>
            <button 
                onClick={() => { setActiveTab('overtime'); setFilterStatus('all'); }}
                className={`bg-transparent border-none pb-3 text-sm font-semibold cursor-pointer relative transition-colors hover:text-slate-900 ${activeTab === 'overtime' ? 'text-[#0B1EAE] after:content-[""] after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-[#0B1EAE] after:rounded-t-[2px]' : 'text-slate-500'}`}
            >
                Overtime & Corrections
            </button>
        </div>

        <div className="mb-5">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                className={`py-1.5 px-3.5 border rounded-md cursor-pointer text-[13px] transition-all hover:bg-slate-100 hover:text-slate-900 ${filterStatus === status ? 'bg-blue-50 text-[#0B1EAE] border-blue-200 font-semibold' : 'bg-slate-50 text-slate-500 border-slate-200 font-medium'}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-[13px]">
            <div className="w-6 h-6 border-[3px] border-slate-200 border-t-[#0B1EAE] rounded-full animate-spin mb-3"></div>
            <p>Syncing records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {currentDataList.length === 0 ? (
              <div className="py-10 px-5 text-center flex flex-col items-center justify-center">
                <div className="bg-slate-50 text-slate-300 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <FileText size={40} />
                </div>
                <h3 className="m-0 mb-1 text-slate-900 text-base">No records found</h3>
                <p className="m-0 text-slate-500 text-[13px]">There are currently no {filterStatus !== 'all' ? filterStatus : ''} records to review in this category.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="p-3 px-4 text-xs font-semibold text-slate-500 border-b border-slate-200 bg-slate-50">Intern</th>
                    <th className="p-3 px-4 text-xs font-semibold text-slate-500 border-b border-slate-200 bg-slate-50">{activeTab === 'appeals' ? 'Disputed Date' : 'Target Date'}</th>
                    <th className="p-3 px-4 text-xs font-semibold text-slate-500 border-b border-slate-200 bg-slate-50">Type</th>
                    <th className="p-3 px-4 text-xs font-semibold text-slate-500 border-b border-slate-200 bg-slate-50">Status</th>
                    <th className="p-3 px-4 text-xs font-semibold text-slate-500 border-b border-slate-200 bg-slate-50" style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDataList.map(item => {
                    const itemStatus = item.appeal_status || item.status;
                    const itemDate = item.date || item.target_date;
                    
                    return (
                      <tr key={item.id} className="transition-colors hover:bg-slate-50">
                        <td className="p-4 border-b border-slate-100 text-[13px] text-slate-900 align-middle min-w-[200px]">
                          <div>
                            <p className="m-0 mb-0.5 font-semibold text-slate-900">
                              {item.intern?.user?.first_name} {item.intern?.user?.last_name}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 border-b border-slate-100 text-[13px] text-slate-900 align-middle">{formatDate(itemDate)}</td>
                        <td className="p-4 border-b border-slate-100 text-[13px] text-slate-900 align-middle">
                          <span className="bg-slate-100 text-slate-600 py-1 px-2 rounded-md text-[11px] font-semibold uppercase tracking-[0.02em]">
                              {activeTab === 'appeals' ? 'Photo Appeal' : item.type}
                          </span>
                        </td>
                        <td className="p-4 border-b border-slate-100 text-[13px] text-slate-900 align-middle">
                          <span className={getStatusBadgeClass(itemStatus)}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(itemStatus)}`}></span>
                            {itemStatus ? itemStatus.charAt(0).toUpperCase() + itemStatus.slice(1) : 'Pending'}
                          </span>
                        </td>
                        <td className="p-4 border-b border-slate-100 text-[13px] text-slate-900 align-middle" style={{ textAlign: 'right' }}>
                          <button
                            className="py-2 px-3 bg-white text-[#0B1EAE] border border-slate-200 rounded-md cursor-pointer font-semibold text-xs inline-flex items-center gap-1.5 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
                            onClick={() => handleViewDetails(item)}
                            disabled={processingId === item.id}
                          >
                            <Eye size={16} /> View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ─── MODAL ─── */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-[1000] p-6 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-[500px] w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 px-5 border-b border-slate-100 flex justify-between items-center bg-[#fffbfa]">
              <h2 className="text-base font-bold text-slate-900 m-0">Review {activeTab === 'appeals' ? 'Appeal' : selectedItem.type?.toUpperCase() + ' Request'}</h2>
              <button className="bg-transparent border-none text-slate-500 cursor-pointer flex items-center justify-center p-1 rounded-md transition-colors hover:bg-slate-100 hover:text-slate-900" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <div className="p-5 overflow-y-auto">
              <div className="mb-6">
                <h3 className="m-0 mb-3 text-slate-900 text-[13px] font-bold border-b border-slate-200 pb-2">Intern Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase mb-1">Name</span>
                    <p className="m-0 text-slate-900 text-[13px] font-medium">{selectedItem.intern?.user?.first_name} {selectedItem.intern?.user?.last_name}</p>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase mb-1">Intern ID</span>
                    <p className="m-0 text-slate-900 text-[13px] font-medium">{selectedItem.intern?.id}</p>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase mb-1">{activeTab === 'appeals' ? 'Attendance Date' : 'Target Date'}</span>
                    <p className="m-0 text-slate-900 text-[13px] font-medium">{formatDate(selectedItem.date || selectedItem.target_date)}</p>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase mb-1">Submitted</span>
                    <p className="m-0 text-slate-900 text-[13px] font-medium">{formatDate(selectedItem.appeal_submitted_at || selectedItem.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="m-0 mb-3 text-slate-900 text-[13px] font-bold border-b border-slate-200 pb-2">{activeTab === 'appeals' ? 'Appeal Details' : 'Reason'}</h3>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="m-0 text-slate-700 leading-relaxed text-[13px] whitespace-pre-wrap">{selectedItem.appeal_text || selectedItem.reason}</p>
                  {selectedItem.additional_details && (
                      <p className="m-0 leading-relaxed" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
                          <strong>Details:</strong> {selectedItem.additional_details}
                      </p>
                  )}
                </div>
              </div>

              {(selectedItem.appeal_file_path || selectedItem.attachment_path) && (
                <div className="mb-6">
                  <h3 className="m-0 mb-3 text-slate-900 text-[13px] font-bold border-b border-slate-200 pb-2">Attached Document</h3>
                  <button
                    onClick={() => handleDownload(selectedItem.id, activeTab === 'appeals')}
                    className="py-2.5 px-4 bg-white text-[#0B1EAE] border border-slate-200 rounded-lg text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300"
                  >
                    <Download size={16} /> Download Attachment
                  </button>
                </div>
              )}

              {((selectedItem.appeal_status || selectedItem.status)?.toLowerCase() === 'rejected') && (selectedItem.appeal_rejection_reason || selectedItem.hr_remarks) && (
                <div className="bg-rose-50 p-3 rounded-lg border border-red-200 mb-6">
                  <h3 className="text-rose-600 m-0 mb-2 text-[13px] border-none p-0 font-bold">Rejection Reason / HR Remarks</h3>
                  <p className="m-0 text-rose-800 text-[13px] leading-relaxed">{selectedItem.appeal_rejection_reason || selectedItem.hr_remarks}</p>
                </div>
              )}

              {((selectedItem.appeal_status || selectedItem.status)?.toLowerCase() === 'pending') && (
                <div className="mb-6">
                  <h3 className="m-0 mb-3 text-slate-900 text-[13px] font-bold border-none pb-2">HR Remarks (Sent to Intern)</h3>
                  <textarea
                    className="w-full p-3 rounded-lg border border-slate-200 text-[13px] text-slate-800 font-sans resize-y min-h-[80px] outline-none transition-colors box-border bg-slate-50 focus:border-[#0B1EAE] focus:shadow-[0_0_0_3px_rgba(11,30,174,0.1)] focus:bg-white"
                    placeholder="Enter approval/rejection notes here..."
                    value={hrRemarks}
                    onChange={e => setHrRemarks(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 p-4 px-5 border-t border-slate-100 bg-white">
              <button className="py-2 px-4 bg-white text-slate-600 border border-slate-200 rounded-md cursor-pointer font-semibold text-[13px] transition-colors hover:bg-slate-50" onClick={() => setShowModal(false)}>Cancel</button>
              
              {((selectedItem.appeal_status || selectedItem.status)?.toLowerCase() === 'pending') ? (
                <>
                  <button
                    className="py-2 px-4 bg-rose-600 text-white border-none rounded-md cursor-pointer font-semibold text-[13px] flex items-center gap-1.5 transition-colors hover:bg-rose-700 disabled:opacity-50"
                    onClick={() => handleProcessRequest('rejected')}
                    disabled={processingId === selectedItem.id}
                  >
                    <X size={16} /> Reject
                  </button>
                  <button
                    className="py-2 px-4 bg-green-600 text-white border-none rounded-md cursor-pointer font-semibold text-[13px] flex items-center gap-1.5 transition-colors hover:bg-green-700 disabled:opacity-50"
                    onClick={() => handleProcessRequest('approved')}
                    disabled={processingId === selectedItem.id}
                  >
                    <Check size={16} /> Approve
                  </button>
                </>
              ) : (
                <p className="m-0 text-slate-500 italic text-[13px] self-center">
                  This request has already been {(selectedItem.appeal_status || selectedItem.status)?.toLowerCase()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormsAndRequests;