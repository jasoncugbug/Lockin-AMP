/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}" // 这确保了会扫描你的 jsx 文件中的类名
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
