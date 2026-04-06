import Link from "next/link";

export default function Home() {
  return (
    <div
      className="min-h-screen bg-wedding-beige text-wedding-brown font-sans"
      dir="rtl"
    >
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 text-center border-b border-wedding-sand/30">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-serif font-bold text-wedding-dark mb-8 tracking-tight">
            החתונה שלכם. <br />
            <span className="italic opacity-80 text-wedding-brown">
              פשוטה. חכמה. אלגנטית.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-stone-600 mb-12 leading-relaxed max-w-2xl mx-auto font-light">
            אנחנו יודעים שארגון חתונה יכול להיות כאוס. יצרנו עבורכם את הכלים
            המתקדמים ביותר לניהול מוזמנים, תקציב ואלכוהול – הכל במקום אחד,
            בסטייל שמתאים ליום המיוחד שלכם.
          </p>
          <div className="flex justify-center gap-6">
            <Link
              href="/guests"
              className="bg-wedding-dark border-2 border-wedding-dark text-wedding-beige px-10 py-4 rounded-full font-bold hover:bg-stone-800 hover:border-stone-800 hover:text-white transition-all shadow-xl scale-110"
            >
              התחילו עכשיו
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Feature 1 */}
          <div className="group p-8 rounded-3xl bg-white/40 border border-wedding-sand hover:bg-white/80 transition-all duration-500">
            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform inline-block">
              📋
            </div>
            <h3 className="text-2xl font-bold text-wedding-dark mb-4">
              ניהול מוזמנים חכם
            </h3>
            <p className="text-stone-500 leading-relaxed font-light">
              ייבוא מהיר מאקסל, מעקב אחרי אישורי הגעה וחלוקה לצדדים בצורה
              ויזואלית ונוחה. שום אורח לא יישכח מאחור.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-8 rounded-3xl bg-white/40 border border-wedding-sand hover:bg-white/80 transition-all duration-500">
            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform inline-block">
              🍾
            </div>
            <h3 className="text-2xl font-bold text-wedding-dark mb-4">
              מחשבון אלכוהול
            </h3>
            <p className="text-stone-500 leading-relaxed font-light">
              מערכת מבוססת נתונים שתחשב לכם בדיוק כמה בקבוקים לקנות לפי הרכב
              האורחים שלכם. חוסכים כסף ומונעים חוסרים בבר.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-8 rounded-3xl bg-white/40 border border-wedding-sand hover:bg-white/80 transition-all duration-500">
            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform inline-block">
              💰
            </div>
            <h3 className="text-2xl font-bold text-wedding-dark mb-4">
              בקרת תקציב
            </h3>
            <p className="text-stone-500 leading-relaxed font-light">
              ניהול הוצאות מול ספקים בזמן אמת. דעו בכל רגע איפה אתם עומדים ומנעו
              חריגות לא מתוכננות בתקציב.
            </p>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="bg-wedding-dark py-20 px-6 text-center text-wedding-beige overflow-hidden relative">
        <div className="max-w-3xl mx-auto relative z-10">
          <p className="text-3xl font-serif italic mb-6">
            "הדרך הכי טובה לחגוג את האהבה שלכם היא להגיע ליום החתונה בראש שקט."
          </p>
          <p className="font-bold uppercase tracking-widest text-sm opacity-60">
            Wedding AI Team
          </p>
        </div>
        {/* קישוט רקע קטן */}
        <div className="absolute -bottom-10 -right-10 text-[200px] opacity-5 select-none pointer-events-none">
          🤍
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center text-stone-400 text-sm font-light">
        © 2026 Wedding AI - מיוצר באהבה עבור סיוון ותומר
      </footer>
    </div>
  );
}
