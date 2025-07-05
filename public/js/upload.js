document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('uploadForm');
    const message = document.getElementById('message');
    const pdfOption = document.getElementById('pdfOption');
    const urlOption = document.getElementById('urlOption');
    const pdfUploadSection = document.getElementById('pdfUploadSection');
    const urlInputSection = document.getElementById('urlInputSection');

    // Toggle between PDF and URL inputs
    pdfOption.addEventListener('change', () => {
        pdfUploadSection.classList.remove('hidden');
        urlInputSection.classList.add('hidden');
    });

    urlOption.addEventListener('change', () => {
        pdfUploadSection.classList.add('hidden');
        urlInputSection.classList.remove('hidden');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const resourceType = document.querySelector('input[name="resourceType"]:checked').value;
        
        try {
            message.className = 'mt-4 text-gray-600 dark:text-gray-400';
            message.textContent = 'Uploading...';
            message.classList.remove('hidden');

            let response;
            
            if (resourceType === 'url') {
                // Handle URL submission
                const data = {
                    title: formData.get('title'),
                    subject: formData.get('subject'),
                    chapter: formData.get('chapter'),
                    username: formData.get('username'),
                    resourceUrl: formData.get('resourceUrl')
                };

                response = await fetch('/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
            } else {
                // Handle PDF file upload
                const file = formData.get('file');
                if (!file || file.size === 0) {
                    throw new Error('Please select a PDF file');
                }

                if (file.size > 40 * 1024 * 1024) {
                    throw new Error('File size exceeds 40MB limit');
                }

                response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            message.className = 'mt-4 text-green-600 dark:text-green-400';
            message.textContent = 'Resource uploaded successfully! It will be visible after admin approval.';
            form.reset();

        } catch (error) {
            message.className = 'mt-4 text-red-600 dark:text-red-400';
            message.textContent = error.message || 'Upload failed. Please try again.';
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