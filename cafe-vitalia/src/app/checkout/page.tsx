"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

type DeliveryType = "pickup" | "delivery";
type PaymentType = "cash" | "card";

export default function CheckoutPage() {
  const { items, totalPrice, getItemKey, clearCart } = useCart();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");

  const deliveryCost = deliveryType === "pickup" ? 0 : 49;
  const finalTotal = totalPrice + deliveryCost;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Введіть ваше ім'я";
    }

    const phoneClean = phone.replace(/\D/g, "");
    if (!phone.trim()) {
      newErrors.phone = "Введіть номер телефону";
    } else if (phoneClean.length < 10) {
      newErrors.phone = "Невірний формат телефону";
    }

    if (deliveryType === "delivery" && !address.trim()) {
      newErrors.address = "Введіть адресу доставки";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitted(true);
    clearCart();
  };

  if (items.length === 0 && !isSubmitted) {
    return (
      <div className="section-padding pt-28">
        <div className="container-custom text-center py-20">
          <h1 className="font-heading text-2xl font-semibold text-text-primary mb-4">
            Кошик порожній
          </h1>
          <p className="text-text-muted mb-6">
            Додайте товари до кошика перед оформленням замовлення
          </p>
          <Link href="/menu" className="btn-accent">
            Перейти до меню
          </Link>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="section-padding pt-28 min-h-[70vh] flex items-center justify-center">
        <div className="container-custom max-w-xl text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="font-heading text-3xl font-semibold text-text-primary mb-3">
            Дякуємо за замовлення!
          </h1>
          <p className="text-text-secondary mb-2">
            Ваше замовлення прийнято та передано на обробку.
          </p>
          <p className="text-text-muted text-sm mb-8">
            Орієнтовний час готовності: 20–40 хвилин
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn-accent">
              На головну
            </Link>
            <Link href="/menu" className="btn-secondary">
              Переглянути меню
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding pt-28">
      <div className="container-custom">
        {/* Page Header */}
        <header className="mb-12 sm:mb-16">
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-text-primary mb-2">
            Оформлення замовлення
          </h1>
          <p className="text-text-secondary text-lg">
            Крок 1 з 1 — перевірте дані та підтвердіть замовлення
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left - Order Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Info */}
              <div className="card p-6 sm:p-8">
                <h2 className="font-heading text-xl font-semibold text-text-primary mb-6">
                  Контактна інформація
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-text-secondary mb-2"
                    >
                      Ім&apos;я *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`input-field ${errors.name ? "border-error focus:ring-error/30" : ""}`}
                      placeholder="Ваше ім'я"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-error">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-text-secondary mb-2"
                    >
                      Телефон *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`input-field ${errors.phone ? "border-error focus:ring-error/30" : ""}`}
                      placeholder="+380 XX XXX XX XX"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-error">{errors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-text-secondary mb-2"
                    >
                      Email (необов&apos;язково)
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="card p-6 sm:p-8">
                <h2 className="font-heading text-xl font-semibold text-text-primary mb-6">
                  Спосіб отримання
                </h2>
                <div className="flex gap-4 mb-6">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryType === "pickup"}
                      onChange={() => setDeliveryType("pickup")}
                      className="sr-only peer"
                    />
                    <div className="p-4 rounded-xl border-2 border-border peer-checked:border-caramel peer-checked:bg-caramel/5 transition-all text-center">
                      <span className="font-medium text-text-primary">
                        Самовивіз
                      </span>
                      <p className="text-sm text-text-muted mt-1">
                        Безкоштовно
                      </p>
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryType === "delivery"}
                      onChange={() => setDeliveryType("delivery")}
                      className="sr-only peer"
                    />
                    <div className="p-4 rounded-xl border-2 border-border peer-checked:border-caramel peer-checked:bg-caramel/5 transition-all text-center">
                      <span className="font-medium text-text-primary">
                        Доставка
                      </span>
                      <p className="text-sm text-text-muted mt-1">
                        від 49 ₴
                      </p>
                    </div>
                  </label>
                </div>

                {deliveryType === "delivery" && (
                  <div className="animate-fade-in">
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-text-secondary mb-2"
                    >
                      Адреса доставки *
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={`input-field ${errors.address ? "border-error focus:ring-error/30" : ""}`}
                      placeholder="Вулиця, будинок, квартира"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-error">{errors.address}</p>
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-text-secondary mb-2"
                  >
                    Коментар до замовлення
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Побажання, зауваження..."
                  />
                </div>
              </div>

              {/* Payment */}
              <div className="card p-6 sm:p-8">
                <h2 className="font-heading text-xl font-semibold text-text-primary mb-6">
                  Спосіб оплати
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-border cursor-pointer hover:border-latte transition-colors has-[:checked]:border-caramel has-[:checked]:bg-caramel/5">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentType === "cash"}
                      onChange={() => setPaymentType("cash")}
                      className="w-4 h-4 text-caramel"
                    />
                    <span className="font-medium text-text-primary">
                      Оплата при отриманні
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-border cursor-pointer hover:border-latte transition-colors has-[:checked]:border-caramel has-[:checked]:bg-caramel/5">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentType === "card"}
                      onChange={() => setPaymentType("card")}
                      className="w-4 h-4 text-caramel"
                    />
                    <span className="font-medium text-text-primary">
                      Карткою онлайн
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="btn-accent w-full !py-4 text-lg justify-center"
              >
                Підтвердити замовлення
              </button>
            </div>

            {/* Right - Order Summary */}
            <div className="lg:col-span-1">
              <div className="card p-6 sm:p-8 sticky top-28">
                <h3 className="font-heading text-xl font-semibold text-text-primary mb-6">
                  Ваше замовлення
                </h3>

                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => {
                    const key = getItemKey(item);
                    const lineTotal = item.price * item.quantity;
                    return (
                      <div
                        key={key}
                        className="flex gap-3 py-3 border-b border-border last:border-0"
                      >
                        <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-cream-dark">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary text-sm truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            {item.quantity} × {item.price} ₴
                          </p>
                        </div>
                        <span className="font-semibold text-espresso text-sm whitespace-nowrap">
                          {lineTotal} ₴
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex justify-between text-text-secondary">
                    <span>Проміжний підсумок</span>
                    <span>{totalPrice} ₴</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Доставка</span>
                    <span>
                      {deliveryType === "pickup"
                        ? "Безкоштовно"
                        : `від ${deliveryCost} ₴`}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg text-text-primary pt-2">
                    <span>Підсумок</span>
                    <span className="text-espresso">{finalTotal} ₴</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
