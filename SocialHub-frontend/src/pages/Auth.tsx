import { useState } from "react";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { login, register } from "@/api/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Activity, Shield } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const handleAuth = async (email: string, password: string, name: string, isLogin: boolean) => {
    setIsAuthenticated(true);
    if (!isLogin) {
      try {
        await register(name, email, password);
        toast.success('Account created successfully! Welcome aboard.', {
          style: { background: '#18181b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
        });
        localStorage.setItem('email', email);
        setTimeout(() => {
          navigate('/auth?mode=signin');
          navigate(0);
        }, 2000);
      } catch (e: any) {
        toast.error(e || 'Registration failed. Please try again.', {
          style: { background: '#18181b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
        });
      }
    } else {
      try {
        await login(email, password);
        toast.success('Welcome back!', {
          style: { background: '#18181b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
        });
        localStorage.setItem('email', email);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } catch (e: any) {
        toast.error(e || 'Invalid credentials. Please try again.', {
          style: { background: '#18181b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background Effects */}
      
      <Header isAuthenticated={isAuthenticated} />
      
      <div className="flex-1 flex flex-col lg:flex-row w-full mt-20">
        
        {/* Left Side - Visuals (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-center overflow-hidden border-r border-white/5">
          <div className="absolute inset-0 bg-primary/5 opacity-20"></div>
          
          <div className="relative z-10 max-w-xl mx-auto space-y-12">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel mb-6">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary-light">Join the revolution</span>
              </div>
              <h1 className="text-5xl font-heading font-bold text-white leading-tight mb-6">
                Experience the <br/>
                <span className="text-highlight">future of social.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Step into a beautifully designed world where your thoughts matter, connections are real, and your data is secure.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4 glass-panel p-4 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Lightning Fast</h4>
                  <p className="text-sm text-muted-foreground">Real-time updates without the lag.</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 glass-panel p-4 rounded-2xl ml-8">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Enterprise Security</h4>
                  <p className="text-sm text-muted-foreground">Your privacy is our top priority.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
          <div className="w-full max-w-md">
            <AuthForm onAuth={handleAuth} />
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Auth;