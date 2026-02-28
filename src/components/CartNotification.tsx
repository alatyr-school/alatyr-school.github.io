"use client";

import React from "react";
import { useCart } from "@/context/CartContext";

export default function CartNotification() {
  const { notification } = useCart();

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] bg-espresso text-white px-6 py-4 rounded-2xl shadow-2xl shadow-espresso/30 flex items-center gap-3 transition-all duration-500 ${
        notification.show
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium">Додано в кошик</p>
        <p className="text-xs text-white/70">{notification.productName}</p>
      </div>
    </div>
  );
}
