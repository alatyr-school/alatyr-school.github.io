"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ContactsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[320px] flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1800&q=80"
          alt="Café Vitalia"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-chocolate/60 via-espresso/50 to-chocolate/70" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Контакти
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            Ми завжди на зв&apos;язку — завітайте, зателефонуйте або напишіть нам
          </p>
        </div>
      </section>

      {/* Contact Info + Map */}
      <section className="section-padding bg-cream">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left - Contact Info */}
            <div>
              <span className="text-caramel font-medium text-sm uppercase tracking-widest">
                Знайдіть нас
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary mt-3 mb-8">
                Завітайте до нас
              </h2>

              <div className="space-y-6">
                {/* Address */}
                <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-caramel/10 text-caramel flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1">Адреса</h3>
                    <p className="text-text-secondary">вул. Хрещатик, 22</p>
                    <p className="text-text-muted text-sm">м. Київ, 01001</p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-caramel/10 text-caramel flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1">Графік роботи</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-8">
                        <span className="text-text-muted">Понеділок — П&apos;ятниця</span>
                        <span className="text-text-secondary font-medium">7:30 — 22:00</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-text-muted">Субота</span>
                        <span className="text-text-secondary font-medium">9:00 — 23:00</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-text-muted">Неділя</span>
                        <span className="text-text-secondary font-medium">9:00 — 22:00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-caramel/10 text-caramel flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1">Телефон</h3>
                    <a
                      href="tel:+380441234567"
                      className="text-text-secondary hover:text-caramel transition-colors"
                    >
                      +38 (044) 123-45-67
                    </a>
                    <p className="text-text-muted text-sm mt-0.5">Для бронювання та замовлень</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-caramel/10 text-caramel flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1">Email</h3>
                    <a
                      href="mailto:hello@cafevitalia.ua"
                      className="text-text-secondary hover:text-caramel transition-colors"
                    >
                      hello@cafevitalia.ua
                    </a>
                  </div>
                </div>

                {/* Social Media */}
                <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-caramel/10 text-caramel flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-2">Соцмережі</h3>
                    <div className="flex gap-3">
                      {[
                        { name: "Instagram", handle: "@cafevitalia" },
                        { name: "Facebook", handle: "Café Vitalia" },
                        { name: "TikTok", handle: "@cafevitalia" },
                      ].map((social) => (
                        <a
                          key={social.name}
                          href="#"
                          className="px-4 py-2 bg-cream-dark rounded-full text-sm text-text-secondary hover:bg-caramel hover:text-white transition-all duration-300"
                        >
                          {social.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Map Placeholder */}
            <div className="flex flex-col gap-6">
              <div className="relative aspect-[4/3] lg:aspect-auto lg:flex-1 rounded-2xl overflow-hidden shadow-lg bg-latte min-h-[400px]">
                <div className="absolute inset-0 flex items-center justify-center bg-cream-dark">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-caramel/10 text-caramel flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                      </svg>
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-text-primary mb-2">
                      Карта
                    </h3>
                    <p className="text-text-muted text-sm mb-4">
                      вул. Хрещатик, 22, Київ
                    </p>
                    <a
                      href="https://maps.google.com/?q=Khreshchatyk+22+Kyiv"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-accent text-sm !px-6 !py-2.5"
                    >
                      Відкрити в Google Maps
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="tel:+380441234567"
                  className="flex items-center justify-center gap-2 p-4 bg-espresso text-white rounded-2xl font-medium transition-all duration-300 hover:bg-chocolate hover:shadow-lg hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  Зателефонувати
                </a>
                <Link
                  href="/menu"
                  className="flex items-center justify-center gap-2 p-4 bg-caramel text-white rounded-2xl font-medium transition-all duration-300 hover:bg-accent-hover hover:shadow-lg hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  Замовити онлайн
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="section-padding bg-cream-dark">
        <div className="container-custom max-w-3xl">
          <div className="text-center mb-12">
            <span className="text-caramel font-medium text-sm uppercase tracking-widest">
              Зворотний зв&apos;язок
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary mt-3">
              Напишіть нам
            </h2>
            <p className="text-text-muted mt-3">
              Маєте питання, побажання чи пропозицію? Ми з радістю відповімо.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-heading text-2xl font-bold text-text-primary mb-3">
                Дякуємо за повідомлення!
              </h3>
              <p className="text-text-muted mb-8">
                Ми отримали ваш лист і відповімо протягом 24 годин.
              </p>
              <Link href="/" className="btn-primary">
                Повернутися на головну
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm"
            >
              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Ваше ім&apos;я *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Як до вас звертатися?"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="your@email.com"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Тема
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="Про що ви хочете нам написати?"
                  className="input-field"
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Повідомлення *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Ваше повідомлення..."
                  className="input-field resize-none"
                />
              </div>

              <button type="submit" className="btn-accent w-full sm:w-auto">
                Надіслати повідомлення
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
