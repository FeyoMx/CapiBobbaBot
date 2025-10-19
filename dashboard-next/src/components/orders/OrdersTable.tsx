'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpDown, Download, Eye, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import type { Order, OrderStatus } from '@/types';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  preparing: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  ready: 'bg-green-500/10 text-green-500 border-green-500/20',
  delivered: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

interface OrdersTableProps {
  orders: Order[];
  isLoading?: boolean;
  onViewOrder: (order: Order) => void;
  onExportCSV?: () => void;
  filters: {
    status: string;
    paymentMethod: string;
    search: string;
  };
  onFiltersChange: (filters: Partial<{ status: string; paymentMethod: string; search: string }>) => void;
}

export function OrdersTable({ orders, isLoading, onViewOrder, onExportCSV, filters, onFiltersChange }: OrdersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ]);

  // Define columns
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.id.slice(0, 8)}</span>
        ),
        size: 100,
      },
      {
        accessorKey: 'customer_name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="hover:bg-transparent"
            >
              Cliente
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.customer_name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.customer_phone}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'items',
        header: 'Items',
        cell: ({ row }) => (
          <div>
            <div className="text-sm">
              {row.original.items?.length ? `${row.original.items.length} item${row.original.items.length !== 1 ? 's' : ''}` : 'Pedido'}
            </div>
            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
              {row.original.items?.[0]?.name || (row.original.summary ? row.original.summary.split('\n')[0].substring(0, 30) + '...' : 'Ver detalles')}
              {(row.original.items?.length || 0) > 1 && ` +${(row.original.items?.length || 0) - 1}`}
            </div>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'total',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="hover:bg-transparent"
            >
              Total
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-semibold">${row.original.total.toLocaleString('es-MX')}</div>
        ),
        size: 120,
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge variant="outline" className={statusColors[row.original.status]}>
            {statusLabels[row.original.status]}
          </Badge>
        ),
        size: 130,
      },
      {
        accessorKey: 'payment_method',
        header: 'Pago',
        cell: ({ row }) => (
          <span className="text-sm capitalize">{row.original.payment_method}</span>
        ),
        size: 100,
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="hover:bg-transparent"
            >
              Fecha
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{format(new Date(row.original.created_at), 'dd MMM yyyy', { locale: es })}</div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(row.original.created_at), 'HH:mm', { locale: es })}
            </div>
          </div>
        ),
        size: 130,
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewOrder(row.original)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver
          </Button>
        ),
        size: 100,
      },
    ],
    [onViewOrder]
  );

  // Table instance - filtrado manejado por backend
  const table = useReactTable({
    data: orders,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true, // Paginación manejada por backend
    manualFiltering: true, // Filtrado manejado por backend
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Buscar por nombre, teléfono o ID..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="max-w-xs"
        />

        <Select
          value={filters.status || 'all'}
          onChange={(e) => onFiltersChange({ status: e.target.value })}
          className="w-[150px]"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="preparing">Preparando</option>
          <option value="ready">Listo</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </Select>

        <Select
          value={filters.paymentMethod || 'all'}
          onChange={(e) => onFiltersChange({ paymentMethod: e.target.value })}
          className="w-[150px]"
        >
          <option value="all">Todos los pagos</option>
          <option value="cash">Efectivo</option>
          <option value="transfer">Transferencia</option>
          <option value="pending">Pendiente</option>
        </Select>

        {onExportCSV && (
          <Button variant="outline" onClick={onExportCSV} className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                    style={{ width: header.column.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState
                    icon={ShoppingCart}
                    title="No hay pedidos"
                    description={
                      filters.search || filters.status !== 'all' || filters.paymentMethod !== 'all'
                        ? 'No se encontraron pedidos con los filtros aplicados. Intenta ajustar los criterios de búsqueda.'
                        : 'Aún no hay pedidos registrados en el sistema. Los pedidos aparecerán aquí cuando los clientes realicen compras.'
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
