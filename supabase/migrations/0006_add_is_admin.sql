-- Add is_admin column that was referenced in 0004/0005 but never defined.
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Migrate existing cover_photo_url values that embed the Google API key
-- to the server-side proxy format (/api/photos?ref=PHOTO_REFERENCE).
update public.restaurants
set cover_photo_url =
  case
    when (regexp_match(cover_photo_url, 'photo_reference=([^&]+)'))[1] is not null
    then '/api/photos?ref=' || (regexp_match(cover_photo_url, 'photo_reference=([^&]+)'))[1]
    else null
  end
where cover_photo_url like '%googleapis.com%photo_reference%';
