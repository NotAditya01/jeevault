// Format date helper
function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}


async function loadResources() {
  try {
    const response = await fetch("/api/resources");
    const resources = await response.json();
    const resourcesContainer = document.getElementById("resourcesContainer");

   
    resourcesContainer.innerHTML = "";

    if (resources.length === 0) {
      document.getElementById("noResources").classList.remove("hidden");
      return;
    }

    // Create resource cards
    resources.forEach((resource, index) => {
      const card = document.createElement("div");
      card.className = `bg-white/5 dark:bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 flex flex-col card-fade-in stagger-delay-${
        (index % 4) + 1
      }`;

      const tagClass =
        resource.tag === "notes"
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";

      card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${
            resource.title
          }</h3>
          <span class="px-2 py-1 text-xs rounded-full ${tagClass} uppercase font-medium">${
        resource.tag
      }</span>
        </div>
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-grow">${
          resource.description
        }</p>
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-700 dark:text-gray-300">${
              resource.subject
            }</span>
            <span class="text-gray-500 dark:text-gray-400">${formatDate(
              resource.createdAt
            )}</span>
          </div>
          <div class="flex justify-between items-center mt-3">
            <span class="text-xs text-gray-500 dark:text-gray-400">By ${
              resource.uploadedBy
            }</span>
            <a href="${
              resource.type === "file" ? resource.fileUrl : resource.url
            }" target="_blank" 
               class="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
              <i class="bi bi-download mr-1"></i> Download
            </a>
          </div>
        </div>
      `;

      resourcesContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading resources:", error);
    const resourcesContainer = document.getElementById("resourcesContainer");
    resourcesContainer.innerHTML = `
      <div class="col-span-full text-center py-8">
        <i class="bi bi-exclamation-triangle text-3xl text-red-500 mb-2"></i>
        <p class="text-gray-600 dark:text-gray-400">Failed to load resources. Please try again later.</p>
      </div>
    `;
  }
}


function filterResources() {
  const searchInput = document.getElementById("searchInput").value.toLowerCase();
  const subjectFilter = document.getElementById("subjectFilter").value;
  const tagFilter = document.getElementById("tagFilter").value;
  const cards = document.querySelectorAll("#resourcesContainer > div");
  let visibleCount = 0;

  cards.forEach((card) => {
    const title = card.querySelector("h3").textContent.toLowerCase();
    const description = card.querySelector("p").textContent.toLowerCase();
    const subject = card.querySelector(
      ".flex.justify-between.items-center.text-sm span"
    ).textContent;
    const tag = card
      .querySelector(".px-2.py-1.text-xs.rounded-full")
      .textContent.toLowerCase();

    const matchesSearch =
      title.includes(searchInput) || description.includes(searchInput);
    const matchesSubject = subjectFilter === "" || subject === subjectFilter;
    const matchesTag =
      tagFilter === "" || tag.toLowerCase() === tagFilter.toLowerCase();

    if (matchesSearch && matchesSubject && matchesTag) {
      card.classList.remove("hidden");
      visibleCount++;
    } else {
      card.classList.add("hidden");
    }
  });

  // Show/hide no results message
  if (visibleCount === 0 && cards.length > 0) {
    document.getElementById("noResources").classList.remove("hidden");
    document.getElementById("noResources").querySelector("p").textContent =
      "No resources match your search criteria.";
  } else {
    document.getElementById("noResources").classList.add("hidden");
  }
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("appear");
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  // Add fade-in observers
  document
    .querySelectorAll(".fade-in-section")
    .forEach((el) => observer.observe(el));

  // Add filter listeners
  document
    .getElementById("searchInput")
    .addEventListener("input", filterResources);
  document
    .getElementById("subjectFilter")
    .addEventListener("change", filterResources);
  document
    .getElementById("tagFilter")
    .addEventListener("change", filterResources);

  // Load initial resources
  loadResources();
}); 