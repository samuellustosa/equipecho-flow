-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'user');

-- Create enum for equipment status
CREATE TYPE public.equipment_status AS ENUM ('operacional', 'manutencao', 'parado');

-- Create enum for inventory status  
CREATE TYPE public.inventory_status AS ENUM ('normal', 'baixo', 'critico');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create sectors table
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create responsibles table
CREATE TABLE public.responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create equipments table
CREATE TABLE public.equipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model TEXT,
  serial_number TEXT UNIQUE,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
  responsible_id UUID REFERENCES public.responsibles(id) ON DELETE SET NULL,
  status equipment_status NOT NULL DEFAULT 'operacional',
  last_cleaning DATE,
  next_cleaning DATE NOT NULL,
  cleaning_frequency_days INTEGER NOT NULL DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  minimum_quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'un',
  status inventory_status NOT NULL DEFAULT 'normal',
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'user'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for sectors
CREATE POLICY "Authenticated users can view sectors" ON public.sectors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Manager can manage sectors" ON public.sectors
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for responsibles
CREATE POLICY "Authenticated users can view responsibles" ON public.responsibles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Manager can manage responsibles" ON public.responsibles
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for equipments
CREATE POLICY "Authenticated users can view equipments" ON public.equipments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Manager can manage equipments" ON public.equipments
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for inventory
CREATE POLICY "Admin and Manager can view inventory" ON public.inventory
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admin and Manager can manage inventory" ON public.inventory
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sectors_updated_at
  BEFORE UPDATE ON public.sectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_responsibles_updated_at
  BEFORE UPDATE ON public.responsibles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipments_updated_at
  BEFORE UPDATE ON public.equipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial data
INSERT INTO public.sectors (name, description) VALUES 
  ('Produção', 'Setor de produção industrial'),
  ('Manutenção', 'Setor de manutenção de equipamentos'),
  ('Qualidade', 'Controle de qualidade'),
  ('Administração', 'Setor administrativo');

INSERT INTO public.responsibles (name, email, phone, sector_id) VALUES 
  ('João Silva', 'joao@empresa.com', '(11) 99999-0001', (SELECT id FROM public.sectors WHERE name = 'Produção' LIMIT 1)),
  ('Maria Santos', 'maria@empresa.com', '(11) 99999-0002', (SELECT id FROM public.sectors WHERE name = 'Manutenção' LIMIT 1)),
  ('Carlos Lima', 'carlos@empresa.com', '(11) 99999-0003', (SELECT id FROM public.sectors WHERE name = 'Qualidade' LIMIT 1));