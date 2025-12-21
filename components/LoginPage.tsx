import React, { useState } from 'react';
import { 
  Mail, Lock, Eye, EyeOff, User, Hexagon, ArrowRight, 
  Loader2, AlertCircle, CheckCircle, TrendingUp, Shield, Zap
} from 'lucide-react';
import { signIn, signUp, signInWithGoogle, resetPassword } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.success) {
          onLoginSuccess();
        } else {
          setError(result.error || 'Đăng nhập thất bại');
        }
      } else if (mode === 'register') {
        if (password.length < 6) {
          setError('Mật khẩu phải có ít nhất 6 ký tự');
          setIsLoading(false);
          return;
        }
        const result = await signUp(email, password, fullName);
        if (result.success) {
          setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.');
          setMode('login');
        } else {
          setError(result.error || 'Đăng ký thất bại');
        }
      } else if (mode === 'forgot') {
        const result = await resetPassword(email);
        if (result.success) {
          setSuccess('Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hộp thư.');
          setMode('login');
        } else {
          setError(result.error || 'Không thể gửi email khôi phục');
        }
      }
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await signInWithGoogle();
  };

  const features = [
    { icon: TrendingUp, title: 'Phân tích AI', desc: 'Dự đoán xu hướng với AI tiên tiến' },
    { icon: Shield, title: 'Dữ liệu Real-time', desc: 'Cập nhật giá cổ phiếu theo thời gian thực' },
    { icon: Zap, title: 'Sen AI Assistant', desc: 'Trợ lý AI thông minh hỗ trợ 24/7' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-30" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
        </div>

        <div className="relative z-10 max-w-lg text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="relative">
              <Hexagon className="w-16 h-16 text-indigo-500 fill-indigo-500/20" />
              <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full"></div>
            </div>
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              Finsensei AI
            </span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Nền tảng phân tích chứng khoán thông minh
          </h1>
          <p className="text-slate-400 text-lg mb-12">
            Sử dụng AI để đưa ra quyết định đầu tư thông minh hơn với dữ liệu VN100
          </p>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4 text-left bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="text-indigo-400" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Hexagon className="w-10 h-10 text-indigo-500 fill-indigo-500/20" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              Finsensei AI
            </span>
          </div>

          {/* Form Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {mode === 'login' && 'Đăng nhập'}
                {mode === 'register' && 'Tạo tài khoản'}
                {mode === 'forgot' && 'Quên mật khẩu'}
              </h2>
              <p className="text-slate-400">
                {mode === 'login' && 'Chào mừng bạn quay trở lại'}
                {mode === 'register' && 'Bắt đầu hành trình đầu tư thông minh'}
                {mode === 'forgot' && 'Nhập email để khôi phục mật khẩu'}
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300">
                <CheckCircle size={20} />
                <span className="text-sm">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name - Only for Register */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Password - Not for Forgot */}
              {mode !== 'forgot' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {mode === 'register' && (
                    <p className="text-xs text-slate-400 mt-2">Tối thiểu 6 ký tự</p>
                  )}
                </div>
              )}

              {/* Forgot Password Link */}
              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {mode === 'login' && 'Đăng nhập'}
                    {mode === 'register' && 'Tạo tài khoản'}
                    {mode === 'forgot' && 'Gửi email khôi phục'}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            {mode !== 'forgot' && (
              <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-transparent text-slate-400">hoặc</span>
                  </div>
                </div>

                {/* Google Login */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Tiếp tục với Google
                </button>
              </>
            )}

            {/* Switch Mode */}
            <div className="mt-8 text-center text-slate-400">
              {mode === 'login' && (
                <p>
                  Chưa có tài khoản?{' '}
                  <button
                    onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Đăng ký ngay
                  </button>
                </p>
              )}
              {mode === 'register' && (
                <p>
                  Đã có tài khoản?{' '}
                  <button
                    onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Đăng nhập
                  </button>
                </p>
              )}
              {mode === 'forgot' && (
                <p>
                  <button
                    onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    ← Quay lại đăng nhập
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-500 text-sm mt-8">
            © 2024 Finsensei AI. Nền tảng phân tích chứng khoán Việt Nam.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
