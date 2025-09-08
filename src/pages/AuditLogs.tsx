import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, FileClock, Filter, MoreHorizontal, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Componente para o modal de detalhes
const AuditLogDetailsDialog = ({ log, isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
          <DialogDescription>
            Detalhes da ação de {log.action_type} na tabela {log.table_name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {log.old_data && (
            <div className="space-y-2">
              <h4 className="font-semibold text-lg">Dados Anteriores:</h4>
              <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                {JSON.stringify(log.old_data, null, 2)}
              </pre>
            </div>
          )}
          {log.new_data && (
            <div className="space-y-2">
              <h4 className="font-semibold text-lg">Dados Novos:</h4>
              <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                {JSON.stringify(log.new_data, null, 2)}
              </pre>
            </div>
          )}
          {!log.old_data && !log.new_data && (
            <p className="text-muted-foreground">Nenhum dado alterado disponível.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};


export const AuditLogs: React.FC = () => {
  const { data: auditLogs = [], isLoading, error } = useAuditLogs();
  const { authState } = useAuth();

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [actionFilter, setActionFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');
  
  const getBadgeColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'UPDATE': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'DELETE': return 'bg-red-500 hover:bg-red-600 text-white';
      default: return 'bg-muted text-foreground';
    }
  };

  const getFilteredLogs = useMemo(() => {
    let filtered = auditLogs;
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action_type === actionFilter);
    }
    if (tableFilter !== 'all') {
      filtered = filtered.filter(log => log.table_name === tableFilter);
    }
    return filtered;
  }, [auditLogs, actionFilter, tableFilter]);
  
  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setIsDetailsModalOpen(true);
  };
  
  const uniqueTables = [...new Set(auditLogs.map(log => log.table_name))];

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
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Ação</label>
              <Select onValueChange={setActionFilter} value={actionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as Ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Ações</SelectItem>
                  <SelectItem value="INSERT">INSERT</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Tabela</label>
              <Select onValueChange={setTableFilter} value={tableFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as Tabelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Tabelas</SelectItem>
                  {uniqueTables.map(table => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive">
              Erro ao carregar os logs: {error.message}
            </div>
          ) : getFilteredLogs.length > 0 ? (
            <ScrollArea className="h-[60vh] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Data</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>ID do Registro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-xs">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getBadgeColor(log.action_type)}>
                          {log.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.table_name}</TableCell>
                      <TableCell>{log.profiles?.name || 'Usuário Desconhecido'}</TableCell>
                      <TableCell className="text-xs font-mono">{log.record_id}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleViewDetails(log)}>
                              <Eye className="h-3 w-3 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
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
      
      {selectedLog && (
        <AuditLogDetailsDialog 
          log={selectedLog}
          isOpen={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
        />
      )}
    </div>
  );
};