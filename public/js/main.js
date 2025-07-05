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