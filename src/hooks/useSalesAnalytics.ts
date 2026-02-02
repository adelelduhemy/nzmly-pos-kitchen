import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, format, subDays, eachHourOfInterval } from 'date-fns';

export interface SalesAnalytics {
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    hourlyTrend: { hour: string; sales: number }[];
    paymentMethods: { name: string; value: number; count: number }[];
    topItems: { name: string; revenue: number; quantity: number }[];
}

export const useSalesAnalytics = (startDate?: Date, endDate?: Date) => {
    return useQuery({
        queryKey: ['sales-analytics', startDate, endDate],
        queryFn: async (): Promise<SalesAnalytics> => {
            // Use provided dates or default to today
            const start = startDate || startOfDay(new Date());
            const end = endDate || endOfDay(new Date());

            // Fetch all completed orders in date range
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items (
            dish_name,
            quantity,
            unit_price,
            total_price
          )
        `)
                .gte('created_at', start.toISOString())
                .lte('created_at', end.toISOString())
                .in('status', ['paid', 'served', 'ready', 'preparing', 'pending']);

            if (error) throw error;
            if (!orders) return getEmptyAnalytics();

            // Calculate total sales and orders
            const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
            const totalOrders = orders.length;
            const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

            // Calculate hourly trend
            const hourlyTrend = calculateHourlyTrend(orders, start, end);

            // Calculate payment method breakdown
            const paymentMethods = calculatePaymentMethods(orders);

            // Calculate top-selling items
            const topItems = calculateTopItems(orders);

            return {
                totalSales,
                totalOrders,
                avgOrderValue,
                hourlyTrend,
                paymentMethods,
                topItems,
            };
        },
        refetchInterval: 60000, // Refresh every minute
    });
};

function getEmptyAnalytics(): SalesAnalytics {
    return {
        totalSales: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        hourlyTrend: [],
        paymentMethods: [],
        topItems: [],
    };
}

function calculateHourlyTrend(orders: any[], start: Date, end: Date) {
    const hours = eachHourOfInterval({ start, end });

    return hours.map(hour => {
        const hourStart = hour;
        const hourEnd = new Date(hour.getTime() + 60 * 60 * 1000);

        const hourOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= hourStart && orderDate < hourEnd;
        });

        const sales = hourOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

        return {
            hour: format(hour, 'ha'), // e.g., "10AM"
            sales,
        };
    });
}

function calculatePaymentMethods(orders: any[]) {
    const methods = orders.reduce((acc, order) => {
        const method = order.payment_method || 'cash';
        if (!acc[method]) {
            acc[method] = { count: 0, total: 0 };
        }
        acc[method].count += 1;
        acc[method].total += Number(order.total || 0);
        return acc;
    }, {} as Record<string, { count: number; total: number }>);

    const total = orders.length;

    return (Object.entries(methods) as [string, { count: number; total: number }][]).map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: total > 0 ? Math.round((data.count / total) * 100) : 0,
        count: data.count,
    }));
}

function calculateTopItems(orders: any[]) {
    const items = orders.reduce((acc, order) => {
        if (!order.order_items) return acc;

        order.order_items.forEach((item: any) => {
            if (!acc[item.dish_name]) {
                acc[item.dish_name] = { quantity: 0, revenue: 0 };
            }
            acc[item.dish_name].quantity += item.quantity;
            acc[item.dish_name].revenue += Number(item.total_price || 0);
        });

        return acc;
    }, {} as Record<string, { quantity: number; revenue: number }>);

    return (Object.entries(items) as [string, { quantity: number; revenue: number }][])
        .map(([name, data]) => ({
            name,
            revenue: data.revenue,
            quantity: data.quantity,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10 items
}
