const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const taskRoutes = require("./routes/tasks");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "null"], // Autoriser aussi 'null'
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Ajouter un middleware pour gérer les pré-requêtes OPTIONS
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Pour parser les données de formulaire

// Routes
app.use("/tasks", taskRoutes);

// Connexion à la base de données et démarrage du serveur
connectDB().then(async () => {
  await seedDatabase();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

const Task = require("./models/Task");

async function seedDatabase() {
  try {
    const count = await Task.countDocuments();
    if (count === 0) {
      await Task.create([
        {
          titre: "Tâche exemple",
          statut: "à faire",
          priorite: "haute",
          auteur: {
            nom: "Dupont",
            prenom: "Jean",
            email: "jean.dupont@example.com",
          },
        },
      ]);
      console.log("Base initialisée");
    }
  } catch (err) {
    console.error("Erreur initialisation BD:", err);
  }
}

//REGLER PROBLEME NODE SERVER.JS

mongoose.set("debug", true);
