import React, { useState, useEffect } from 'react';
import { Card, Badge, Container } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmployeeDirectory from './EmployeeDirectory';
import Departments from './Departments';
import OfficeLocations from './OfficeLocations';

const OrganizationHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'employees');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const getTabs = () => {
    const tabs = [
      { 
        key: 'employees', 
        label: 'Employees Directory', 
        icon: 'fa-users', 
        description: 'Workforce directory, profiles & management',
        roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] 
      },
      { 
        key: 'departments', 
        label: 'Departments', 
        icon: 'fa-sitemap', 
        description: 'Organizational hierarchy & teams',
        roles: ['ADMIN', 'HR'] 
      },
      { 
        key: 'locations', 
        label: 'Office Locations', 
        icon: 'fa-location-dot', 
        description: 'Physical branches & geofencing',
        roles: ['ADMIN', 'HR'] 
      }
    ];

    return tabs.filter(tab => tab.roles.includes(user?.role));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'employees':
        return <EmployeeDirectory />;
      case 'departments':
        return <Departments />;
      case 'locations':
        return <OfficeLocations />;
      default:
        return <EmployeeDirectory />;
    }
  };

  return (
    <div className="organization-hub-v2">
      <style>{`
        /* ── Emerald Green & Pure White Executive Theme ── */
        .organization-hub-v2 {
          animation: hubFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          background: #f8fafc;
          min-height: 100vh;
          width: 100%;
          padding: 0;
          margin: 0;
        }
        
        @keyframes hubFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Hero Banner */
        .org-hero-banner {
          position: relative;
          background: linear-gradient(135deg, #064e3b 0%, #047857 45%, #059669 85%, #10b981 100%);
          border-radius: 20px;
          padding: 2.25rem 2.5rem;
          margin-bottom: 1.75rem;
          color: white;
          box-shadow: 0 14px 35px -10px rgba(4, 120, 87, 0.45);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        /* Decorative Background Pattern & Glow */
        .org-hero-banner::before {
          content: '';
          position: absolute;
          top: -40%;
          right: -10%;
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(52, 211, 153, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
          animation: pulseGlow 6s infinite alternate ease-in-out;
        }

        .org-hero-banner::after {
          content: '';
          position: absolute;
          bottom: -50%;
          left: -10%;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(255, 255, 255, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        @keyframes pulseGlow {
          0% { transform: scale(1) translateY(0); opacity: 0.8; }
          100% { transform: scale(1.15) translateY(-10px); opacity: 1; }
        }

        .org-hero-content {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .org-title-group h1 {
          font-size: 2.15rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 0.4rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          color: #ffffff;
          text-shadow: 0 2px 10px rgba(0,0,0,0.15);
        }

        .org-title-group h1 i {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.65rem 0.75rem;
          border-radius: 14px;
          font-size: 1.6rem;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .org-title-group p {
          opacity: 0.92;
          margin: 0;
          font-size: 1rem;
          font-weight: 400;
          max-width: 600px;
          color: #ecfdf5;
          line-height: 1.5;
        }

        .org-hero-badges {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .org-pill-badge {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.28);
          border-radius: 50px;
          padding: 0.5rem 1.15rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }

        .org-pill-badge:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        /* Main Navigation Tab Container */
        .org-tabs-card {
          background: #ffffff;
          border-radius: 0;
          box-shadow: none;
          margin: 0;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
          border: none;
          transition: all 0.3s ease;
        }

        .org-tabs-header {
          display: flex;
          background: #ffffff;
          border-bottom: 2px solid #e6f4ed;
          padding: 0.5rem 0.75rem 0 0.75rem;
          overflow-x: auto;
          scrollbar-width: thin;
          gap: 0.5rem;
        }

        .org-tabs-header::-webkit-scrollbar {
          height: 4px;
        }

        .org-tabs-header::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 4px;
        }

        .org-tab-btn {
          flex: 1;
          min-width: 190px;
          padding: 0.95rem 1.35rem;
          border: none;
          background: transparent;
          color: #475569;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          white-space: nowrap;
          border-radius: 14px 14px 0 0;
        }

        .org-tab-btn i {
          font-size: 1.15rem;
          color: #64748b;
          transition: all 0.3s ease;
        }

        .org-tab-btn:hover {
          background: rgba(16, 185, 129, 0.06);
          color: #059669;
        }

        .org-tab-btn:hover i {
          color: #059669;
          transform: scale(1.1);
        }

        .org-tab-btn.active {
          color: #047857;
          background: linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%);
          font-weight: 700;
        }

        .org-tab-btn.active i {
          color: #059669;
          transform: scale(1.15);
        }

        .org-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 10px;
          right: 10px;
          height: 3.5px;
          background: linear-gradient(90deg, #047857 0%, #10b981 100%);
          border-radius: 4px 4px 0 0;
          box-shadow: 0 -2px 8px rgba(16, 185, 129, 0.4);
        }

        .org-content-wrapper {
          padding: 0.25rem 0 0 0;
          min-height: 500px;
        }

        .org-tab-pane {
          animation: paneSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes paneSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 992px) {
          .org-hero-banner {
            padding: 1.75rem;
          }
          .org-title-group h1 {
            font-size: 1.75rem;
          }
        }

        @media (max-width: 768px) {
          .org-hero-content {
            flex-direction: column;
            align-items: flex-start;
          }
          .org-tab-btn {
            min-width: 140px;
            padding: 0.85rem 1rem;
            font-size: 0.88rem;
          }
          .org-tab-btn span {
            display: inline-block;
          }
        }
      `}</style>

      {/* Tabs Navigation Card - Full Height & Width */}
      <Card className="org-tabs-card border-0 shadow-none rounded-0">
        <div className="org-tabs-header">
          {getTabs().map(tab => (
            <button
              key={tab.key}
              className={`org-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
              title={tab.description}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="org-content-wrapper">
          <div className="org-tab-pane" key={activeTab}>
            {renderTabContent()}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrganizationHub;
