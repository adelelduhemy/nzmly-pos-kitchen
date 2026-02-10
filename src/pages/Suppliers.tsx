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
import { useAuthContext } from '@/contexts/AuthContext';
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
  Loader2,
  Send,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────
interface POLineItem {
  inventory_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const emptySupplier = { name: '', phone: '', email: '', address: '', contact_person: '', payment_terms: '', notes: '' };

// ─── Component ────────────────────────────────────────────
const Suppliers = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { toast } = useToast();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isAddPOOpen, setIsAddPOOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [supplierForm, setSupplierForm] = useState({ ...emptySupplier });

  // PO creation state
  const [poForm, setPoForm] = useState({
    supplier_id: '',
    expected_date: '',
    notes: '',
  });
  const [poItems, setPoItems] = useState<POLineItem[]>([]);
  const [savingPO, setSavingPO] = useState(false);

  // ─── Queries ──────────────────────────────────────────
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

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name_en, name_ar, unit, cost_per_unit')
        .eq('is_active', true)
        .order('name_en');
      if (error) throw error;
      return data;
    },
  });

  // ─── Supplier Mutations ───────────────────────────────
  const addSupplierMutation = useMutation({
    mutationFn: async (supplier: typeof emptySupplier) => {
      const { data, error } = await supabase.from('suppliers').insert([supplier]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      closeSupplierDialog();
      toast({ title: isAr ? 'تم إضافة المورد بنجاح' : 'Supplier added successfully' });
    },
    onError: (error: any) => {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, supplier }: { id: string; supplier: typeof emptySupplier }) => {
      const { error } = await supabase.from('suppliers').update(supplier).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      closeSupplierDialog();
      toast({ title: isAr ? 'تم تحديث المورد' : 'Supplier updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

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

  // ─── PO Status Mutation ───────────────────────────────
  const updatePOStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'received') updates.received_at = new Date().toISOString();
      const { error } = await supabase.from('purchase_orders').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      toast({ title: isAr ? 'تم تحديث الحالة' : 'Status updated' });
    },
    onError: (error: any) => {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // ─── Helpers ──────────────────────────────────────────
  const closeSupplierDialog = () => {
    setIsSupplierDialogOpen(false);
    setEditingId(null);
    setSupplierForm({ ...emptySupplier });
  };

  const openEditSupplier = (supplier: any) => {
    setEditingId(supplier.id);
    setSupplierForm({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      contact_person: supplier.contact_person || '',
      payment_terms: supplier.payment_terms || '',
      notes: supplier.notes || '',
    });
    setIsSupplierDialogOpen(true);
  };

  const handleSaveSupplier = () => {
    if (editingId) {
      updateSupplierMutation.mutate({ id: editingId, supplier: supplierForm });
    } else {
      addSupplierMutation.mutate(supplierForm);
    }
  };

  const filteredSuppliers = suppliers.filter((s: any) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm)
  );

  // ─── PO Helpers ───────────────────────────────────────
  const addPOItem = () => {
    setPoItems([...poItems, { inventory_item_id: '', name: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const updatePOItem = (index: number, field: keyof POLineItem, value: any) => {
    const updated = [...poItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'inventory_item_id') {
      const item = inventoryItems.find((i: any) => i.id === value);
      if (item) {
        updated[index].name = isAr ? item.name_ar : item.name_en;
        updated[index].unit_price = Number(item.cost_per_unit) || 0;
        updated[index].total_price = updated[index].quantity * updated[index].unit_price;
      }
    }
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total_price = Number(updated[index].quantity) * Number(updated[index].unit_price);
    }
    setPoItems(updated);
  };

  const removePOItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const poSubtotal = poItems.reduce((sum, item) => sum + item.total_price, 0);
  const poVat = poSubtotal * 0.15;
  const poTotal = poSubtotal + poVat;

  const handleCreatePO = async () => {
    if (!poForm.supplier_id || poItems.length === 0) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: isAr ? 'اختر مورد وأضف عناصر' : 'Select a supplier and add items', variant: 'destructive' });
      return;
    }

    // Validate all items have an inventory item selected
    if (poItems.some(item => !item.inventory_item_id)) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: isAr ? 'اختر صنف لكل عنصر' : 'Select an item for each line', variant: 'destructive' });
      return;
    }

    setSavingPO(true);
    try {
      // Generate order number
      const dateStr = new Date().toLocaleDateString('en-CA').replace(/-/g, '');
      const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      const orderNumber = `PO-${dateStr}-${rand}`;

      // Insert PO
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          order_number: orderNumber,
          supplier_id: poForm.supplier_id,
          status: 'draft',
          subtotal: poSubtotal,
          vat: poVat,
          total: poTotal,
          notes: poForm.notes || null,
          expected_date: poForm.expected_date || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (poError) throw poError;

      // Insert PO items
      const itemsPayload = poItems.map(item => ({
        purchase_order_id: po.id,
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsPayload);
      if (itemsError) throw itemsError;

      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      setIsAddPOOpen(false);
      setPoForm({ supplier_id: '', expected_date: '', notes: '' });
      setPoItems([]);

      toast({ title: isAr ? 'تم إنشاء طلب الشراء' : 'Purchase order created', description: `#${orderNumber}` });
    } catch (error: any) {
      console.error('Error creating PO:', error);
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingPO(false);
    }
  };

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

  const getNextStatusActions = (status: string, orderId: string) => {
    const actions: React.ReactNode[] = [];
    if (status === 'draft') {
      actions.push(
        <Button key="send" size="sm" variant="outline" className="gap-1" onClick={() => updatePOStatusMutation.mutate({ id: orderId, status: 'sent' })}>
          <Send className="w-3 h-3" /> {isAr ? 'إرسال' : 'Send'}
        </Button>
      );
    }
    if (status === 'sent') {
      actions.push(
        <Button key="receive" size="sm" variant="outline" className="gap-1 text-green-600 border-green-300 hover:bg-green-50" onClick={() => updatePOStatusMutation.mutate({ id: orderId, status: 'received' })}>
          <CheckCircle className="w-3 h-3" /> {isAr ? 'استلام' : 'Receive'}
        </Button>
      );
    }
    if (status !== 'cancelled' && status !== 'received') {
      actions.push(
        <Button key="cancel" size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => updatePOStatusMutation.mutate({ id: orderId, status: 'cancelled' })}>
          <XCircle className="w-3 h-3" /> {isAr ? 'إلغاء' : 'Cancel'}
        </Button>
      );
    }
    return actions;
  };

  // ─── Render ───────────────────────────────────────────
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

        {/* ─── Suppliers Tab ─────────────────────────────── */}
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
            <Dialog open={isSupplierDialogOpen} onOpenChange={(open) => { if (!open) closeSupplierDialog(); else setIsSupplierDialogOpen(true); }}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => { setEditingId(null); setSupplierForm({ ...emptySupplier }); }}>
                  <Plus className="w-4 h-4" />
                  {isAr ? 'إضافة مورد' : 'Add Supplier'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingId ? (isAr ? 'تعديل المورد' : 'Edit Supplier') : (isAr ? 'إضافة مورد جديد' : 'Add New Supplier')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isAr ? 'اسم المورد' : 'Supplier Name'}</Label>
                      <Input value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>{isAr ? 'جهة الاتصال' : 'Contact Person'}</Label>
                      <Input value={supplierForm.contact_person} onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isAr ? 'رقم الهاتف' : 'Phone'}</Label>
                      <Input value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} dir="ltr" />
                    </div>
                    <div>
                      <Label>{isAr ? 'البريد الإلكتروني' : 'Email'}</Label>
                      <Input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} dir="ltr" />
                    </div>
                  </div>
                  <div>
                    <Label>{isAr ? 'العنوان' : 'Address'}</Label>
                    <Input value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
                  </div>
                  <div>
                    <Label>{isAr ? 'شروط الدفع' : 'Payment Terms'}</Label>
                    <Input value={supplierForm.payment_terms} onChange={(e) => setSupplierForm({ ...supplierForm, payment_terms: e.target.value })} />
                  </div>
                  <div>
                    <Label>{isAr ? 'ملاحظات' : 'Notes'}</Label>
                    <Textarea value={supplierForm.notes} onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })} />
                  </div>
                  <Button onClick={handleSaveSupplier} disabled={!supplierForm.name} className="w-full">
                    {editingId ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إضافة' : 'Add')}
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
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditSupplier(supplier)}>
                        <Edit className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteSupplierMutation.mutate(supplier.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
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

        {/* ─── Purchase Orders Tab ────────────────────────── */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddPOOpen} onOpenChange={setIsAddPOOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => { setPoForm({ supplier_id: '', expected_date: '', notes: '' }); setPoItems([]); }}>
                  <Plus className="w-4 h-4" />
                  {isAr ? 'طلب شراء جديد' : 'New Purchase Order'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isAr ? 'إنشاء طلب شراء' : 'Create Purchase Order'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Supplier + Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isAr ? 'المورد' : 'Supplier'}</Label>
                      <Select value={poForm.supplier_id} onValueChange={(v) => setPoForm({ ...poForm, supplier_id: v })}>
                        <SelectTrigger><SelectValue placeholder={isAr ? 'اختر المورد' : 'Select supplier'} /></SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{isAr ? 'تاريخ التسليم المتوقع' : 'Expected Date'}</Label>
                      <Input type="date" value={poForm.expected_date} onChange={(e) => setPoForm({ ...poForm, expected_date: e.target.value })} />
                    </div>
                  </div>

                  {/* Line Items */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base font-semibold">{isAr ? 'العناصر' : 'Items'}</Label>
                      <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addPOItem}>
                        <Plus className="w-3 h-3" /> {isAr ? 'إضافة صنف' : 'Add Item'}
                      </Button>
                    </div>

                    {poItems.length === 0 ? (
                      <div className="border rounded-lg p-6 text-center text-muted-foreground">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>{isAr ? 'أضف أصناف لطلب الشراء' : 'Add items to the purchase order'}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {poItems.map((item, idx) => (
                          <div key={idx} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{isAr ? `صنف ${idx + 1}` : `Item ${idx + 1}`}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePOItem(idx)}>
                                <X className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                            <Select value={item.inventory_item_id} onValueChange={(v) => updatePOItem(idx, 'inventory_item_id', v)}>
                              <SelectTrigger><SelectValue placeholder={isAr ? 'اختر الصنف' : 'Select item'} /></SelectTrigger>
                              <SelectContent>
                                {inventoryItems.map((inv: any) => (
                                  <SelectItem key={inv.id} value={inv.id}>
                                    {isAr ? inv.name_ar : inv.name_en} ({inv.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">{isAr ? 'الكمية' : 'Qty'}</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updatePOItem(idx, 'quantity', Number(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">{isAr ? 'سعر الوحدة' : 'Unit Price'}</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(e) => updatePOItem(idx, 'unit_price', Number(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">{isAr ? 'الإجمالي' : 'Total'}</Label>
                                <Input value={formatCurrency(item.total_price, i18n.language)} readOnly className="bg-muted" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  {poItems.length > 0 && (
                    <div className="border-t pt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
                        <span>{formatCurrency(poSubtotal, i18n.language)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{isAr ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}</span>
                        <span>{formatCurrency(poVat, i18n.language)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-1 border-t">
                        <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                        <span>{formatCurrency(poTotal, i18n.language)}</span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <Label>{isAr ? 'ملاحظات' : 'Notes'}</Label>
                    <Textarea value={poForm.notes} onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })} />
                  </div>

                  <Button onClick={handleCreatePO} disabled={savingPO || !poForm.supplier_id || poItems.length === 0} className="w-full">
                    {savingPO && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
                    {isAr ? 'إنشاء طلب الشراء' : 'Create Purchase Order'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {getNextStatusActions(order.status, order.id)}
                        </div>
                        <div className="text-end">
                          {getStatusBadge(order.status)}
                          <p className="text-lg font-bold mt-1">{formatCurrency(order.total, i18n.language)}</p>
                        </div>
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
