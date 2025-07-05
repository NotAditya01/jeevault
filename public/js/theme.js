// Theme management
const themeManager = {
    init() {
        this.html = document.documentElement;
        this.themeToggle = document.getElementById('themeToggle');
        this.icon = this.themeToggle ? this.themeToggle.querySelector('i') : null;
        
        // Set default theme to dark if no preference is saved
        if (!localStorage.getItem('darkMode')) {
            localStorage.setItem('darkMode', 'true');
        }
        
        this.applyTheme();
        
        // Add click handler if toggle button exists
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    },

    applyTheme() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        this.html.classList.toggle('dark', isDark);
        
        if (this.icon) {
            this.icon.className = isDark ? 
                'bi bi-sun-fill text-gray-400' : 
                'bi bi-moon-fill text-gray-600';
        }
    },

    toggleTheme() {
        const isDark = !this.html.classList.contains('dark');
        localStorage.setItem('darkMode', isDark.toString());
        this.applyTheme();
    }
};

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => themeManager.init()); 