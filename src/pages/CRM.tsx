import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  Users,
  Plus,
  Search,
  Star,
  Gift,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Award,
  ShoppingBag,
  Ticket,
  Send,
  Loader2,
} from 'lucide-react';

const emptyCustomer = { name: '', phone: '', email: '', address: '', notes: '' };

const CRM = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState({ ...emptyCustomer });
  const [newCoupon, setNewCoupon] = useState({
    code: '', name_ar: '', name_en: '', discount_type: 'percentage',
    discount_value: 0, min_order_value: 0, max_uses: null as number | null,
    start_date: '', end_date: ''
  });
  const [campaignForm, setCampaignForm] = useState({ name: '', message: '', target: 'all' });
  const [savingCampaign, setSavingCampaign] = useState(false);

  // ─── Queries ──────────────────────────────────────────
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Real-time customer order stats
  const { data: customerStats = {} } = useQuery({
    queryKey: ['customer_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('customer_id, total')
        .not('customer_id', 'is', null)
        .not('status', 'eq', 'cancelled');
      if (error) throw error;

      const stats: Record<string, { orders: number; spent: number }> = {};
      data?.forEach((order: any) => {
        if (!order.customer_id) return;
        if (!stats[order.customer_id]) stats[order.customer_id] = { orders: 0, spent: 0 };
        stats[order.customer_id].orders += 1;
        stats[order.customer_id].spent += Number(order.total) || 0;
      });
      return stats;
    },
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['sms_campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Customer orders (for detail dialog)
  const { data: customerOrders = [] } = useQuery({
    queryKey: ['customer_orders', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', selectedCustomer.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCustomer?.id,
  });

  // ─── Customer Mutations ───────────────────────────────
  const addCustomerMutation = useMutation({
    mutationFn: async (customer: typeof emptyCustomer) => {
      const { data, error } = await supabase.from('customers').insert([customer]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      closeCustomerDialog();
      toast({ title: isAr ? 'تم إضافة العميل بنجاح' : 'Customer added successfully' });
    },
    onError: (error: any) => {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, customer }: { id: string; customer: typeof emptyCustomer }) => {
      const { error } = await supabase.from('customers').update(customer).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      closeCustomerDialog();
      toast({ title: isAr ? 'تم تحديث العميل' : 'Customer updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: isAr ? 'تم حذف العميل' : 'Customer deleted' });
    },
  });

  // ─── Coupon Mutations ─────────────────────────────────
  const addCouponMutation = useMutation({
    mutationFn: async (coupon: typeof newCoupon) => {
      const { data, error } = await supabase.from('coupons').insert([{
        ...coupon,
        max_uses: coupon.max_uses || null,
        start_date: coupon.start_date || null,
        end_date: coupon.end_date || null,
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsAddCouponOpen(false);
      setNewCoupon({ code: '', name_ar: '', name_en: '', discount_type: 'percentage', discount_value: 0, min_order_value: 0, max_uses: null, start_date: '', end_date: '' });
      toast({ title: isAr ? 'تم إضافة الكوبون بنجاح' : 'Coupon added successfully' });
    },
    onError: (error: any) => {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({ title: isAr ? 'تم حذف الكوبون' : 'Coupon deleted' });
    },
  });

  const toggleCouponMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('coupons').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({ title: isAr ? 'تم تحديث الكوبون' : 'Coupon updated' });
    },
  });

  // ─── Helpers ──────────────────────────────────────────
  const closeCustomerDialog = () => {
    setIsCustomerDialogOpen(false);
    setEditingCustomerId(null);
    setCustomerForm({ ...emptyCustomer });
  };

  const openEditCustomer = (customer: any) => {
    setEditingCustomerId(customer.id);
    setCustomerForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setIsCustomerDialogOpen(true);
  };

  const handleSaveCustomer = () => {
    if (editingCustomerId) {
      updateCustomerMutation.mutate({ id: editingCustomerId, customer: customerForm });
    } else {
      addCustomerMutation.mutate(customerForm);
    }
  };

  const getCustomerStats = (customerId: string) => {
    const stats = (customerStats as any)[customerId];
    return { orders: stats?.orders || 0, spent: stats?.spent || 0 };
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.message) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: isAr ? 'أدخل اسم الحملة والرسالة' : 'Enter campaign name and message', variant: 'destructive' });
      return;
    }
    setSavingCampaign(true);
    try {
      const { error } = await supabase.from('sms_campaigns').insert({
        name: campaignForm.name,
        message: campaignForm.message,
        target_audience: campaignForm.target,
        status: 'draft',
        total_recipients: customers.length,
      });
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['sms_campaigns'] });
      setIsCampaignDialogOpen(false);
      setCampaignForm({ name: '', message: '', target: 'all' });
      toast({ title: isAr ? 'تم إنشاء الحملة' : 'Campaign created' });
    } catch (error: any) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingCampaign(false);
    }
  };

  const filteredCustomers = customers.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const totalCustomers = customers.length;
  const totalLoyaltyPoints = customers.reduce((sum: number, c: any) => sum + (c.loyalty_points || 0), 0);
  const activeCoupons = coupons.filter((c: any) => c.is_active).length;

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{isAr ? 'إدارة العملاء' : 'Customer Management'}</h1>
        <p className="text-muted-foreground">{isAr ? 'نقاط الولاء والكوبونات والحملات' : 'Loyalty points, coupons & campaigns'}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-pos">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'إجمالي العملاء' : 'Total Customers'}</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-pos">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'نقاط الولاء' : 'Loyalty Points'}</p>
                <p className="text-2xl font-bold">{totalLoyaltyPoints.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-pos">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Ticket className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'كوبونات نشطة' : 'Active Coupons'}</p>
                <p className="text-2xl font-bold">{activeCoupons}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-pos">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'الحملات' : 'Campaigns'}</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customers" className="gap-2">
            <Users className="w-4 h-4" /> {isAr ? 'العملاء' : 'Customers'}
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-2">
            <Gift className="w-4 h-4" /> {isAr ? 'الكوبونات' : 'Coupons'}
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <Send className="w-4 h-4" /> {isAr ? 'الحملات' : 'Campaigns'}
          </TabsTrigger>
        </TabsList>

        {/* ─── Customers Tab ─────────────────────────────── */}
        <TabsContent value="customers" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? 'بحث بالاسم أو الهاتف...' : 'Search by name or phone...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10"
              />
            </div>
            <Dialog open={isCustomerDialogOpen} onOpenChange={(open) => { if (!open) closeCustomerDialog(); else setIsCustomerDialogOpen(true); }}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => { setEditingCustomerId(null); setCustomerForm({ ...emptyCustomer }); }}>
                  <Plus className="w-4 h-4" /> {isAr ? 'إضافة عميل' : 'Add Customer'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCustomerId ? (isAr ? 'تعديل العميل' : 'Edit Customer') : (isAr ? 'إضافة عميل جديد' : 'Add New Customer')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{isAr ? 'الاسم' : 'Name'}</Label>
                    <Input value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>{isAr ? 'رقم الهاتف' : 'Phone'}</Label>
                    <Input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} dir="ltr" />
                  </div>
                  <div>
                    <Label>{isAr ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <Input type="email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} dir="ltr" />
                  </div>
                  <div>
                    <Label>{isAr ? 'العنوان' : 'Address'}</Label>
                    <Input value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} />
                  </div>
                  <div>
                    <Label>{isAr ? 'ملاحظات' : 'Notes'}</Label>
                    <Textarea value={customerForm.notes} onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })} />
                  </div>
                  <Button onClick={handleSaveCustomer} disabled={!customerForm.name || !customerForm.phone} className="w-full">
                    {editingCustomerId ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إضافة' : 'Add')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Customers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer: any) => {
              const stats = getCustomerStats(customer.id);
              return (
                <Card key={customer.id} className="card-pos hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{customer.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{customer.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {customer.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditCustomer(customer); }}>
                          <Edit className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteCustomerMutation.mutate(customer.id); }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <Award className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                        <p className="text-xs text-muted-foreground">{isAr ? 'نقاط' : 'Points'}</p>
                        <p className="font-bold">{customer.loyalty_points || 0}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <ShoppingBag className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        <p className="text-xs text-muted-foreground">{isAr ? 'طلبات' : 'Orders'}</p>
                        <p className="font-bold">{stats.orders}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <span className="text-green-500 text-sm">ر.س</span>
                        <p className="text-xs text-muted-foreground">{isAr ? 'إنفاق' : 'Spent'}</p>
                        <p className="font-bold">{stats.spent}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── Coupons Tab ────────────────────────────────── */}
        <TabsContent value="coupons" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddCouponOpen} onOpenChange={setIsAddCouponOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> {isAr ? 'إضافة كوبون' : 'Add Coupon'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{isAr ? 'إضافة كوبون جديد' : 'Add New Coupon'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isAr ? 'الكود' : 'Code'}</Label>
                      <Input value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} dir="ltr" />
                    </div>
                    <div>
                      <Label>{isAr ? 'نوع الخصم' : 'Discount Type'}</Label>
                      <Select value={newCoupon.discount_type} onValueChange={(v) => setNewCoupon({ ...newCoupon, discount_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">{isAr ? 'نسبة مئوية' : 'Percentage'}</SelectItem>
                          <SelectItem value="fixed">{isAr ? 'مبلغ ثابت' : 'Fixed Amount'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isAr ? 'الاسم بالعربي' : 'Arabic Name'}</Label>
                      <Input value={newCoupon.name_ar} onChange={(e) => setNewCoupon({ ...newCoupon, name_ar: e.target.value })} />
                    </div>
                    <div>
                      <Label>{isAr ? 'الاسم بالإنجليزي' : 'English Name'}</Label>
                      <Input value={newCoupon.name_en} onChange={(e) => setNewCoupon({ ...newCoupon, name_en: e.target.value })} dir="ltr" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isAr ? 'قيمة الخصم' : 'Discount Value'}</Label>
                      <Input type="number" value={newCoupon.discount_value} onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: +e.target.value })} dir="ltr" />
                    </div>
                    <div>
                      <Label>{isAr ? 'الحد الأدنى للطلب' : 'Min Order Value'}</Label>
                      <Input type="number" value={newCoupon.min_order_value} onChange={(e) => setNewCoupon({ ...newCoupon, min_order_value: +e.target.value })} dir="ltr" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isAr ? 'تاريخ البداية' : 'Start Date'}</Label>
                      <Input type="date" value={newCoupon.start_date} onChange={(e) => setNewCoupon({ ...newCoupon, start_date: e.target.value })} dir="ltr" />
                    </div>
                    <div>
                      <Label>{isAr ? 'تاريخ الانتهاء' : 'End Date'}</Label>
                      <Input type="date" value={newCoupon.end_date} onChange={(e) => setNewCoupon({ ...newCoupon, end_date: e.target.value })} dir="ltr" />
                    </div>
                  </div>
                  <Button onClick={() => addCouponMutation.mutate(newCoupon)} disabled={!newCoupon.code || !newCoupon.name_ar} className="w-full">
                    {isAr ? 'إضافة' : 'Add'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Coupons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon: any) => (
              <Card key={coupon.id} className={`card-pos ${!coupon.is_active ? 'opacity-50' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                        {coupon.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}
                      </Badge>
                      <h3 className="font-bold text-lg mt-2">{coupon.code}</h3>
                      <p className="text-sm text-muted-foreground">{isAr ? coupon.name_ar : coupon.name_en}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-2xl font-bold text-primary">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : formatCurrency(coupon.discount_value, i18n.language)}
                      </p>
                      <p className="text-xs text-muted-foreground">{isAr ? 'خصم' : 'Discount'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-3">
                    <span>{isAr ? 'الاستخدام' : 'Usage'}: {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</span>
                    {coupon.end_date && <span>{isAr ? 'ينتهي' : 'Expires'}: {new Date(coupon.end_date).toLocaleDateString()}</span>}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={coupon.is_active}
                        onCheckedChange={(checked) => toggleCouponMutation.mutate({ id: coupon.id, is_active: checked })}
                      />
                      <span className="text-xs text-muted-foreground">{coupon.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Disabled')}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteCouponMutation.mutate(coupon.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── Campaigns Tab ──────────────────────────────── */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> {isAr ? 'حملة جديدة' : 'New Campaign'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isAr ? 'إنشاء حملة' : 'Create Campaign'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{isAr ? 'اسم الحملة' : 'Campaign Name'}</Label>
                    <Input value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>{isAr ? 'الجمهور المستهدف' : 'Target Audience'}</Label>
                    <Select value={campaignForm.target} onValueChange={(v) => setCampaignForm({ ...campaignForm, target: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isAr ? 'جميع العملاء' : 'All Customers'} ({customers.length})</SelectItem>
                        <SelectItem value="loyal">{isAr ? 'العملاء المخلصين' : 'Loyal Customers'}</SelectItem>
                        <SelectItem value="new">{isAr ? 'العملاء الجدد' : 'New Customers'}</SelectItem>
                        <SelectItem value="inactive">{isAr ? 'العملاء غير النشطين' : 'Inactive Customers'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isAr ? 'نص الرسالة' : 'Message'}</Label>
                    <Textarea
                      value={campaignForm.message}
                      onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                      placeholder={isAr ? 'مثال: مرحباً! استمتع بخصم 20% على طلبك القادم...' : 'Example: Hi! Enjoy 20% off your next order...'}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{campaignForm.message.length} / 160 {isAr ? 'حرف' : 'characters'}</p>
                  </div>
                  <Button onClick={handleCreateCampaign} disabled={savingCampaign || !campaignForm.name || !campaignForm.message} className="w-full">
                    {savingCampaign && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
                    {isAr ? 'إنشاء الحملة (مسودة)' : 'Create Campaign (Draft)'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {campaigns.length === 0 ? (
            <Card className="card-pos">
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">{isAr ? 'لا توجد حملات' : 'No Campaigns Yet'}</h3>
                <p className="text-muted-foreground">
                  {isAr ? 'أنشئ حملتك الأولى للتواصل مع العملاء' : 'Create your first campaign to reach your customers'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((campaign: any) => (
                <Card key={campaign.id} className="card-pos">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{campaign.message}</p>
                      </div>
                      <Badge variant={campaign.status === 'sent' ? 'default' : campaign.status === 'draft' ? 'secondary' : 'outline'}>
                        {campaign.status === 'draft' ? (isAr ? 'مسودة' : 'Draft') : campaign.status === 'sent' ? (isAr ? 'مرسل' : 'Sent') : campaign.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3 pt-3 border-t">
                      <span>{isAr ? 'المستلمون' : 'Recipients'}: {campaign.total_recipients || 0}</span>
                      <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Customer Details Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isAr ? 'تفاصيل العميل' : 'Customer Details'}</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (() => {
            const stats = getCustomerStats(selectedCustomer.id);
            return (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{selectedCustomer.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                      {selectedCustomer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selectedCustomer.phone}</span>}
                      {selectedCustomer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{selectedCustomer.email}</span>}
                      {selectedCustomer.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedCustomer.address}</span>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card className="card-pos">
                    <CardContent className="pt-4 text-center">
                      <Award className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                      <p className="text-2xl font-bold">{selectedCustomer.loyalty_points || 0}</p>
                      <p className="text-sm text-muted-foreground">{isAr ? 'نقاط الولاء' : 'Loyalty Points'}</p>
                    </CardContent>
                  </Card>
                  <Card className="card-pos">
                    <CardContent className="pt-4 text-center">
                      <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">{stats.orders}</p>
                      <p className="text-sm text-muted-foreground">{isAr ? 'عدد الطلبات' : 'Total Orders'}</p>
                    </CardContent>
                  </Card>
                  <Card className="card-pos">
                    <CardContent className="pt-4 text-center">
                      <span className="text-green-500 text-lg">ر.س</span>
                      <p className="text-2xl font-bold">{stats.spent}</p>
                      <p className="text-sm text-muted-foreground">{isAr ? 'إجمالي الإنفاق' : 'Total Spent'}</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">{isAr ? 'آخر الطلبات' : 'Recent Orders'}</h3>
                  {customerOrders.length > 0 ? (
                    <div className="space-y-2">
                      {customerOrders.slice(0, 5).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">#{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-end">
                            <p className="font-bold">{formatCurrency(order.total, i18n.language)}</p>
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">{isAr ? 'لا توجد طلبات' : 'No orders yet'}</p>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRM;
