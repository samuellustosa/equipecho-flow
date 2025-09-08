import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldAlert, FileClock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AuditLogs: React.FC = () => {
  const { data: auditLogs = [], isLoading, error } = useAuditLogs();
  const { authState } = useAuth();

  if (authState.isLoading || authState.user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Logs de Auditoria</h1>
          <p className="text-muted-foreground">
            Acompanhe as alterações e ações realizadas no sistema.
          </p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileClock className="h-5 w-5" />
            Histórico de Ações
          </CardTitle>
          <CardDescription>
            Logs de criação, atualização e exclusão de registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive">
              Erro ao carregar os logs: {error.message}
            </div>
          ) : auditLogs.length > 0 ? (
            <ScrollArea className="h-[60vh] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Data</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>ID do Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-xs">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.action_type}</Badge>
                      </TableCell>
                      <TableCell>{log.table_name}</TableCell>
                      <TableCell>{log.profiles?.name || 'Usuário Desconhecido'}</TableCell>
                      <TableCell className="text-xs font-mono">{log.record_id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              Nenhum log de auditoria encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};