import React, { useState } from 'react';
import { 
  Crown, Star, Zap, TrendingUp, BarChart3, Brain, 
  Shield, Clock, Users, Check, X 
} from 'lucide-react';

interface PlanFeature {
  name: string;
  included: boolean;
  premium?: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  color: string;
  icon: React.ComponentType<any>;
}

const SubscriptionPlans: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Miễn phí',
      price: 0,
      period: 'tháng',
      description: 'Dành cho nhà đầu tư cá nhân mới bắt đầu',
      color: 'slate',
      icon: Users,
      features: [
        { name: '10 mã cổ phiếu VN30', included: true },
        { name: 'Dữ liệu 30 ngày', included: true },
        { name: 'Biểu đồ cơ bản', included: true },
        { name: 'Chỉ số kỹ thuật cơ bản', included: true },
        { name: 'Dữ liệu realtime', included: false },
        { name: 'AI Analysis', included: false },
        { name: 'Cảnh báo giá', included: false },
        { name: 'Xuất báo cáo', included: false },
        { name: 'Hỗ trợ 24/7', included: false }
      ]
    },
    {
      id: 'pro',
      name: 'Chuyên nghiệp',
      price: billingCycle === 'monthly' ? 299000 : 2990000,
      period: billingCycle === 'monthly' ? 'tháng' : 'năm',
      description: 'Dành cho trader và nhà đầu tư chuyên nghiệp',
      color: 'blue',
      icon: TrendingUp,
      popular: true,
      features: [
        { name: 'Toàn bộ VN100 (120+ mã)', included: true },
        { name: 'Dữ liệu 2 năm', included: true },
        { name: 'Biểu đồ nâng cao', included: true },
        { name: 'Tất cả chỉ số kỹ thuật', included: true },
        { name: 'Dữ liệu realtime', included: true },
        { name: 'AI Analysis cơ bản', included: true },
        { name: 'Cảnh báo giá (50/ngày)', included: true },
        { name: 'Xuất báo cáo PDF', included: true },
        { name: 'Hỗ trợ email', included: true }
      ]
    },
    {
      id: 'enterprise',
      name: 'Doanh nghiệp',
      price: billingCycle === 'monthly' ? 999000 : 9990000,
      period: billingCycle === 'monthly' ? 'tháng' : 'năm',
      description: 'Dành cho quỹ đầu tư và tổ chức tài chính',
      color: 'purple',
      icon: Crown,
      features: [
        { name: 'Toàn bộ thị trường (500+ mã)', included: true, premium: true },
        { name: 'Dữ liệu 5 năm', included: true, premium: true },
        { name: 'Biểu đồ chuyên nghiệp', included: true },
        { name: 'Chỉ số độc quyền', included: true, premium: true },
        { name: 'Dữ liệu tick-by-tick', included: true, premium: true },
        { name: 'AI Analysis nâng cao', included: true, premium: true },
        { name: 'Cảnh báo không giới hạn', included: true, premium: true },
        { name: 'API truy cập', included: true, premium: true },
        { name: 'Hỗ trợ 24/7 + Hotline', included: true, premium: true }
      ]
    }
  ];

  const getDiscountPercent = () => {
    return billingCycle === 'yearly' ? 17 : 0; // 2 tháng miễn phí
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="text-yellow-500" size={32} />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              FinSensei AI Premium
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Nâng tầm phân tích đầu tư với công nghệ AI hàng đầu
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
              Hàng tháng
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
              Hàng năm
            </span>
            {billingCycle === 'yearly' && (
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-bold px-2 py-1 rounded-full">
                Tiết kiệm {getDiscountPercent()}%
              </span>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-8 transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? 'border-blue-500 bg-white dark:bg-slate-800 shadow-2xl shadow-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              } ${selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <Star size={14} />
                    Phổ biến nhất
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  plan.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' :
                  plan.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' :
                  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  <plan.icon size={24} />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    {plan.price.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">₫/{plan.period}</span>
                  {billingCycle === 'yearly' && plan.price > 0 && (
                    <div className="text-sm text-slate-500 dark:text-slate-400 line-through">
                      {Math.round(plan.price * 12 / 10).toLocaleString('vi-VN')}₫/năm
                    </div>
                  )}
                </div>
                
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className={`w-5 h-5 ${feature.premium ? 'text-purple-500' : 'text-green-500'}`} />
                    ) : (
                      <X className="w-5 h-5 text-slate-400" />
                    )}
                    <span className={`text-sm ${
                      feature.included 
                        ? feature.premium 
                          ? 'text-purple-600 dark:text-purple-400 font-medium' 
                          : 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all duration-300 ${
                  plan.id === 'free'
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    : plan.popular
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                }`}
              >
                {plan.id === 'free' ? 'Sử dụng miễn phí' : 'Bắt đầu ngay'}
              </button>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            So sánh tính năng chi tiết
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-blue-500" size={20} />
                <h3 className="font-bold text-slate-900 dark:text-white">Dữ liệu & Biểu đồ</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>• Biểu đồ nến chuyên nghiệp</li>
                <li>• Chỉ số kỹ thuật đầy đủ</li>
                <li>• Dữ liệu lịch sử sâu</li>
                <li>• Cập nhật realtime</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="text-purple-500" size={20} />
                <h3 className="font-bold text-slate-900 dark:text-white">AI Analysis</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>• Phân tích tâm lý thị trường</li>
                <li>• Dự đoán xu hướng</li>
                <li>• Tín hiệu mua/bán</li>
                <li>• Đánh giá rủi ro</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="text-yellow-500" size={20} />
                <h3 className="font-bold text-slate-900 dark:text-white">Cảnh báo</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>• Cảnh báo giá target</li>
                <li>• Thông báo breakout</li>
                <li>• Alert volume bất thường</li>
                <li>• Tin tức quan trọng</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="text-green-500" size={20} />
                <h3 className="font-bold text-slate-900 dark:text-white">Hỗ trợ</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>• Hướng dẫn sử dụng</li>
                <li>• Webinar định kỳ</li>
                <li>• Cộng đồng trader</li>
                <li>• Tư vấn 1-1</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Sẵn sàng nâng tầm đầu tư của bạn?
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Tham gia cùng 10,000+ nhà đầu tư thông minh đang sử dụng FinSensei AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors">
                Dùng thử miễn phí 7 ngày
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white hover:text-blue-600 transition-colors">
                Xem demo trực tiếp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;