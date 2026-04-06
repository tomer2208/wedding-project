import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wedding: {
          beige: "#FAF9F6", // בז' בהיר ויוקרתי לרקע
          sand: "#E5E1DA", // בז' עמוק יותר לאלמנטים
          brown: "#5F4B32", // חום אלגנטי לטקסט
          dark: "#3D3021", // חום כהה מאוד לכפתורים
        },
      },
    },
  },
  plugins: [],
};
export default config;
