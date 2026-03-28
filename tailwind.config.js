/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: '#1A73E8',
                action: '#1A73E8',
                primary: '#2c3e50',
                secondary: '#95a5a6',
                success: '#27ae60',
                error: '#e74c3c',
                background: '#f0f2f5',
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            }
        },
    },
    plugins: [],
};
