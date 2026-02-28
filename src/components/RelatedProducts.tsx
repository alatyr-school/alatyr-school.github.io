"use client";

import React from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/data/products";

interface RelatedProductsProps {
  products: Product[];
  title?: string;
}

export default function RelatedProducts({
  products,
  title = "До цього товару також замовляють",
}: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="section-padding bg-cream-dark/50">
      <div className="container-custom">
        <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-text-primary mb-10">
          {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
