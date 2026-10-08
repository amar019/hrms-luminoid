import React, { useState, useEffect } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/recruitment-tracker.css';

export default function RecruitmentTrackerLayout() {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [selectedReqId, setSelectedReqId] = useState('all');
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchRequisitions();
  }, []);

  useEffect(() => {
    const activeId = id || getReqIdFromPath(location.pathname);
    if (activeId) {
      setSelectedReqId(activeId);
    } else if (requisitions.length > 0) {
      setSelectedReqId('all');
    }
  }, [id, requisitions, location.pathname]);

  const getReqIdFromPath = (pathname) => {
    const match = pathname.match(/^\/recruitment-tracker\/board\/([^/]+)/);
    return match ? match[1] : null;
  };

  const fetchRequisitions = async () => {
    try {
      const res = await api.get('/api/job-requisitions');
      setRequisitions(res.data || []);
    } catch (e) {
      console.error("Failed to fetch requisitions list");
    }
  };

  const handleReqChange = (reqId) => {
    setSelectedReqId(reqId);
    navigate(`/recruitment-tracker/board/${reqId}`);
  };

  const currentRequisition = selectedReqId === 'all'
    ? { _id: 'all', title: 'All Candidates Pipeline', code: 'ALL' }
    : requisitions.find(r => r._id === selectedReqId);

  return (
    <div className="recruitment-app full-width">
      <div className="recruitment-main w-100">
        <Outlet context={{ currentRequisition, fetchRequisitions, requisitions, handleReqChange, selectedReqId }} />
      </div>
    </div>
  );
}
