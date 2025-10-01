-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Categories table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name)
);

-- Recipes table
create table public.recipes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text not null,
  description text,
  thumbnail_url text,
  category_id uuid references public.categories(id) on delete set null,
  prep_time text,
  difficulty text,
  cuisine_type text,
  dietary_tags text[], -- array of tags like 'vegan', 'gluten-free', etc.
  notes text,
  rating integer check (rating >= 1 and rating <= 5),
  is_favorite boolean default false,
  source_domain text, -- extracted from URL for display
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index recipes_user_id_idx on public.recipes(user_id);
create index recipes_category_id_idx on public.recipes(category_id);
create index recipes_is_favorite_idx on public.recipes(is_favorite);
create index recipes_created_at_idx on public.recipes(created_at desc);
create index categories_user_id_idx on public.categories(user_id);

-- Enable Row Level Security
alter table public.categories enable row level security;
alter table public.recipes enable row level security;

-- RLS Policies for categories
create policy "Users can view their own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can create their own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- RLS Policies for recipes
create policy "Users can view their own recipes"
  on public.recipes for select
  using (auth.uid() = user_id);

create policy "Users can create their own recipes"
  on public.recipes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own recipes"
  on public.recipes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own recipes"
  on public.recipes for delete
  using (auth.uid() = user_id);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger on_categories_updated
  before update on public.categories
  for each row
  execute procedure public.handle_updated_at();

create trigger on_recipes_updated
  before update on public.recipes
  for each row
  execute procedure public.handle_updated_at();
