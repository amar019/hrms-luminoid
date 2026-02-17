import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

const PermissionGuard = ({ 
  resource, 
  action, 
  permissions = [], 
  requireAll = false,
  fallback = null,
  children 
}) => {
  const { hasPermission, hasAnyPermission, loading } = usePermissions();

  if (loading) {
    return fallback;
  }

  let hasAccess = false;

  if (resource && action) {
    hasAccess = hasPermission(resource, action);
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = permissions.every(({ resource, action }) => 
        hasPermission(resource, action)
      );
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  }

  return hasAccess ? children : fallback;
};

export default PermissionGuard;