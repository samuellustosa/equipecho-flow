import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useFaqs } from '@/hooks/useFaqs';

export const HelpCenter: React.FC = () => {
  // Busca todas as FAQs sem paginação para a página completa da Central de Ajuda
  const { data: faqs = [], isLoading, error } = useFaqs(1000); // Um número grande para buscar todas

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar as FAQs: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Central de Ajuda Completa</CardTitle>
          <CardDescription>
            Encontre respostas para todas as suas dúvidas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.length > 0 ? faqs.map((item) => (
              <AccordionItem value={`item-${item.id}`} key={item.id}>
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            )) : (
              <p className="text-center text-muted-foreground">Nenhuma FAQ encontrada.</p>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};