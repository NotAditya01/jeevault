// Theme toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
        icon.classList.remove('bi-moon-fill');
        icon.classList.add('bi-sun-fill');
    } else {
        document.documentElement.classList.remove('dark');
        icon.classList.remove('bi-sun-fill');
        icon.classList.add('bi-moon-fill');
    }
    
    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        
        if (isDark) {
            localStorage.setItem('theme', 'dark');
            icon.classList.remove('bi-moon-fill');
            icon.classList.add('bi-sun-fill');
        } else {
            localStorage.setItem('theme', 'light');
            icon.classList.remove('bi-sun-fill');
            icon.classList.add('bi-moon-fill');
        }
    });
}); 