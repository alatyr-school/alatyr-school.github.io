"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

interface CartState {
  items: CartItem[];
  notification: { show: boolean; productName: string };
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; selectedOptions?: Record<string, string>; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "SHOW_NOTIFICATION"; payload: string }
  | { type: "HIDE_NOTIFICATION" };

function getCartItemKey(item: { productId: string; selectedOptions?: Record<string, string> }): string {
  const opts = item.selectedOptions ? JSON.stringify(item.selectedOptions) : "";
  return `${item.productId}__${opts}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const key = getCartItemKey(action.payload);
      const existingIndex = state.items.findIndex(
        (item) => getCartItemKey(item) === key
      );
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + action.payload.quantity,
        };
        return { ...state, items: newItems };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM": {
      return {
        ...state,
        items: state.items.filter(
          (item) => getCartItemKey(item) !== action.payload
        ),
      };
    }
    case "UPDATE_QUANTITY": {
      const key = getCartItemKey(action.payload);
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => getCartItemKey(item) !== key),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          getCartItemKey(item) === key
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "SHOW_NOTIFICATION":
      return {
        ...state,
        notification: { show: true, productName: action.payload },
      };
    case "HIDE_NOTIFICATION":
      return {
        ...state,
        notification: { show: false, productName: "" },
      };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  notification: { show: boolean; productName: string };
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  updateQuantity: (productId: string, selectedOptions: Record<string, string> | undefined, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  getItemKey: (item: { productId: string; selectedOptions?: Record<string, string> }) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    notification: { show: false, productName: "" },
  });

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
    dispatch({ type: "SHOW_NOTIFICATION", payload: item.name });
    setTimeout(() => dispatch({ type: "HIDE_NOTIFICATION" }), 2500);
  }, []);

  const removeItem = useCallback((key: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: key });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, selectedOptions: Record<string, string> | undefined, quantity: number) => {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { productId, selectedOptions, quantity },
      });
    },
    []
  );

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        notification: state.notification,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        getItemKey: getCartItemKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
