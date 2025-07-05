document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const resourceTypeSelect = document.getElementById('resourceType');
    const fileInputGroup = document.getElementById('fileInputGroup');
    const urlInputGroup = document.getElementById('urlInputGroup');
    const fileInput = document.getElementById('file');
    const urlInput = document.getElementById('url');

    // Toggle between file upload and URL input
    resourceTypeSelect.addEventListener('change', function() {
        if (this.value === 'file') {
            fileInputGroup.style.display = 'block';
            urlInputGroup.style.display = 'none';
            fileInput.required = true;
            urlInput.required = false;
        } else {
            fileInputGroup.style.display = 'none';
            urlInputGroup.style.display = 'block';
            fileInput.required = false;
            urlInput.required = true;
        }
    });

    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', document.getElementById('title').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('type', document.getElementById('resourceType').value);
        formData.append('tag', document.getElementById('tag').value);

        const resourceType = document.getElementById('resourceType').value;
        if (resourceType === 'file') {
            if (fileInput.files.length === 0) {
                alert('Please select a PDF file');
                return;
            }
            formData.append('file', fileInput.files[0]);
        } else {
            const urlValue = urlInput.value.trim();
            if (!urlValue) {
                alert('Please enter a valid URL');
                return;
            }
            formData.append('url', urlValue);
        }

        try {
            const response = await fetch('/api/resources', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            alert('Resource uploaded successfully!');
            uploadForm.reset();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to upload resource: ' + error.message);
        }
    });
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