-- Run this query in your Supabase SQL Editor
-- Create the users table
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  status text not null check (status in ('pending', 'approved', 'admin')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security (RLS)
alter table public.users enable row level security;

-- Create policy to allow users to read their own status
create policy "Users can read own data" on users for select
  using ( auth.uid() = id );

-- Create policy to allow admin to read all data
create policy "Admins can read all data" on users for select
  using ( 
    auth.uid() in (
      select id from public.users where status = 'admin'
    )
  );

-- Create policy to allow admin to update all data
create policy "Admins can update all data" on users for update
  using ( 
    auth.uid() in (
      select id from public.users where status = 'admin'
    )
  );

-- Create policy for the service role or initial insert (usually handled securely, but let's allow inserts if user doesn't exist)
create policy "Users can insert their own initial row" on users for insert
  with check ( auth.uid() = id );
