import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrderStore } from '@/store/orderStore';
import { toast } from 'sonner';

interface CreateOrderParams {
    orderType: 'dine-in' | 'takeaway' | 'delivery';
    tableNumber?: string | null;
    subtotal: number;
    vat: number;
    discount: number;
    total: number;
    paymentMethod: 'cash' | 'card' | 'online';
    items: Array<{
        menuItemId?: string;
        dishName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        notes?: string;
    }>;
    notes?: string;
}

export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: CreateOrderParams) => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            // Generate order number (format: ORD-YYYYMMDD-XXXX)
            const date = new Date();
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const orderNumber = `ORD-${dateStr}-${random}`;

            // Insert order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    order_number: orderNumber,
                    order_type: params.orderType,
                    table_number: params.tableNumber,
                    subtotal: params.subtotal,
                    vat: params.vat,
                    discount: params.discount,
                    total: params.total,
                    payment_method: params.paymentMethod,
                    status: 'pending',
                    payment_status: 'unpaid', // New field for payment tracking
                    cashier_id: user.id,
                    notes: params.notes,
                })
                .select()
                .single();

            if (orderError) {
                console.error('Order error:', orderError);
                throw orderError;
            }

            // Insert order items
            const orderItems = params.items.map((item) => ({
                order_id: order.id,
                menu_item_id: item.menuItemId,
                dish_name: item.dishName,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.totalPrice,
                notes: item.notes,
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) {
                console.error('Order items error:', itemsError);
                throw itemsError;
            }

            return { order, orderItems };
        },
        onSuccess: (data) => {
            toast.success('Order placed successfully!', {
                description: `Order ${data.order.order_number} has been created`,
            });

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
        },
        onError: (error: any) => {
            console.error('Create order error:', error);
            toast.error('Failed to create order', {
                description: error.message || 'Please try again',
            });
        },
    });
};
