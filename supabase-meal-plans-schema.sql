-- Meal Plans table
create table public.meal_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  day_of_week text not null check (day_of_week in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  week_start_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index meal_plans_user_id_idx on public.meal_plans(user_id);
create index meal_plans_week_start_date_idx on public.meal_plans(week_start_date);
create index meal_plans_recipe_id_idx on public.meal_plans(recipe_id);

-- Enable Row Level Security
alter table public.meal_plans enable row level security;

-- RLS Policies for meal_plans
create policy "Users can view their own meal plans"
  on public.meal_plans for select
  using (auth.uid() = user_id);

create policy "Users can create their own meal plans"
  on public.meal_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own meal plans"
  on public.meal_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own meal plans"
  on public.meal_plans for delete
  using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger on_meal_plans_updated
  before update on public.meal_plans
  for each row
  execute procedure public.handle_updated_at();
