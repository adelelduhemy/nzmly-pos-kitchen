import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Shield, Info } from 'lucide-react';
import { AppRole } from '@/hooks/useAuth';

interface RolePermission {
    id: string;
    role: AppRole;
    resource: string;
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
}

const RESOURCES = [
    'pos', 'orders', 'kds', 'menu', 'tables',
    'inventory', 'reports', 'settings', 'users', 'finance',
    'crm', 'suppliers'
];

// All roles including owner for display (owner is always implied to have full access)
const DISPLAY_ROLES: AppRole[] = ['manager', 'cashier', 'kitchen', 'inventory'];

const PermissionsTable = () => {
    const { t, i18n } = useTranslation();
    const { isOwner, isManager } = useAuthContext();
    const isRTL = i18n.language === 'ar';
    const [permissions, setPermissions] = useState<RolePermission[]>([]);
    const [loading, setLoading] = useState(true);

    // Determine which roles this user can manage permissions for
    const canManageRolePermission = (role: AppRole): boolean => {
        if (isOwner()) return true; // Owners can manage all
        if (isManager()) {
            // Managers can only manage cashier, kitchen, inventory
            return ['cashier', 'kitchen', 'inventory'].includes(role);
        }
        return false;
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            const { data, error } = await supabase
                .from('role_permissions')
                .select('*')
                .order('resource');

            if (error) throw error;
            setPermissions(data as RolePermission[]);
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.error('Failed to load permissions');
        } finally {
            setLoading(false);
        }
    };

    const updatePermission = async (
        role: AppRole,
        resource: string,
        field: 'can_view',
        value: boolean
    ) => {
        // Check if user can manage this role's permissions
        if (!canManageRolePermission(role)) {
            toast.error(isRTL ? 'لا يمكنك تعديل صلاحيات هذا الدور' : 'Cannot modify permissions for this role');
            return;
        }

        try {
            // Find existing permission record
            const existing = permissions.find(
                p => p.role === role && p.resource === resource
            );

            if (existing) {
                // Update
                const { error } = await supabase
                    .from('role_permissions')
                    .update({ [field]: value })
                    .eq('id', existing.id);

                if (error) throw error;
            } else {
                // Create new record if missing
                const { error } = await supabase
                    .from('role_permissions')
                    .insert({
                        role,
                        resource,
                        [field]: value,
                        can_edit: false,
                        can_delete: false
                    });

                if (error) throw error;
            }

            // Optimistic update locally
            setPermissions(prev => {
                const idx = prev.findIndex(p => p.role === role && p.resource === resource);
                if (idx >= 0) {
                    const updated = [...prev];
                    updated[idx] = { ...updated[idx], [field]: value };
                    return updated;
                }
                return prev;
            });

            toast.success(isRTL ? 'تم تحديث الصلاحية' : 'Permission updated');
            fetchPermissions();
        } catch (error) {
            console.error('Error updating permission:', error);
            toast.error(isRTL ? 'فشل تحديث الصلاحية' : 'Failed to update permission');
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    const currentUserIsOwner = isOwner();
    const currentUserIsManager = isManager();

    return (
        <div className="space-y-4">
            {/* Info Banner */}
            {currentUserIsOwner && (
                <Alert className="bg-purple-50 border-purple-200">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800">
                        {isRTL 
                            ? 'بصفتك المالك، يمكنك تعديل صلاحيات جميع الأدوار' 
                            : 'As an Owner, you can modify permissions for all roles'}
                    </AlertDescription>
                </Alert>
            )}
            {currentUserIsManager && (
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        {isRTL 
                            ? 'يمكنك تعديل صلاحيات الكاشير والمطبخ والمخزون فقط. لا يمكنك تعديل صلاحيات المالك أو المدير.' 
                            : 'You can only modify permissions for Cashier, Kitchen, and Inventory roles. You cannot modify Owner or Manager permissions.'}
                    </AlertDescription>
                </Alert>
            )}
            {!currentUserIsOwner && !currentUserIsManager && (
                <Alert className="bg-amber-50 border-amber-200">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                        {isRTL 
                            ? 'لا يمكنك تعديل الصلاحيات. اتصل بالمالك أو المدير.' 
                            : 'You cannot modify permissions. Contact an Owner or Manager.'}
                    </AlertDescription>
                </Alert>
            )}

            <div className="bg-white rounded-lg shadow border">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">
                        {isRTL ? 'مصفوفة التحكم في الوصول' : 'Access Control Matrix'}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {isRTL ? 'تكوين ما يمكن لكل دور الوصول إليه' : 'Configure what each role can access'}
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">
                                    {isRTL ? 'المورد / الصفحة' : 'Resource / Page'}
                                </TableHead>
                                {DISPLAY_ROLES.map(role => (
                                    <TableHead key={role} className="text-center capitalize">
                                        {isRTL ? 
                                            role === 'manager' ? 'مدير' :
                                            role === 'cashier' ? 'كاشير' :
                                            role === 'kitchen' ? 'مطبخ' :
                                            role === 'inventory' ? 'مخزون' : role
                                            : role}
                                        {canManageRolePermission(role) && (
                                            <span className="ml-1 text-green-500">✓</span>
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {RESOURCES.map(resource => (
                                <TableRow key={resource}>
                                    <TableCell className="font-medium capitalize">
                                        {resource}
                                    </TableCell>
                                    {DISPLAY_ROLES.map(role => {
                                        const perm = permissions.find(p => p.role === role && p.resource === resource);
                                        const isChecked = perm?.can_view || false;
                                        const canEdit = canManageRolePermission(role);

                                        return (
                                            <TableCell key={`${resource}-${role}`} className="text-center">
                                                <Checkbox
                                                    checked={isChecked}
                                                    disabled={!canEdit}
                                                    onCheckedChange={(checked) =>
                                                        updatePermission(role, resource, 'can_view', checked as boolean)
                                                    }
                                                />
                                                {!canEdit && (
                                                    <span className="sr-only">
                                                        {isRTL ? 'غير مسموح' : 'Not allowed'}
                                                    </span>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default PermissionsTable;
