import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export const EmailConfirmation = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Pega o email do state da navegação ou do localStorage
        const emailFromState = location.state?.email;
        const emailFromStorage = localStorage.getItem('pendingConfirmationEmail');
        
        if (emailFromState) {
            setEmail(emailFromState);
            localStorage.setItem('pendingConfirmationEmail', emailFromState);
        } else if (emailFromStorage) {
            setEmail(emailFromStorage);
        } else {
            // Se não tem email, redireciona para auth
            navigate('/auth');
        }
    }, [location.state, navigate]);

    const handleResendEmail = async () => {
        if (!email) return;
        
        setIsResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email
            });

            if (error) {
                throw error;
            }

            toast({
                title: "Email reenviado",
                description: "Verifique sua caixa de entrada e spam.",
            });
        } catch (error: any) {
            toast({
                title: "Erro ao reenviar email",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsResending(false);
        }
    };

    const handleBackToLogin = () => {
        localStorage.removeItem('pendingConfirmationEmail');
        navigate('/auth');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-lg text-center shadow-lg">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Confirme seu Email</CardTitle>
                    <CardDescription>
                        Enviamos um link de confirmação para <strong>{email}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4" />
                            Clique no link no email para ativar sua conta
                        </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                        Não recebeu o email? Verifique sua pasta de spam ou solicite o reenvio.
                    </p>
                    
                    <div className="space-y-3">
                        <Button 
                            onClick={handleResendEmail} 
                            disabled={isResending} 
                            variant="outline"
                            className="w-full"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Reenviando...
                                </>
                            ) : (
                                'Reenviar Email'
                            )}
                        </Button>
                        
                        <Button 
                            onClick={handleBackToLogin} 
                            variant="ghost"
                            className="w-full"
                        >
                            Voltar ao Login
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};