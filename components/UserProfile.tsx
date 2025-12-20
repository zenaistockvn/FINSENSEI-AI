
import React from 'react';
import { User, PlanType } from '../types';
import { Check, Shield, Crown, CreditCard, Star, User as UserIcon, Edit3, Calendar, Mail } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpgrade: (plan: PlanType) => void;
  isDark: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpgrade, isDark }) => {
  
  const plans = [
    {
      id: 'basic',
      name: 'Cơ bản',
      price: 'Miễn phí',
      period: 'vĩnh viễn',
      icon: UserIcon,
      color: 'text-slate-500',
      bg: 'bg-slate-100 dark:bg-slate-800',
      border: 'border-slate-200 dark:border-slate-700',
      features: [
        'Dữ liệu thị trường chậm 15p',
        'Phân tích kỹ thuật cơ bản',
        'Chat với Sen AI (Giới hạn 10 câu/ngày)',
        'Xem tin tức tổng hợp'
      ],
      cta: 'Đang sử dụng',
      disabled: true
    },
    {
      id: 'vip',
      name: 'VIP',
      price: '199.000đ',
      period: '/ tháng',
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/10 dark:to-[#0b0f19]',
      border: 'border-amber-200 dark:border-amber-500/30',
      popular: true,
      features: [
        'Dữ liệu Real-time',
        'Bộ lọc AI nâng cao',
        'Chat với Sen AI không giới hạn',
        'Phân tích báo cáo tài chính tự động',
        'Không quảng cáo'
      ],
      cta: 'Nâng cấp VIP'
    },
    {
      id: 'expert',
      name: 'Expert',
      price: '499.000đ',
      period: '/ tháng',
      icon: Crown,
      color: 'text-indigo-500',
      bg: 'bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-900/10 dark:to-[#0b0f19]',
      border: 'border-indigo-200 dark:border-indigo-500/30',
      features: [
        'Mọi quyền lợi của gói VIP',
        'Danh mục Guru & Tín hiệu sớm',
        'Truy cập Sen AI Pro (Model 3.0)',
        'Báo cáo chiến lược tuần độc quyền',
        'Hỗ trợ 1-1 từ chuyên gia'
      ],
      cta: 'Trở thành Expert'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      
      {/* User Header */}
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden border-t border-slate-200 dark:border-white/5">
         <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500">
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-[#0b0f19]" />
                </div>
                <div className="absolute bottom-2 right-2 bg-slate-900 text-white p-2 rounded-full border-2 border-white dark:border-[#0b0f19] cursor-pointer hover:bg-indigo-600 transition-colors">
                    <Edit3 size={16} />
                </div>
            </div>

            <div className="text-center md:text-left flex-1 space-y-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-3">
                        {user.name}
                        {user.plan !== 'basic' && (
                            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
                                {user.plan}
                            </span>
                        )}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-slate-500 dark:text-slate-400 text-sm">
                        <div className="flex items-center gap-1.5">
                            <Mail size={14} className="text-indigo-500" />
                            {user.email}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-indigo-500" />
                            Gia nhập: {user.memberSince}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 shadow-sm">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Hạng thành viên</span>
                        <div className="flex items-center gap-2">
                             {user.plan === 'expert' ? <Crown size={14} className="text-indigo-500" /> : <Star size={14} className="text-amber-500" />}
                            <span className="font-bold text-slate-900 dark:text-white capitalize">{user.plan}</span>
                        </div>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 shadow-sm">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Giới hạn AI</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                            {user.plan === 'basic' ? '10 câu/ngày' : 'Không giới hạn'}
                        </span>
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* Subscription Plans */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <CreditCard className="text-indigo-500" /> Nâng cấp đặc quyền
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
                <div 
                    key={plan.id}
                    className={`relative rounded-2xl p-6 border transition-all duration-300 flex flex-col ${plan.bg} ${plan.border} ${
                        user.plan === plan.id 
                            ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-[#050511]' 
                            : 'hover:-translate-y-2 hover:shadow-xl'
                    }`}
                >
                    {plan.popular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-4 py-1 rounded-full shadow-lg">
                            ĐƯỢC TIN DÙNG NHẤT
                        </div>
                    )}

                    <div className="mb-6">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                            plan.id === 'expert' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 
                            plan.id === 'vip' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 border border-amber-200' : 
                            'bg-slate-200 dark:bg-slate-700 text-slate-600'
                        }`}>
                            <plan.icon size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className={`text-3xl font-bold ${plan.color}`}>{plan.price}</span>
                            <span className="text-slate-500 text-sm">{plan.period}</span>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                        {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className={`mt-0.5 rounded-full p-0.5 ${
                                    user.plan === plan.id ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                }`}>
                                    <Check size={12} />
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => onUpgrade(plan.id as PlanType)}
                        disabled={user.plan === plan.id || (user.plan === 'expert' && plan.id !== 'expert')}
                        className={`w-full py-3 rounded-xl font-bold transition-all ${
                            user.plan === plan.id
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-default'
                                : plan.id === 'expert'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                                    : plan.id === 'vip'
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/30'
                                        : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                        {user.plan === plan.id ? 'Đang sử dụng' : plan.cta}
                    </button>
                </div>
            ))}
        </div>
      </div>
      
      {/* Settings Section */}
      <div className="glass-panel p-6 rounded-2xl border-t border-slate-200 dark:border-white/5 mt-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Cài đặt bảo mật</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group">
                  <div>
                      <span className="block font-medium text-slate-900 dark:text-white">Đổi mật khẩu</span>
                      <span className="text-xs text-slate-500">Bảo vệ tài khoản của bạn</span>
                  </div>
                  <Shield size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </button>
               <button className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group">
                  <div>
                      <span className="block font-medium text-slate-900 dark:text-white">Phương thức thanh toán</span>
                      <span className="text-xs text-slate-500">Quản lý thẻ và ví điện tử</span>
                  </div>
                  <CreditCard size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </button>
          </div>
      </div>

    </div>
  );
};

export default UserProfile;
