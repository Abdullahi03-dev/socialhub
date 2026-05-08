import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react";

interface AuthFormProps {
  onAuth?: (email: string, password: string, username: string, isLogin: boolean) => Promise<void>;
}

const AuthForm = ({ onAuth }: AuthFormProps) => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: string[] = [];
    if (!formData.email) newErrors.push('Email is required');
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.push('Please enter a valid email address');
    
    if (!formData.password) newErrors.push('Password is required');
    else if (formData.password.length < 6) newErrors.push('Password must be at least 6 characters');
    
    if (mode === 'signup') {
      if (!formData.username) newErrors.push('Username is required');
      else if (formData.username.length < 3) newErrors.push('Username must be at least 3 characters');
      if (formData.password !== formData.confirmPassword) newErrors.push('Passwords do not match');
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    if (onAuth) {
      setIsLoading(true);
      try {
        await onAuth(formData.email, formData.password, formData.username, mode === 'login');
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) setErrors([]);
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors([]);
    setFormData({ email: '', password: '', username: '', confirmPassword: '' });
  };

  return (
    <div className="glass-panel rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
      
      <div className="relative z-10 text-center mb-8">
        <h2 className="text-3xl font-heading font-bold text-white mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {mode === 'login' 
            ? 'Enter your credentials to access your account'
            : 'Fill in your details to join the community'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        {errors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <ul className="list-disc list-inside space-y-1 text-sm text-white/90">
              {errors.map((error, index) => <li key={index}>{error}</li>)}
            </ul>
          </div>
        )}

        {mode === 'signup' && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Username</Label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="input-field pl-12 py-3.5 bg-white/5 border-white/10 hover:border-white/20 focus:bg-white/10"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Email Address</Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="email"
              placeholder="hello@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="input-field pl-12 py-3.5 bg-white/5 border-white/10 hover:border-white/20 focus:bg-white/10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Password</Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="input-field pl-12 pr-12 py-3.5 bg-white/5 border-white/10 hover:border-white/20 focus:bg-white/10"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mode === 'signup' && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Confirm Password</Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="input-field pl-12 py-3.5 bg-white/5 border-white/10 hover:border-white/20 focus:bg-white/10"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full btn-hero py-6 mt-4 text-base tracking-wide"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Authenticating...
            </span>
          ) : (mode === 'login' ? 'Sign In to Account' : 'Create Account')}
        </Button>
      </form>

      <div className="mt-8 text-center relative z-10">
        <p className="text-sm text-muted-foreground">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          <button
            type="button"
            onClick={toggleMode}
            className="ml-2 text-primary hover:text-primary-light font-semibold transition-colors"
            disabled={isLoading}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;