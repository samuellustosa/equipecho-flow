import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

export const WaitingForApproval = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-lg text-center shadow-lg">
                <CardHeader>
                    <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-warning" />
                    <CardTitle className="text-2xl font-bold">Conta Pendente de Aprovação</CardTitle>
                    <CardDescription>
                        A sua conta foi criada com sucesso, mas está aguardando a aprovação de um administrador.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Você será notificado por e-mail assim que a sua conta for ativada.
                    </p>
                    <Button onClick={handleLogout} disabled={isLoading} className="w-full">
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Sair
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};