-- Ensure auth schema exists
create schema if not exists auth;

-- Create test user
insert into auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) values (
    '8fb3ff85-39e3-41d4-9404-b1810d350ffb',
    'test@example.com',
    crypt('test123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Test User"}',
    false,
    'authenticated'
);

-- Create test user identity
insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) values (
    '8fb3ff85-39e3-41d4-9404-b1810d350ffb',
    '8fb3ff85-39e3-41d4-9404-b1810d350ffb',
    '{"sub":"8fb3ff85-39e3-41d4-9404-b1810d350ffb","email":"test@example.com"}',
    'email',
    'test@example.com',
    now(),
    now(),
    now()
); 