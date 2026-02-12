import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CartDrawer from '../../components/public-menu/CartDrawer';
import { usePublicCartStore } from '../../store/publicCartStore';
import { useCreateOnlineOrder } from '../../hooks/useCreateOnlineOrder';
import { vi } from 'vitest';

// Mock the hook
vi.mock('../../hooks/useCreateOnlineOrder', () => ({
    useCreateOnlineOrder: vi.fn(),
}));

// Mock createPortal to render in place for testing
vi.mock('react-dom', async () => {
    const actual = await vi.importActual('react-dom');
    return {
        ...actual,
        createPortal: (node: React.ReactNode) => node,
    };
});

describe('CartDrawer Checkout Flow', () => {
    const mutateAsyncMock = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();
        (useCreateOnlineOrder as any).mockReturnValue({
            mutateAsync: mutateAsyncMock,
            isPending: false,
        });

        // Seed the store
        usePublicCartStore.setState({
            items: [
                {
                    id: 'item-1',
                    name_ar: 'برجر',
                    name_en: 'Burger',
                    price: 50,
                    quantity: 2,
                    image_url: null,
                },
            ],

        });
    });

    afterEach(() => {
        usePublicCartStore.getState().clearCart();
    });

    it('navigates to checkout and submits order', async () => {
        render(<CartDrawer isOpen={true} onClose={() => { }} lang="en" primaryColor="#000" />);

        // Check if cart items are visible
        expect(screen.getByText('Burger')).toBeInTheDocument();
        expect(screen.getByText('SAR 100.00')).toBeInTheDocument(); // 50 * 2

        // Click "Proceed to Checkout"
        const checkoutBtn = screen.getByText('Proceed to Checkout');
        fireEvent.click(checkoutBtn);

        // Verify checkout view
        expect(screen.getByText('Full Name')).toBeInTheDocument();
        expect(screen.getByText('Phone Number')).toBeInTheDocument();

        // Fill form
        fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByPlaceholderText('05xxxxxxxx'), { target: { value: '0512345678' } });

        // Select Delivery (Default) - Input Address
        fireEvent.change(screen.getByPlaceholderText('Delivery address details...'), { target: { value: '123 Main St' } });

        // Submit
        const submitBtn = screen.getByText('Submit Order');
        fireEvent.click(submitBtn);

        // Assert RPC call
        await waitFor(() => {
            expect(mutateAsyncMock).toHaveBeenCalledWith(expect.objectContaining({
                p_customer_name: 'John Doe',
                p_customer_phone: '0512345678',
                p_customer_address: '123 Main St',
                p_order_type: 'delivery',
                p_items: expect.arrayContaining([
                    expect.objectContaining({
                        menuItemId: 'item-1',
                        quantity: 2,
                        totalPrice: 100
                    })
                ])
            }));
        });
    });

    it('validates required fields', async () => {
        render(<CartDrawer isOpen={true} onClose={() => { }} lang="en" primaryColor="#000" />);

        // Go to checkout
        fireEvent.click(screen.getByText('Proceed to Checkout'));

        // Try submit without filling anything
        const submitBtn = screen.getByText('Submit Order');
        expect(submitBtn).toBeDisabled();

        // Fill Name
        fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'John' } });
        expect(submitBtn).toBeDisabled(); // Phone missing

        // Fill Phone
        fireEvent.change(screen.getByPlaceholderText('05xxxxxxxx'), { target: { value: '123' } });

        // Address missing (default is delivery)
        expect(submitBtn).toBeDisabled();

        // Fill Address
        fireEvent.change(screen.getByPlaceholderText('Delivery address details...'), { target: { value: 'Address' } });
        expect(submitBtn).not.toBeDisabled();
    });
});
