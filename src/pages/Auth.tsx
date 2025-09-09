import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AtSign, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { useAuth } from "../hooks/useAuth"; 
import { useToast } from "../components/ui/use-toast";
import { Toaster } from "../components/ui/toaster";
import { ToastAction } from "@/components/ui/toast";


type AuthView = "login" | "signup" | "forgot-password";

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  
  const [authView, setAuthView] = useState<AuthView>("login");

  const { login, signUp, resetPassword } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast({
        title: "Login bem-sucedido!",
        className: "bg-green-500 text-white",
      });
      navigate(from, { replace: true });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro de login",
        description: error.message,
        action: <ToastAction altText="Tentar novamente">Tentar novamente</ToastAction>,
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      toast({
        variant: "destructive",
        title: "Senhas não conferem",
        description: "A senha e a confirmação de senha não coincidem.",
      });
      return;
    }
    try {
      await signUp(email, password, "");
      toast({
        title: "Inscrição bem-sucedida!",
        description: "Verifique seu e-mail para confirmar sua conta.",
        className: "bg-green-500 text-white",
      });
      setAuthView("login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro de inscrição",
        description: error.message,
      });
    }
  };
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await resetPassword(email);
        toast({
            title: "E-mail de redefinição enviado!",
            description: "Verifique sua caixa de entrada para redefinir sua senha.",
            className: "bg-green-500 text-white",
        });
        setAuthView("login");
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erro ao redefinir senha",
            description: error.message,
        });
    }
  };

  return (
    <div
      id="auth-page"
      className="bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12"
    >
      <Toaster />
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <img src="/appstore.png" alt="Logo do Sistema" className="h-20 w-auto" />
            </div>

            <CardTitle className="text-2xl text-center">
              {authView === "login" && "Entrar"}
              {authView === "signup" && "Cadastrar"}
              {authView === "forgot-password" && "Esqueci a senha"}
            </CardTitle>
            <CardDescription className="text-center">
              {authView === "login" && "Entre para acessar sua conta."}
              {authView === "signup" &&
                "Crie uma conta para começar a usar o sistema."}
              {authView === "forgot-password" &&
                "Insira seu e-mail para redefinir sua senha."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Formulário de Login */}
            {authView === "login" && (
              <form onSubmit={handleLogin} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="exemplo@flow.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Senha</Label>
                    <Link
                      to="#"
                      className="ml-auto inline-block text-sm underline"
                      onClick={() => setAuthView("forgot-password")}
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </form>
            )}

            {/* Formulário de Cadastro */}
            {authView === "signup" && (
              <form onSubmit={handleSignup} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="exemplo@flow.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password-confirmation">Confirme a senha</Label>
                  <div className="relative">
                    <Input
                      id="password-confirmation"
                      type={showPasswordConfirmation ? "text" : "password"}
                      required
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() =>
                        setShowPasswordConfirmation(!showPasswordConfirmation)
                      }
                    >
                      {showPasswordConfirmation ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Cadastrar
                </Button>
              </form>
            )}

            {/* Formulário de Esqueci a Senha */}
            {authView === "forgot-password" && (
              <form onSubmit={handlePasswordReset} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="exemplo@flow.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Redefinir senha
                </Button>
              </form>
            )}

            <Separator className="my-6" />

            {authView === "login" && (
              <div className="text-center text-sm">
                Não tem uma conta?{" "}
                <Link
                  to="#"
                  className="underline"
                  onClick={() => setAuthView("signup")}
                >
                  Cadastre-se
                </Link>
              </div>
            )}

            {authView === "signup" && (
              <div className="text-center text-sm">
                Já tem uma conta?{" "}
                <Link
                  to="#"
                  className="underline"
                  onClick={() => setAuthView("login")}
                >
                  Entrar
                </Link>
              </div>
            )}

            {authView === "forgot-password" && (
              <div className="text-center text-sm">
                Voltar para{" "}
                <Link
                  to="#"
                  className="underline"
                  onClick={() => setAuthView("login")}
                >
                  Entrar
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};