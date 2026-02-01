import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Edit, 
  Trash2,
  Search,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AppRole } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface UserRoleData {
  id: string;
  user_id: string;
  role: AppRole;
  warehouse_id: string | null;
}

interface UserWithRoles extends UserProfile {
  roles: UserRoleData[];
}

const roleLabels: Record<AppRole, { ar: string; en: string; color: string }> = {
  owner: { ar: 'مالك', en: 'Owner', color: 'bg-purple-500' },
  manager: { ar: 'مدير', en: 'Manager', color: 'bg-blue-500' },
  cashier: { ar: 'كاشير', en: 'Cashier', color: 'bg-green-500' },
  kitchen: { ar: 'مطبخ', en: 'Kitchen', color: 'bg-orange-500' },
  inventory: { ar: 'مخزون', en: 'Inventory', color: 'bg-amber-500' },
};

const UserManagement = () => {
  const { t, i18n } = useTranslation();
  const { isOwnerOrManager, user } = useAuthContext();
  const isRTL = i18n.language === 'ar';

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      toast.error('فشل في تحميل المستخدمين');
      setLoading(false);
      return;
    }

    // Fetch all roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      toast.error('فشل في تحميل الصلاحيات');
      setLoading(false);
      return;
    }

    // Combine profiles with roles
    const usersWithRoles: UserWithRoles[] = (profiles as UserProfile[]).map(profile => ({
      ...profile,
      roles: (roles as UserRoleData[]).filter(r => r.user_id === profile.user_id),
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const openRoleDialog = (userProfile: UserWithRoles) => {
    setSelectedUser(userProfile);
    setSelectedRoles(userProfile.roles.map(r => r.role));
    setShowRoleDialog(true);
  };

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;

    // Can't modify your own roles
    if (selectedUser.user_id === user?.id) {
      toast.error('لا يمكنك تعديل صلاحياتك الخاصة');
      return;
    }

    // Get current roles
    const currentRoles = selectedUser.roles.map(r => r.role);
    
    // Find roles to add and remove
    const rolesToAdd = selectedRoles.filter(r => !currentRoles.includes(r));
    const rolesToRemove = currentRoles.filter(r => !selectedRoles.includes(r));

    // Remove roles
    if (rolesToRemove.length > 0) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id)
        .in('role', rolesToRemove);

      if (error) {
        toast.error('فشل في إزالة الصلاحيات');
        return;
      }
    }

    // Add roles
    if (rolesToAdd.length > 0) {
      const { error } = await supabase
        .from('user_roles')
        .insert(rolesToAdd.map(role => ({
          user_id: selectedUser.user_id,
          role,
          warehouse_id: null,
        })));

      if (error) {
        toast.error('فشل في إضافة الصلاحيات');
        return;
      }
    }

    toast.success('تم تحديث الصلاحيات بنجاح');
    setShowRoleDialog(false);
    fetchUsers();
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleCounts = () => {
    const counts: Record<AppRole, number> = {
      owner: 0,
      manager: 0,
      cashier: 0,
      kitchen: 0,
      inventory: 0,
    };
    users.forEach(u => {
      u.roles.forEach(r => {
        counts[r.role]++;
      });
    });
    return counts;
  };

  const roleCounts = getRoleCounts();

  if (!isOwnerOrManager()) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">ليس لديك صلاحية للوصول لهذه الصفحة</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {(Object.keys(roleLabels) as AppRole[]).map((role) => (
          <Card key={role} className="card-pos">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${roleLabels[role].color} rounded-lg flex items-center justify-center`}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? roleLabels[role].ar : roleLabels[role].en}
                  </p>
                  <p className="text-xl font-bold">{roleCounts[role]}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن مستخدم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="card-pos">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            المستخدمين ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الصلاحيات</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    لا يوجد مستخدمين
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((userProfile) => (
                  <TableRow key={userProfile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-foreground">
                            {userProfile.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{userProfile.name}</p>
                          {userProfile.user_id === user?.id && (
                            <Badge variant="outline" className="text-xs">أنت</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {userProfile.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userProfile.roles.length === 0 ? (
                          <Badge variant="outline">بدون صلاحيات</Badge>
                        ) : (
                          userProfile.roles.map((role) => (
                            <Badge 
                              key={role.id} 
                              className={`${roleLabels[role.role].color} text-white`}
                            >
                              {isRTL ? roleLabels[role.role].ar : roleLabels[role.role].en}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {userProfile.user_id !== user?.id && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openRoleDialog(userProfile)}
                        >
                          <Edit className="w-4 h-4 me-2" />
                          تعديل الصلاحيات
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Assignment Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل صلاحيات المستخدم</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedUser.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              
              <div className="space-y-3">
                <Label>الصلاحيات</Label>
                {(Object.keys(roleLabels) as AppRole[]).map((role) => (
                  <div 
                    key={role}
                    className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleRoleToggle(role)}
                  >
                    <Checkbox
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => handleRoleToggle(role)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {isRTL ? roleLabels[role].ar : roleLabels[role].en}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {role === 'owner' && 'صلاحيات كاملة للنظام'}
                        {role === 'manager' && 'إدارة الموظفين والمخزون والتقارير'}
                        {role === 'cashier' && 'نقطة البيع والطلبات'}
                        {role === 'kitchen' && 'شاشة المطبخ فقط'}
                        {role === 'inventory' && 'إدارة المخزون والمستودعات'}
                      </p>
                    </div>
                    <Badge className={`${roleLabels[role].color} text-white`}>
                      {isRTL ? roleLabels[role].ar : roleLabels[role].en}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveRoles}>
              حفظ الصلاحيات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default UserManagement;
