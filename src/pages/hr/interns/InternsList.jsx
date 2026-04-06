import React, { useState, useEffect } from 'react';
// 1. Use the custom api instance
import api from '../../../api/axios'; 
import styles from './InternsList.module.css';

const InternsList = () => {
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInterns = async () => {
        try {
            setLoading(true);
            // 2. Clean API call: No full URL, no manual headers
            const response = await api.get('/hr/interns'); 
            setInterns(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching interns:", err);
            setError("Failed to load interns list. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterns();
    }, []);

    if (loading) return <div className={styles.loader}>Loading Interns...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Interns Management</h2>
                <button className={styles.addButton} onClick={fetchInterns}>
                    Refresh List
                </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.tableCard}>
                <table className={styles.internsTable}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Course</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {interns.map((user) => (
                            <tr key={user.id}>
                                <td className={styles.nameCell}>
                                    {user.first_name} {user.last_name}
                                </td>
                                <td>{user.email}</td>
                                <td>{user.intern?.course || 'N/A'}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td>
                                    <button className={styles.viewBtn}>View Profile</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {interns.length === 0 && (
                    <div className={styles.emptyState}>No interns registered in the system.</div>
                )}
            </div>
        </div>
    );
};

export default InternsList;