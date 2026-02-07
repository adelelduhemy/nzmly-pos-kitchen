import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { History, ArrowDown, ArrowUp, TrendingDown, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InventoryMovementHistoryProps {
    itemId?: string;
    itemName?: string;
}

export const InventoryMovementHistory: React.FC<InventoryMovementHistoryProps> = ({ itemId, itemName }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [open, setOpen] = useState(false);

    const { data: transactions = [], isLoading, error } = useQuery({
        queryKey: ['inventory_transactions', itemId],
        queryFn: async () => {
            let query = supabase
                .from('inventory_transactions')
                .select(`
          *,
          inventory_items(name_en, name_ar, unit)
        `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (itemId) {
                query = query.eq('inventory_item_id', itemId);
            }

            const { data, error } = await query;
            if (error) {
                console.error('Inventory transactions error:', error);
                throw error;
            }
            return data;
        },
        enabled: open,
    });

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'in':
                return <ArrowDown className="w-4 h-4 text-green-600" />;
            case 'out':
                return <ArrowUp className="w-4 h-4 text-red-600" />;
            default:
                return <History className="w-4 h-4" />;
        }
    };

    const getTransactionBadge = (type: string) => {
        switch (type) {
            case 'in':
                return <Badge className="bg-green-600">Stock In</Badge>;
            case 'out':
                return <Badge className="bg-red-600">Stock Out</Badge>;
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    // Function to render notes with clickable order links
    const renderNotes = (notes: string | null) => {
        if (!notes) return '-';

        // Check if it's an order sale note (format: "Order Sale #ORDER_NUMBER")
        const orderMatch = notes.match(/Order Sale #(\S+)/);
        if (orderMatch) {
            const orderNumber = orderMatch[1];
            return (
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Order Sale</span>
                    <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                            // Open order details in a new window or navigate
                            window.open(`/orders?search=${orderNumber}`, '_blank');
                        }}
                    >
                        #{orderNumber}
                    </Badge>
                </div>
            );
        }

        return <span>{notes}</span>;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <History className="w-4 h-4" />
                    {itemName ? 'View History' : 'All Movements'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>
                        {itemName ? `Stock Movement History - ${itemName}` : 'All Stock Movements'}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[500px] pr-4">
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No movements recorded yet
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date & Time</TableHead>
                                    {!itemId && <TableHead>Item</TableHead>}
                                    <TableHead>Type</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((transaction: any) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                        {!itemId && (
                                            <TableCell>
                                                {isRTL ? transaction.inventory_items.name_ar : transaction.inventory_items.name_en}
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getTransactionIcon(transaction.type)}
                                                {getTransactionBadge(transaction.type)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={transaction.type === 'out' ? 'text-red-600' : 'text-green-600'}>
                                                {transaction.type === 'out' ? '-' : '+'}{transaction.quantity} {transaction.inventory_items?.unit || 'units'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            {renderNotes(transaction.notes)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
