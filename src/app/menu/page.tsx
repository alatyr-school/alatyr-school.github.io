import { products, categories } from "@/data/products";
import MenuCatalog from "@/components/MenuCatalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Меню — Café Vitalia",
  description:
    "Преміальна кава, чай, десерти, випічка та сніданки. Відкрийте різноманіття смаків Café Vitalia — кожна страва створена з любов'ю.",
  openGraph: {
    title: "Меню — Café Vitalia",
    description:
      "Преміальна кава, чай, десерти, випічка та сніданки. Відкрийте різноманіття смаків Café Vitalia.",
  },
};

export default function MenuPage() {
  return <MenuCatalog products={products} categories={categories} />;
}
