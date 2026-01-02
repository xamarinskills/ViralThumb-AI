export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#8c25f4',
                'primary-hover': '#7a1bd6',
                background: '#0a0a0c',
                surface: '#121216',
                'surface-light': '#1e1e24',
                border: '#2a2a32',
                text: {
                    primary: '#ffffff',
                    secondary: '#ab9cba',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
            },
            boxShadow: {
                'neon': '0 0 20px rgba(140, 37, 244, 0.4)',
                'neon-strong': '0 0 30px rgba(140, 37, 244, 0.6)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'shake': 'shake 0.4s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-5px)' },
                    '75%': { transform: 'translateX(5px)' },
                },
                shimmer: {
                    '100%': { transform: 'translateX(100%)' },
                }
            }
        }
    },
    plugins: [],
}
