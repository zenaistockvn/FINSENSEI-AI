import React, { useState } from 'react';
import { User, PlanType } from '../types';
import { 
  Check, Shield, Crown, CreditCard, Star, User as UserIcon, Edit3, Calendar, Mail,
  Bell, BellOff, Eye, EyeOff, Lock, LogOut, Trash2, ChevronRight, Activity,
  TrendingUp, Clock, Settings, Smartphone, Globe, Moon, Sun, Save, X,
  BarChart3, Target, Award, Zap, Heart, BookOpen
} from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpgrade: (plan: PlanType) => void;
  isDark: boolean;
}

interface EditFormData {
  name: string;
  email: string;
  phone: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpgrade, isDark }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'settings' | 'activity' | 'subscription'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    name: user.name,
    email: user.email,
    phone: '0912 345 678'
  });
  
  // Settings states
  const [notifications, setNotifications] = useState({
    priceAlert: true,
    newsUpdate: true,
    weeklyReport: false,
    marketOpen: true
  });
  
  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showActivity: false
  });

  // Mock activity data
  const recentActivity = [
    { id: 1, type: 'view', action: 'Xem phân tích', stock: 'VNM', time: '5 phút trước', icon: Eye },
    { id: 2, type: 'alert', action: 'Đặt cảnh báo giá', stock: 'FPT', time: '1 giờ trước', icon: Bell },
    { id: 3, type: 'chat', action: 'Hỏi Sen AI', stock: 'HPG', time: '2 giờ trước', icon: Zap },
    { id: 4, type: 'screener', action: 'Sử dụng bộ lọc AI', stock: '', time: '3 giờ trước', icon: Target },
    { id: 5, type: 'view', action: 'Xem danh mục Guru', stock: 'Warren Buffett', time: '5 giờ trước', icon: BookOpen },
  ];

  // User stats
  const userStats = [
    { label: 'Cổ phiếu đã xem', value: '156', icon: Eye, color: 'text-blue-500' },
    { label: 'Câu hỏi Sen AI', value: user.plan === 'basic' ? '7/10' : '∞', icon: Zap, color: 'text-amber-500' },
    { label: 'Cảnh báo giá', value: '12', icon: Bell, color: 'text-emerald-500' },
    { label: 'Ngày hoạt động', value: '45', icon: Activity, color: 'text-purple-500' },
  ];

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

  const handleSaveProfile = () => {
    // In real app, call API to save
    setIsEditing(false);
    alert('Đã lưu thông tin thành công!');
  };

  const sidebarItems = [
    { id: 'overview', label: 'Tổng quan', icon: UserIcon },
    { id: 'activity', label: 'Hoạt động', icon: Activity },
    { id: 'subscription', label: 'Gói dịch vụ', icon: Crown },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  // Render Overview Section
  const renderOverview = () => (
    <div className="space-y-6">
      {/* User Header Card */}
      <div className="glass-panel p-6 md:p-8 rounded-2xl relative overflow-hidden border-t border-slate-200 dark:border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="relative group">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500">
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-[#0b0f19]" />
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute bottom-2 right-2 bg-slate-900 text-white p-2 rounded-full border-2 border-white dark:border-[#0b0f19] cursor-pointer hover:bg-indigo-600 transition-colors"
            >
              <Edit3 size={16} />
            </button>
            {user.plan !== 'basic' && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 p-1.5 rounded-full border-2 border-white dark:border-[#0b0f19]">
                {user.plan === 'expert' ? <Crown size={14} className="text-white" /> : <Star size={14} className="text-white" />}
              </div>
            )}
          </div>

          <div className="text-center md:text-left flex-1 space-y-3">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full md:w-auto px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Họ và tên"
                />
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full md:w-auto px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Email"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors flex items-center gap-2">
                    <Save size={16} /> Lưu
                  </button>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2">
                    <X size={16} /> Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-3">
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {userStats.map((stat, idx) => (
          <div key={idx} className="glass-panel p-4 rounded-xl border-t border-slate-200 dark:border-white/5 hover:scale-105 transition-transform cursor-default">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color} bg-current/10`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-panel p-6 rounded-2xl border-t border-slate-200 dark:border-white/5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="text-amber-500" size={20} /> Thao tác nhanh
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group">
            <Bell size={24} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Cảnh báo giá</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group">
            <Heart size={24} className="text-slate-400 group-hover:text-red-500 transition-colors" />
            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400">Watchlist</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group">
            <BarChart3 size={24} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Báo cáo</span>
          </button>
          <button 
            onClick={() => setActiveSection('subscription')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-colors group border border-amber-200/50 dark:border-amber-500/20"
          >
            <Crown size={24} className="text-amber-500" />
            <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">Nâng cấp</span>
          </button>
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div className="glass-panel p-6 rounded-2xl border-t border-slate-200 dark:border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="text-indigo-500" size={20} /> Hoạt động gần đây
          </h3>
          <button 
            onClick={() => setActiveSection('activity')}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Xem tất cả <ChevronRight size={16} />
          </button>
        </div>
        <div className="space-y-3">
          {recentActivity.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <item.icon size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900 dark:text-white">{item.action}</div>
                {item.stock && <div className="text-xs text-slate-500">{item.stock}</div>}
              </div>
              <div className="text-xs text-slate-400">{item.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Activity Section
  const renderActivity = () => (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border-t border-slate-200 dark:border-white/5">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Activity className="text-indigo-500" /> Lịch sử hoạt động
        </h3>
        
        <div className="space-y-4">
          {recentActivity.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <item.icon size={22} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-white">{item.action}</div>
                {item.stock && (
                  <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{item.stock}</div>
                )}
              </div>
              <div className="text-sm text-slate-400 flex items-center gap-1">
                <Clock size={14} />
                {item.time}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button className="px-6 py-3 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors">
            Tải thêm hoạt động
          </button>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-xl border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium text-slate-900 dark:text-white">Phân tích nhiều nhất</span>
          </div>
          <div className="space-y-2">
            {['VNM', 'FPT', 'HPG', 'VIC', 'MWG'].map((stock, idx) => (
              <div key={stock} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">{idx + 1}. {stock}</span>
                <span className="text-slate-900 dark:text-white font-medium">{15 - idx * 2} lần</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Zap size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <span className="font-medium text-slate-900 dark:text-white">Câu hỏi Sen AI</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {user.plan === 'basic' ? '7/10' : '156'}
          </div>
          <div className="text-sm text-slate-500">
            {user.plan === 'basic' ? 'Còn 3 câu hỏi hôm nay' : 'Không giới hạn'}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Award size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="font-medium text-slate-900 dark:text-white">Thành tích</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">🔥 7 ngày liên tiếp</span>
            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">📊 100 phân tích</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Settings Section
  const renderSettings = () => (
    <div className="space-y-6">
      {/* Notification Settings */}
      <div className="glass-panel p-6 rounded-2xl border-t border-slate-200 dark:border-white/5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Bell className="text-indigo-500" /> Cài đặt thông báo
        </h3>
        <div className="space-y-4">
          {[
            { key: 'priceAlert', label: 'Cảnh báo giá', desc: 'Nhận thông báo khi giá đạt mức đã đặt' },
            { key: 'newsUpdate', label: 'Tin tức mới', desc: 'Cập nhật tin tức quan trọng về cổ phiếu theo dõi' },
            { key: 'weeklyReport', label: 'Báo cáo tuần', desc: 'Nhận email tổng kết thị trường hàng tuần' },
            { key: 'marketOpen', label: 'Thị trường mở cửa', desc: 'Thông báo khi phiên giao dịch bắt đầu' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{item.label}</div>
                <div className="text-sm text-slate-500">{item.desc}</div>
              </div>
              <button
                onClick={() => setNotifications({...notifications, [item.key]: !notifications[item.key as keyof typeof notifications]})}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications[item.key as keyof typeof notifications] ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  notifications[item.key as keyof typeof notifications] ? 'translate-x-7' : 'translate-x-1'
                }`}></div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="glass-panel p-6 rounded-2xl border-t border-slate-200 dark:border-white/5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Shield className="text-indigo-500" /> Quyền riêng tư
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              {privacy.showProfile ? <Eye size={20} className="text-slate-400" /> : <EyeOff size={20} className="text-slate-400" />}
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Hiển thị hồ sơ công khai</div>
                <div className="text-sm text-slate-500">Cho phép người khác xem hồ sơ của bạn</div>
              </div>
            </div>
            <button
              onClick={() => setPrivacy({...privacy, showProfile: !privacy.showProfile})}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                privacy.showProfile ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                privacy.showProfile ? 'translate-x-7' : 'translate-x-1'
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="glass-panel p-6 rounded-2xl border-t border-slate-200 dark:border-white/5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Lock className="text-indigo-500" /> Bảo mật tài khoản
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group">
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <div>
                <span className="block font-medium text-slate-900 dark:text-white">Đổi mật khẩu</span>
                <span className="text-xs text-slate-500">Cập nhật mật khẩu định kỳ</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>
          <button className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group">
            <div className="flex items-center gap-3">
              <Smartphone size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <div>
                <span className="block font-medium text-slate-900 dark:text-white">Xác thực 2 bước</span>
                <span className="text-xs text-emerald-500">Đã bật</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>
          <button className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <div>
                <span className="block font-medium text-slate-900 dark:text-white">Phiên đăng nhập</span>
                <span className="text-xs text-slate-500">Quản lý thiết bị</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>
          <button className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group">
            <div className="flex items-center gap-3">
              <CreditCard size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <div>
                <span className="block font-medium text-slate-900 dark:text-white">Thanh toán</span>
                <span className="text-xs text-slate-500">Quản lý phương thức</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-panel p-6 rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
          <Trash2 size={20} /> Vùng nguy hiểm
        </h3>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-medium text-slate-900 dark:text-white">Xóa tài khoản</div>
            <div className="text-sm text-slate-500">Xóa vĩnh viễn tài khoản và tất cả dữ liệu</div>
          </div>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors flex items-center gap-2 justify-center">
            <Trash2 size={16} /> Xóa tài khoản
          </button>
        </div>
      </div>
    </div>
  );

  // Render Subscription Section
  const renderSubscription = () => (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="glass-panel p-6 rounded-2xl border-t border-slate-200 dark:border-white/5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Gói hiện tại của bạn</h3>
        <div className={`p-4 rounded-xl border-2 ${
          user.plan === 'expert' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' :
          user.plan === 'vip' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' :
          'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              user.plan === 'expert' ? 'bg-indigo-500 text-white' :
              user.plan === 'vip' ? 'bg-amber-500 text-white' :
              'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              {user.plan === 'expert' ? <Crown size={28} /> : user.plan === 'vip' ? <Star size={28} /> : <UserIcon size={28} />}
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold text-slate-900 dark:text-white capitalize">{user.plan}</div>
              <div className="text-sm text-slate-500">
                {user.plan === 'basic' ? 'Miễn phí vĩnh viễn' : 'Gia hạn: 15/01/2025'}
              </div>
            </div>
            {user.plan !== 'basic' && (
              <button className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Hủy gói
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
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
    </div>
  );

  return (
    <div className="animate-fade-in-up pb-10">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="glass-panel p-4 rounded-2xl border-t border-slate-200 dark:border-white/5 sticky top-4">
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as typeof activeSection)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    activeSection === item.id
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left">
                <LogOut size={20} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {activeSection === 'overview' && renderOverview()}
          {activeSection === 'activity' && renderActivity()}
          {activeSection === 'settings' && renderSettings()}
          {activeSection === 'subscription' && renderSubscription()}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
