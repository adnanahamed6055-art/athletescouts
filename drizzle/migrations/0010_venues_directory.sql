CREATE TABLE public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'strength' CHECK (category IN ('strength','combat','team','racket','aquatic')),
  sports text[] NOT NULL DEFAULT '{}',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  phone text,
  website text,
  hours text,
  facilities text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.venues TO anon, authenticated;
GRANT ALL ON public.venues TO service_role;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venues are public" ON public.venues FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage venues" ON public.venues FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT INSERT, UPDATE, DELETE ON public.venues TO authenticated;

INSERT INTO public.venues (name, category, sports, lat, lng, address, city, facilities) VALUES
('Baniyas Sports & Cultural Club','team','{Football,BJJ,Padel,Volleyball,Gym}',24.3498,54.6857,'Al Shamkha / Baniyas','Abu Dhabi','{Football pitch,Gym,Padel court}'),
('Al Jazira Club','team','{Football,Basketball,Volleyball}',24.4532,54.3925,'Al Nahyan','Abu Dhabi','{Stadium,Football pitch,Sports hall}'),
('Al Wahda Sports Club','team','{Football,Basketball,Handball}',24.4405,54.3910,'Al Wahda','Abu Dhabi','{Stadium,Sports hall}'),
('Zayed Sports City','team','{Football,Tennis,Ice Hockey,Bowling}',24.4166,54.4536,'Zayed Sports City','Abu Dhabi','{Stadium,Tennis courts,Ice rink,Bowling}'),
('Al Ain Club Hazza Bin Zayed Stadium','team','{Football}',24.2440,55.7170,'Al Tuwayya','Al Ain','{Stadium,Training pitches}'),
('Mohammed Bin Zayed Stadium','team','{Football}',24.4167,54.4530,'Al Maqtaa','Abu Dhabi','{Stadium}'),
('Abu Dhabi Cricket Stadium','team','{Cricket}',24.3960,54.5410,'Zayed Cricket Stadium, Khalifa City','Abu Dhabi','{Cricket ground,Nets}'),
('Abu Dhabi Country Club','racket','{Tennis,Padel,Squash,Swimming}',24.4600,54.4060,'Al Mushrif','Abu Dhabi','{Tennis courts,Squash courts,Pool}'),
('Hudayriyat Island Sports Hub','team','{Football,Padel,Cycling,Running}',24.4440,54.3150,'Hudayriyat Island','Abu Dhabi','{Football pitches,Padel courts,Running track}'),
('Adrenagy Fitness','strength','{Gym,Group Classes}',24.4545,54.3515,'Al Bateen','Abu Dhabi','{Gym}'),
('Fitness First — Abu Dhabi Mall','strength','{Gym,Group Classes}',24.4960,54.3833,'Tourist Club Area','Abu Dhabi','{Gym,Studio}'),
('Vogue Fitness Abu Dhabi','strength','{CrossFit,Olympic Lifting}',24.4467,54.3417,'Al Bateen','Abu Dhabi','{Gym}'),
('GymNation Al Wahda','strength','{Gym,Group Classes}',24.4700,54.3730,'Al Wahda Mall','Abu Dhabi','{Gym}'),
('UFC Gym Abu Dhabi','combat','{MMA,Boxing,BJJ,Gym}',24.4206,54.5770,'Khalifa City','Abu Dhabi','{Cage,Boxing ring,Gym}'),
('Palms Sports BJJ Academy','combat','{BJJ,Judo,Wrestling}',24.4247,54.5640,'Khalifa City','Abu Dhabi','{Mat hall}'),
('Abu Dhabi Boxing & Muay Thai Club','combat','{Boxing,Muay Thai,Kickboxing}',24.4870,54.3700,'Al Khalidiyah','Abu Dhabi','{Boxing ring}'),
('Mubadala Arena','combat','{BJJ,MMA,Basketball}',24.4170,54.4560,'Zayed Sports City','Abu Dhabi','{Arena}'),
('Zayed Sports City Aquatics','aquatic','{Swimming}',24.4180,54.4500,'Zayed Sports City','Abu Dhabi','{Pool}'),
('Hamdan Sports Complex','aquatic','{Swimming,Diving}',25.0464,55.3189,'Al Hebiah','Dubai','{Olympic pool,Diving pool}'),
('Fitness First — Dubai Mall','strength','{Gym,Group Classes}',25.1975,55.2796,'Downtown Dubai','Dubai','{Gym}'),
('Dubai Sports City','team','{Football,Cricket,Hockey}',25.0400,55.2200,'Dubai Sports City','Dubai','{Cricket stadium,Football pitches}'),
('Al Nasr Club','team','{Football,Basketball}',25.2440,55.3170,'Oud Metha','Dubai','{Stadium,Sports hall}'),
('Shabab Al Ahli Club','team','{Football,Basketball,Volleyball}',25.2620,55.4110,'Al Mamzar','Dubai','{Stadium}'),
('Dubai Duty Free Tennis Stadium','racket','{Tennis}',25.2400,55.3440,'Al Garhoud','Dubai','{Tennis courts}'),
('Just Padel Dubai','racket','{Padel}',25.1290,55.2230,'Al Quoz','Dubai','{Padel courts}'),
('Round 10 Boxing Club','combat','{Boxing}',25.1430,55.2250,'Al Quoz','Dubai','{Boxing ring}'),
('GymNation Al Quoz','strength','{Gym,Group Classes}',25.1380,55.2400,'Al Quoz','Dubai','{Gym}'),
('Sharjah Cricket Stadium','team','{Cricket}',25.3320,55.4210,'Al Qasimia','Sharjah','{Cricket ground}'),
('Sharjah Sports Club','team','{Football,Basketball,Handball}',25.3430,55.4100,'Al Sharq','Sharjah','{Stadium,Sports hall}'),
('Sharjah Ladies Club Aquatics','aquatic','{Swimming}',25.3170,55.3800,'Al Ramtha','Sharjah','{Pool}');