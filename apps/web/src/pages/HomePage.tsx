import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShoppingBag, Zap, Heart, Trophy } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Дофаминовые покупки без последствий
          </motion.div>
          <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Покупайте без <span className="text-primary-600">границ</span>
            <br />
            и без <span className="text-accent-500">потерь</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
            Полный опыт шоппинга: каталог, корзина, оплата и доставка — всё настоящее, кроме денег.
            Получайте удовольствие без затрат.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors text-lg"
            >
              <ShoppingBag className="w-5 h-5" />
              Начать шоппинг
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Мгновенные покупки</h3>
              <p className="text-sm text-slate-500">Без реальных платежей. Просто удовольствие от процесса.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-accent-100 text-accent-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Избранное</h3>
              <p className="text-sm text-slate-500">Сохраняйте товары и получайте фейковые уведомления о скидках.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Достижения</h3>
              <p className="text-sm text-slate-500">Собирайте бейджи, стройте серии и становитесь королём шоппинга.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
