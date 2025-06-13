import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardLayout.css'; // Import the CSS file

function DashboardLayout({ title, children, showSearchBar, onSearch, searchPlaceholder, onLogout, navigationTabs = [], currentTab, onTabChange, createButton, createButtonOptions = [], onCreateChange, onCreateSelectValue, onCreateSelectChange, onSearchButtonClick }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-card">
                <div className="dashboard-header">
                    <h1>{title}</h1>
                </div>
                <div className="dashboard-nav">
                    <div className="dashboard-nav-buttons">
                        {navigationTabs && navigationTabs.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => onTabChange(tab.value)}
                                className={currentTab === tab.value ? 'dashboard-nav-button active' : 'dashboard-nav-button'}
                            >
                                {tab.label}
                            </button>
                        ))}
                        {createButton && (
                            createButtonOptions ? (
                                <select value={onCreateSelectValue} onChange={onCreateSelectChange} className="dashboard-nav-select">
                                    <option value="">{createButton}</option>
                                    {createButtonOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <button
                                    onClick={onCreateChange || (() => onTabChange(createButton.replace(/\s/g, '')))} // Assuming createButton maps to a tab ID
                                    className="dashboard-nav-button"
                                >
                                    {createButton}
                                </button>
                            )
                        )}
                    </div>
                    {showSearchBar && (
                        <div className="search-bar-container">
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                onChange={(e) => onSearch(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        onSearchButtonClick();
                                    }
                                }}
                                className="search-input"
                            />
                            <button className="search-button" onClick={onSearchButtonClick}>Search</button>
                        </div>
                    )}
                    <div className="dashboard-logout" onClick={onLogout || handleLogout}>LOGOUT</div>
                </div>
                <div className="dashboard-content">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default DashboardLayout; 