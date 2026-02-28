import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-espresso text-white/80">
      <div className="container-custom py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-caramel flex items-center justify-center">
                <span className="text-white font-heading text-lg font-bold">V</span>
              </div>
              <span className="font-heading text-xl font-semibold text-white">
                Café Vitalia
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/60 mb-6">
              Specialty кава, свіжа випічка та натуральні десерти в серці міста.
              Кожна чашка — це історія смаку.
            </p>
            <div className="flex gap-3">
              {["Instagram", "Facebook", "TikTok"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm text-white/70 hover:bg-caramel hover:text-white transition-all duration-300"
                >
                  {social[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-heading text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Навігація
            </h4>
            <ul className="space-y-2.5">
              {[
                { name: "Головна", href: "/" },
                { name: "Меню", href: "/menu" },
                { name: "Про нас", href: "/about" },
                { name: "Контакти", href: "/contacts" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-caramel transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Каталог
            </h4>
            <ul className="space-y-2.5">
              {["Кава", "Чай", "Десерти", "Випічка", "Сніданки", "Подарунки"].map(
                (cat) => (
                  <li key={cat}>
                    <Link
                      href="/menu"
                      className="text-sm text-white/60 hover:text-caramel transition-colors duration-200"
                    >
                      {cat}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Контакти
            </h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="text-caramel mt-0.5">📍</span>
                <span>вул. Хрещатик, 22, Київ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-caramel mt-0.5">📞</span>
                <a href="tel:+380441234567" className="hover:text-caramel transition-colors">
                  +38 (044) 123-45-67
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-caramel mt-0.5">🕐</span>
                <span>Пн–Пт: 7:30–22:00<br/>Сб–Нд: 9:00–23:00</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-caramel mt-0.5">✉️</span>
                <a href="mailto:hello@cafevitalia.ua" className="hover:text-caramel transition-colors">
                  hello@cafevitalia.ua
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Café Vitalia. Усі права захищені.
          </p>
          <div className="flex gap-6 text-xs text-white/40">
            <a href="#" className="hover:text-white/70 transition-colors">
              Політика конфіденційності
            </a>
            <a href="#" className="hover:text-white/70 transition-colors">
              Умови використання
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
