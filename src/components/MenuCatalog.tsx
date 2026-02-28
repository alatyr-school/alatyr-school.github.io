"use client";

import React, { useState, useMemo, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/data/products";

export interface Category {
  id: string;
  name: string;
  icon: string;
}

interface MenuCatalogProps {
  products: Product[];
  categories: Category[];
}

export default function MenuCatalog({ products, categories }: MenuCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSticky, setIsSticky] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 180);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Page Header - Hero-like banner */}
      <header className="relative h-[40vh] min-h-[280px] flex flex-col items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-espresso/90 via-mocha/80 to-chocolate/90"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />
        <div className="relative z-10 container-custom text-center px-4">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-lg animate-[fade-in_0.6s_ease-out_forwards]">
            Наше Меню
          </h1>
          <p className="text-latte/95 text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed animate-[fade-in_0.8s_ease-out_0.2s_forwards]">
            Відкрийте різноманіття смаків — від класичної кави та чаю до свіжих
            десертів та сніданків. Кожна страва створена з любов&apos;ю та найкращих
            інгредієнтів.
          </p>
        </div>
      </header>

      {/* Sticky Category Filter */}
      <div
        className={`sticky top-0 z-30 transition-all duration-300 ${
          isSticky ? "bg-cream/95 backdrop-blur-md shadow-md" : "bg-cream"
        }`}
      >
        <div className="container-custom py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-medium
                  transition-all duration-300 ease-out whitespace-nowrap
                  ${
                    selectedCategory === cat.id
                      ? "bg-espresso text-white shadow-lg shadow-espresso/25 scale-105"
                      : "bg-cream-dark text-text-secondary hover:bg-warm hover:text-espresso border border-border/60"
                  }`}
              >
                <span className="text-lg" aria-hidden>
                  {cat.icon}
                </span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <section className="section-padding">
        <div className="container-custom">
          {filteredProducts.length > 0 ? (
            <div
              key={selectedCategory}
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8
                ${mounted ? "opacity-100" : "opacity-0"}
                transition-opacity duration-500`}
            >
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-[slide-up_0.5s_ease-out_forwards]"
                  style={{
                    animationDelay: `${Math.min(index * 50, 300)}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-6xl mb-6 opacity-40" aria-hidden>
                ☕
              </span>
              <h2 className="font-heading text-2xl text-text-primary mb-3">
                Поки що порожньо
              </h2>
              <p className="text-text-muted max-w-md mb-8">
                У цій категорії ще немає позицій. Обирайте іншу категорію або
                завітайте до нас пізніше — ми постійно оновлюємо меню.
              </p>
              <button
                onClick={() => setSelectedCategory("all")}
                className="btn-primary"
              >
                Переглянути все меню
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
