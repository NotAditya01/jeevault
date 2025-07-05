document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const resourceTypeSelect = document.getElementById('resourceType');
    const fileInputGroup = document.getElementById('fileInputGroup');
    const urlInputGroup = document.getElementById('urlInputGroup');
    const fileInput = document.getElementById('file');
    const urlInput = document.getElementById('url');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const statusMessage = document.getElementById('statusMessage');
    const selectedFileName = document.getElementById('selectedFileName');

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

    // Show selected file name
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            selectedFileName.textContent = file.name;
            selectedFileName.classList.remove('hidden');
            
            // Validate file type
            if (file.type !== 'application/pdf') {
                showMessage('Please upload only PDF files', 'error');
                fileInput.value = '';
                selectedFileName.textContent = '';
                selectedFileName.classList.add('hidden');
            }
            
            // Validate file size
            if (file.size > 10 * 1024 * 1024) { // 10MB
                showMessage('File size must be less than 10MB', 'error');
                fileInput.value = '';
                selectedFileName.textContent = '';
                selectedFileName.classList.add('hidden');
            }
        } else {
            selectedFileName.textContent = '';
            selectedFileName.classList.add('hidden');
        }
    });

    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate form
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const subject = document.getElementById('subject').value;
        const tag = document.getElementById('tag').value;
        const uploadedBy = document.getElementById('uploadedBy').value;
        
        if (!title || !description || !subject || !tag || !uploadedBy) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('subject', subject);
        formData.append('tag', tag);
        formData.append('uploadedBy', uploadedBy);

        const resourceType = resourceTypeSelect.value;
        formData.append('type', resourceType);
        
        if (resourceType === 'file') {
            if (fileInput.files.length === 0) {
                showMessage('Please select a PDF file', 'error');
                return;
            }
            formData.append('file', fileInput.files[0]);
        } else {
            const urlValue = urlInput.value.trim();
            if (!urlValue) {
                showMessage('Please enter a valid URL', 'error');
                return;
            }
            formData.append('url', urlValue);
        }

        // Show progress
        uploadProgress.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        
        // Simulate progress (since fetch doesn't support progress monitoring for uploads)
        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += 5;
                updateProgress(progress);
            }
        }, 300);

        try {
            const response = await fetch('/api/resources', {
                method: 'POST',
                body: formData
            });

            // Clear progress interval
            clearInterval(progressInterval);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            // Complete progress
            updateProgress(100);
            
            // Show success message
            showMessage('Resource uploaded successfully! It will be available after admin approval.', 'success');
            
            // Reset form after a delay
            setTimeout(() => {
                uploadForm.reset();
                uploadProgress.classList.add('hidden');
                selectedFileName.textContent = '';
                selectedFileName.classList.add('hidden');
            }, 3000);
            
        } catch (error) {
            // Clear progress interval and show error
            clearInterval(progressInterval);
            uploadProgress.classList.add('hidden');
            console.error('Error:', error);
            showMessage('Failed to upload resource: ' + error.message, 'error');
        }
    });
    
    // Update progress function
    function updateProgress(percent) {
        progressBar.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
    }
    
    // Show message helper
    function showMessage(text, type) {
        statusMessage.textContent = text;
        statusMessage.className = `mt-4 p-4 rounded-lg ${type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`;
        statusMessage.classList.remove('hidden');
        
        // Scroll to message
        statusMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
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