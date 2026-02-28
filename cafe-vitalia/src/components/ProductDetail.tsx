"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/data/products";
import RelatedProducts from "@/components/RelatedProducts";

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
}

function getOptionPriceModifier(
  product: Product,
  selectedOptions: Record<string, string>
): number {
  if (!product.options) return 0;
  return product.options.reduce((sum, opt) => {
    const choice = opt.choices.find((c) => c.name === selectedOptions[opt.label]);
    return sum + (choice?.priceModifier ?? 0);
  }, 0);
}

export default function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const { addItem } = useCart();

  const initialOptions: Record<string, string> = useMemo(() => {
    const opts: Record<string, string> = {};
    product.options?.forEach((opt) => {
      opts[opt.label] = opt.choices[0]?.name ?? "";
    });
    return opts;
  }, [product.options]);

  const [selectedOptions, setSelectedOptions] =
    useState<Record<string, string>>(initialOptions);
  const [quantity, setQuantity] = useState(1);

  const totalPrice = useMemo(() => {
    const modifier = getOptionPriceModifier(product, selectedOptions);
    return (product.price + modifier) * quantity;
  }, [product.price, product, selectedOptions, quantity]);

  const handleOptionSelect = (label: string, choiceName: string) => {
    setSelectedOptions((prev) => ({ ...prev, [label]: choiceName }));
  };

  const handleAddToCart = () => {
    const modifier = getOptionPriceModifier(product, selectedOptions);
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price + modifier,
      quantity,
      selectedOptions: Object.keys(selectedOptions).length ? selectedOptions : undefined,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="section-padding pt-8 pb-4">
        <div className="container-custom">
          <nav
            className="text-sm text-text-muted"
            aria-label="Breadcrumb"
          >
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href="/"
                  className="hover:text-espresso transition-colors duration-200"
                >
                  Головна
                </Link>
              </li>
              <li className="text-border">/</li>
              <li>
                <Link
                  href="/menu"
                  className="hover:text-espresso transition-colors duration-200"
                >
                  Меню
                </Link>
              </li>
              <li className="text-border">/</li>
              <li className="text-text-primary font-medium" aria-current="page">
                {product.name}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Product Section */}
      <section className="section-padding pt-4">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Image */}
            <div className="relative aspect-[4/3] lg:aspect-square rounded-2xl overflow-hidden shadow-xl shadow-espresso/10 group">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>

            {/* Right: Details */}
            <div className="flex flex-col gap-6">
              {product.badge && (
                <span className="inline-flex w-fit px-4 py-1.5 bg-caramel/20 text-caramel font-medium rounded-full text-sm">
                  {product.badge}
                </span>
              )}

              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-text-primary leading-tight">
                {product.name}
              </h1>

              <p className="text-lg text-text-secondary leading-relaxed">
                {product.shortDescription}
              </p>

              <div className="text-3xl font-semibold text-espresso">
                {totalPrice} ₴
              </div>

              {/* Options */}
              {product.options && product.options.length > 0 && (
                <div className="space-y-6">
                  {product.options.map((option) => (
                    <div key={option.label}>
                      <label className="block text-sm font-medium text-text-primary mb-3">
                        {option.label}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {option.choices.map((choice) => {
                          const isSelected =
                            selectedOptions[option.label] === choice.name;
                          return (
                            <button
                              key={choice.name}
                              type="button"
                              onClick={() =>
                                handleOptionSelect(option.label, choice.name)
                              }
                              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200
                                ${
                                  isSelected
                                    ? "bg-espresso text-white shadow-md"
                                    : "bg-cream-dark text-text-secondary hover:bg-warm hover:text-text-primary border border-border"
                                }`}
                            >
                              {choice.name}
                              {choice.priceModifier > 0 && (
                                <span className="ml-1 opacity-80">
                                  +{choice.priceModifier} ₴
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Кількість
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-12 h-12 rounded-full border border-border bg-white text-espresso font-medium
                             hover:bg-cream-dark hover:border-espresso/50 transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity <= 1}
                    aria-label="Зменшити кількість"
                  >
                    −
                  </button>
                  <span className="w-14 text-center text-lg font-semibold text-text-primary">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-12 h-12 rounded-full border border-border bg-white text-espresso font-medium
                             hover:bg-cream-dark hover:border-espresso/50 transition-all duration-200"
                    aria-label="Збільшити кількість"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="btn-accent w-full py-4 text-lg"
              >
                Додати в кошик — {totalPrice} ₴
              </button>

              {/* Ingredients */}
              {product.ingredients && (
                <div className="pt-6 border-t border-border/60">
                  <h3 className="text-sm font-medium text-text-muted mb-2">
                    Склад / інгредієнти
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {product.ingredients}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
