import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "wedding-beige": "#FDFBF7", // רקע בז' שמנת בהיר
        "wedding-sand": "#E8E1D5", // צבע חול לגבולות וקווים
        "wedding-brown": "#8C7A6B", // חום עדין לטקסט רגיל
        "wedding-dark": "#4A3F35", // חום כהה לכותרות וכפתורים
      },
    },
  },
  plugins: [],
};
export default config;
