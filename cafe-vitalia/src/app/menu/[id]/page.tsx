import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProductById,
  getRelatedProducts,
  products,
} from "@/data/products";
import ProductDetail from "@/components/ProductDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) {
    return { title: "Товар не знайдено | Café Vitalia" };
  }
  return {
    title: `${product.name} | Café Vitalia`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} | Café Vitalia`,
      description: product.shortDescription,
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(id);

  return (
    <ProductDetail product={product} relatedProducts={relatedProducts} />
  );
}
