import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, User, Phone, Star, X } from 'lucide-react';

interface CustomerSelectorProps {
  selectedCustomerId: string | null;
  onSelectCustomer: (customerId: string | null) => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomerId,
  onSelectCustomer,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddNew, setIsAddNew] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Get selected customer details
  const selectedCustomer = customers.find((c: any) => c.id === selectedCustomerId);

  // Add customer mutation
  const addCustomerMutation = useMutation({
    mutationFn: async (customer: typeof newCustomer) => {
      const { data, error } = await supabase.from('customers').insert([customer]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSelectCustomer(data.id);
      setIsOpen(false);
      setIsAddNew(false);
      setNewCustomer({ name: '', phone: '' });
      toast({ title: isAr ? 'تم إضافة العميل' : 'Customer added' });
    },
    onError: (error: any) => {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const filteredCustomers = customers.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <>
      {/* Customer Display/Selector Button */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
        <User className="w-5 h-5 text-muted-foreground" />
        {selectedCustomer ? (
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="font-medium">{selectedCustomer.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                {selectedCustomer.loyalty_points} {isAr ? 'نقطة' : 'points'}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onSelectCustomer(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" className="flex-1 justify-start" onClick={() => setIsOpen(true)}>
            {isAr ? 'اختر عميل (اختياري)' : 'Select Customer (Optional)'}
          </Button>
        )}
      </div>

      {/* Customer Selection Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? 'اختر عميل' : 'Select Customer'}</DialogTitle>
          </DialogHeader>

          {!isAddNew ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={isAr ? 'بحث بالاسم أو الهاتف...' : 'Search by name or phone...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-10"
                />
              </div>

              {/* Add New Button */}
              <Button variant="outline" className="w-full gap-2" onClick={() => setIsAddNew(true)}>
                <Plus className="w-4 h-4" />
                {isAr ? 'إضافة عميل جديد' : 'Add New Customer'}
              </Button>

              {/* Customer List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredCustomers.map((customer: any) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      onSelectCustomer(customer.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-start"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-bold text-primary">{customer.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      {customer.loyalty_points}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>{isAr ? 'الاسم' : 'Name'}</Label>
                <Input
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
              </div>
              <div>
                <Label>{isAr ? 'رقم الهاتف' : 'Phone'}</Label>
                <Input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddNew(false)}>
                  {isAr ? 'رجوع' : 'Back'}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => addCustomerMutation.mutate(newCustomer)}
                  disabled={!newCustomer.name || !newCustomer.phone}
                >
                  {isAr ? 'إضافة' : 'Add'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomerSelector;
