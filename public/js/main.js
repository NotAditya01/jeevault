// State management
let resources = [];
let activeFilters = {
    search: '',
    subject: '',
    tags: new Set()
};

// Fetch resources from the API
async function fetchResources() {
    try {
        const response = await fetch('/api/resources');
        resources = await response.json();
        renderResources();
        updateTagFilters();
    } catch (error) {
        console.error('Error fetching resources:', error);
    }
}

// Render resources grid
function renderResources() {
    const grid = document.getElementById('resourcesGrid');
    const filteredResources = filterResources();
    
    grid.innerHTML = filteredResources.map(resource => `
        <div class="bg-gray-800 rounded-2xl shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-xl font-semibold text-white">${resource.title}</h3>
                <span class="px-3 py-1 bg-gray-700 text-sm rounded-full">${resource.subject}</span>
            </div>
            
            <p class="text-gray-400 text-sm mb-4">${resource.description || ''}</p>
            
            <div class="flex flex-wrap gap-2 mb-4">
                ${resource.tags.map(tag => `
                    <span class="px-2 py-1 bg-gray-700 text-xs rounded-full hover:bg-primary cursor-pointer"
                        onclick="toggleTagFilter('${tag}')">${tag}</span>
                `).join('')}
            </div>
            
            <a href="${resource.filePath || resource.externalLink}" 
                target="_blank" 
                class="inline-block w-full text-center bg-primary text-white py-2 rounded-lg hover:bg-opacity-90 transition-colors duration-200">
                ${resource.filePath ? '📥 Download PDF' : '🔗 View Resource'}
            </a>
        </div>
    `).join('');
}

// Filter resources based on active filters
function filterResources() {
    return resources.filter(resource => {
        const matchesSearch = resource.title.toLowerCase().includes(activeFilters.search.toLowerCase());
        const matchesSubject = !activeFilters.subject || resource.subject === activeFilters.subject;
        const matchesTags = activeFilters.tags.size === 0 || 
            resource.tags.some(tag => activeFilters.tags.has(tag));
        
        return matchesSearch && matchesSubject && matchesTags;
    });
}

// Update tag filters UI
function updateTagFilters() {
    const tagFilters = document.getElementById('tagFilters');
    const allTags = new Set();
    
    resources.forEach(resource => {
        resource.tags.forEach(tag => allTags.add(tag));
    });
    
    tagFilters.innerHTML = Array.from(allTags).map(tag => `
        <button 
            class="px-3 py-1 rounded-full text-sm ${activeFilters.tags.has(tag) ? 'bg-primary' : 'bg-gray-700'} hover:bg-opacity-90"
            onclick="toggleTagFilter('${tag}')"
        >${tag}</button>
    `).join('');
}

// Toggle tag filter
function toggleTagFilter(tag) {
    if (activeFilters.tags.has(tag)) {
        activeFilters.tags.delete(tag);
    } else {
        activeFilters.tags.add(tag);
    }
    updateTagFilters();
    renderResources();
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', (e) => {
    activeFilters.search = e.target.value;
    renderResources();
});

document.getElementById('subjectFilter').addEventListener('change', (e) => {
    activeFilters.subject = e.target.value;
    renderResources();
});

// Initialize
fetchResources();

document.addEventListener('DOMContentLoaded', function() {
    // Toggle dark mode
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;
    const themeIcon = themeToggle.querySelector('i');

    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
        themeIcon.classList.remove('bi-moon-fill');
        themeIcon.classList.add('bi-sun-fill');
    }

    themeToggle.addEventListener('click', function() {
        htmlElement.classList.toggle('dark');
        
        // Update icon
        if (htmlElement.classList.contains('dark')) {
            themeIcon.classList.remove('bi-moon-fill');
            themeIcon.classList.add('bi-sun-fill');
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.classList.remove('bi-sun-fill');
            themeIcon.classList.add('bi-moon-fill');
            localStorage.setItem('theme', 'light');
        }
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    mobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
    });

    // Resources handling
    let resources = [];
    const resourcesGrid = document.getElementById('resourcesGrid');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const subjectFilter = document.getElementById('subjectFilter');
    const tagFilter = document.getElementById('tagFilter');

    // Load resources
    async function loadResources() {
        try {
            const response = await fetch('/api/resources');
            resources = await response.json();
            filterAndDisplayResources();
        } catch (error) {
            console.error('Error loading resources:', error);
            showEmptyState('Failed to load resources. Please try again later.');
        }
    }

    // Filter and display resources
    function filterAndDisplayResources() {
        const searchTerm = searchInput.value.toLowerCase();
        const subjectValue = subjectFilter.value;
        const tagValue = tagFilter.value;

        const filteredResources = resources.filter(resource => {
            const matchesSearch = 
                resource.title.toLowerCase().includes(searchTerm) || 
                resource.description.toLowerCase().includes(searchTerm);
            
            const matchesSubject = !subjectValue || resource.subject === subjectValue;
            const matchesTag = !tagValue || resource.tag === tagValue;

            return matchesSearch && matchesSubject && matchesTag;
        });

        if (filteredResources.length === 0) {
            showEmptyState();
        } else {
            hideEmptyState();
            displayResources(filteredResources);
        }
    }

    // Display resources
    function displayResources(resourcesToShow) {
        resourcesGrid.innerHTML = resourcesToShow.map(resource => `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div class="p-6">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div class="flex gap-2">
                            <span class="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                ${resource.subject}
                            </span>
                            <span class="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                                ${resource.tag}
                            </span>
                        </div>
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                            <i class="bi bi-clock"></i> ${resource.formattedDate}
                        </span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${resource.title}</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">
                        ${resource.description}
                    </p>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <a href="${resource.type === 'file' ? resource.fileUrl : resource.url}" target="_blank" 
                           class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <i class="bi bi-${resource.type === 'file' ? 'download' : 'link-45deg'} mr-2"></i> 
                            ${resource.type === 'file' ? 'Download' : 'View'}
                        </a>
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                            Shared by: ${resource.uploadedBy || 'Anonymous'}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Show empty state
    function showEmptyState(message = null) {
        resourcesGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        
        if (message) {
            emptyState.querySelector('p').textContent = message;
        }
    }

    // Hide empty state
    function hideEmptyState() {
        resourcesGrid.classList.remove('hidden');
        emptyState.classList.add('hidden');
    }

    // Event listeners for filters
    searchInput.addEventListener('input', filterAndDisplayResources);
    subjectFilter.addEventListener('change', filterAndDisplayResources);
    tagFilter.addEventListener('change', filterAndDisplayResources);

    // Initial load
    loadResources();

    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init();
    }
}); 