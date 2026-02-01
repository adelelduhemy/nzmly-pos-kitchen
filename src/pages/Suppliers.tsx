import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  FileText,
  Package,
  ClipboardList,
  User,
} from 'lucide-react';

const Suppliers = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddPOOpen, setIsAddPOOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ 
    name: '', phone: '', email: '', address: '', contact_person: '', payment_terms: '', notes: '' 
  });

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch purchase orders
  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchase_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Add supplier mutation
  const addSupplierMutation = useMutation({
    mutationFn: async (supplier: typeof newSupplier) => {
      const { data, error } = await supabase.from('suppliers').insert([supplier]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsAddSupplierOpen(false);
      setNewSupplier({ name: '', phone: '', email: '', address: '', contact_person: '', payment_terms: '', notes: '' });
      toast({ title: isAr ? 'تم إضافة المورد بنجاح' : 'Supplier added successfully' });
    },
    onError: (error: any) => {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: isAr ? 'تم حذف المورد' : 'Supplier deleted' });
    },
  });

  const filteredSuppliers = suppliers.filter((s: any) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: isAr ? 'مسودة' : 'Draft', variant: 'secondary' },
      sent: { label: isAr ? 'مرسل' : 'Sent', variant: 'default' },
      received: { label: isAr ? 'مستلم' : 'Received', variant: 'outline' },
      cancelled: { label: isAr ? 'ملغي' : 'Cancelled', variant: 'destructive' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'إدارة الموردين' : 'Supplier Management'}</h1>
          <p className="text-muted-foreground">{isAr ? 'الموردين وطلبات الشراء' : 'Suppliers & purchase orders'}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-pos">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'إجمالي الموردين' : 'Total Suppliers'}</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-pos">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'طلبات الشراء' : 'Purchase Orders'}</p>
                <p className="text-2xl font-bold">{purchaseOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-pos">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'طلبات معلقة' : 'Pending Orders'}</p>
                <p className="text-2xl font-bold">{purchaseOrders.filter((o: any) => o.status === 'sent').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-pos">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'طلبات مستلمة' : 'Received Orders'}</p>
                <p className="text-2xl font-bold">{purchaseOrders.filter((o: any) => o.status === 'received').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="w-4 h-4" />
            {isAr ? 'الموردين' : 'Suppliers'}
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            {isAr ? 'طلبات الشراء' : 'Purchase Orders'}
          </TabsTrigger>
        </TabsList>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
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
            <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {isAr ? 'إضافة مورد' : 'Add Supplier'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{isAr ? 'إضافة مورد جديد' : 'Add New Supplier'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isAr ? 'اسم المورد' : 'Supplier Name'}</Label>
                      <Input value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>{isAr ? 'جهة الاتصال' : 'Contact Person'}</Label>
                      <Input value={newSupplier.contact_person} onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isAr ? 'رقم الهاتف' : 'Phone'}</Label>
                      <Input value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} dir="ltr" />
                    </div>
                    <div>
                      <Label>{isAr ? 'البريد الإلكتروني' : 'Email'}</Label>
                      <Input type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} dir="ltr" />
                    </div>
                  </div>
                  <div>
                    <Label>{isAr ? 'العنوان' : 'Address'}</Label>
                    <Input value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} />
                  </div>
                  <div>
                    <Label>{isAr ? 'شروط الدفع' : 'Payment Terms'}</Label>
                    <Input value={newSupplier.payment_terms} onChange={(e) => setNewSupplier({ ...newSupplier, payment_terms: e.target.value })} />
                  </div>
                  <div>
                    <Label>{isAr ? 'ملاحظات' : 'Notes'}</Label>
                    <Textarea value={newSupplier.notes} onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })} />
                  </div>
                  <Button onClick={() => addSupplierMutation.mutate(newSupplier)} disabled={!newSupplier.name} className="w-full">
                    {isAr ? 'إضافة' : 'Add'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Suppliers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier: any) => (
              <Card key={supplier.id} className="card-pos hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Truck className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{supplier.name}</h3>
                        {supplier.contact_person && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {supplier.contact_person}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteSupplierMutation.mutate(supplier.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {supplier.phone && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {supplier.phone}
                      </p>
                    )}
                    {supplier.email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {supplier.email}
                      </p>
                    )}
                    {supplier.address && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {supplier.address}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {isAr ? 'إجمالي المشتريات' : 'Total Purchases'}
                    </span>
                    <span className="font-bold">{formatCurrency(supplier.total_purchases || 0, i18n.language)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2" disabled>
              <Plus className="w-4 h-4" />
              {isAr ? 'طلب شراء جديد' : 'New Purchase Order'}
            </Button>
          </div>

          {purchaseOrders.length === 0 ? (
            <Card className="card-pos">
              <CardContent className="py-12 text-center">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">{isAr ? 'لا توجد طلبات شراء' : 'No Purchase Orders'}</h3>
                <p className="text-muted-foreground">
                  {isAr ? 'ابدأ بإنشاء أول طلب شراء' : 'Start by creating your first purchase order'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {purchaseOrders.map((order: any) => (
                <Card key={order.id} className="card-pos">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">#{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">{order.suppliers?.name}</p>
                        </div>
                      </div>
                      <div className="text-end">
                        {getStatusBadge(order.status)}
                        <p className="text-lg font-bold mt-1">{formatCurrency(order.total, i18n.language)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Suppliers;
