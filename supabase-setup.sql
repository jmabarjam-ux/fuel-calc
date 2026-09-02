-- SQL untuk membuat table shift_logs di Supabase
-- Copy paste SQL ini ke Supabase SQL Editor

-- 1. Buat table shift_logs
CREATE TABLE IF NOT EXISTS shift_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_start TEXT NOT NULL,
    time_end TEXT NOT NULL,
    meter_start DECIMAL(10, 2) NOT NULL,
    meter_end DECIMAL(10, 2) NOT NULL,
    total_usage DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(12, 2) DEFAULT 0,
    note TEXT
);

-- 2. Enable Row Level Security (RLS) - PENTING untuk keamanan
ALTER TABLE shift_logs ENABLE ROW LEVEL SECURITY;

-- 3. Buat policy untuk PUBLIC access (karena pakai anon key)
-- Policy ini memungkinkan semua orang bisa read/write
CREATE POLICY "Enable all access for shift_logs" ON shift_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. Buat index untuk query yang lebih cepat
CREATE INDEX idx_shift_logs_created_at ON shift_logs(created_at DESC);

-- ✅ Selesai! Table siap digunakan
