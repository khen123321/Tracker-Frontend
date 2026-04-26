import React, { createContext, useContext, useState } from 'react';
import InternProfileDrawer from '../components/layout/InternProfileDrawer';

const ProfileDrawerContext = createContext(null);

export const useProfileDrawer = () => {
    const context = useContext(ProfileDrawerContext);
    if (!context) { throw new Error('useProfileDrawer must be used within Provider'); }
    return context;
};

export const ProfileDrawerProvider = ({ children }) => {
    const [drawerInternId, setDrawerInternId] = useState(null);

    const openProfile = (id) => setDrawerInternId(id);
    const closeProfile = () => setDrawerInternId(null);

    return (
        <ProfileDrawerContext.Provider value={{ openProfile, closeProfile }}>
            {children}
            {drawerInternId && (
                <InternProfileDrawer 
                    internId={drawerInternId} 
                    onClose={closeProfile} 
                />
            )}
        </ProfileDrawerContext.Provider>
    );
};