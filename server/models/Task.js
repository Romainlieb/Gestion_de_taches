const mongoose = require("mongoose");

const SubTaskSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true },
    statut: {
      type: String,
      enum: ["à faire", "en cours", "terminée", "annulée"],
      default: "à faire",
    },
    echeance: { type: Date },
  },
  { _id: true }
);

const CommentSchema = new mongoose.Schema(
  {
    auteur: {
      nom: { type: String, required: true },
      prenom: { type: String, required: true },
      email: {
        type: String,
        required: true,
        match: [/^\S+@\S+\.\S+$/, "Email invalide"],
      },
    },
    date: { type: Date, default: Date.now },
    contenu: { type: String, required: true },
  },
  { _id: true }
);

const HistorySchema = new mongoose.Schema(
  {
    champModifie: { type: String, required: true },
    ancienneValeur: { type: mongoose.Schema.Types.Mixed },
    nouvelleValeur: { type: mongoose.Schema.Types.Mixed },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TaskSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, "Le titre est obligatoire"],
      maxlength: [100, "Le titre ne doit pas dépasser 100 caractères"],
    },
    description: { type: String },
    dateCreation: { type: Date, default: Date.now },
    echeance: {
      type: Date,
      validate: {
        validator: function (v) {
          return !this.echeance || v > this.dateCreation;
        },
        message: "La date d'échéance doit être postérieure à la création",
      },
    },
    statut: {
      type: String,
      enum: ["à faire", "en cours", "terminée", "annulée"],
      default: "à faire",
    },
    priorite: {
      type: String,
      enum: {
        values: ["basse", "moyenne", "haute", "critique"],
        message: "Priorité invalide",
      },
      default: "moyenne",
    },
    auteur: {
      nom: { type: String, required: [true, "Le nom est obligatoire"] },
      prenom: { type: String, required: [true, "Le prénom est obligatoire"] },
      email: {
        type: String,
        required: [true, "L'email est obligatoire"],
        match: [/^\S+@\S+\.\S+$/, "Email invalide"],
      },
    },
    categorie: {
      type: String,
      enum: ["perso", "travail", "projet", "formation", "autre"],
      default: "perso",
    },
    etiquettes: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: "Maximum 5 étiquettes par tâche",
      },
    },
    sousTaches: [SubTaskSchema],
    commentaires: [CommentSchema],
    historiqueModifications: [HistorySchema],
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

// Index pour les recherches fréquentes
TaskSchema.index({ titre: "text", description: "text" });
TaskSchema.index({ statut: 1, priorite: -1 });

TaskSchema.path("sousTaches").validate(function (v) {
  return v.every((st) => st.titre && st.statut);
}, "Les sous-tâches doivent avoir un titre et un statut");

TaskSchema.pre("save", function (next) {
  if (this.isModified()) {
    const modifiedPaths = this.modifiedPaths();
    const changes = modifiedPaths.map((path) => ({
      champModifie: path,
      ancienneValeur: this.get(path),
      nouvelleValeur: this[path],
    }));

    this.historiqueModifications.push(...changes);
  }
  next();
});

module.exports = mongoose.model("Task", TaskSchema);

//AJOUTER ETAT CRITIQUE ETC...
