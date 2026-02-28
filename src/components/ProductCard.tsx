"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: 1,
    });
  };

  return (
    <Link href={`/menu/${product.id}`} className="group block">
      <div className="card h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {product.badge && (
            <span className="absolute top-3 left-3 px-3 py-1 bg-caramel text-white text-xs font-semibold rounded-full shadow-lg">
              {product.badge}
            </span>
          )}

          {/* Quick Add Button */}
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center
                     opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                     transition-all duration-300 hover:bg-caramel hover:text-white text-espresso"
            aria-label="Додати в кошик"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <div className="flex-1">
            <h3 className="font-heading text-lg font-semibold text-text-primary mb-1 group-hover:text-espresso transition-colors duration-200">
              {product.name}
            </h3>
            <p className="text-sm text-text-muted leading-relaxed line-clamp-2">
              {product.shortDescription}
            </p>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <span className="text-lg font-semibold text-espresso">
              {product.price} ₴
            </span>
            <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Детальніше →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
