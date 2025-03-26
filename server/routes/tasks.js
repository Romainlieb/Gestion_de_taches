const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const mongoose = require("mongoose");

// Middleware pour logger les requêtes (utile pour le debug)
router.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// GET toutes les tâches avec filtres et tris
router.get("/", async (req, res) => {
  try {
    const { statut, priorite } = req.query;
    let query = {};

    // Filtres optionnels
    if (statut) query.statut = statut;
    if (priorite) query.priorite = priorite;
    if (req.query.q) {
      query.$or = [
        { titre: { $regex: req.query.q, $options: "i" } },
        { description: { $regex: req.query.q, $options: "i" } },
      ];
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 }).lean();

    res.json(tasks); // Envoyer toujours un tableau même vide
  } catch (err) {
    console.error("Erreur GET /tasks:", err);
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    });
  }
});

// GET une tâche par ID
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "commentaires.auteur",
      "nom prenom email"
    ); // Exemple de population

    if (!task) {
      return res.status(404).json({
        message: `Tâche avec l'ID ${req.params.id} non trouvée`,
      });
    }

    res.json(task);
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    });
  }
});

// POST créer une nouvelle tâche
router.post("/", async (req, res) => {
  try {
    if (req.body._id) {
      return res
        .status(400)
        .json({ message: "Utilisez PUT pour modifier une tâche existante" });
    }
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ message: "Corps de requête invalide" });
    }

    const newTask = await Task.create({
      ...req.body,
      auteur: req.body.auteur || {
        nom: "Anonyme",
        prenom: "Utilisateur",
        email: "anonyme@example.com",
      },
    });

    res.status(201).json(newTask);
  } catch (err) {
    console.error("Erreur détaillée:", err);
    res.status(400).json({
      message: err.message,
      errors: err.errors
        ? Object.keys(err.errors).reduce((acc, key) => {
            acc[key] = err.errors[key].message;
            return acc;
          }, {})
        : null,
    });
  }
});

// PUT modifier une tâche existante
router.put("/:id", async (req, res) => {
  try {
    // Valider l'ID
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID invalide" });
    }

    // Mettre à jour uniquement les champs modifiés
    const update = { $set: req.body };

    // Ajouter l'entrée d'historique
    if (Object.keys(req.body).length > 0) {
      update.$push = {
        historiqueModifications: {
          $each: [
            {
              champModifie: Object.keys(req.body).join(", "),
              ancienneValeur: await Task.findById(req.params.id).select(
                req.body
              ),
              nouvelleValeur: req.body,
              date: new Date(),
            },
          ],
        },
      };
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!updatedTask) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }

    res.json(updatedTask);
  } catch (err) {
    console.error("Erreur PUT:", err);
    res.status(400).json({
      message: "Échec de la mise à jour",
      error: err.message,
    });
  }
});

// DELETE supprimer une tâche
router.delete("/:id", async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({
        message: `Tâche avec l'ID ${req.params.id} non trouvée`,
      });
    }

    res.json({
      message: "Tâche supprimée avec succès",
      deletedId: req.params.id,
    });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({
      message: "Erreur lors de la suppression",
      error: err.message,
    });
  }
});

module.exports = router;

// Il me manque : dateCreation Date Date de création de la tâche
// auteur Objet { nom, prénom, email }
// categorie String Type de tâche (perso, travail, projet, etc.)
// etiquettes
// Array de Strings
// Liste de mots-clés
// sousTaches
// Tableau d’objets
// titre, statut, échéance (facultatif)
// commentaires
// Tableau d’objets
// auteur, date, contenu
// historiqueModifications
// Tableau d’objets
// champModifie, ancienneValeur, nouvelleValeur, date
