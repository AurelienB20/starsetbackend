const express = require('express');
const multer = require('multer');
const Client = require('ssh2-sftp-client');
const path = require('path');
const { Pool } = require('pg');

const router = express.Router();

// Configurer la connexion à la base de données
const pool = require('../db').pool;

// Configurer le stockage en mémoire pour multer
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite à 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images au format JPEG, PNG et GIF sont autorisées.'));
    }
  }
});

// Fonction pour retirer le préfixe base64 en fonction du type MIME
const stripBase64Prefix = (data) => {
  if (data.startsWith('data:image/jpeg;base64,')) return data.replace('data:image/jpeg;base64,', '');
  if (data.startsWith('data:image/png;base64,')) return data.replace('data:image/png;base64,', '');
  if (data.startsWith('data:image/gif;base64,')) return data.replace('data:image/gif;base64,', '');
  return data; // Si aucun préfixe reconnu, retourner sans modification
};

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

    // Décoder la chaîne base64 en fonction du type MIME
    const base64Data = stripBase64Prefix(data);
    const buffer = Buffer.from(base64Data, 'base64');

    // Configurer le chemin du fichier sur le serveur distant
    const shortFilePath = `images/${Date.now()}-${filename}`;
    const remoteFilePath = `/var/www/html/${shortFilePath}`;
    const dbFilePath = `http://109.176.199.54/${shortFilePath}`;

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

    if (!filename || !mimetype || !data || !account_id) {
      return res.status(400).json({ success: false, message: 'Aucun fichier ou données manquantes' });
    }

    const base64Data = stripBase64Prefix(data);
    const buffer = Buffer.from(base64Data, 'base64');

    const shortFilePath = `images/profile-pictures/${Date.now()}-${filename}`;
    const remoteFilePath = `/var/www/html/${shortFilePath}`;
    const dbFilePath = `http://109.176.199.54/${shortFilePath}`;

    const sftpConfig = {
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT || 22,
      username: process.env.SFTP_USER,
      password: process.env.SFTP_PASSWORD,
    };

    await client.connect(sftpConfig);
    await client.put(buffer, remoteFilePath);
    await client.end();

    const updateQuery = `
      UPDATE account
      SET profile_picture_url = $1
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, [dbFilePath, account_id]);

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

// Ajouter une route pour supprimer une photo
router.post('/delete-photo', async (req, res) => {
  const client = new Client();
  console.log('debut de delete-photo');
  console.log('Requête reçue avec le corps suivant :', req.body); // Vérifie les données reçues
  try {
    const { adress } = req.body;
    console.log('ID de la photo fourni :', adress);

    // Vérifier si l'ID de la photo est fourni
    if (!adress) {
      return res.status(400).json({ success: false, message: 'ID de la photo requis' });
    }

    // Récupérer l'URL et le chemin du fichier dans la base de données
    const selectQuery = `
      SELECT adress
      FROM images
      WHERE adress = $1;
    `;

    const selectResult = await pool.query(selectQuery, [adress]);

    if (selectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Photo non trouvée' });
    }

    const fileUrl = selectResult.rows[0].adress;
    const remoteFilePath = fileUrl.replace('http://109.176.199.54/', '/var/www/html/');

    const sftpConfig = {
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT || 22,
      username: process.env.SFTP_USER,
      password: process.env.SFTP_PASSWORD,
    };

    // Supprimer le fichier sur le serveur distant
    //await client.connect(sftpConfig);
    //await client.delete(remoteFilePath);
    //await client.end();

    // Supprimer l'entrée correspondante dans la base de données
    const deleteQuery = `
      DELETE FROM images
      WHERE adress = $1
      RETURNING *;
    `;

    const deleteResult = await pool.query(deleteQuery, [adress]);
    console.log('Résultat de la requête DELETE :', deleteResult.rows);
    if (deleteResult.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Photo supprimée avec succès du serveur distant et de la base de données',
        deletedRecord: deleteResult.rows[0],
      });
    } else {
      return res.status(400).json({ success: false, message: 'Erreur lors de la suppression en base de données' });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de la photo:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression de la photo' });
  }
});

module.exports = router;
