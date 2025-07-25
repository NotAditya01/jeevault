let resources = [];
let activeFilters = {
  search: "",
  subject: "",
  tags: new Set(),
};

// Fetch resources from the API
async function fetchResources() {
  try {
    const response = await fetch("/api/resources");

    if (!response.ok) {
      throw new Error(
        `Failed to fetch resources: ${response.status} ${response.statusText}`
      );
    }

    resources = await response.json();

    if (resources.length === 0) {
      showEmptyState("No resources available yet. Be the first to share!");
    } else {
      renderResources();
      updateTagFilters();
    }
  } catch (error) {
    console.error("Error fetching resources:", error);
    showEmptyState("Failed to load resources. Please try again later.");
  }
}

// Show empty state
function showEmptyState(message = "No resources available yet.") {
  const resourcesContainer = document.getElementById("resourcesContainer");
  const noResources = document.getElementById("noResources");

  if (resourcesContainer && noResources) {
    resourcesContainer.classList.add("hidden");
    noResources.classList.remove("hidden");

    const messageElement = noResources.querySelector("p");
    if (messageElement) {
      messageElement.textContent = message;
    }
  }
}

// Hide empty state
function hideEmptyState() {
  const resourcesContainer = document.getElementById("resourcesContainer");
  const noResources = document.getElementById("noResources");

  if (resourcesContainer && noResources) {
    resourcesContainer.classList.remove("hidden");
    noResources.classList.add("hidden");
  }
}

// Render resources
function renderResources() {
  const container = document.getElementById("resourcesContainer");
  if (!container) return;

  const filteredResources = filterResources();

  if (filteredResources.length === 0) {
    showEmptyState("No resources match your search criteria.");
    return;
  }

  hideEmptyState();

  container.innerHTML = filteredResources
    .map(
      (resource) => `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 card-hover card-fade-in">
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
                        <i class="bi bi-clock"></i> ${new Date(
                          resource.createdAt
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${
                  resource.title
                }</h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    ${resource.description}
                </p>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <a href="${resource.url}" target="_blank" 
                       class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <i class="bi bi-link-45deg mr-2"></i> 
                        View Resource
                    </a>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                        Shared by: ${resource.uploadedBy || "Anonymous"}
                    </span>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Filter resources based on fliters
function filterResources() {
  return resources.filter((resource) => {
    const matchesSearch =
      resource.title
        .toLowerCase()
        .includes(activeFilters.search.toLowerCase()) ||
      resource.description
        .toLowerCase()
        .includes(activeFilters.search.toLowerCase());
    const matchesSubject =
      !activeFilters.subject || resource.subject === activeFilters.subject;
    const matchesTags =
      activeFilters.tags.size === 0 ||
      (resource.tag && activeFilters.tags.has(resource.tag));

    return matchesSearch && matchesSubject && matchesTags;
  });
}

function updateTagFilters() {
  const tagFilter = document.getElementById("tagFilter");
  if (!tagFilter) return;

  const tags = new Set();
  resources.forEach((resource) => {
    if (resource.tag) {
      tags.add(resource.tag);
    }
  });

  // Add options to select
  if (tags.size > 0) {
    const currentValue = tagFilter.value;

    // Clear existing options except the first one
    while (tagFilter.options.length > 1) {
      tagFilter.remove(1);
    }

    // Add new options
    tags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      tagFilter.appendChild(option);
    });

    // Restore selected value if it still exists
    if (currentValue && tags.has(currentValue)) {
      tagFilter.value = currentValue;
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      activeFilters.search = e.target.value;
      renderResources();
    });
  }

  // Subject filter
  const subjectFilter = document.getElementById("subjectFilter");
  if (subjectFilter) {
    subjectFilter.addEventListener("change", (e) => {
      activeFilters.subject = e.target.value;
      renderResources();
    });
  }

  // Tag filter
  const tagFilter = document.getElementById("tagFilter");
  if (tagFilter) {
    tagFilter.addEventListener("change", (e) => {
      if (e.target.value) {
        activeFilters.tags = new Set([e.target.value]);
      } else {
        activeFilters.tags = new Set();
      }
      renderResources();
    });
  }

  // Initialize
  fetchResources();

  // Retry button for failed resource loading
  const retryButton = document.querySelector("#noResources button");
  if (retryButton) {
    retryButton.addEventListener("click", () => {
      fetchResources();
    });
  }

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", function () {
      mobileMenu.classList.toggle("hidden");
    });
  }

  // Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  const htmlElement = document.documentElement;

  if (themeToggle) {
    const themeIcon = themeToggle.querySelector("i");

    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      htmlElement.classList.add("dark");
      if (themeIcon) {
        themeIcon.classList.remove("bi-moon-fill");
        themeIcon.classList.add("bi-sun-fill");
      }
    }

    themeToggle.addEventListener("click", function () {
      htmlElement.classList.toggle("dark");

      // Update icon
      if (themeIcon) {
        if (htmlElement.classList.contains("dark")) {
          themeIcon.classList.remove("bi-moon-fill");
          themeIcon.classList.add("bi-sun-fill");
          localStorage.setItem("theme", "dark");
        } else {
          themeIcon.classList.remove("bi-sun-fill");
          themeIcon.classList.add("bi-moon-fill");
          localStorage.setItem("theme", "light");
        }
      }
    });
  }
});
