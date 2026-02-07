import { createClient } from '@supabase/supabase-js'

// Ganti string di bawah dengan data asli dari Dashboard Supabase -> Settings -> API
const supabaseUrl = 'https://jjieqkjxnjwgxgrrtdll.supabase.co' 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWVxa2p4bmp3Z3hncnJ0ZGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTA2NTksImV4cCI6MjA4NTA2NjY1OX0.tiTsHwnpmIpFMgWqmk0ML7cEYY1mU-Cw3gk9_-GBeRI'

export const supabase = createClient(supabaseUrl, supabaseKey)