
interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: AppRole[];
    requiredPermission?: string; // New: Support checking specific permission resource
}

const ProtectedRoute = ({ children, allowedRoles, requiredPermission }: ProtectedRouteProps) => {
    const { isAuthenticated, loading, hasRole, hasPermission } = useAuthContext();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    // 1. Check Roles (Legacy/Simple check)
    if (allowedRoles && !allowedRoles.some(role => hasRole(role))) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 2. Check Dynamic Permission (New System)
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};
