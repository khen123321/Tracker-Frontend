import React, { useState } from 'react';
import api from '../../../api/axios'; 

const Forms = () => {
    const [activeTab, setActiveTab] = useState('absent');
    const [dateOfAbsence, setDateOfAbsence] = useState('');
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [attachment, setAttachment] = useState(null);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('type', activeTab);
        formData.append('date_of_absence', dateOfAbsence); // Matches Laravel validation
        formData.append('reason', reason);
        formData.append('additional_details', details);
        if (attachment) {
            formData.append('attachment', attachment);
        }

        try {
            // ✅ FIX: We removed 'const response =' because we weren't using the variable
            await api.post('/intern/forms/submit', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setMessage({ type: 'success', text: 'Form submitted successfully!' });
            
            // Clear fields
            setDateOfAbsence('');
            setReason('');
            setDetails('');
            setAttachment(null);
            if (document.getElementById('file-input')) {
                document.getElementById('file-input').value = '';
            }
        } catch (err) {
            console.error(err);
            // If Laravel returns a 422 error, show the specific validation message
            const errorMsg = err.response?.data?.message || 'Failed to submit form. Check your connection.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Forms & Requests</h1>

            {message.text && (
                <div className={`p-4 mb-4 rounded-lg font-medium ${
                    message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {message.text}
                </div>
            )}

            <div className="flex gap-3 mb-6">
                {['absent', 'half-day', 'overtime', 'correction'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-lg font-bold capitalize transition ${
                            activeTab === tab ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700'
                        }`}
                    >
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">Date of {activeTab}</label>
                        <input 
                            type="date" 
                            className="w-full md:w-1/3 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                            value={dateOfAbsence}
                            onChange={(e) => setDateOfAbsence(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-bold mb-2">Reason</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-bold mb-2">Additional Details</label>
                        <textarea 
                            rows="3"
                            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                        ></textarea>
                    </div>

                    <div>
                        <label className="inline-flex items-center px-4 py-2 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-300">
                            <span>📎 {attachment ? attachment.name : 'Attach File'}</span>
                            <input id="file-input" type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-10 py-3 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Forms;