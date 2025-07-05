// Check if admin is logged in
const isLoggedIn = () => localStorage.getItem('adminLoggedIn') === 'true';

// Store admin credentials securely
function storeCredentials(username, password) {
    localStorage.setItem('adminCredentials', btoa(`${username}:${password}`));
    localStorage.setItem('adminLoggedIn', 'true');
}

// Get stored credentials
function getCredentials() {
    const credentials = localStorage.getItem('adminCredentials');
    return credentials || null;
}

// Clear credentials on logout
function clearCredentials() {
    localStorage.removeItem('adminCredentials');
    localStorage.removeItem('adminLoggedIn');
}

// Track current filter state
let currentFilter = 'pending'; // 'pending' or 'approved'

// Show/hide appropriate sections based on login state
function updateUI() {
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');
    
    if (isLoggedIn()) {
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        fetchResources();
    } else {
        loginForm.style.display = 'flex';
        adminPanel.style.display = 'none';
    }
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('#loginForm form');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            // Check if response is ok before trying to parse JSON
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            // Check content type to ensure it's JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response');
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Store credentials for future API calls
                storeCredentials(username, password);
                updateUI();
            } else {
                showLoginMessage('Invalid credentials', 'error');
            }
        } catch (error) {
            console.error('Error during login:', error);
            showLoginMessage('Error logging in: ' + error.message, 'error');
        }
    });

    // Handle logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearCredentials();
            updateUI();
        });
    }

    // Handle tab switching
    const pendingTab = document.getElementById('pendingTab');
    const approvedTab = document.getElementById('approvedTab');

    if (pendingTab && approvedTab) {
        pendingTab.addEventListener('click', () => {
            currentFilter = 'pending';
            updateTabs();
            filterResources();
        });

        approvedTab.addEventListener('click', () => {
            currentFilter = 'approved';
            updateTabs();
            filterResources();
        });
    }

    // Handle edit modal close button
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeEditModal);
    }

    // Handle edit form submission
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditFormSubmit);
    }

    // Initialize UI
    updateUI();
});

// Update tab styles based on current filter
function updateTabs() {
    const pendingTab = document.getElementById('pendingTab');
    const approvedTab = document.getElementById('approvedTab');

    if (currentFilter === 'pending') {
        pendingTab.className = 'py-4 px-1 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium text-sm';
        approvedTab.className = 'py-4 px-1 text-gray-500 dark:text-gray-400 font-medium text-sm';
    } else {
        approvedTab.className = 'py-4 px-1 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium text-sm';
        pendingTab.className = 'py-4 px-1 text-gray-500 dark:text-gray-400 font-medium text-sm';
    }
}

// Store all resources for filtering
let allResources = [];

// Fetch all resources
async function fetchResources() {
    try {
        const credentials = getCredentials();
        if (!credentials) {
            clearCredentials();
            updateUI();
            showLoginMessage('Session expired. Please log in again.', 'error');
            return;
        }
        
        const response = await fetch('/admin/resources', {
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });
        
        if (response.status === 401) {
            // Unauthorized, log out
            clearCredentials();
            updateUI();
            showLoginMessage('Session expired. Please log in again.', 'error');
            return;
        }
        
        // Check if response is ok and content type is JSON before parsing
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }
        
        allResources = await response.json();
        filterResources();
    } catch (error) {
        console.error('Error fetching resources:', error);
        showLoginMessage('Error fetching resources: ' + error.message, 'error');
    }
}

// Filter resources based on current tab
function filterResources() {
    const filteredResources = allResources.filter(resource => {
        if (currentFilter === 'pending') {
            return !resource.approved;
        } else {
            return resource.approved;
        }
    });
    
    renderResources(filteredResources);
}

// Render resources list
function renderResources(resources) {
    const list = document.getElementById('resourcesList');
    
    if (!list) {
        console.error('Resources list element not found');
        return;
    }
    
    if (resources.length === 0) {
        list.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="bi bi-inbox text-5xl text-gray-400 dark:text-gray-600"></i>
                <p class="mt-4 text-gray-600 dark:text-gray-400">No ${currentFilter} resources available.</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = resources.map(resource => `
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
                <div class="flex flex-wrap items-center justify-between gap-2 mt-4">
                    <div>
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                            Shared by: ${resource.uploadedBy || 'Anonymous'}
                        </span>
                    </div>
                    <div class="flex gap-2">
                        ${currentFilter === 'pending' ? `
                            <button onclick="approveResource('${resource._id}')" class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                <i class="bi bi-check-lg mr-2"></i> Approve
                            </button>
                        ` : ''}
                        <button onclick="editResource('${resource._id}')" class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <i class="bi bi-pencil mr-2"></i> Edit
                        </button>
                        <button onclick="deleteResource('${resource._id}')" class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            <i class="bi bi-trash mr-2"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Approve resource
async function approveResource(id) {
    try {
        const credentials = getCredentials();
        if (!credentials) {
            clearCredentials();
            updateUI();
            return;
        }
        
        const response = await fetch(`/admin/resources/${id}/approve`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            clearCredentials();
            updateUI();
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to approve resource: ${response.status}`);
        }
        
        // Check content type before parsing JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }
        
        await response.json(); // Just to validate the response
        
        // Refresh resources
        fetchResources();
        
    } catch (error) {
        console.error('Error approving resource:', error);
        alert('Failed to approve resource: ' + error.message);
    }
}

// Delete resource
async function deleteResource(id) {
    if (!confirm('Are you sure you want to delete this resource?')) {
        return;
    }
    
    try {
        const credentials = getCredentials();
        if (!credentials) {
            clearCredentials();
            updateUI();
            return;
        }
        
        const response = await fetch(`/admin/resources/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });
        
        if (response.status === 401) {
            clearCredentials();
            updateUI();
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to delete resource: ${response.status}`);
        }
        
        // Refresh resources
        fetchResources();
        
    } catch (error) {
        console.error('Error deleting resource:', error);
        alert('Failed to delete resource: ' + error.message);
    }
}

// Current resource being edited
let currentEditId = null;

// Edit resource
function editResource(id) {
    const resource = allResources.find(r => r._id === id);
    if (!resource) return;
    
    currentEditId = id;
    
    // Populate form
    document.getElementById('editTitle').value = resource.title;
    document.getElementById('editDescription').value = resource.description;
    document.getElementById('editSubject').value = resource.subject;
    document.getElementById('editTag').value = resource.tag;
    document.getElementById('editUploadedBy').value = resource.uploadedBy || '';
    
    // Show modal
    document.getElementById('editModal').classList.remove('hidden');
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    currentEditId = null;
}

// Handle edit form submission
async function handleEditFormSubmit(e) {
    e.preventDefault();
    
    if (!currentEditId) return;
    
    try {
        const credentials = getCredentials();
        if (!credentials) {
            clearCredentials();
            updateUI();
            return;
        }
        
        const formData = {
            title: document.getElementById('editTitle').value,
            description: document.getElementById('editDescription').value,
            subject: document.getElementById('editSubject').value,
            tag: document.getElementById('editTag').value,
            uploadedBy: document.getElementById('editUploadedBy').value || 'Anonymous'
        };
        
        const response = await fetch(`/admin/resources/${currentEditId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.status === 401) {
            clearCredentials();
            updateUI();
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to update resource: ${response.status}`);
        }
        
        // Check content type before parsing JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }
        
        await response.json(); // Just to validate the response
        
        // Close modal and refresh
        closeEditModal();
        fetchResources();
        
    } catch (error) {
        console.error('Error updating resource:', error);
        alert('Failed to update resource: ' + error.message);
    }
}

// Show login message
function showLoginMessage(text, type) {
    const messageEl = document.getElementById('loginMessage');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = `mt-4 p-4 rounded-lg ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
        messageEl.classList.remove('hidden');
    }
} 