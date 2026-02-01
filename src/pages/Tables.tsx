import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Edit2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { mockTables } from '@/data/mockData';
import { Table, TableStatus } from '@/types';

const Tables = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [tables, setTables] = useState(mockTables);
  const [sectionFilter, setSectionFilter] = useState<'all' | 'indoor' | 'outdoor'>('all');

  const filteredTables = tables.filter((table) =>
    sectionFilter === 'all' ? true : table.section === sectionFilter
  );

  const getStatusColor = (status: TableStatus): string => {
    const colors: Record<TableStatus, string> = {
      available: 'table-status-available',
      occupied: 'table-status-occupied',
      reserved: 'table-status-reserved',
      cleaning: 'table-status-cleaning',
    };
    return colors[status];
  };

  const getStatusLabel = (status: TableStatus): string => {
    const labels: Record<TableStatus, string> = {
      available: t('pos.available'),
      occupied: t('pos.occupied'),
      reserved: t('pos.reserved'),
      cleaning: t('pos.cleaning'),
    };
    return labels[status];
  };

  const updateTableStatus = (tableId: string, newStatus: TableStatus) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId ? { ...table, status: newStatus } : table
      )
    );
  };

  const statusOptions: TableStatus[] = ['available', 'occupied', 'reserved', 'cleaning'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('tables.title')}</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {t('tables.addTable')}
        </Button>
      </div>

      {/* Section Filter */}
      <div className="flex gap-2">
        {(['all', 'indoor', 'outdoor'] as const).map((section) => (
          <Button
            key={section}
            variant={sectionFilter === section ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSectionFilter(section)}
          >
            {section === 'all'
              ? t('pos.allSections')
              : section === 'indoor'
              ? t('pos.indoor')
              : t('pos.outdoor')}
            <Badge variant="secondary" className="ml-2">
              {section === 'all'
                ? tables.length
                : tables.filter((t) => t.section === section).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredTables.map((table, index) => (
          <motion.div
            key={table.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={cn(
                'card-pos border-2 transition-all',
                getStatusColor(table.status)
              )}
            >
              <CardContent className="p-4">
                <div className="text-center">
                  <span className="text-2xl font-bold">{table.number}</span>
                  <div className="flex items-center justify-center gap-1 mt-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {table.capacity}
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {table.section === 'indoor' ? t('pos.indoor') : t('pos.outdoor')}
                  </Badge>
                </div>

                {/* Quick Status Buttons */}
                <div className="grid grid-cols-2 gap-1 mt-4">
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      variant={table.status === status ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs px-2"
                      onClick={() => updateTableStatus(table.id, status)}
                    >
                      {getStatusLabel(status)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <Card className="card-pos">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-6">
            {statusOptions.map((status) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-6 h-6 rounded border-2',
                    getStatusColor(status)
                  )}
                />
                <span className="text-sm">{getStatusLabel(status)}</span>
                <Badge variant="secondary">
                  {tables.filter((t) => t.status === status).length}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Tables;
