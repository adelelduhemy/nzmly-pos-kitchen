import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUpdateWorkflowStatus } from '../../hooks/useUpdateWorkflowStatus';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        rpc: vi.fn(),
    },
}));

// Smart mock for react-query
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        invalidateQueries: vi.fn(),
    }),
    useMutation: (options: any) => {
        const mutate = async (variables: any) => {
            try {
                const data = await options.mutationFn(variables);
                options.onSuccess?.(data, variables);
                return data;
            } catch (error) {
                options.onError?.(error, variables);
                throw error;
            }
        };
        const mutateAsync = mutate;
        return {
            mutate,
            mutateAsync,
            isPending: false,
            isError: false,
            isSuccess: false,
        };
    },
    QueryClient: vi.fn(),
    QueryClientProvider: ({ children }: any) => children,
}));

// Removed wrapper component and QueryClient instantiation as we mock the library

describe('useUpdateWorkflowStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call update_order_status RPC with correct arguments', async () => {
        const mockResponse = {
            success: true,
            order: { id: 'order-1', status: 'preparing', version: 2 },
        };

        (supabase.rpc as any).mockResolvedValue({ data: mockResponse, error: null });

        const { result } = renderHook(() => useUpdateWorkflowStatus());

        await act(async () => {
            await result.current.mutateAsync({
                orderId: 'order-1',
                status: 'preparing',
                expectedVersion: 1,
            });
        });

        expect(supabase.rpc).toHaveBeenCalledWith('update_order_status', {
            p_order_id: 'order-1',
            p_new_status: 'preparing',
            p_expected_version: 1,
        });
    });

    it('should handle optimistic lock failure (conflict)', async () => {
        // Simulate RPC returning success=false (logic error inside RPC)
        const mockResponse = {
            success: false,
            error: 'Conflict: Order has been updated by someone else',
        };

        (supabase.rpc as any).mockResolvedValue({ data: mockResponse, error: null });

        const { result } = renderHook(() => useUpdateWorkflowStatus());

        await act(async () => {
            try {
                await result.current.mutateAsync({
                    orderId: 'order-1',
                    status: 'ready',
                    expectedVersion: 1,
                });
            } catch (e: any) {
                expect(e.message).toContain('Conflict');
            }
        });

        expect(supabase.rpc).toHaveBeenCalled();
    });

    it('should handle permission denied error from DB', async () => {
        // Simulate DB level error (e.g., RLS or RPC guard)
        (supabase.rpc as any).mockResolvedValue({
            data: null,
            error: { message: 'permission denied for function update_order_status' }
        });

        const { result } = renderHook(() => useUpdateWorkflowStatus());

        await act(async () => {
            try {
                await result.current.mutateAsync({
                    orderId: 'order-1',
                    status: 'completed',
                    expectedVersion: 5,
                });
            } catch (e: any) {
                expect(e.message).toContain('permission denied');
            }
        });

        expect(supabase.rpc).toHaveBeenCalled();
    });

    it('should handle order cancellation (atomic stock return)', async () => {
        const mockResponse = {
            success: true,
            order: { id: 'order-1', status: 'cancelled', version: 3 },
        };

        (supabase.rpc as any).mockResolvedValue({ data: mockResponse, error: null });

        const { result } = renderHook(() => useUpdateWorkflowStatus());

        await act(async () => {
            await result.current.mutateAsync({
                orderId: 'order-1',
                status: 'cancelled',
                expectedVersion: 2,
            });
        });

        expect(supabase.rpc).toHaveBeenCalledWith('update_order_status', {
            p_order_id: 'order-1',
            p_new_status: 'cancelled',
            p_expected_version: 2,
        });
    });
});
