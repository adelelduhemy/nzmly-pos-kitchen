import React, { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

export function renderWithProviders(ui: ReactNode) {
    const testQueryClient = createTestQueryClient();
    return {
        ...render(
            <QueryClientProvider client={testQueryClient}>
                <MemoryRouter>
                    {ui}
                </MemoryRouter>
            </QueryClientProvider>
        ),
    };
}
