import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';

interface AdminRouteProps {
  session: any;
  children: React.ReactNode;
  requireAdminOnly?: boolean; // ম্যানেজাররা ঢুকতে পারবে নাকি শুধু অ্যাডমিন
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ 
  session, 
  children, 
  requireAdminOnly = false 
}) => {
  const userId = session?.user?.id;
  const { role, isAdmin, isManager, loading } = useAdmin(userId);

  if (loading) {
    return <div style={{ padding: '20px', color: 'white' }}>অ্যাক্সেস যাচাই করা হচ্ছে...</div>;
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  // যদি শুধু অ্যাডমিনের অনুমতি লাগে
  if (requireAdminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // যদি অ্যাডমিন বা ম্যানেজার যে কারও অনুমতি লাগে
  if (!isManager) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
