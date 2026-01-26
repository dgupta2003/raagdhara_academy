/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: 'var(--color-border)', /* gold-30 */
        input: 'var(--color-input)', /* subtle-beige */
        ring: 'var(--color-ring)', /* metallic-gold */
        background: 'var(--color-background)', /* soft-parchment */
        foreground: 'var(--color-foreground)', /* charcoal */
        primary: {
          DEFAULT: 'var(--color-primary)', /* saddle-brown */
          foreground: 'var(--color-primary-foreground)', /* white */
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)', /* metallic-gold */
          foreground: 'var(--color-secondary-foreground)', /* dark-brown */
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)', /* deep-red */
          foreground: 'var(--color-destructive-foreground)', /* white */
        },
        muted: {
          DEFAULT: 'var(--color-muted)', /* wheat */
          foreground: 'var(--color-muted-foreground)', /* warm-gray */
        },
        accent: {
          DEFAULT: 'var(--color-accent)', /* muted-coral */
          foreground: 'var(--color-accent-foreground)', /* white */
        },
        popover: {
          DEFAULT: 'var(--color-popover)', /* white */
          foreground: 'var(--color-popover-foreground)', /* charcoal */
        },
        card: {
          DEFAULT: 'var(--color-card)', /* subtle-beige */
          foreground: 'var(--color-card-foreground)', /* charcoal */
        },
        success: {
          DEFAULT: 'var(--color-success)', /* forest-green */
          foreground: 'var(--color-success-foreground)', /* white */
        },
        warning: {
          DEFAULT: 'var(--color-warning)', /* golden-rod */
          foreground: 'var(--color-warning-foreground)', /* dark-brown */
        },
        error: {
          DEFAULT: 'var(--color-error)', /* deep-red */
          foreground: 'var(--color-error-foreground)', /* white */
        },
        brand: {
          brown: 'var(--color-brand-brown)', /* dark-brown */
          'brown-grey': 'var(--color-brand-brown-grey)', /* brown-grey */
          peru: 'var(--color-brand-peru)', /* peru */
          'dark-goldenrod': 'var(--color-brand-dark-goldenrod)', /* dark-goldenrod */
          cornsilk: 'var(--color-brand-cornsilk)', /* cornsilk */
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        headline: ['Crimson Text', 'serif'],
        body: ['Source Sans Pro', 'sans-serif'],
        cta: ['Poppins', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif'],
      },
      spacing: {
        '13': '3.25rem', /* 52px - golden ratio */
        '21': '5.25rem', /* 84px - golden ratio */
        '34': '8.5rem', /* 136px - golden ratio */
        '55': '13.75rem', /* 220px - golden ratio */
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "breathing": {
          '0%, 100%': { letterSpacing: '0.02em' },
          '50%': { letterSpacing: '0.05em' },
        },
        "pulse-gentle": {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
        "reveal-path": {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        "float": {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "breathing": "breathing 6s ease-in-out infinite",
        "pulse-gentle": "pulse-gentle 2s ease-in-out infinite",
        "reveal-path": "reveal-path 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        "float": "float 3s ease-in-out infinite",
      },
      boxShadow: {
        'warm': '0 4px 12px rgba(139, 69, 19, 0.1)',
        'warm-lg': '0 4px 20px rgba(139, 69, 19, 0.15)',
      },
      transitionTimingFunction: {
        'contemplative': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}