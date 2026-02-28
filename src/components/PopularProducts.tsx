"use client";

import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/data/products";

interface PopularProductsProps {
  products: Product[];
}

export default function PopularProducts({ products }: PopularProductsProps) {
  const displayProducts = products.slice(0, 8);

  return (
    <section className="section-padding bg-cream">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-text-primary mb-4 animate-[fade-in_0.6s_ease-out_forwards]">
            Хіти продажів
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Найулюбленіші позиції наших гостей — перевірена якість та неперевершений смак
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {displayProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-[slide-up_0.6s_ease-out_forwards]"
              style={{ animationDelay: `${Math.min(index * 80, 400)}ms`, animationFillMode: "both" }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/menu" className="btn-secondary">
            Переглянути повне меню
          </Link>
        </div>
      </div>
    </section>
  );
}
