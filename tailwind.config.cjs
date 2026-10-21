module.exports = {
  "content": [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  "darkMode": "class",
  "theme": {
    "extend": {
      "fontFamily": {
        "arabic": [
          "\"Noto Kufi Arabic\"",
          "system-ui",
          "sans-serif"
        ],
        "en": [
          "\"Outfit\"",
          "system-ui",
          "sans-serif"
        ],
        "sans": [
          "\"Outfit\"",
          "\"Noto Kufi Arabic\"",
          "system-ui",
          "sans-serif"
        ]
      },
      "colors": {
        "black": {
          "50": "#0f0f0f",
          "100": "#1a1a1a",
          "200": "#262626",
          "300": "#333333",
          "400": "#4d4d4d",
          "500": "#666666",
          "600": "#737373",
          "700": "#808080",
          "800": "#999999",
          "900": "#b3b3b3",
          "950": "#e6e6e6"
        },
        "brand": {
          "50": "#fbf7f1",
          "100": "#f4ebdd",
          "200": "#e8d7bd",
          "300": "#d8bc97",
          "400": "#c69a6b",
          "500": "#b07c49",
          "600": "#966238",
          "700": "#7a4c2e",
          "800": "#5f3a26",
          "900": "#452a1d",
          "950": "#2a180f"
        },
        "gold": {
          "50": "#fff9ec",
          "100": "#fdf0cf",
          "200": "#fbdf9b",
          "300": "#f7c85f",
          "400": "#f2ae2e",
          "500": "#e8951a",
          "600": "#c97512",
          "700": "#a15613",
          "800": "#834516",
          "900": "#6e3a16",
          "950": "#5a2b0c"
        },
        "surface": {
          "50": "#0a0a0a",
          "100": "#111111",
          "200": "#181818",
          "300": "#1f1f1f",
          "400": "#262626",
          "500": "#2d2d2d"
        }
      },
      "boxShadow": {
        "soft": "0 12px 40px -18px rgba(0, 0, 0, 0.45)",
        "card": "0 1px 2px rgba(255, 255, 255, 0.04), 0 12px 32px -20px rgba(0, 0, 0, 0.5)",
        "float": "0 24px 60px -24px rgba(0, 0, 0, 0.6)",
        "gold": "0 0 30px rgba(242, 174, 46, 0.25)"
      },
      "keyframes": {
        "fade-in": {
          "from": {
            "opacity": "0"
          },
          "to": {
            "opacity": "1"
          }
        },
        "slide-up": {
          "from": {
            "opacity": "0",
            "transform": "translateY(12px)"
          },
          "to": {
            "opacity": "1",
            "transform": "translateY(0)"
          }
        },
        "slide-in": {
          "from": {
            "opacity": "0",
            "transform": "translateX(-16px)"
          },
          "to": {
            "opacity": "1",
            "transform": "translateX(0)"
          }
        },
        "scale-in": {
          "from": {
            "opacity": "0",
            "transform": "scale(0.96)"
          },
          "to": {
            "opacity": "1",
            "transform": "scale(1)"
          }
        },
        "pulse-gold": {
          "0%, 100%": {
            "boxShadow": "0 0 20px rgba(242, 174, 46, 0.3)"
          },
          "50%": {
            "boxShadow": "0 0 40px rgba(242, 174, 46, 0.6)"
          }
        },
        "glow": {
          "0%, 100%": {
            "opacity": "0.6"
          },
          "50%": {
            "opacity": "1"
          }
        }
      },
      "animation": {
        "fade-in": "fade-in 0.3s ease-out both",
        "slide-up": "slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in": "slide-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 0.2s ease-out both",
        "pulse-gold": "pulse-gold 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate"
      },
      "borderRadius": {
        "card": "1.5rem",
        "pill": "9999px"
      }
    }
  },
  "plugins": []
}