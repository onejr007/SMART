import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from './store';
import './Navbar.css';

interface NavbarProps {
    onNavigate: (view: 'home' | 'create') => void;
    currentView: 'home' | 'create' | 'play';
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView }) => {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    // Security Recommendation #1: RBAC Check
    const canCreate = user?.role === UserRole.ADMIN || user?.role === UserRole.CREATOR;

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand" onClick={() => onNavigate('home')}>
                    <span className="brand-icon">🎮</span>
                    <span className="brand-text">SMART Metaverse</span>
                </div>

                <div className="navbar-menu">
                    <button 
                        className={`nav-button ${currentView === 'home' ? 'active' : ''}`}
                        onClick={() => onNavigate('home')}
                    >
                        <span className="nav-icon">🏠</span>
                        <span>Home</span>
                    </button>
                    
                    {canCreate && (
                        <button 
                            className={`nav-button ${currentView === 'create' ? 'active' : ''}`}
                            onClick={() => onNavigate('create')}
                        >
                            <span className="nav-icon">✨</span>
                            <span>Create</span>
                        </button>
                    )}
                </div>

                <div className="navbar-user">
                    <div 
                        className="user-profile"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <div className="user-avatar">
                            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-meta">
                            <span className="user-name">{user?.displayName || 'User'}</span>
                            <span className="user-role-badge" data-role={user?.role}>{user?.role}</span>
                        </div>
                        <span className="dropdown-arrow">▼</span>
                    </div>

                    {showDropdown && (
                        <div className="user-dropdown">
                            <div className="dropdown-header">
                                <div className="dropdown-avatar">
                                    {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="dropdown-info">
                                    <div className="dropdown-name">{user?.displayName}</div>
                                    <div className="dropdown-email">{user?.email}</div>
                                </div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item" onClick={handleLogout}>
                                <span>🚪</span>
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showDropdown && (
                <div 
                    className="dropdown-overlay"
                    onClick={() => setShowDropdown(false)}
                ></div>
            )}
        </nav>
    );
};

export default Navbar;
