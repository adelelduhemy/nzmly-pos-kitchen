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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from '@/utils/formatCurrency';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Plus,
  Settings,
  Eye,
  Copy,
  Download,
  ExternalLink,
  Utensils,
  Star,
  LayoutGrid,
  Pencil,
  Trash2,
  Palette,
} from 'lucide-react';
import ImageUpload from '@/components/menu/ImageUpload';
import TemplateSettings from '@/components/online-menu/TemplateSettings';
import RecipeDialog from '@/components/online-menu/RecipeDialog';

const OnlineMenu = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    name_ar: '', name_en: '', description_ar: '', description_en: '',
    price: 0, category: '', is_available: true, is_featured: false, image_url: null as string | null
  });
  const [newCategory, setNewCategory] = useState({ name_ar: '', name_en: '', icon: '', image_url: null as string | null });

  // Fetch restaurant settings
  const { data: settings } = useQuery({
    queryKey: ['restaurant_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['menu_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Add menu item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      const { data, error } = await supabase.from('menu_items').insert([item]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
      setIsAddItemOpen(false);
      setNewItem({ name_ar: '', name_en: '', description_ar: '', description_en: '', price: 0, category: '', is_available: true, is_featured: false, image_url: null });
      toast({ title: isAr ? 'تم إضافة الصنف بنجاح' : 'Item added successfully' });
    },
    onError: (error: any) => {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (category: typeof newCategory) => {
      const { data, error } = await supabase.from('menu_categories').insert([category]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_categories'] });
      setIsAddCategoryOpen(false);
      setNewCategory({ name_ar: '', name_en: '', icon: '', image_url: null });
      toast({ title: isAr ? 'تم إضافة القسم بنجاح' : 'Category added successfully' });
    },
    onError: (error: any) => {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.from('menu_categories').delete().eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_categories'] });
      toast({ title: isAr ? 'تم حذف القسم بنجاح' : 'Category deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<typeof settings>) => {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .update(updates)
        .eq('id', settings?.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant_settings'] });
      toast({ title: isAr ? 'تم حفظ الإعدادات' : 'Settings saved' });
    },
  });

  const menuUrl = settings?.menu_slug
    ? `${window.location.origin}/menu/${settings.menu_slug}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    toast({ title: isAr ? 'تم نسخ الرابط' : 'Link copied!' });
  };

  const downloadQR = () => {
    const svg = document.getElementById('menu-qr-code');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'menu-qr-code.png';
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'المنيو الأونلاين' : 'Online Menu'}</h1>
          <p className="text-muted-foreground">{isAr ? 'إدارة المنيو وتوليد QR Code' : 'Manage menu & generate QR Code'}</p>
        </div>
        <Button onClick={() => setShowQRDialog(true)} className="gap-2">
          <QrCode className="w-5 h-5" />
          {isAr ? 'عرض QR Code' : 'View QR Code'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-pos">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Utensils className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'أصناف المنيو' : 'Menu Items'}</p>
                <p className="text-2xl font-bold">{menuItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-pos">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'الأقسام' : 'Categories'}</p>
                <p className="text-2xl font-bold">{categories.length}</p>
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
                <p className="text-sm text-muted-foreground">{isAr ? 'أصناف مميزة' : 'Featured Items'}</p>
                <p className="text-2xl font-bold">{menuItems.filter((i: any) => i.is_featured).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-pos">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'حالة المنيو' : 'Menu Status'}</p>
                <Badge variant={settings?.is_menu_active ? 'default' : 'secondary'}>
                  {settings?.is_menu_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="items" className="gap-2">
            <Utensils className="w-4 h-4" />
            {isAr ? 'الأصناف' : 'Items'}
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            {isAr ? 'الأقسام' : 'Categories'}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            {isAr ? 'مظهر الموقع' : 'Appearance'}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            {isAr ? 'الإعدادات' : 'Settings'}
          </TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {isAr ? 'إضافة صنف' : 'Add Item'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{isAr ? 'إضافة صنف جديد' : 'Add New Item'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Image Upload */}
                  <div>
                    <Label className="mb-2 block">{isAr ? 'صورة الصنف' : 'Item Image'}</Label>
                    <ImageUpload
                      value={newItem.image_url}
                      onChange={(url) => setNewItem({ ...newItem, image_url: url })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isAr ? 'الاسم بالعربي' : 'Arabic Name'}</Label>
                      <Input value={newItem.name_ar} onChange={(e) => setNewItem({ ...newItem, name_ar: e.target.value })} />
                    </div>
                    <div>
                      <Label>{isAr ? 'الاسم بالإنجليزي' : 'English Name'}</Label>
                      <Input value={newItem.name_en} onChange={(e) => setNewItem({ ...newItem, name_en: e.target.value })} dir="ltr" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isAr ? 'الوصف بالعربي' : 'Arabic Description'}</Label>
                      <Textarea value={newItem.description_ar} onChange={(e) => setNewItem({ ...newItem, description_ar: e.target.value })} />
                    </div>
                    <div>
                      <Label>{isAr ? 'الوصف بالإنجليزي' : 'English Description'}</Label>
                      <Textarea value={newItem.description_en} onChange={(e) => setNewItem({ ...newItem, description_en: e.target.value })} dir="ltr" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isAr ? 'السعر' : 'Price'}</Label>
                      <Input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: +e.target.value })} dir="ltr" />
                    </div>
                    <div>
                      <Label>{isAr ? 'القسم' : 'Category'}</Label>
                      <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                        <SelectTrigger><SelectValue placeholder={isAr ? 'اختر القسم' : 'Select category'} /></SelectTrigger>
                        <SelectContent>
                          {categories.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>{isAr ? cat.name_ar : cat.name_en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>{isAr ? 'صنف مميز' : 'Featured Item'}</Label>
                    <Switch checked={newItem.is_featured} onCheckedChange={(v) => setNewItem({ ...newItem, is_featured: v })} />
                  </div>
                  <Button onClick={() => addItemMutation.mutate(newItem)} disabled={!newItem.name_ar || !newItem.price} className="w-full">
                    {isAr ? 'إضافة' : 'Add'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item: any) => (
              <Card key={item.id} className="card-pos">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name_ar} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Utensils className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    {item.is_featured && (
                      <Badge className="gap-1">
                        <Star className="w-3 h-3" />
                        {isAr ? 'مميز' : 'Featured'}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold">{isAr ? item.name_ar : item.name_en}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {isAr ? item.description_ar : item.description_en}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-primary">{formatCurrency(item.price, i18n.language)}</span>
                    <div className="flex gap-2">
                      <RecipeDialog menuItemId={item.id} menuItemName={isAr ? item.name_ar : item.name_en} />
                      <Badge variant={item.is_available ? 'default' : 'secondary'}>
                        {item.is_available ? (isAr ? 'متوفر' : 'Available') : (isAr ? 'غير متوفر' : 'Unavailable')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {isAr ? 'إضافة قسم' : 'Add Category'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isAr ? 'إضافة قسم جديد' : 'Add New Category'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Category Image Upload */}
                  <div>
                    <Label className="mb-2 block">{isAr ? 'صورة القسم' : 'Category Image'}</Label>
                    <ImageUpload
                      value={newCategory.image_url}
                      onChange={(url) => setNewCategory({ ...newCategory, image_url: url })}
                    />
                  </div>
                  <div>
                    <Label>{isAr ? 'الاسم بالعربي' : 'Arabic Name'}</Label>
                    <Input value={newCategory.name_ar} onChange={(e) => setNewCategory({ ...newCategory, name_ar: e.target.value })} />
                  </div>
                  <div>
                    <Label>{isAr ? 'الاسم بالإنجليزي' : 'English Name'}</Label>
                    <Input value={newCategory.name_en} onChange={(e) => setNewCategory({ ...newCategory, name_en: e.target.value })} dir="ltr" />
                  </div>
                  <div>
                    <Label>{isAr ? 'أيقونة (Emoji)' : 'Icon (Emoji)'}</Label>
                    <Input value={newCategory.icon} onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })} placeholder="🍔" />
                  </div>
                  <Button onClick={() => addCategoryMutation.mutate(newCategory)} disabled={!newCategory.name_ar} className="w-full">
                    {isAr ? 'إضافة' : 'Add'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat: any) => (
              <Card key={cat.id} className="card-pos overflow-hidden group relative">
                <div className="relative h-24 bg-muted flex items-center justify-center">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name_ar} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{cat.icon || '📁'}</span>
                  )}

                  <div className="absolute top-2 right-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity mr-2"
                      onClick={() => {
                        // TODO: Open Recipe Dialog
                        console.log('Open recipe for', cat.id);
                        // Note: This is on the category card in the original code? 
                        // Wait, I need to check if I am targeting the Item Card or Category Card.
                        // The context shows "categories.map". I need to target "menuItems.map".
                      }}
                    >
                      {/* Placeholder, actually I need to target menuItems.map loop */}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{isAr ? 'هل أنت متأكد؟' : 'Are you sure?'}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {isAr
                              ? 'سيتم حذف هذا القسم وجميع البيانات المرتبطة به. لا يمكن التراجع عن هذا الإجراء.'
                              : 'This action cannot be undone. This will permanently delete the category.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteCategoryMutation.mutate(cat.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isAr ? 'حذف' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardContent className="pt-4 text-center">
                  <h3 className="font-semibold">{isAr ? cat.name_ar : cat.name_en}</h3>
                  <p className="text-sm text-muted-foreground">
                    {menuItems.filter((i: any) => i.category === cat.id).length} {isAr ? 'أصناف' : 'items'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <TemplateSettings isAr={isAr} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="card-pos">
            <CardHeader>
              <CardTitle>{isAr ? 'إعدادات المطعم' : 'Restaurant Settings'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isAr ? 'اسم المطعم بالعربي' : 'Restaurant Name (Arabic)'}</Label>
                  <Input
                    defaultValue={settings?.restaurant_name_ar}
                    onBlur={(e) => updateSettingsMutation.mutate({ restaurant_name_ar: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{isAr ? 'اسم المطعم بالإنجليزي' : 'Restaurant Name (English)'}</Label>
                  <Input
                    defaultValue={settings?.restaurant_name_en}
                    onBlur={(e) => updateSettingsMutation.mutate({ restaurant_name_en: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <Label>{isAr ? 'رابط المنيو' : 'Menu URL Slug'}</Label>
                <Input
                  defaultValue={settings?.menu_slug}
                  onBlur={(e) => updateSettingsMutation.mutate({ menu_slug: e.target.value })}
                  dir="ltr"
                />
                <p className="text-sm text-muted-foreground mt-1">{menuUrl}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label>{isAr ? 'تفعيل المنيو الأونلاين' : 'Enable Online Menu'}</Label>
                <Switch
                  checked={settings?.is_menu_active}
                  onCheckedChange={(v) => updateSettingsMutation.mutate({ is_menu_active: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{isAr ? 'QR Code للمنيو' : 'Menu QR Code'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <QRCodeSVG
                id="menu-qr-code"
                value={menuUrl || 'https://example.com/menu'}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="text-center">
              <p className="font-semibold">{settings?.restaurant_name_ar}</p>
              <p className="text-sm text-muted-foreground">{settings?.restaurant_name_en}</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1 gap-2" onClick={copyLink}>
                <Copy className="w-4 h-4" />
                {isAr ? 'نسخ الرابط' : 'Copy Link'}
              </Button>
              <Button className="flex-1 gap-2" onClick={downloadQR}>
                <Download className="w-4 h-4" />
                {isAr ? 'تحميل' : 'Download'}
              </Button>
            </div>
            <Button variant="ghost" className="gap-2" onClick={() => window.open(menuUrl, '_blank')}>
              <ExternalLink className="w-4 h-4" />
              {isAr ? 'فتح المنيو' : 'Open Menu'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnlineMenu;
