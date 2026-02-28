"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

const navigation = [
  { name: "Головна", href: "/" },
  { name: "Меню", href: "/menu" },
  { name: "Про нас", href: "/about" },
  { name: "Контакти", href: "/contacts" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { totalItems } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-cream/95 backdrop-blur-md shadow-lg shadow-espresso/5 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-espresso flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <span className="text-white font-heading text-lg font-bold">V</span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-xl font-semibold text-espresso leading-tight tracking-wide">
              Café Vitalia
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted leading-tight">
              Specialty Coffee
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative text-sm font-medium transition-colors duration-300 py-1 ${
                pathname === item.href
                  ? "text-espresso"
                  : "text-text-secondary hover:text-espresso"
              }`}
            >
              {item.name}
              {pathname === item.href && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-caramel rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative p-2.5 rounded-full hover:bg-espresso/5 transition-colors duration-300"
          >
            <svg className="w-5 h-5 text-espresso" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-caramel text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                {totalItems}
              </span>
            )}
          </Link>

          <Link href="/menu" className="hidden sm:inline-flex btn-primary text-sm !px-6 !py-2.5">
            Замовити
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-espresso/5 transition-colors"
            aria-label="Відкрити меню"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span
                className={`block h-0.5 bg-espresso rounded-full transition-all duration-300 ${
                  mobileOpen ? "rotate-45 translate-y-[7px]" : ""
                }`}
              />
              <span
                className={`block h-0.5 bg-espresso rounded-full transition-all duration-300 ${
                  mobileOpen ? "opacity-0 scale-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 bg-espresso rounded-full transition-all duration-300 ${
                  mobileOpen ? "-rotate-45 -translate-y-[7px]" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-cream/98 backdrop-blur-lg shadow-xl transition-all duration-400 ${
          mobileOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <nav className="container-custom py-6 flex flex-col gap-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-3 rounded-xl text-base font-medium transition-colors duration-200 ${
                pathname === item.href
                  ? "bg-espresso/5 text-espresso"
                  : "text-text-secondary hover:bg-espresso/5 hover:text-espresso"
              }`}
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/menu"
            className="btn-primary mt-4 text-center"
          >
            Замовити онлайн
          </Link>
        </nav>
      </div>
    </header>
  );
}
