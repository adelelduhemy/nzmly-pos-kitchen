import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCloseShift } from '../../hooks/useCloseShift';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        rpc: vi.fn(),
    },
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'en',
        },
    }),
}));

// Smart mock for react-query to execute mutationFn and callbacks
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
        // Provide alias mutateAsync
        const mutateAsync = mutate;

        return {
            mutate,
            mutateAsync,
            isPending: false,
            isError: false,
            isSuccess: false,
        };
    },
    // We don't use QueryClient or Provider in this test anymore (mocked fully)
    QueryClient: vi.fn(),
    QueryClientProvider: ({ children }: any) => children,
}));

describe('useCloseShift', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call close_shift_with_sales RPC successfully', async () => {
        const mockResponse = {
            success: true,
            summary: { total_sales: 500 },
        };

        (supabase.rpc as any).mockResolvedValue({ data: mockResponse, error: null });

        const { result } = renderHook(() => useCloseShift());

        await act(async () => {
            await result.current.mutateAsync({
                shiftId: 'shift-123',
                closingCash: 1000,
                notes: 'All good',
            });
        });

        expect(supabase.rpc).toHaveBeenCalledWith('close_shift_with_sales', {
            p_shift_id: 'shift-123',
            p_closing_cash: 1000,
            p_notes: 'All good',
        });
    });

    it('should handle logic error (success: false)', async () => {
        const mockResponse = {
            success: false,
            error: 'Shift already closed',
        };

        (supabase.rpc as any).mockResolvedValue({ data: mockResponse, error: null });

        const { result } = renderHook(() => useCloseShift());

        await act(async () => {
            try {
                await result.current.mutateAsync({
                    shiftId: 'shift-123',
                    closingCash: 1000,
                });
            } catch (e: any) {
                expect(e.message).toBe('Shift already closed');
            }
        });
    });

    it('should handle RPC error', async () => {
        (supabase.rpc as any).mockResolvedValue({ data: null, error: { message: 'DB Error' } });

        const { result } = renderHook(() => useCloseShift());

        await act(async () => {
            try {
                await result.current.mutateAsync({
                    shiftId: 'shift-123',
                    closingCash: 1000,
                });
            } catch (e: any) {
                expect(e.message).toBe('DB Error');
            }
        });
    });
});
