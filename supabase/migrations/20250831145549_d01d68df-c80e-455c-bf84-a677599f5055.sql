-- Insert sample equipments
INSERT INTO public.equipments (name, model, serial_number, sector_id, responsible_id, status, next_cleaning, cleaning_frequency_days, notes)
VALUES 
  ('Compressor AC-001', 'Atlas Copco GA22', 'AC2024001', 
   (SELECT id FROM public.sectors WHERE name = 'Produção' LIMIT 1),
   (SELECT id FROM public.responsibles WHERE name = 'João Silva' LIMIT 1),
   'operacional', '2024-02-15', 30, 'Compressor de ar principal'),
  ('Gerador GE-205', 'Caterpillar C9', 'GE2024002',
   (SELECT id FROM public.sectors WHERE name = 'Manutenção' LIMIT 1),
   (SELECT id FROM public.responsibles WHERE name = 'Maria Santos' LIMIT 1),
   'manutencao', '2024-02-20', 60, 'Gerador de emergência'),
  ('Bomba BP-103', 'KSB Etanorm', 'BP2024003',
   (SELECT id FROM public.sectors WHERE name = 'Produção' LIMIT 1),
   (SELECT id FROM public.responsibles WHERE name = 'Carlos Lima' LIMIT 1),
   'parado', '2024-02-10', 45, 'Bomba centrífuga do sistema principal');

-- Insert sample inventory items
INSERT INTO public.inventory (name, description, category, current_quantity, minimum_quantity, unit, status, location)
VALUES 
  ('Filtro de Ar', 'Filtros para compressores', 'Filtros', 5, 10, 'un', 'baixo', 'Almoxarifado A'),
  ('Óleo Lubrificante', 'Óleo para equipamentos', 'Lubrificantes', 3, 8, 'litros', 'critico', 'Almoxarifado B'),
  ('Correias', 'Correias para motores', 'Transmissão', 2, 5, 'un', 'critico', 'Almoxarifado A'),
  ('Parafusos M6', 'Parafusos métricos 6mm', 'Fixação', 100, 20, 'un', 'normal', 'Almoxarifado C');