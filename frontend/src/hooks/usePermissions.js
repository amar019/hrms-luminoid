import { useState, useEffect, createContext, useContext } from 'react';
import api from '../utils/api';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      const response = await api.get('/api/permissions/user-permissions');
      setPermissions(response.data.permissions || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (resource, action) => {
    return permissions.some(perm => 
      perm.resource === resource && perm.action === action
    );
  };

  const hasAnyPermission = (permissionList) => {
    return permissionList.some(({ resource, action }) => 
      hasPermission(resource, action)
    );
  };

  const checkPermission = async (resource, action) => {
    try {
      const response = await api.get(`/api/permissions/check?resource=${resource}&action=${action}`);
      return response.data.hasPermission;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  };

  return (
    <PermissionContext.Provider value={{
      permissions,
      loading,
      hasPermission,
      hasAnyPermission,
      checkPermission,
      refreshPermissions: fetchUserPermissions
    }}>
      {children}
    </PermissionContext.Provider>
  );
};