/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <--- 確保這行存在
  ],
  theme: {
    extend: {
      // 根據 spec-kit 新增字體
      fontFamily: {
        sans: ['"Noto Sans TC"', '"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}