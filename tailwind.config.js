/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // MENDAFTARKAN WARNA RESMI TSA USU
      colors: {
        'tsa-green': '#006749',  // Hijau Tua Utama
        'tsa-gold': '#D2B355',   // Emas Elegan (untuk aksen)
        'tsa-yellow': '#FFCC33', // Kuning Terang (untuk highlight/sparkles)
        'tsa-dark': '#282F2C',   // Hitam Arang (untuk teks utama)
        'tsa-light': '#FFFFFF',  // Putih Bersih
      },
      // MENDAFTARKAN FONT RESMI
      fontFamily: {
        sans: ['Poppins', 'sans-serif'], 
        serif: ['Noto Serif', 'serif'],
      },
      // MENAMBAHKAN BAYANGAN GEOMETRIS HALUS & GLOW PREMIUM
      boxShadow: {
        'tsa': '0 20px 40px -15px rgba(0, 103, 73, 0.15)', // Bayangan halus berwarna hijau
        'tsa-gold-glow': '0 0 25px -5px rgba(210, 179, 85, 0.5)', // Efek Glow/Neon Emas untuk Lencana Juara
      }
    },
  },
  plugins: [],
}