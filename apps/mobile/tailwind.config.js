/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["PlusJakartaSans_400Regular"],
        semibold: ["PlusJakartaSans_600SemiBold"],
        bold: ["PlusJakartaSans_700Bold"],
      },
      colors: {
        border: "rgb(234 234 234)",
        input: "rgb(234 234 234)",
        ring: "rgb(163 163 163)",
        background: "rgb(250 250 249)",
        foreground: "rgb(28 28 28)",
        muted: {
          DEFAULT: "rgb(245 245 244)",
          foreground: "rgb(115 115 115)",
        },
        card: {
          DEFAULT: "rgb(255 255 255)",
          foreground: "rgb(28 28 28)",
        },
        primary: {
          DEFAULT: "#4a9f7a",
          foreground: "rgb(250 250 250)",
        },
        secondary: {
          DEFAULT: "rgb(244 244 243)",
          foreground: "rgb(28 28 28)",
        },
        destructive: {
          DEFAULT: "rgb(220 38 38)",
          foreground: "rgb(255 255 255)",
        },
        accent: {
          DEFAULT: "rgb(245 245 244)",
          foreground: "rgb(28 28 28)",
        },
      },
      borderRadius: {
        lg: "10px",
        xl: "14px",
        "2xl": "16px",
        "3xl": "20px",
      },
    },
  },
  plugins: [],
};
