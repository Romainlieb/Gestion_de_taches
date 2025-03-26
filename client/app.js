document.addEventListener("DOMContentLoaded", () => {
  // Éléments DOM
  const taskList = document.getElementById("task-list");
  const addTaskBtn = document.getElementById("add-task-btn");
  const taskModal = document.getElementById("task-modal");
  const taskForm = document.getElementById("task-form");
  const closeBtn = document.querySelector(".close");
  const searchInput = document.getElementById("search");
  const statusFilter = document.getElementById("status-filter");
  const priorityFilter = document.getElementById("priority-filter");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const resetFiltersBtn = document.getElementById("reset-filters");

  // Variables d'état
  let currentTasks = [];
  let currentEditingTaskId = null;

  // Chargement initial
  loadTasks();

  // Écouteurs d'événements
  addTaskBtn.addEventListener("click", () => openModal());
  closeBtn.addEventListener("click", closeModal);
  applyFiltersBtn.addEventListener("click", applyFilters);
  resetFiltersBtn.addEventListener("click", resetFilters);

  // Ajouter cette fonction au début pour gérer les erreurs réseau
  async function handleFetch(url, options = {}) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Erreur fetch:", error);
      throw error;
    }
  }

  // Fonction pour charger les tâches
  async function loadTasks(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`http://localhost:3001/tasks?${params}`);

      if (!response.ok) throw new Error(`Erreur ${response.status}`);

      const tasks = await response.json();
      renderTasks(tasks);
    } catch (error) {
      console.error("Erreur:", error);
      taskList.innerHTML = `
        <div class="task-placeholder">
          <p>${error.message}</p>
          <p>Vérifiez que le serveur est en marche</p>
        </div>
      `;
    }
  }

  // Fonction pour afficher les tâches
  function renderTasks(tasks) {
    if (tasks.length === 0) {
      taskList.innerHTML = `
          <div class="task-placeholder">
            <p>Aucune tâche trouvée</p>
          </div>
        `;
      return;
    }

    taskList.innerHTML = "";

    tasks.forEach((task) => {
      const taskElement = document.createElement("div");
      taskElement.className = "task";
      taskElement.innerHTML = `
          <h3>${task.titre}</h3>
          <p><strong>Statut:</strong> ${task.statut}</p>
          <p><strong>Priorité:</strong> ${task.priorite}</p>
          ${
            task.echeance
              ? `<p><strong>Échéance:</strong> ${new Date(
                  task.echeance
                ).toLocaleDateString()}</p>`
              : ""
          }
          ${task.description ? `<p>${task.description}</p>` : ""}
          
          <div class="task-actions">
            <button class="edit-btn" data-id="${task._id}">Modifier</button>
            <button class="delete-btn" data-id="${task._id}">Supprimer</button>
          </div>
        `;
      taskList.appendChild(taskElement);
    });

    // Ajouter les gestionnaires d'événements
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const taskId = e.target.dataset.id;
        console.log("ID à modifier:", taskId);
        openModal(taskId);
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => deleteTask(e.target.dataset.id));
    });
  }

  // Fonction pour ouvrir le modal
  function openModal(taskId = null) {
    // Réinitialiser le formulaire
    taskForm.reset();

    // Stocker l'ID dans la variable globale
    currentEditingTaskId = taskId;

    if (taskId) {
      // Mode édition
      document.getElementById("modal-title").textContent = "Modifier la tâche";
      const task = currentTasks.find((t) => t._id === taskId);

      if (task) {
        // IMPORTANT: définir ces valeurs
        document.getElementById("task-id").value = taskId;

        // Remplir les champs
        document.getElementById("title").value = task.titre || "";
        document.getElementById("description").value = task.description || "";
        document.getElementById("status").value = task.statut || "à faire";
        document.getElementById("priority").value = task.priorite || "moyenne";

        if (task.echeance) {
          document.getElementById("due-date").value = new Date(task.echeance)
            .toISOString()
            .split("T")[0];
        }

        console.log("Ouverture en mode édition - ID:", taskId);
        console.log(
          "ID stocké dans la variable globale:",
          currentEditingTaskId
        );
      }
    } else {
      // Mode création
      document.getElementById("modal-title").textContent = "Nouvelle tâche";
      document.getElementById("task-id").value = "";
    }

    taskModal.style.display = "block";
  }

  // Fonction pour fermer le modal
  function closeModal() {
    taskModal.style.display = "none";
    currentEditingTaskId = null;
  }

  // Fonction pour appliquer les filtres
  function applyFilters() {
    const filters = {};

    if (searchInput.value) filters.q = searchInput.value;
    if (statusFilter.value) filters.statut = statusFilter.value;
    if (priorityFilter.value) filters.priorite = priorityFilter.value;

    loadTasks(filters);
  }

  // Fonction pour réinitialiser les filtres
  function resetFilters() {
    searchInput.value = "";
    statusFilter.value = "";
    priorityFilter.value = "";
    loadTasks();
  }

  // Fonction pour supprimer une tâche
  async function deleteTask(taskId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;

    try {
      const response = await fetch(`http://localhost:3001/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadTasks();
      } else {
        throw new Error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Échec de la suppression");
    }
  }

  // Gestion de la soumission du formulaire
  taskForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Utiliser la variable globale
    const taskId = currentEditingTaskId;

    console.log("ID au moment de la soumission:", taskId);

    // Construire les données
    const formData = {
      titre: document.getElementById("title").value,
      description: document.getElementById("description").value,
      statut: document.getElementById("status").value,
      priorite: document.getElementById("priority").value,
    };

    // Ajouter la date si elle existe
    if (document.getElementById("due-date").value) {
      formData.echeance = document.getElementById("due-date").value;
    }

    // Ajouter l'auteur UNIQUEMENT en création
    if (!taskId) {
      formData.auteur = {
        nom: document.getElementById("author-name").value,
        prenom: document.getElementById("author-firstname").value,
        email: document.getElementById("author-email").value,
      };
    }

    // Déterminer la méthode
    const isEditMode = taskId && taskId.trim() !== "";
    const method = isEditMode ? "PUT" : "POST";
    const url = isEditMode
      ? `http://localhost:3001/tasks/${taskId}`
      : "http://localhost:3001/tasks";

    console.log(
      `Mode ${isEditMode ? "ÉDITION" : "CRÉATION"} - Méthode ${method}`
    );
    console.log("URL:", url);

    // Pour debug
    console.log({ taskId, method, url, formData });

    // Envoyer la requête
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Réinitialiser l'ID après succès
        currentEditingTaskId = null;
        closeModal();
        loadTasks();
      } else {
        console.error("Erreur:", xhr.status, xhr.responseText);
        alert(`Échec de l'opération: ${xhr.status} ${xhr.statusText}`);
      }
    };

    xhr.onerror = function () {
      console.error("Erreur réseau");
      alert("Erreur réseau");
    };

    xhr.send(JSON.stringify(formData));
  });
});
