-- Migration 002: Expand click columns to TEXT to handle proxy IP chains and detailed user agent strings
ALTER TABLE clicks ALTER COLUMN ip_address TYPE TEXT;
ALTER TABLE clicks ALTER COLUMN country TYPE TEXT;
ALTER TABLE clicks ALTER COLUMN city TYPE TEXT;
ALTER TABLE clicks ALTER COLUMN browser TYPE TEXT;
ALTER TABLE clicks ALTER COLUMN os TYPE TEXT;
ALTER TABLE clicks ALTER COLUMN device TYPE TEXT;
