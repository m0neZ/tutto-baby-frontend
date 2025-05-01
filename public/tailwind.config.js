/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tutto Baby Green Palette
        "green-1": "#dfeed6", // Lightest Green
        "green-2": "#c4deb7",
        "green-3": "#aac59a",
        "green-4": "#8da27d", // Darkest Green

        // Semantic colors based on the palette
        primary: "#8da27d", // Darkest green as primary
        secondary: "#aac59a",
        accent: "#c4deb7",
        background: "#dfeed6", // Lightest green as background
        "background-alt": "#FFFFFF", // White for contrasting backgrounds
        "text-primary": "#333333", // Dark Gray for text
        "text-secondary": "#555555", // Slightly lighter gray
      },
      fontFamily: {
        // TODO: Add Andrea II Script Slant Nib font family.
        // Consider licensing or alternatives.
        // script: ["Andrea II Script Slant Nib", "cursive"],
        sans: ["sans-serif"], // Default sans-serif for body text
      },
    },
  },
  plugins: [],
}

