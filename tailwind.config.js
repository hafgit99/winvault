/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // veya 'media'
    theme: {
        extend: {
            colors: {
                // Özel renkler eklenebilir ama şu an standart Tailwind renkleri yeterli
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
            }
        },
    },
    plugins: [],
}
