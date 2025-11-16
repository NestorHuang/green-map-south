import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '../hooks/useSuperAdmin';

/**
 * Route protection component for super admin only pages
 */
const SuperAdminRoute = ({ children }) => {
  const { isSuperAdmin, loading } = useSuperAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    const isReady = !loading;
    if (isReady && !isSuperAdmin) {
      console.log('[SuperAdminRoute] Not a super admin. Redirecting to admin home.');
      navigate('/admin/pending');
    }
  }, [isSuperAdmin, loading, navigate]);

  if (loading) {
    return <div>檢查超級管理員權限中...</div>;
  }

  return isSuperAdmin ? children : null;
};

export default SuperAdminRoute;
