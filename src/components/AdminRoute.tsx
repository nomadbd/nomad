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
  const { isAdmin, isManager, loading } = useAdmin(userId);

  // ১. লোডিং স্টেট
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#0f172a', 
        color: '#38bdf8' 
      }}>
        ⏳ অ্যাক্সেস যাচাই করা হচ্ছে...
      </div>
    );
  }

  // ২. ইউজার লগইন না থাকলে
  if (!session) {
    return <Navigate to="/" replace />;
  }

  // ৩. যদি পেজটি "শুধু অ্যাডমিনের জন্য" হয় কিন্তু ইউজার অ্যাডমিন না হয়
  if (requireAdminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // ৪. যদি ইউজার অ্যাডমিন বা ম্যানেজার কোনটিই না হয় (অর্থাৎ সাধারণ ইউজার)
  if (!isAdmin && !isManager) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
