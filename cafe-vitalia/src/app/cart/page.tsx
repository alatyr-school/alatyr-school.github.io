"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, type CartItem } from "@/context/CartContext";

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, getItemKey } =
    useCart();
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      setAppliedPromo(promoCode.trim());
    }
  };

  const handleRemoveItem = (key: string) => {
    setRemovingKey(key);
    setTimeout(() => {
      removeItem(key);
      setRemovingKey(null);
    }, 300);
  };

  const discount = appliedPromo ? totalPrice * 0.1 : 0;
  const finalTotal = Math.max(0, totalPrice - discount);

  return (
    <div className="section-padding pt-28">
      <div className="container-custom">
        {/* Page Header */}
        <header className="mb-12 sm:mb-16">
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-text-primary mb-2">
            Ваш кошик
          </h1>
          <p className="text-text-secondary text-lg">
            {totalItems > 0
              ? `${totalItems} ${totalItems === 1 ? "позиція" : totalItems < 5 ? "позиції" : "позицій"}`
              : "Додайте щось смачненьке"}
          </p>
        </header>

        {items.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 sm:py-28 text-center animate-fade-in">
            <div className="w-32 h-32 sm:w-40 sm:h-40 mb-8 rounded-full bg-latte/50 flex items-center justify-center">
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 text-warm"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-text-primary mb-3">
              Ваш кошик порожній
            </h2>
            <p className="text-text-muted max-w-md mb-8">
              Перегляньте наше меню та оберіть улюблені напої та десерти
            </p>
            <Link
              href="/menu"
              className="btn-accent !px-10 !py-4 text-base"
            >
              Перейти до меню
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => {
                const key = getItemKey(item);
                const isRemoving = removingKey === key;
                const lineTotal = item.price * item.quantity;

                return (
                  <div
                    key={key}
                    className={`card p-4 sm:p-6 flex gap-4 sm:gap-6 transition-all duration-300 ${
                      isRemoving
                        ? "opacity-0 scale-95 -translate-x-4"
                        : "opacity-100 scale-100 translate-x-0"
                    }`}
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-cream-dark">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3 className="font-heading font-semibold text-text-primary text-lg">
                            {item.name}
                          </h3>
                          {item.selectedOptions &&
                            Object.keys(item.selectedOptions).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {Object.entries(item.selectedOptions).map(
                                  ([opt, val]) => (
                                    <span
                                      key={opt}
                                      className="inline-flex px-2 py-0.5 text-xs bg-latte/70 text-coffee rounded-full"
                                    >
                                      {val}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-espresso">
                            {lineTotal} ₴
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-muted">
                            {item.price} ₴ / шт
                          </span>
                          <div className="flex items-center border border-border rounded-full overflow-hidden">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.selectedOptions,
                                  Math.max(0, item.quantity - 1)
                                )
                              }
                              className="w-9 h-9 flex items-center justify-center hover:bg-latte/50 transition-colors text-espresso"
                              aria-label="Зменшити"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M20 12H4"
                                />
                              </svg>
                            </button>
                            <span className="w-10 h-9 flex items-center justify-center text-sm font-medium text-text-primary">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.selectedOptions,
                                  item.quantity + 1
                                )
                              }
                              className="w-9 h-9 flex items-center justify-center hover:bg-latte/50 transition-colors text-espresso"
                              aria-label="Збільшити"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(key)}
                          className="p-2 rounded-full hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                          aria-label="Видалити"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="card p-6 sm:p-8 sticky top-28">
                <h3 className="font-heading text-xl font-semibold text-text-primary mb-6">
                  Підсумок замовлення
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-text-secondary">
                    <span>Проміжний підсумок</span>
                    <span>{totalPrice} ₴</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Промокод"
                      className="input-field flex-1 !py-2.5"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="btn-secondary !px-4 !py-2.5 text-sm whitespace-nowrap"
                    >
                      Застосувати
                    </button>
                  </div>
                  {appliedPromo && (
                    <p className="text-sm text-success">
                      Промокод застосовано (−10%)
                    </p>
                  )}

                  <div className="flex justify-between font-semibold text-lg text-text-primary pt-4 border-t border-border">
                    <span>До сплати</span>
                    <span className="text-espresso">{finalTotal} ₴</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="btn-accent w-full !py-4 text-base justify-center mb-4"
                >
                  Оформити замовлення
                </Link>

                <Link
                  href="/menu"
                  className="block text-center text-text-secondary hover:text-espresso transition-colors text-sm"
                >
                  ← Продовжити покупки
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
