// src/pages/RedirectAfterAuth.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

export const RedirectAfterAuth = () => {
    const { authState } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (authState.isLoading) {
            return;
        }

        if (authState.isAuthenticated) {
            if (authState.user?.role === 'pending') {
                // Redireciona usuários com o status 'pending' para a página de espera.
                toast({
                    title: "Conta confirmada!",
                    description: "Aguardando aprovação de um administrador.",
                });
                navigate("/waiting-for-approval", { replace: true });
            } else {
                // Usuários autenticados e não pendentes são redirecionados para a dashboard.
                toast({
                    title: "Login realizado com sucesso!",
                    description: "Bem-vindo ao EquipCPD.",
                });
                navigate("/", { replace: true });
            }
        } else {
            // Se a autenticação falhou (sessão inválida ou link expirado)
            toast({
                title: "Falha na confirmação de email",
                description: "O link pode ser inválido ou expirado. Tente fazer login novamente.",
                variant: "destructive",
            });
            navigate("/auth", { replace: true });
        }
    }, [authState, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Confirmando seu Email</CardTitle>
                    <CardDescription>
                        Aguarde um momento enquanto validamos sua conta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Você será redirecionado em breve.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};