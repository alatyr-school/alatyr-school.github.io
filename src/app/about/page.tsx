import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Про нас — Café Vitalia",
  description:
    "Історія Café Vitalia, наша філософія та команда. Дізнайтесь більше про нашу пристрасть до якісної кави та натуральних інгредієнтів.",
};

const team = [
  {
    name: "Марко Вітальєв",
    role: "Засновник та шеф-бариста",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    description: "15 років у кавовій індустрії. Навчався у Італії та Колумбії.",
  },
  {
    name: "Анна Коваленко",
    role: "Шеф-кондитер",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    description: "Випускниця Le Cordon Bleu. Створює десерти, що стають мистецтвом.",
  },
  {
    name: "Дмитро Петренко",
    role: "Головний Q-грейдер",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    description: "Сертифікований SCA. Відповідає за якість кожної партії зерна.",
  },
];

const values = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    title: "Пристрасть до якості",
    description: "Кожен інгредієнт ретельно відбирається. Ми працюємо напряму з фермерами та обираємо лише найкраще зерно врожаю.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
    title: "Свіжість щодня",
    description: "Випічка готується кожного ранку. Кава обсмажується щотижня. Ми не визнаємо компромісів у свіжості.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: "Спільнота",
    description: "Café Vitalia — це не просто кав'ярня. Це місце зустрічей, натхнення та теплих моментів.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438a2.25 2.25 0 01-1.228 2.39l-.018.009a6.004 6.004 0 01-.425.152C5.046 20.346 3.75 17.823 3.75 15" />
      </svg>
    ),
    title: "Сталий розвиток",
    description: "Ми підтримуємо еко-практики: біорозкладний посуд, локальні постачальники та мінімум відходів.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=1800&q=80"
          alt="Інтер'єр Café Vitalia"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-chocolate/60 via-espresso/50 to-chocolate/70" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Про нас
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Історія пристрасті до кави, якості та мистецтва гостинності
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="section-padding bg-cream">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-espresso/10">
                <Image
                  src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80"
                  alt="Початок історії Café Vitalia"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-caramel/20 rounded-full blur-2xl" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-espresso/10 rounded-full blur-xl" />
            </div>

            <div>
              <span className="text-caramel font-medium text-sm uppercase tracking-widest">
                Наша історія
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary mt-3 mb-6">
                Від мрії до чашки
              </h2>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>
                  Café Vitalia народилося у 2018 році з простої ідеї: створити місце,
                  де кожна чашка кави — це подорож. Засновник Марко Вітальєв, після
                  років подорожей кавовими плантаціями Ефіопії, Колумбії та Коста-Ріки,
                  вирішив принести найкращі кавові традиції світу до Києва.
                </p>
                <p>
                  Ми починали як маленька кав'ярня на 20 місць, а сьогодні ми —
                  улюблене місце для тисяч поціновувачів кави. Але одне залишається
                  незмінним: наша одержимість якістю. Кожне зерно проходить ретельний
                  відбір, кожен десерт створюється вручну, кожен гість відчуває справжню
                  гостинність.
                </p>
                <p>
                  Сьогодні Café Vitalia — це більше, ніж кав'ярня. Це спільнота людей,
                  які цінують справжній смак, затишну атмосферу та мистецтво кавового
                  ремесла.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-10">
                <div className="text-center">
                  <span className="block font-heading text-3xl font-bold text-espresso">7+</span>
                  <span className="text-sm text-text-muted">років досвіду</span>
                </div>
                <div className="text-center">
                  <span className="block font-heading text-3xl font-bold text-espresso">50K+</span>
                  <span className="text-sm text-text-muted">чашок на місяць</span>
                </div>
                <div className="text-center">
                  <span className="block font-heading text-3xl font-bold text-espresso">12</span>
                  <span className="text-sm text-text-muted">країн-постачальників</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-cream-dark">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="text-caramel font-medium text-sm uppercase tracking-widest">
              Наші цінності
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary mt-3">
              Що нами рухає
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-xl hover:shadow-espresso/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-16 h-16 rounded-2xl bg-caramel/10 text-caramel flex items-center justify-center mx-auto mb-5">
                  {value.icon}
                </div>
                <h3 className="font-heading text-lg font-semibold text-text-primary mb-3">
                  {value.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section-padding bg-cream">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="text-caramel font-medium text-sm uppercase tracking-widest">
              Наш процес
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary mt-3">
              Від зерна до чашки
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Відбір зерна",
                description: "Наш Q-грейдер особисто відвідує плантації та обирає зерно з оцінкою 85+ балів за стандартами SCA.",
                image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80",
              },
              {
                step: "02",
                title: "Щотижнева обсмажка",
                description: "Зерно обсмажується щотижня малими партіями для збереження максимальної свіжості та розкриття смакового профілю.",
                image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=600&q=80",
              },
              {
                step: "03",
                title: "Мистецтво приготування",
                description: "Наші бариста — сертифіковані професіонали, що перетворюють кожну чашку на витвір кавового мистецтва.",
                image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
              },
            ].map((item) => (
              <div key={item.step} className="group">
                <div className="relative aspect-[3/2] rounded-2xl overflow-hidden mb-6">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-caramel text-white font-heading text-lg font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-heading text-xl font-semibold text-text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-text-muted leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-cream-dark">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="text-caramel font-medium text-sm uppercase tracking-widest">
              Наша команда
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary mt-3">
              Люди, які створюють магію
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member) => (
              <div key={member.name} className="text-center group">
                <div className="relative w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden shadow-lg shadow-espresso/10">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <h3 className="font-heading text-lg font-semibold text-text-primary">
                  {member.name}
                </h3>
                <p className="text-sm text-caramel font-medium mb-2">{member.role}</p>
                <p className="text-sm text-text-muted">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-espresso text-white text-center">
        <div className="container-custom max-w-3xl">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Приходьте на каву
          </h2>
          <p className="text-white/70 text-lg mb-10 leading-relaxed">
            Ми завжди раді бачити вас у Café Vitalia. Завітайте, щоб відчути
            атмосферу, спробувати нашу каву та стати частиною нашої спільноти.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/menu"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-caramel text-white font-medium rounded-full transition-all duration-300 hover:bg-accent-hover hover:shadow-lg hover:-translate-y-0.5"
            >
              Замовити онлайн
            </Link>
            <Link
              href="/contacts"
              className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-white/30 text-white font-medium rounded-full transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5"
            >
              Як нас знайти
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
