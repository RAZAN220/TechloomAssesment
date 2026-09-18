import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as cartService from '../services/cartService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ToastContext';

const EMPTY_CART = { items: [], total: 0, itemCount: 0, hasIssues: false };

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user, booting } = useAuth();
  const toast = useToast();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(EMPTY_CART);
      return;
    }
    try {
      setCart(await cartService.getCart());
    } catch {
      // network/auth hiccups are non-fatal for the shell
    }
  }, [user]);

  useEffect(() => {
    if (!booting) refresh();
  }, [user, booting, refresh]);

  const add = useCallback(
    async (productId, qty = 1) => {
      setLoading(true);
      try {
        const next = await cartService.addToCart(productId, qty);
        setCart(next);
        toast.success('Added to cart');
        return next;
      } catch (error) {
        toast.error(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const updateQty = useCallback(
    async (productId, qty) => {
      setLoading(true);
      try {
        const next = await cartService.updateCartItem(productId, qty);
        setCart(next);
      } catch (error) {
        toast.error(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const remove = useCallback(
    async (productId) => {
      setLoading(true);
      try {
        const next = await cartService.removeCartItem(productId);
        setCart(next);
        toast.info('Item removed');
      } catch (error) {
        toast.error(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const clear = useCallback(async () => {
    setLoading(true);
    try {
      const next = await cartService.clearCart();
      setCart(next);
      toast.info('Cart cleared');
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const value = useMemo(
    () => ({ cart, loading, refresh, add, updateQty, remove, clear }),
    [cart, loading, refresh, add, updateQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
