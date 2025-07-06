document.addEventListener("DOMContentLoaded", function () {
  const uploadForm = document.getElementById("uploadForm");
  const statusMessage = document.getElementById("statusMessage");

  uploadForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Validate form
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const subject = document.getElementById("subject").value;
    const tag = document.getElementById("tag").value;
    const uploadedBy = document.getElementById("uploadedBy").value.trim();
    const url = document.getElementById("url").value.trim();

    if (!title || !description || !subject || !tag || !url) {
      showMessage("Please fill in all required fields", "error");
      return;
    }

    // URL validation
    try {
      new URL(url);
    } catch (error) {
      showMessage("Please enter a valid URL", "error");
      return;
    }

    const formData = {
      title,
      description,
      subject,
      tag,
      uploadedBy: uploadedBy || "Anonymous",
      url,
    };

    // Disable submit button during submission
    const submitButton = uploadForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="bi bi-arrow-repeat spin mr-2"></i> Submitting...';
    }

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = "Submission failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Show success message
      showMessage(
        "Your resource has been submitted. It will appear after admin approval.",
        "success"
      );

      setTimeout(() => {
        uploadForm.reset();

        // Re-enable submit button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML =
            '<i class="bi bi-cloud-upload mr-2"></i>Submit Resource';
        }
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      showMessage(error.message, "error");

      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML =
          '<i class="bi bi-cloud-upload mr-2"></i>Submit Resource';
      }
    }
  });

  function showMessage(text, type) {
    statusMessage.textContent = text;
    statusMessage.className = `mt-4 p-4 rounded-lg ${
      type === "success"
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }`;
    statusMessage.classList.remove("hidden");

    statusMessage.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }
});
