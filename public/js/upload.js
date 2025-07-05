document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const messageDiv = document.getElementById('message');
    const fileInput = document.getElementById('file');
    const linkInput = document.getElementById('link');
    
    // Validate that either file or link is provided
    if (!fileInput.files[0] && !linkInput.value) {
        showMessage('Please provide either a PDF file or an external link', 'error');
        return;
    }
    
    // Validate that not both file and link are provided
    if (fileInput.files[0] && linkInput.value) {
        showMessage('Please provide either a file OR a link, not both', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        
        // Add basic fields
        formData.append('title', document.getElementById('title').value);
        formData.append('subject', document.getElementById('subject').value);
        formData.append('tags', document.getElementById('tags').value);
        formData.append('description', document.getElementById('description').value);
        
        // Add either file or link
        if (fileInput.files[0]) {
            formData.append('file', fileInput.files[0]);
        } else {
            formData.append('link', linkInput.value);
        }
        
        // Disable form while submitting
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Uploading...';
        
        // Submit the form
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Resource submitted successfully! It will be reviewed by an admin.', 'success');
            e.target.reset();
        } else {
            showMessage(result.message || 'Error uploading resource', 'error');
        }
    } catch (error) {
        showMessage('Error uploading resource: ' + error.message, 'error');
    } finally {
        // Re-enable form
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Resource';
    }
});

// Show message helper
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `rounded-lg p-4 ${type === 'success' ? 'bg-green-800' : 'bg-red-800'} text-white`;
    messageDiv.style.display = 'block';
    
    // Scroll to message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// File input validation
document.getElementById('file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
        showMessage('Please upload only PDF files', 'error');
        e.target.value = '';
    }
});

// Clear other input when one is filled
document.getElementById('file').addEventListener('change', () => {
    if (document.getElementById('file').files[0]) {
        document.getElementById('link').value = '';
    }
});

document.getElementById('link').addEventListener('input', () => {
    if (document.getElementById('link').value) {
        document.getElementById('file').value = '';
    }
}); 