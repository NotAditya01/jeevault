// Check if admin is logged in
const isLoggedIn = () => localStorage.getItem('adminLoggedIn') === 'true';

// Show/hide appropriate sections based on login state
function updateUI() {
    document.getElementById('loginForm').style.display = isLoggedIn() ? 'none' : 'block';
    document.getElementById('adminDashboard').style.display = isLoggedIn() ? 'block' : 'none';
    
    if (isLoggedIn()) {
        fetchResources();
    }
}

// Handle login form submission
document.querySelector('#loginForm form').addEventListener('submit', async (e) => {
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
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('adminLoggedIn', 'true');
            updateUI();
        } else {
            showLoginMessage('Invalid credentials', 'error');
        }
    } catch (error) {
        showLoginMessage('Error logging in: ' + error.message, 'error');
    }
});

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    updateUI();
});

// Fetch all resources
async function fetchResources() {
    try {
        const response = await fetch('/api/admin/resources');
        const resources = await response.json();
        renderResources(resources);
    } catch (error) {
        console.error('Error fetching resources:', error);
        alert('Error fetching resources. Please try again.');
    }
}

// Render resources list
function renderResources(resources) {
    const list = document.getElementById('resourcesList');
    
    list.innerHTML = resources.map(resource => `
        <div class="bg-gray-800 rounded-2xl shadow-md p-6 ${resource.approved ? 'border-l-4 border-green-500' : 'border-l-4 border-yellow-500'}">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-semibold text-white">${resource.title}</h3>
                    <p class="text-gray-400 text-sm mt-1">Status: ${resource.approved ? 'Approved' : 'Pending'}</p>
                </div>
                <span class="px-3 py-1 bg-gray-700 text-sm rounded-full">${resource.subject}</span>
            </div>
            
            <p class="text-gray-400 text-sm mb-4">${resource.description || ''}</p>
            
            <div class="flex flex-wrap gap-2 mb-4">
                ${resource.tags.map(tag => `
                    <span class="px-2 py-1 bg-gray-700 text-xs rounded-full">${tag}</span>
                `).join('')}
            </div>
            
            <div class="mb-4">
                <strong class="text-sm text-gray-300">Resource Link:</strong>
                <a href="${resource.filePath || resource.externalLink}" target="_blank" 
                    class="text-primary hover:underline text-sm ml-2">
                    ${resource.filePath ? 'Download File' : resource.externalLink}
                </a>
            </div>
            
            <div class="flex flex-wrap gap-3">
                ${!resource.approved ? `
                    <button onclick="approveResource('${resource._id}')"
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-opacity-90 transition-colors duration-200">
                        ✅ Approve
                    </button>
                ` : ''}
                
                <button onclick="editResource('${resource._id}')"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-opacity-90 transition-colors duration-200">
                    ✏️ Edit
                </button>
                
                <button onclick="deleteResource('${resource._id}')"
                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-opacity-90 transition-colors duration-200">
                    ❌ Delete
                </button>
            </div>
            
            <div id="editForm-${resource._id}" class="hidden mt-4 space-y-4">
                <input type="text" value="${resource.title}" 
                    class="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    id="edit-title-${resource._id}"
                    placeholder="Enter resource title">
                    
                <select class="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    id="edit-subject-${resource._id}">
                    <option value="">Select subject</option>
                    <option value="Physics" ${resource.subject === 'Physics' ? 'selected' : ''}>Physics</option>
                    <option value="Chemistry" ${resource.subject === 'Chemistry' ? 'selected' : ''}>Chemistry</option>
                    <option value="Math" ${resource.subject === 'Math' ? 'selected' : ''}>Math</option>
                </select>
                
                <input type="text" value="${resource.tags.join(', ')}" 
                    class="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    id="edit-tags-${resource._id}"
                    placeholder="Enter tags (comma-separated)">
                    
                <textarea class="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    id="edit-description-${resource._id}"
                    placeholder="Enter resource description">${resource.description || ''}</textarea>
                    
                <input type="text" value="${resource.externalLink || ''}"
                    class="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    id="edit-link-${resource._id}"
                    placeholder="Enter external link (optional)">
                    
                <div class="flex gap-2">
                    <button onclick="saveEdit('${resource._id}')"
                        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors duration-200">
                        Save Changes
                    </button>
                    <button onclick="cancelEdit('${resource._id}')"
                        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-opacity-90 transition-colors duration-200">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Resource actions
async function approveResource(id) {
    try {
        const response = await fetch(`/api/admin/approve/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            await fetchResources(); // Refresh the list
        } else {
            const error = await response.json();
            alert('Error approving resource: ' + error.message);
        }
    } catch (error) {
        console.error('Error approving resource:', error);
        alert('Error approving resource. Please try again.');
    }
}

async function deleteResource(id) {
    if (!confirm('Are you sure you want to delete this resource?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            await fetchResources(); // Refresh the list
        } else {
            const error = await response.json();
            alert('Error deleting resource: ' + error.message);
        }
    } catch (error) {
        console.error('Error deleting resource:', error);
        alert('Error deleting resource. Please try again.');
    }
}

function editResource(id) {
    document.getElementById(`editForm-${id}`).style.display = 'block';
}

function cancelEdit(id) {
    document.getElementById(`editForm-${id}`).style.display = 'none';
}

async function saveEdit(id) {
    const data = {
        title: document.getElementById(`edit-title-${id}`).value,
        subject: document.getElementById(`edit-subject-${id}`).value,
        tags: document.getElementById(`edit-tags-${id}`).value,
        description: document.getElementById(`edit-description-${id}`).value,
        link: document.getElementById(`edit-link-${id}`).value
    };
    
    try {
        const response = await fetch(`/api/admin/edit/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            document.getElementById(`editForm-${id}`).style.display = 'none';
            await fetchResources(); // Refresh the list
        } else {
            const error = await response.json();
            alert('Error updating resource: ' + error.message);
        }
    } catch (error) {
        console.error('Error updating resource:', error);
        alert('Error updating resource. Please try again.');
    }
}

// Show login message helper
function showLoginMessage(text, type) {
    const messageDiv = document.getElementById('loginMessage');
    messageDiv.textContent = text;
    messageDiv.className = `rounded-lg p-4 ${type === 'success' ? 'bg-green-800' : 'bg-red-800'} text-white`;
    messageDiv.style.display = 'block';
}

// Initialize UI
updateUI(); 