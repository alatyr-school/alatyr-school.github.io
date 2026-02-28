import Link from "next/link";
import Image from "next/image";
import { getPopularProducts } from "@/data/products";
import PopularProducts from "@/components/PopularProducts";

export default function HomePage() {
  const popularProducts = getPopularProducts();

  return (
    <>
      {/* 1. Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1800&q=80"
            alt="Café Vitalia — атмосфера кав'ярні"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70"
            aria-hidden
          />
        </div>

        <div className="relative z-10 container-custom text-center text-white px-4">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 animate-[fade-in_0.6s_ease-out_forwards] leading-tight">
            Мистецтво кави у кожній чашці
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/95 mb-10 animate-[fade-in_0.8s_ease-out_0.2s_forwards] leading-relaxed">
            Затишна атмосфера, преміальні інгредієнти та реміснича майстерність — 
            усе для того, щоб кожна зустріч з кавою ставала особливою подією.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-[slide-up_0.6s_ease-out_0.3s_forwards]">
            <Link href="/menu" className="btn-primary bg-espresso hover:bg-chocolate border-0">
              Замовити онлайн
            </Link>
            <Link
              href="/menu"
              className="btn-secondary border-white text-white hover:bg-white hover:text-espresso"
            >
              Переглянути меню
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Features/Benefits Section */}
      <section className="section-padding bg-cream-dark">
        <div className="container-custom">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="card p-8 text-center group">
              <div className="text-4xl mb-4">🥐</div>
              <h3 className="font-heading text-xl font-semibold text-text-primary mb-2">
                Свіжа випічка щоранку
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Круасани, синабони та хліб — випікаємо щодня з натуральних інгредієнтів
              </p>
            </div>
            <div className="card p-8 text-center group">
              <div className="text-4xl mb-4">☕</div>
              <h3 className="font-heading text-xl font-semibold text-text-primary mb-2">
                Specialty кава
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Зерно з найкращих плантацій світу, обсмажка на місці та ідеальна екстракція
              </p>
            </div>
            <div className="card p-8 text-center group">
              <div className="text-4xl mb-4">🚴</div>
              <h3 className="font-heading text-xl font-semibold text-text-primary mb-2">
                Доставка по місту
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Швидка доставка протягом 45 хвилин — кава та випічка ще теплі
              </p>
            </div>
            <div className="card p-8 text-center group">
              <div className="text-4xl mb-4">🌿</div>
              <h3 className="font-heading text-xl font-semibold text-text-primary mb-2">
                Натуральні інгредієнти
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Без штучних добавок — лише якісні продукти та ремісничі рецепти
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Popular Products */}
      <PopularProducts products={popularProducts} />

      {/* 4. Brand Story Section */}
      <section className="section-padding bg-white overflow-hidden">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative aspect-[4/3] lg:aspect-square rounded-2xl overflow-hidden shadow-xl order-2 lg:order-1">
              <Image
                src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80"
                alt="Інтер'єр Café Vitalia"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-text-primary mb-6">
                Наша історія
              </h2>
              <p className="text-text-secondary text-lg leading-relaxed mb-6">
                Café Vitalia народилася з любові до справжньої кави та бажання створювати 
                простір, де кожен відчуває тепло та гостинність. Ми заснували кав'ярню у 2018 році, 
                об'єднавши досвід бариста з різних куточків світу та локальні традиції української 
                гостинності.
              </p>
              <p className="text-text-secondary text-lg leading-relaxed">
                Наша філософія — якість у кожній деталі. Від вибору зерна до останньої краплі 
                в чашці, ми дбаємо про те, щоб ваш досвід був неперевершеним. Кожна страва, 
                кожен напій — це результат ремісничої майстерності та поваги до інгредієнтів.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Reviews/Testimonials */}
      <section className="section-padding bg-cream-dark">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-text-primary mb-4">
              Відгуки гостей
            </h2>
            <p className="text-text-secondary">
              Те, що кажуть про нас ті, хто вже відкрив для себе Café Vitalia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8 bg-white/80">
              <div className="flex gap-1 mb-4 text-caramel">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-text-secondary mb-6 leading-relaxed">
                Найкраща кава в місті! Капучіно завжди ідеальний, а атмосфера така затишна. 
                Обов'язково замовляю тірамісу — воно тут божественне.
              </p>
              <p className="font-semibold text-text-primary">Олександра К.</p>
            </div>
            <div className="card p-8 bg-white/80">
              <div className="flex gap-1 mb-4 text-caramel">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-text-secondary mb-6 leading-relaxed">
                Доставка завжди вчасно, кава приїжджає гарячою. Круасани з шоколадом — 
                моя слабкість. Рекомендую всім, хто цінує якість!
              </p>
              <p className="font-semibold text-text-primary">Андрій М.</p>
            </div>
            <div className="card p-8 bg-white/80">
              <div className="flex gap-1 mb-4 text-caramel">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-text-secondary mb-6 leading-relaxed">
                Ідеальне місце для роботи та зустрічей. Wi‑Fi, розетки, чудова кава — 
                все для комфорту. Персонал завжди привітний та уважний.
              </p>
              <p className="font-semibold text-text-primary">Марія Т.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Mood/Gallery Section */}
      <section className="section-padding bg-cream overflow-hidden">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-text-primary mb-4">
              Атмосфера Café Vitalia
            </h2>
            <p className="text-text-secondary">
              Затишний інтер'єр, реміснича кава та неперевершені смаки
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg md:col-span-1 md:row-span-2 md:self-center">
              <Image
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
                alt="Кава та атмосфера"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&q=80"
                alt="Інтер'єр кав'ярні"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80"
                alt="Приготування кави"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg md:col-span-2">
              <Image
                src="https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=800&q=80"
                alt="Свіжа випічка"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, 66vw"
              />
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80"
                alt="Капучіно"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final CTA Section */}
      <section className="section-padding bg-espresso text-white">
        <div className="container-custom text-center">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold mb-6">
            Завітайте до нас
          </h2>
          <p className="text-white/90 text-lg mb-2">
            вул. Хрещатик, 22
          </p>
          <p className="text-white/80 mb-8">
            Пн–Нд: 8:00 – 22:00
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/menu"
              className="btn-primary bg-white text-espresso hover:bg-cream hover:text-chocolate border-0"
            >
              Замовити онлайн
            </Link>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary border-white text-white hover:bg-white hover:text-espresso"
            >
              Прокласти маршрут
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
