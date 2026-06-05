import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const user = await login(email, password);
    setLoading(false);
    if (user) {
      toast({ title: "Welcome back!", description: `Logged in as ${user.name}` });
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } else {
      toast({
        title: "Login failed",
        description: "Invalid email or password. Check your credentials and make sure the server is running.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-card-foreground">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-1">Login to manage your residence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm pr-10"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="rounded border-input" />
              Remember me
            </label>
            <button type="button" className="text-sm text-primary font-medium hover:underline">Forgot Password?</button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login to Account"}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-6 p-3 bg-muted rounded-lg text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Demo credentials:</p>
          <p>Admin: <span className="font-mono">admin@apt.com</span> / <span className="font-mono">admin123</span></p>
          <p>Resident: <span className="font-mono">resident@apt.com</span> / <span className="font-mono">resident123</span></p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-xs">Need help?</p>
          <p className="text-xs text-muted-foreground mt-1">New resident? <button className="text-primary font-medium hover:underline">Contact Management</button></p>
        </div>

        <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
          <span className="hover:underline cursor-pointer">Privacy Policy</span>
          <span className="hover:underline cursor-pointer">Terms of Service</span>
          <span className="hover:underline cursor-pointer">Support</span>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">© 2024 Urban Living Management Systems.</p>
      </div>
    </div>
  );
};

export default Login;
