import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  ArrowDown, 
  ArrowUp, 
  Warehouse, 
  Plus, 
  AlertTriangle,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  UtensilsCrossed
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type WarehouseType = 'raw_materials' | 'work_in_progress' | 'finished_goods';

interface WarehouseData {
  id: string;
  name_en: string;
  name_ar: string;
  type: WarehouseType;
  description: string | null;
  is_active: boolean;
}

interface InventoryItem {
  id: string;
  warehouse_id: string;
  name_en: string;
  name_ar: string;
  sku: string | null;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  cost_per_unit: number;
  is_active: boolean;
}

const WarehouseManagement = () => {
  const { t, i18n } = useTranslation();
  const { isOwnerOrManager, canManageInventory, user } = useAuthContext();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activeWarehouse, setActiveWarehouse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Form states
  const [itemForm, setItemForm] = useState({
    name_en: '',
    name_ar: '',
    sku: '',
    unit: 'kg',
    minimum_stock: 0,
    cost_per_unit: 0,
    warehouse_id: '',
  });
  
  const [transactionForm, setTransactionForm] = useState({
    type: 'in' as 'in' | 'out',
    quantity: 0,
    notes: '',
  });

  useEffect(() => {
    fetchWarehouses();
    fetchItems();
  }, []);

  const fetchWarehouses = async () => {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      toast.error('فشل في تحميل المستودعات');
      return;
    }
    setWarehouses(data as WarehouseData[]);
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      toast.error('فشل في تحميل المواد');
      setLoading(false);
      return;
    }
    setItems(data as InventoryItem[]);
    setLoading(false);
  };

  const handleSaveItem = async () => {
    if (!itemForm.name_ar || !itemForm.warehouse_id) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (editingItem) {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          name_en: itemForm.name_en,
          name_ar: itemForm.name_ar,
          sku: itemForm.sku || null,
          unit: itemForm.unit,
          minimum_stock: itemForm.minimum_stock,
          cost_per_unit: itemForm.cost_per_unit,
          warehouse_id: itemForm.warehouse_id,
        })
        .eq('id', editingItem.id);

      if (error) {
        toast.error('فشل في تحديث المادة');
        return;
      }
      toast.success('تم تحديث المادة بنجاح');
    } else {
      const { error } = await supabase
        .from('inventory_items')
        .insert({
          name_en: itemForm.name_en,
          name_ar: itemForm.name_ar,
          sku: itemForm.sku || null,
          unit: itemForm.unit,
          minimum_stock: itemForm.minimum_stock,
          cost_per_unit: itemForm.cost_per_unit,
          warehouse_id: itemForm.warehouse_id,
          current_stock: 0,
        });

      if (error) {
        toast.error('فشل في إضافة المادة');
        return;
      }
      toast.success('تم إضافة المادة بنجاح');
    }

    setShowItemDialog(false);
    setEditingItem(null);
    resetItemForm();
    fetchItems();
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('inventory_items')
      .update({ is_active: false })
      .eq('id', itemId);

    if (error) {
      toast.error('فشل في حذف المادة');
      return;
    }
    toast.success('تم حذف المادة بنجاح');
    fetchItems();
  };

  const handleTransaction = async () => {
    if (!selectedItem || transactionForm.quantity <= 0) {
      toast.error('يرجى إدخال كمية صحيحة');
      return;
    }

    if (transactionForm.type === 'out' && transactionForm.quantity > selectedItem.current_stock) {
      toast.error('الكمية المطلوبة أكبر من المتوفر');
      return;
    }

    const { error } = await supabase
      .from('inventory_transactions')
      .insert({
        inventory_item_id: selectedItem.id,
        type: transactionForm.type,
        quantity: transactionForm.quantity,
        notes: transactionForm.notes || null,
        created_by: user?.id,
      });

    if (error) {
      toast.error('فشل في تسجيل الحركة');
      return;
    }

    toast.success(transactionForm.type === 'in' ? 'تم إضافة المخزون' : 'تم صرف المخزون');
    setShowTransactionDialog(false);
    setSelectedItem(null);
    setTransactionForm({ type: 'in', quantity: 0, notes: '' });
    fetchItems();
  };

  const resetItemForm = () => {
    setItemForm({
      name_en: '',
      name_ar: '',
      sku: '',
      unit: 'kg',
      minimum_stock: 0,
      cost_per_unit: 0,
      warehouse_id: '',
    });
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      name_en: item.name_en,
      name_ar: item.name_ar,
      sku: item.sku || '',
      unit: item.unit,
      minimum_stock: item.minimum_stock,
      cost_per_unit: item.cost_per_unit,
      warehouse_id: item.warehouse_id,
    });
    setShowItemDialog(true);
  };

  const openTransactionDialog = (item: InventoryItem, type: 'in' | 'out') => {
    setSelectedItem(item);
    setTransactionForm({ type, quantity: 0, notes: '' });
    setShowTransactionDialog(true);
  };

  const getStockStatus = (current: number, minimum: number) => {
    if (current < minimum) return 'critical';
    if (current < minimum * 1.5) return 'warning';
    return 'good';
  };

  const getStockPercentage = (current: number, minimum: number) => {
    return Math.min((current / (minimum * 2)) * 100, 100);
  };

  const getWarehouseLabel = (type: WarehouseType) => {
    const labels = {
      raw_materials: { ar: 'مواد خام', en: 'Raw Materials' },
      work_in_progress: { ar: 'قيد الإنشاء', en: 'Work in Progress' },
      finished_goods: { ar: 'تام', en: 'Finished Goods' },
    };
    return isRTL ? labels[type].ar : labels[type].en;
  };

  const filteredItems = items.filter(item => {
    const matchesWarehouse = activeWarehouse === 'all' || item.warehouse_id === activeWarehouse;
    const matchesSearch = 
      item.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesWarehouse && matchesSearch;
  });

  const lowStockCount = items.filter(item => item.current_stock < item.minimum_stock).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
        {canManageInventory() && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate('/dishes')}
            >
              <UtensilsCrossed className="w-4 h-4" />
              {t('dishes.title')}
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => {
                resetItemForm();
                setEditingItem(null);
                setShowItemDialog(true);
              }}
            >
              <Plus className="w-4 h-4" />
              إضافة مادة
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {warehouses.map((warehouse) => {
          const warehouseItems = items.filter(i => i.warehouse_id === warehouse.id);
          const lowStock = warehouseItems.filter(i => i.current_stock < i.minimum_stock).length;
          
          return (
            <Card 
              key={warehouse.id} 
              className={cn(
                "card-pos cursor-pointer transition-all hover:scale-[1.02]",
                activeWarehouse === warehouse.id && "ring-2 ring-primary"
              )}
              onClick={() => setActiveWarehouse(
                activeWarehouse === warehouse.id ? 'all' : warehouse.id
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    warehouse.type === 'raw_materials' && "bg-blue-500/10",
                    warehouse.type === 'work_in_progress' && "bg-amber-500/10",
                    warehouse.type === 'finished_goods' && "bg-green-500/10"
                  )}>
                    <Warehouse className={cn(
                      "w-6 h-6",
                      warehouse.type === 'raw_materials' && "text-blue-500",
                      warehouse.type === 'work_in_progress' && "text-amber-500",
                      warehouse.type === 'finished_goods' && "text-green-500"
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? warehouse.name_ar : warehouse.name_en}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{warehouseItems.length}</p>
                      {lowStock > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {lowStock} منخفض
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        <Card className="card-pos border-destructive/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.lowStock')}</p>
                <p className="text-2xl font-bold text-destructive">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن مادة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>
      </div>

      {/* Items Table */}
      <Card className="card-pos">
        <CardHeader>
          <CardTitle>
            {activeWarehouse === 'all' 
              ? 'جميع المواد' 
              : warehouses.find(w => w.id === activeWarehouse)?.name_ar || 'المواد'
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المادة</TableHead>
                <TableHead>المستودع</TableHead>
                <TableHead>{t('inventory.stockLevel')}</TableHead>
                <TableHead>{t('inventory.minimum')}</TableHead>
                <TableHead>{t('tables.status')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    لا توجد مواد
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const status = getStockStatus(item.current_stock, item.minimum_stock);
                  const percentage = getStockPercentage(item.current_stock, item.minimum_stock);
                  const warehouse = warehouses.find(w => w.id === item.warehouse_id);

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name_ar}</p>
                          {item.sku && (
                            <p className="text-xs text-muted-foreground">{item.sku}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {warehouse ? (isRTL ? warehouse.name_ar : warehouse.name_en) : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 w-32">
                          <Progress
                            value={percentage}
                            className={cn(
                              'h-2',
                              status === 'critical' && '[&>div]:bg-destructive',
                              status === 'warning' && '[&>div]:bg-warning',
                              status === 'good' && '[&>div]:bg-success'
                            )}
                          />
                          <p className="text-sm">
                            {item.current_stock} {item.unit}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.minimum_stock} {item.unit}
                      </TableCell>
                      <TableCell>
                        {status === 'critical' && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {t('inventory.lowStock')}
                          </Badge>
                        )}
                        {status === 'warning' && (
                          <Badge className="bg-warning text-warning-foreground">
                            تحذير
                          </Badge>
                        )}
                        {status === 'good' && (
                          <Badge className="bg-success text-success-foreground">
                            جيد
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canManageInventory() && (
                            <>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openTransactionDialog(item, 'in')}
                              >
                                <ArrowDown className="w-4 h-4 text-green-500" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openTransactionDialog(item, 'out')}
                              >
                                <ArrowUp className="w-4 h-4 text-red-500" />
                              </Button>
                            </>
                          )}
                          {isOwnerOrManager() && (
                            <>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'تعديل مادة' : 'إضافة مادة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم (عربي) *</Label>
              <Input
                value={itemForm.name_ar}
                onChange={(e) => setItemForm({ ...itemForm, name_ar: e.target.value })}
                placeholder="اسم المادة بالعربي"
              />
            </div>
            <div className="space-y-2">
              <Label>الاسم (English)</Label>
              <Input
                value={itemForm.name_en}
                onChange={(e) => setItemForm({ ...itemForm, name_en: e.target.value })}
                placeholder="Item name in English"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رمز المادة (SKU)</Label>
                <Input
                  value={itemForm.sku}
                  onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-2">
                <Label>الوحدة</Label>
                <Select 
                  value={itemForm.unit} 
                  onValueChange={(value) => setItemForm({ ...itemForm, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">كيلوجرام</SelectItem>
                    <SelectItem value="g">جرام</SelectItem>
                    <SelectItem value="l">لتر</SelectItem>
                    <SelectItem value="ml">مللتر</SelectItem>
                    <SelectItem value="pcs">قطعة</SelectItem>
                    <SelectItem value="box">صندوق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>المستودع *</Label>
              <Select 
                value={itemForm.warehouse_id} 
                onValueChange={(value) => setItemForm({ ...itemForm, warehouse_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المستودع" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {isRTL ? w.name_ar : w.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحد الأدنى</Label>
                <Input
                  type="number"
                  value={itemForm.minimum_stock}
                  onChange={(e) => setItemForm({ ...itemForm, minimum_stock: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>التكلفة/وحدة</Label>
                <Input
                  type="number"
                  value={itemForm.cost_per_unit}
                  onChange={(e) => setItemForm({ ...itemForm, cost_per_unit: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveItem}>
              {editingItem ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {transactionForm.type === 'in' ? 'إضافة مخزون' : 'صرف مخزون'}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedItem.name_ar}</p>
                <p className="text-sm text-muted-foreground">
                  المتوفر حالياً: {selectedItem.current_stock} {selectedItem.unit}
                </p>
              </div>
              <div className="space-y-2">
                <Label>الكمية *</Label>
                <Input
                  type="number"
                  value={transactionForm.quantity}
                  onChange={(e) => setTransactionForm({ 
                    ...transactionForm, 
                    quantity: Number(e.target.value) 
                  })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Input
                  value={transactionForm.notes}
                  onChange={(e) => setTransactionForm({ 
                    ...transactionForm, 
                    notes: e.target.value 
                  })}
                  placeholder="ملاحظات إضافية..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransactionDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleTransaction}
              className={transactionForm.type === 'in' ? 'bg-green-600' : 'bg-red-600'}
            >
              {transactionForm.type === 'in' ? 'إضافة' : 'صرف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default WarehouseManagement;
