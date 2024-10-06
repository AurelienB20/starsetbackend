const express = require('express');
const multer = require('multer');
const Client = require('ssh2-sftp-client');
const path = require('path');
const { Pool } = require('pg'); // Utilisation de PostgreSQL, adapte selon ta BD

const router = express.Router();

// Configurer la connexion à la base de données
const pool = require('../db').pool; // Supposant que la connexion est gérée dans db.js

// Configurer le stockage en mémoire pour multer (aucun stockage local sur disque)
const storage = multer.memoryStorage(); // Stocker les fichiers en mémoire

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite à 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images au format JPEG et PNG sont autorisées.'));
    }
  }
});

// Route pour télécharger une image sans la stocker localement
router.post('/upload', async (req, res) => {
  const client = new Client();

  try {
    const { file, object_id, type_object } = req.body;
    const { filename, mimetype, data } = file;

    // Validation des données d'entrée
    if (!filename || !mimetype || !data) {
      return res.status(400).json({ success: false, message: 'Aucun fichier ou données manquantes' });
    }

    // Décoder la chaîne base64
    const base64Data = data.replace('data:image/jpeg;base64,', '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Configurer le chemin du fichier sur le serveur distant
    const shortFilePath = `images/${Date.now()}-${filename}`
    const remoteFilePath = `/var/www/html/${shortFilePath}`;
    const dbFilePath = `http://109.176.199.54/${shortFilePath}`

    const sftpConfig = {
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT || 22,
      username: process.env.SFTP_USER,
      password: process.env.SFTP_PASSWORD,
    };

    // Connexion au serveur SFTP et transfert du fichier
    await client.connect(sftpConfig);
    await client.put(buffer, remoteFilePath);
    await client.end();

    // Enregistrement de l'adresse de l'image dans la base de données
    const insertQuery = `
      INSERT INTO images (adress, type_object, object_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const result = await pool.query(insertQuery, [dbFilePath, type_object, object_id]);

    // Vérification du résultat de l'insertion
    if (result.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Image transférée avec succès sur le serveur distant et ajoutée à la base de données',
        fileName: filename,
        remotePath: remoteFilePath,
        dbRecord: result.rows[0],
      });
    } else {
      return res.status(400).json({ success: false, message: 'Erreur lors de l\'insertion en base de données' });
    }
  } catch (error) {
    console.error('Erreur lors du transfert de fichier ou de la base de données:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors du transfert du fichier' });
  }
});

// Route pour télécharger une image comme photo de profil
router.post('/upload-profile-picture', async (req, res) => {
  const client = new Client();

  try {
    const { file, account_id } = req.body;
    const { filename, mimetype, data } = file;

    // Validation des données d'entrée
    if (!filename || !mimetype || !data || !account_id) {
      return res.status(400).json({ success: false, message: 'Aucun fichier ou données manquantes' });
    }

    // Décoder la chaîne base64
    const base64Data = data.replace('data:image/jpeg;base64,', '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Configurer le chemin du fichier sur le serveur distant
    const shortFilePath = `images/profile-pictures/${Date.now()}-${filename}`
    const remoteFilePath = `/var/www/html/${shortFilePath}`;
    const dbFilePath = `http://109.176.199.54/${shortFilePath}`

    const sftpConfig = {
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT || 22,
      username: process.env.SFTP_USER,
      password: process.env.SFTP_PASSWORD,
    };

    // Connexion au serveur SFTP et transfert du fichier
    await client.connect(sftpConfig);
    await client.put(buffer, remoteFilePath);
    await client.end();

    // Mettre à jour l'adresse de la photo de profil dans la base de données
    const updateQuery = `
      UPDATE account
      SET profile_picture_url = $1
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, [dbFilePath, account_id]);

    // Vérification du résultat de la mise à jour
    if (result.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Photo de profil transférée avec succès sur le serveur distant et mise à jour dans la base de données',
        fileName: filename,
        remotePath: remoteFilePath,
        dbRecord: result.rows[0],
      });
    } else {
      return res.status(400).json({ success: false, message: 'Erreur lors de la mise à jour en base de données' });
    }
  } catch (error) {
    console.error('Erreur lors du transfert de fichier ou de la base de données:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors du transfert de la photo de profil' });
  }
});

module.exports = router;
