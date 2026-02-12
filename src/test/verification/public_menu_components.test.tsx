import { describe, it, expect } from 'vitest';
import CartDrawer from '@/components/public-menu/CartDrawer';
import ItemDetailModal from '@/components/public-menu/ItemDetailModal';
import CategoryItemsView from '@/components/public-menu/CategoryItemsView';
import ClassicGridTemplate from '@/components/public-menu/templates/ClassicGridTemplate';
import ModernDarkTemplate from '@/components/public-menu/templates/ModernDarkTemplate';
import MinimalFastTemplate from '@/components/public-menu/templates/MinimalFastTemplate';
import PromoFocusedTemplate from '@/components/public-menu/templates/PromoFocusedTemplate';

describe('Public Menu Components Verification', () => {
    it('should import CartDrawer successfully', () => {
        expect(CartDrawer).toBeDefined();
    });

    it('should import ItemDetailModal successfully', () => {
        expect(ItemDetailModal).toBeDefined();
    });

    it('should import CategoryItemsView successfully', () => {
        expect(CategoryItemsView).toBeDefined();
    });

    it('should import all templates successfully', () => {
        expect(ClassicGridTemplate).toBeDefined();
        expect(ModernDarkTemplate).toBeDefined();
        expect(MinimalFastTemplate).toBeDefined();
        expect(PromoFocusedTemplate).toBeDefined();
    });
});
