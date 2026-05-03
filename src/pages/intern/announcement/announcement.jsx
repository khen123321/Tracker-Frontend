import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { Megaphone, Search, Pin, Calendar, MapPin, Clock, X, ChevronRight, AlertCircle } from 'lucide-react';
import styles from './announcement.module.css';
import toast, { Toaster } from 'react-hot-toast';

// ✨ PAGE HEADER IMPORT ✨
import PageHeader from "../../../components/PageHeader";

const Announcement = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await api.get('/events');
            
            // Sort by newest first
            const sortedData = response.data.sort((a, b) => new Date(b.created_at || b.start) - new Date(a.created_at || a.start));
            
            setAnnouncements(sortedData);
        } catch (error) {
            console.error("Error fetching announcements:", error);
            toast.error("Failed to load announcements.");
        } finally {
            setLoading(false);
        }
    };

    // Filter logic based on the search bar
    const filteredAnnouncements = announcements.filter(ann => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            ann.title?.toLowerCase().includes(query) || 
            ann.extendedProps?.description?.toLowerCase().includes(query)
        );
    });

    // ─── SPLIT LOGIC LOOKING AT EXTENDEDPROPS ───
    const pinnedAnnouncements = filteredAnnouncements.filter(ann => ann.extendedProps?.is_pinned === true);
    const recentAnnouncements = filteredAnnouncements.filter(ann => !ann.extendedProps?.is_pinned);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading announcements...</p>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <Toaster position="top-right" />
            
            <PageHeader 
                title="Announcements" 
            />

            <div className={styles.mainContentCard}>
                
                {/* Search Bar Row */}
                <div className={styles.searchWrapper}>
                    <div className={styles.searchContainer}>
                        <Search size={16} className={styles.searchIcon} />
                        <input 
                            type="text" 
                            placeholder="Search announcements..." 
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {filteredAnnouncements.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Megaphone size={48} className={styles.emptyIcon} />
                        <h3>No announcements found</h3>
                        <p>We couldn't find anything matching your search.</p>
                    </div>
                ) : (
                    <>
                        {/* ─── PINNED SECTION ─── */}
                        {pinnedAnnouncements.length > 0 && (
                            <div className={styles.sectionContainer}>
                                <div className={styles.sectionHeader}>
                                    <Pin size={14} className={styles.sectionIcon} />
                                    <span>PINNED</span>
                                </div>
                                
                                <div className={styles.pinnedList}>
                                    {pinnedAnnouncements.map((announcement) => {
                                        const dateObj = new Date(announcement.start || announcement.date || announcement.created_at);
                                        
                                        return (
                                            <div 
                                                key={announcement.id} 
                                                className={`${styles.pinnedCard} ${styles.accentRed}`}
                                                onClick={() => setSelectedAnnouncement(announcement)}
                                            >
                                                <div className={styles.pinnedIconBox}>
                                                    <AlertCircle size={20} />
                                                </div>
                                                
                                                <div className={styles.pinnedContent}>
                                                    <div className={styles.pinnedMeta}>
                                                        <span className={`${styles.badge} ${styles.badgeUrgent}`}>PINNED</span>
                                                        <span className={styles.dateText}>
                                                            {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <h3 className={styles.pinnedTitle}>{announcement.title}</h3>
                                                    <p className={styles.pinnedDesc}>
                                                        {announcement.extendedProps?.description || "Click to view full details."}
                                                    </p>
                                                </div>
                                                
                                                <div className={styles.cardActions}>
                                                    <ChevronRight size={20} className={styles.chevron} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ─── RECENT SECTION ─── */}
                        {recentAnnouncements.length > 0 && (
                            <div className={styles.sectionContainer}>
                                <div className={styles.sectionHeader}>
                                    <Calendar size={14} className={styles.sectionIcon} />
                                    <span>RECENT</span>
                                </div>
                                
                                <div className={styles.recentGrid}>
                                    {recentAnnouncements.map((announcement) => {
                                        const dateObj = new Date(announcement.start || announcement.date || announcement.created_at);
                                        
                                        return (
                                            <div 
                                                key={announcement.id} 
                                                className={`${styles.recentCard} ${styles.accentBlue}`}
                                                onClick={() => setSelectedAnnouncement(announcement)}
                                            >
                                                <div className={styles.recentCardHeader}>
                                                    <span className={`${styles.badge} ${styles.badgeStandard}`}>NOTICE</span>
                                                    <span className={styles.dateText}>
                                                        {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                
                                                <h3 className={styles.recentTitle}>{announcement.title}</h3>
                                                
                                                <p className={styles.recentDesc}>
                                                    {announcement.extendedProps?.description || "Click to view full details."}
                                                </p>

                                                <div className={styles.recentFooter}>
                                                    <span className={styles.readMoreText}>READ MORE</span>
                                                    <ChevronRight size={14} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ─── DETAILS MODAL (READ-ONLY) ─── */}
            {selectedAnnouncement && (
                <div className={styles.modalOverlay} onClick={() => setSelectedAnnouncement(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{selectedAnnouncement.title}</h2>
                            <button onClick={() => setSelectedAnnouncement(null)} className={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.modalMetaGroup}>
                                <div className={styles.modalMeta}>
                                    <Clock size={16} color="#64748b" />
                                    <span>
                                        {new Date(selectedAnnouncement.start || selectedAnnouncement.date || selectedAnnouncement.created_at).toLocaleString('en-US', { 
                                            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', 
                                            hour: '2-digit', minute: '2-digit' 
                                        })}
                                    </span>
                                </div>

                                {selectedAnnouncement.extendedProps?.location && (
                                    <div className={styles.modalMeta}>
                                        <MapPin size={16} color="#ef4444" />
                                        <span>{selectedAnnouncement.extendedProps.location}</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.modalDivider}></div>

                            <div className={styles.modalDescription}>
                                {selectedAnnouncement.extendedProps?.description ? (
                                    selectedAnnouncement.extendedProps.description.split('\n').map((paragraph, index) => (
                                        <p key={index}>{paragraph}</p>
                                    ))
                                ) : (
                                    <p className={styles.noDesc}>No additional details provided.</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button onClick={() => setSelectedAnnouncement(null)} className={styles.btnPrimary}>
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcement;