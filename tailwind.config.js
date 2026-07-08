/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./frontend/**/*.html", "./frontend/**/*.js"],
  theme: {
    extend: {
      colors: {
        "primary-fixed": "#56ffa8",
        "on-secondary": "#680008",
        "inverse-surface": "#dae5da",
        "error": "#ffb4ab",
        "outline-variant": "#3b4a3f",
        "tertiary-fixed": "#b7eaff",
        "on-tertiary-fixed": "#001f28",
        "on-primary-fixed": "#002110",
        "on-surface": "#dae5da",
        "secondary-fixed-dim": "#ffb3ac",
        "tertiary-fixed-dim": "#4cd6ff",
        "surface-tint": "#00e38b",
        "error-container": "#93000a",
        "tertiary-container": "#ade8ff",
        "surface-bright": "#323c34",
        "on-secondary-fixed-variant": "#930010",
        "primary-fixed-dim": "#00e38b",
        "tertiary": "#f8fcff",
        "surface-dim": "#0c150f",
        "inverse-on-surface": "#29332b",
        "on-secondary-fixed": "#410003",
        "surface-container-lowest": "#07100a",
        "surface-variant": "#2d3730",
        "surface": "#0c150f",
        "on-background": "#dae5da",
        "secondary-fixed": "#ffdad6",
        "on-secondary-container": "#ffd2cd",
        "on-primary": "#00391f",
        "primary": "#f4fff3",
        "on-error-container": "#ffdad6",
        "primary-container": "#00ff9d",
        "on-primary-fixed-variant": "#00522f",
        "secondary": "#ffb3ac",
        "on-primary-container": "#007143",
        "on-error": "#690005",
        "secondary-container": "#c40019",
        "surface-container": "#18221b",
        "outline": "#849587",
        "background": "#0c150f",
        "on-tertiary": "#003543",
        "surface-container-low": "#141e17",
        "on-surface-variant": "#b9cbbc",
        "on-tertiary-fixed-variant": "#004e60",
        "inverse-primary": "#006d40",
        "surface-container-highest": "#2d3730",
        "surface-container-high": "#232c25",
        "on-tertiary-container": "#006b84"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        md: "24px",
        gutter: "24px",
        sm: "12px",
        xs: "4px",
        xl: "80px",
        lg: "48px",
        margin: "32px",
        base: "8px"
      },
      fontFamily: {
        "headline-md": ["Inter", "sans-serif"],
        "label-mono": ["JetBrains Mono", "monospace"],
        "body-base": ["Inter", "sans-serif"],
        "data-lg": ["JetBrains Mono", "monospace"],
        "headline-md-mobile": ["Inter", "sans-serif"],
        "display-lg": ["Inter", "sans-serif"]
      },
      fontSize: {
        "headline-md": ["32px", { lineHeight: "1.2", fontWeight: "600" }],
        "label-mono": ["12px", { lineHeight: "1.2", fontWeight: "400" }],
        "body-base": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "data-lg": ["24px", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "500" }],
        "headline-md-mobile": ["24px", { lineHeight: "1.2", fontWeight: "600" }],
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }]
      }
    }
  },
  plugins: []
};
