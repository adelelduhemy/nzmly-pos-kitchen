import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/utils/formatCurrency';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  created_at: string;
}

interface Shift {
  id: string;
  user_id: string;
  shift_date: string;
  started_at: string;
  ended_at: string | null;
  opening_cash: number;
  closing_cash: number | null;
  total_sales: number;
  total_orders: number;
  cash_sales: number;
  card_sales: number;
  online_sales: number;
  discounts_total: number;
  notes: string | null;
  status: string;
}

const expenseCategories = [
  { value: 'rent', labelAr: 'إيجار', labelEn: 'Rent' },
  { value: 'utilities', labelAr: 'كهرباء ومياه', labelEn: 'Utilities' },
  { value: 'salaries', labelAr: 'رواتب', labelEn: 'Salaries' },
  { value: 'supplies', labelAr: 'مستلزمات', labelEn: 'Supplies' },
  { value: 'maintenance', labelAr: 'صيانة', labelEn: 'Maintenance' },
  { value: 'marketing', labelAr: 'تسويق', labelEn: 'Marketing' },
  { value: 'other', labelAr: 'أخرى', labelEn: 'Other' },
];

const FinancialManagement = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuthContext();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);

  // Form states
  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    amount: '',
  });
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');

  // Summary calculations
  const [todayOrdersTotal, setTodayOrdersTotal] = useState(0);
  const [todayCashSales, setTodayCashSales] = useState(0);
  const [todayCardSales, setTodayCardSales] = useState(0);
  const [todayOnlineSales, setTodayOnlineSales] = useState(0);
  const [todayExpensesTotal, setTodayExpensesTotal] = useState(0);
  const [monthExpensesTotal, setMonthExpensesTotal] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      // Use local date for accurate reporting
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA');

      // 1. Fetch Today's Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total, payment_method')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .not('status', 'eq', 'cancelled');

      let total = 0;
      let cash = 0;
      let card = 0;
      let online = 0;

      ordersData?.forEach(order => {
        const amount = Number(order.total);
        total += amount;
        if (order.payment_method === 'cash') cash += amount;
        else if (order.payment_method === 'card') card += amount;
        else if (order.payment_method === 'online') online += amount;
      });

      setTodayOrdersTotal(total);
      setTodayCashSales(cash);
      setTodayCardSales(card);
      setTodayOnlineSales(online);

      // 2. Fetch Today's Expenses
      // Note: expense_date is usually 'YYYY-MM-DD'
      const { data: todayExpData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('expense_date', today);

      const todayExp = todayExpData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      setTodayExpensesTotal(todayExp);

      // 3. Fetch Month's Expenses
      const { data: monthExpData } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', startOfMonth)
        .lte('expense_date', today); // Up to today

      const monthExp = monthExpData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      setMonthExpensesTotal(monthExp);
    };

    fetchStats();
  }, [expenses]); // Re-fetch when expenses change

  const todaySales = todayOrdersTotal;
  const todayProfit = todaySales - todayExpensesTotal;


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .limit(100);

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

      // Fetch shifts
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .order('shift_date', { ascending: false })
        .limit(30);

      if (shiftsError) throw shiftsError;
      setShifts(shiftsData || []);

      // Check for open shift
      const openShift = shiftsData?.find(s => s.status === 'open');
      setCurrentShift(openShift || null);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: isAr ? 'خطأ' : 'Error',
        description: isAr ? 'فشل في تحميل البيانات' : 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount) {
      toast({
        title: isAr ? 'خطأ' : 'Error',
        description: isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('expenses').insert({
        category: newExpense.category,
        description: newExpense.description || null,
        amount: parseFloat(newExpense.amount),
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: isAr ? 'تم بنجاح' : 'Success',
        description: isAr ? 'تم إضافة المصروف' : 'Expense added successfully',
      });

      setNewExpense({ category: '', description: '', amount: '' });
      setIsExpenseDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: isAr ? 'خطأ' : 'Error',
        description: isAr ? 'فشل في إضافة المصروف' : 'Failed to add expense',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: isAr ? 'تم بنجاح' : 'Success',
        description: isAr ? 'تم حذف المصروف' : 'Expense deleted',
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: isAr ? 'خطأ' : 'Error',
        description: isAr ? 'فشل في حذف المصروف' : 'Failed to delete expense',
        variant: 'destructive',
      });
    }
  };

  const handleOpenShift = async () => {
    if (!openingCash) {
      toast({
        title: isAr ? 'خطأ' : 'Error',
        description: isAr ? 'يرجى إدخال الرصيد الافتتاحي' : 'Please enter opening cash',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('shifts').insert({
        user_id: user?.id,
        opening_cash: parseFloat(openingCash),
        status: 'open',
      });

      if (error) throw error;

      toast({
        title: isAr ? 'تم بنجاح' : 'Success',
        description: isAr ? 'تم فتح الشيفت' : 'Shift opened successfully',
      });

      setOpeningCash('');
      setIsShiftDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error opening shift:', error);
      toast({
        title: isAr ? 'خطأ' : 'Error',
        description: isAr ? 'فشل في فتح الشيفت' : 'Failed to open shift',
        variant: 'destructive',
      });
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift || !closingCash) {
      toast({
        title: isAr ? 'خطأ' : 'Error',
        description: isAr ? 'يرجى إدخال الرصيد الختامي' : 'Please enter closing cash',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('close_shift_with_sales', {
        p_shift_id: currentShift.id,
        p_closing_cash: parseFloat(closingCash),
        p_notes: shiftNotes || null,
      });

      if (error) throw error;

      const result = data as any;
      if (!result.success) {
        throw new Error(result.error || 'Failed to close shift');
      }

      toast({
        title: isAr ? 'تم بنجاح' : 'Success',
        description: isAr
          ? `تم إقفال الشيفت • إجمالي المبيعات: ${result.summary.total_sales} ر.س`
          : `Shift closed • Total sales: SAR ${result.summary.total_sales} `,
      });

      setClosingCash('');
      setShiftNotes('');
      setShiftNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error closing shift:', error);
      // Refresh data in case shift state was stale (e.g. already closed)
      fetchData();

      toast({
        title: isAr ? 'خطأ' : 'Error',
        description: error.message || (isAr ? 'فشل في إقفال الشيفت' : 'Failed to close shift'),
        variant: 'destructive',
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = expenseCategories.find(c => c.value === category);
    return cat ? (isAr ? cat.labelAr : cat.labelEn) : category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">{isAr ? 'الإدارة المالية' : 'Financial Management'}</h1>
        <div className="flex gap-2">
          <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {isAr ? 'إضافة مصروف' : 'Add Expense'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isAr ? 'إضافة مصروف جديد' : 'Add New Expense'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>{isAr ? 'الفئة' : 'Category'}</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isAr ? 'اختر الفئة' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {isAr ? cat.labelAr : cat.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isAr ? 'المبلغ' : 'Amount'}</Label>
                  <Input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>{isAr ? 'الوصف (اختياري)' : 'Description (optional)'}</Label>
                  <Textarea
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder={isAr ? 'تفاصيل إضافية...' : 'Additional details...'}
                  />
                </div>
                <Button onClick={handleAddExpense} className="w-full">
                  {isAr ? 'إضافة المصروف' : 'Add Expense'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {!currentShift ? (
            <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Clock className="w-4 h-4" />
                  {isAr ? 'فتح شيفت' : 'Open Shift'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isAr ? 'فتح شيفت جديد' : 'Open New Shift'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>{isAr ? 'الرصيد الافتتاحي' : 'Opening Cash'}</Label>
                    <Input
                      type="number"
                      value={openingCash}
                      onChange={(e) => setOpeningCash(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <Button onClick={handleOpenShift} className="w-full">
                    {isAr ? 'فتح الشيفت' : 'Open Shift'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {isAr ? 'إقفال الشيفت' : 'Close Shift'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isAr ? 'إقفال الشيفت' : 'Close Shift'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>{isAr ? 'الرصيد الافتتاحي' : 'Opening Cash'}</span>
                      <span className="font-bold">{formatCurrency(currentShift.opening_cash, i18n.language)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{isAr ? 'إجمالي المبيعات' : 'Total Sales'}</span>
                      <span className="font-bold text-green-600">{formatCurrency(currentShift.total_sales || 0, i18n.language)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{isAr ? 'عدد الطلبات' : 'Total Orders'}</span>
                      <span className="font-bold">{currentShift.total_orders || 0}</span>
                    </div>
                  </div>
                  <div>
                    <Label>{isAr ? 'الرصيد الختامي' : 'Closing Cash'}</Label>
                    <Input
                      type="number"
                      value={closingCash}
                      onChange={(e) => setClosingCash(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>{isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</Label>
                    <Textarea
                      value={shiftNotes}
                      onChange={(e) => setShiftNotes(e.target.value)}
                      placeholder={isAr ? 'أي ملاحظات...' : 'Any notes...'}
                    />
                  </div>
                  <Button onClick={handleCloseShift} className="w-full" variant="destructive">
                    {isAr ? 'تأكيد الإقفال' : 'Confirm Close'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Shift Status Banner */}
      {currentShift && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium text-green-700 dark:text-green-400">
                {isAr ? 'الشيفت مفتوح منذ' : 'Shift open since'}: {new Date(currentShift.started_at).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-pos">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'مبيعات اليوم' : "Today's Sales"}</p>
                <p className="text-2xl font-bold">{formatCurrency(todaySales, i18n.language)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-pos">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'مصروفات اليوم' : "Today's Expenses"}</p>
                <p className="text-2xl font-bold">{formatCurrency(todayExpensesTotal, i18n.language)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-pos">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w - 12 h - 12 ${todayProfit >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'} rounded - xl flex items - center justify - center`}>
                <DollarSign className={`w - 6 h - 6 ${todayProfit >= 0 ? 'text-blue-600' : 'text-orange-600'} `} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'صافي اليوم' : "Today's Net"}</p>
                <p className={`text - 2xl font - bold ${todayProfit >= 0 ? 'text-green-600' : 'text-red-600'} `}>
                  {formatCurrency(todayProfit, i18n.language)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-pos">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'مصروفات الشهر' : 'Month Expenses'}</p>
                <p className="text-2xl font-bold">{formatCurrency(monthExpensesTotal, i18n.language)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="expenses">{isAr ? 'المصروفات' : 'Expenses'}</TabsTrigger>
          <TabsTrigger value="shifts">{isAr ? 'الشيفتات' : 'Shifts'}</TabsTrigger>
          <TabsTrigger value="profit">{isAr ? 'الأرباح والخسائر' : 'Profit & Loss'}</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? 'سجل المصروفات' : 'Expenses Log'}</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isAr ? 'لا توجد مصروفات بعد' : 'No expenses yet'}
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{getCategoryLabel(expense.category)}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.description || (isAr ? 'بدون وصف' : 'No description')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <p className="font-bold text-red-600">
                            -{formatCurrency(expense.amount, i18n.language)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(expense.expense_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? 'سجل الشيفتات' : 'Shifts Log'}</CardTitle>
            </CardHeader>
            <CardContent>
              {shifts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isAr ? 'لا توجد شيفتات بعد' : 'No shifts yet'}
                </div>
              ) : (
                <div className="space-y-3">
                  {shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w - 10 h - 10 ${shift.status === 'open' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-900/30'} rounded - lg flex items - center justify - center`}>
                          <Clock className={`w - 5 h - 5 ${shift.status === 'open' ? 'text-green-600' : 'text-gray-600'} `} />
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(shift.shift_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                          </p>
                          <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>{new Date(shift.started_at).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            {shift.ended_at && (
                              <>
                                <span>-</span>
                                <span>{new Date(shift.ended_at).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          {shift.status === 'open' ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                              {isAr ? 'مفتوح' : 'Open'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded-full">
                              {isAr ? 'مغلق' : 'Closed'}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-green-600 mt-1">
                          {formatCurrency(shift.total_sales || 0, i18n.language)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? 'ملخص الأرباح والخسائر' : 'Profit & Loss Summary'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Income Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-green-600">
                    {isAr ? 'الإيرادات' : 'Revenue'}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        <span>{isAr ? 'مبيعات نقدية' : 'Cash Sales'}</span>
                      </div>
                      <span className="font-bold">{formatCurrency(todayCashSales, i18n.language)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>{isAr ? 'مبيعات بطاقات' : 'Card Sales'}</span>
                      </div>
                      <span className="font-bold">{formatCurrency(todayCardSales, i18n.language)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        <span>{isAr ? 'مبيعات إلكترونية' : 'Online Sales'}</span>
                      </div>
                      <span className="font-bold">{formatCurrency(todayOnlineSales, i18n.language)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-100 dark:bg-green-900/40 rounded-lg font-bold">
                      <span>{isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}</span>
                      <span className="text-green-600">{formatCurrency(todaySales, i18n.language)}</span>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-red-600">
                    {isAr ? 'المصروفات' : 'Expenses'}
                  </h3>
                  <div className="space-y-2">
                    {expenseCategories.map((cat) => {
                      const catTotal = expenses
                        .filter(e => e.category === cat.value && e.expense_date === new Date().toISOString().split('T')[0])
                        .reduce((sum, e) => sum + Number(e.amount), 0);
                      if (catTotal === 0) return null;
                      return (
                        <div key={cat.value} className="flex justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                          <span className="font-bold text-red-600">-{formatCurrency(catTotal, i18n.language)}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between p-3 bg-red-100 dark:bg-red-900/40 rounded-lg font-bold">
                      <span>{isAr ? 'إجمالي المصروفات' : 'Total Expenses'}</span>
                      <span className="text-red-600">-{formatCurrency(todayExpensesTotal, i18n.language)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Profit */}
                <div className={`p - 4 rounded - lg ${todayProfit >= 0 ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'} `}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {todayProfit >= 0 ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      )}
                      <span className="font-bold text-lg">{isAr ? 'صافي الربح' : 'Net Profit'}</span>
                    </div>
                    <span className={`text - 2xl font - bold ${todayProfit >= 0 ? 'text-green-600' : 'text-red-600'} `}>
                      {formatCurrency(todayProfit, i18n.language)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default FinancialManagement;
