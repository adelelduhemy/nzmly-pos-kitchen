import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, CheckCircle, ArrowRight, ChefHat, ShoppingBag, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { mockKDSTickets } from '@/data/mockData';
import { KDSTicket, TicketStatus, OrderType } from '@/types';

const KDS = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [tickets, setTickets] = useState<KDSTicket[]>(mockKDSTickets);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // In real app, this would fetch from API
      setTickets([...tickets]);
    }, 5000);
    return () => clearInterval(interval);
  }, [tickets]);

  const getElapsedTime = (date: Date): string => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    return `${diff}m`;
  };

  const isOverdue = (date: Date): boolean => {
    const diff = (Date.now() - date.getTime()) / 1000 / 60;
    return diff > 10;
  };

  const updateTicketStatus = (ticketId: string, newStatus: TicketStatus) => {
    setTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id === ticketId) {
          const updates: Partial<KDSTicket> = { status: newStatus };
          if (newStatus === 'preparing') updates.startedAt = new Date();
          if (newStatus === 'ready') updates.readyAt = new Date();
          return { ...ticket, ...updates };
        }
        return ticket;
      })
    );
  };

  const bumpTicket = (ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
  };

  const getOrderTypeIcon = (type: OrderType) => {
    switch (type) {
      case 'dine-in':
        return <ChefHat className="w-4 h-4" />;
      case 'takeaway':
        return <ShoppingBag className="w-4 h-4" />;
      case 'delivery':
        return <Truck className="w-4 h-4" />;
    }
  };

  const statusColumns: { status: TicketStatus; labelKey: string; color: string; bgClass: string }[] = [
    { status: 'new', labelKey: 'kds.newOrders', color: 'text-destructive', bgClass: 'kds-ticket-new' },
    { status: 'preparing', labelKey: 'kds.preparing', color: 'text-warning', bgClass: 'kds-ticket-preparing' },
    { status: 'ready', labelKey: 'kds.ready', color: 'text-success', bgClass: 'kds-ticket-ready' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ChefHat className="w-7 h-7 text-primary" />
          {t('kds.title')}
        </h1>
        <Badge variant="outline" className="text-sm">
          <Clock className="w-4 h-4 mr-1" />
          Auto-refresh: 5s
        </Badge>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusColumns.map(({ status, labelKey, color, bgClass }) => {
          const columnTickets = tickets.filter((t) => t.status === status);

          return (
            <div key={status} className="space-y-4">
              {/* Column Header */}
              <div className="flex items-center justify-between">
                <h2 className={cn('font-bold text-lg', color)}>{t(labelKey)}</h2>
                <Badge variant="secondary">{columnTickets.length}</Badge>
              </div>

              {/* Tickets */}
              <div className="space-y-4 min-h-[200px]">
                <AnimatePresence>
                  {columnTickets.map((ticket) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={cn('kds-ticket', bgClass)}
                    >
                      {/* Ticket Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getOrderTypeIcon(ticket.type)}
                          <span className="font-bold">{ticket.orderNumber.split('-').pop()}</span>
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1 text-sm font-medium',
                            isOverdue(ticket.createdAt) && status !== 'ready' && 'text-destructive pulse-alert'
                          )}
                        >
                          <Clock className="w-4 h-4" />
                          {getElapsedTime(ticket.createdAt)}
                        </div>
                      </div>

                      {/* Table/Type Info */}
                      <div className="mb-3 pb-3 border-b border-border/50">
                        {ticket.tableNumber ? (
                          <Badge variant="secondary">
                            {t('kds.table')} {ticket.tableNumber}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {ticket.type === 'takeaway' ? t('pos.takeaway') : t('pos.delivery')}
                          </Badge>
                        )}
                      </div>

                      {/* Items */}
                      <div className="space-y-2 mb-4">
                        {ticket.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <div>
                              <span className="font-medium">{item.quantity}x</span>{' '}
                              <span>{item.name}</span>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground italic mt-1">
                                  📝 {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      {status === 'new' && (
                        <Button
                          className="w-full bg-warning hover:bg-warning/90 text-warning-foreground"
                          onClick={() => updateTicketStatus(ticket.id, 'preparing')}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {t('kds.startPrep')}
                        </Button>
                      )}
                      {status === 'preparing' && (
                        <Button
                          className="w-full bg-success hover:bg-success/90 text-success-foreground"
                          onClick={() => updateTicketStatus(ticket.id, 'ready')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {t('kds.markReady')}
                        </Button>
                      )}
                      {status === 'ready' && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => bumpTicket(ticket.id)}
                        >
                          <ArrowRight className={cn('w-4 h-4 mr-2', isRTL && 'rotate-180')} />
                          {t('kds.bump')}
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {columnTickets.length === 0 && (
                  <div className="h-32 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
                    No tickets
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KDS;
