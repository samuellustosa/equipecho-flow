import React, { useMemo } from 'react';
import { useAllEquipments } from '@/hooks/useEquipments';
import { useResponsibles } from '@/hooks/useResponsibles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveTooltip } from '@/components/ResponsiveTooltip';

const calculateStatusColor = (daysUntilDue: number, currentStatus: string) => {
  if (currentStatus === 'parado') {
    return 'bg-destructive text-destructive-foreground';
  }
  if (daysUntilDue < 0) {
    return 'bg-destructive text-destructive-foreground'; // Atrasado
  }
  if (daysUntilDue === 0) {
    return 'bg-warning text-warning-foreground'; // Aviso
  }
  return 'bg-success text-success-foreground'; // Em dia
};

const getStatusLabel = (daysUntilDue: number, currentStatus: string) => {
  if (currentStatus === 'parado') {
    return 'PARADO';
  }
  if (daysUntilDue < 0) {
    return `ATRASADO (${Math.abs(daysUntilDue)} dias)`;
  }
  if (daysUntilDue === 0) {
    return 'AVISO (Hoje)';
  }
  return 'EM DIA';
};

export const EquipmentStatusGrid = () => {
  const { data: allEquipments, isLoading: isLoadingEquipments, error: equipmentsError } = useAllEquipments();
  const { data: responsibles = [], isLoading: isLoadingResponsibles, error: responsiblesError } = useResponsibles();

  const isLoading = isLoadingEquipments || isLoadingResponsibles;
  const error = equipmentsError || responsiblesError;

  const groupedByResponsible = useMemo(() => {
    if (!allEquipments || !responsibles) return {};

    const responsibleMap = new Map(responsibles.map(r => [r.id, r.name]));
    const grouped: { [key: string]: typeof allEquipments } = {};

    allEquipments.forEach(equipment => {
      const responsibleName = equipment.responsible_id ? responsibleMap.get(equipment.responsible_id) : 'Não Atribuído';
      if (responsibleName) {
        if (!grouped[responsibleName]) {
          grouped[responsibleName] = [];
        }
        grouped[responsibleName].push(equipment);
      }
    });

    return grouped;
  }, [allEquipments, responsibles]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center">Erro ao carregar os dados. Tente novamente.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(groupedByResponsible).map(([responsible, equipments]) => (
        <Card key={responsible} className="shadow-lg">
          <CardHeader className="bg-muted p-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              {responsible}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {equipments.map(equipment => {
                // Ajustado para criar objetos de data no fuso horário local para evitar o problema de fuso horário.
                const nextCleaning = new Date(equipment.next_cleaning + 'T00:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysUntilDue = differenceInDays(nextCleaning, today);

                const colorClass = calculateStatusColor(daysUntilDue, equipment.status);
                
                const lastCleaningDate = equipment.last_cleaning ? format(parseISO(equipment.last_cleaning), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A';
                const nextCleaningDate = equipment.next_cleaning ? format(parseISO(equipment.next_cleaning), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A';
                const statusLabel = getStatusLabel(daysUntilDue, equipment.status);

                return (
                  <ResponsiveTooltip
                    key={equipment.id}
                    trigger={
                      <Button 
                        variant="outline" 
                        className={cn(
                          "min-h-[4rem] w-full flex flex-col items-center justify-center p-2 text-center text-xs font-normal whitespace-normal",
                          colorClass,
                          "hover:brightness-90"
                        )}
                      >
                        <span className="font-semibold leading-tight text-center">{equipment.name}</span>
                      </Button>
                    }
                    content={
                      <div className="flex flex-col text-sm">
                        <p>
                          <span className="font-semibold">Nome:</span> {equipment.name}
                        </p>
                        <p>
                          <span className="font-semibold">Status:</span> {statusLabel}
                        </p>
                        <p>
                          <span className="font-semibold">Responsável:</span> {responsible}
                        </p>
                        <p>
                          <span className="font-semibold">Última Limpeza:</span> {lastCleaningDate}
                        </p>
                        <p>
                          <span className="font-semibold">Próxima Limpeza:</span> {nextCleaningDate}
                        </p>
                      </div>
                    }
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};