import React from 'react';
import { FaTachometerAlt, FaCalendarAlt, FaChartBar, FaUsers, FaQrcode, FaSignOutAlt } from 'react-icons/fa';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
        { id: 'bookings', label: 'Bookings', icon: <FaCalendarAlt /> },
        { id: 'analytics', label: 'Analytics', icon: <FaChartBar /> },
        { id: 'newregistrations', label: 'Registrations', icon: <FaUsers /> },
        { id: 'subscribers', label: 'Subscribers', icon: <FaUsers /> },
        { id: 'reports', label: 'Reports', icon: <FaChartBar /> },
        { id: 'qrscanner', label: 'QR Scanner', icon: <FaQrcode /> }
    ];

    return (
        <div className="admin-sidebar">
            <div className="sidebar-header">
                <h2>Admin Panel</h2>
                <p className="sidebar-subtitle">Management Dashboard</p>
            </div>
            
            <div className="sidebar-buttons">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`sidebar-button ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        <span className="button-icon">{item.icon}</span>
                        <span className="button-text">{item.label}</span>
                    </button>
                ))}
            </div>
            
            <div className="sidebar-footer">
                <button className="logout-btn" onClick={onLogout}>
                    <FaSignOutAlt />
                    <span>Logout</span>
                </button>
                
                <div className="admin-info">
                    <div className="admin-avatar">A</div>
                    <div className="admin-details">
                        <div className="admin-name">Administrator</div>
                        <div className="admin-role">System Admin</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;