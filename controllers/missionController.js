const { getWorkerId } = require('./authController');

// authcontroller.js
const pool = require('../db').pool; // Assurez-vous que le chemin vers db.js est correct

exports.createPrestation = async (req, res) => {
    const { account_id, selectedJob } = req.body;
    
    console.log(account_id)
    console.log(selectedJob)
    console.log(req.body)
    console.log(1)
    try {
        
        const worker_id = await getWorkerId(account_id);
        console.log(worker_id)
        const result = await pool.query(
          'INSERT INTO Prestation (worker_id, metier) VALUES ($1, $2) RETURNING *',
          [worker_id, selectedJob]
        );
        return res.status(201).json({ success: true, prestation: result.rows[0] });
        
      
  
    } catch (err) {
      console.error('Server error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createExperience = async (req, res) => {
  const { title, date,description, prestation_id } = req.body;
  
  try {
      const result = await pool.query(
        'INSERT INTO Experience (title, date, description, prestation_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, date, description, prestation_id]
      );
      return res.status(201).json({ success: true, experience: result.rows[0] });
      
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createCertification = async (req, res) => {
  const { title, institution, date, description,  prestation_id } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO certification (title, establishment, date, description, prestation_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, institution, date, description, prestation_id]
    );
    return res.status(201).json({ success: true, certification: result.rows[0] });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllPrestation = async (req, res) => {
  const { account_id } = req.body;

  try {
    // Récupérer le worker_id à partir de l'account_id
    const worker_id = await getWorkerId(account_id);

    // Récupérer toutes les prestations associées au worker_id
    const result = await pool.query('SELECT * FROM Prestation WHERE worker_id = $1', [worker_id]);

    // Retourner les prestations trouvées
    return res.status(200).json({ success: true, prestations: result.rows });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllExperience = async (req, res) => {
  const { prestation_id } = req.body;

  try {
    // Récupérer toutes les prestations associées au worker_id
    const result = await pool.query('SELECT * FROM Experience WHERE prestation_id = $1', [prestation_id]);

    // Retourner les prestations trouvées
    return res.status(200).json({ success: true, experiences: result.rows });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllCertification = async (req, res) => {
  const { prestation_id } = req.body;

  try {
    // Récupérer toutes les prestations associées au worker_id
    const result = await pool.query('SELECT * FROM Certification WHERE prestation_id = $1', [prestation_id]);

    // Retourner les prestations trouvées
    return res.status(200).json({ success: true, certifications: result.rows });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPrestation = async (req, res) => {
  const { prestation_id } = req.body;

  try {
    // Récupérer la prestation par son ID
    const prestationResult = await pool.query('SELECT * FROM Prestation WHERE id = $1', [prestation_id]);

    if (prestationResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Prestation not found' });
    }

    // Récupérer les images associées à la prestation (via object_id)
    const imagesResult = await pool.query('SELECT * FROM images WHERE object_id = $1', [prestation_id]);
    const account = await pool.query('SELECT * FROM account WHERE worker = $1', [prestationResult.rows[0].worker_id]);
    const metiers = await pool.query('SELECT * FROM prestation WHERE worker_id = $1', [prestationResult.rows[0].worker_id]);
    // Retourner la prestation avec les images associées
    return res.status(200).json({
      success: true,
      prestation: prestationResult.rows[0], // Renvoie une seule prestation
      images: imagesResult.rows,           // Tableau contenant toutes les images associées
      account : account.rows[0],
      metiers : metiers.rows
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.savePrestationDescription = async (req, res) => {
  const { prestation_id, description } = req.body;
  console.log("debut de save description")
  console.log(prestation_id)
  try {
      // Mise à jour de la description de la prestation correspondant à l'ID donné
      const result = await pool.query(
        'UPDATE Prestation SET description = $1 WHERE id = $2 RETURNING *',
        [description, prestation_id]
      );

      // Vérifier si la prestation a bien été mise à jour
      if (result.rows.length > 0) {
          return res.status(200).json({ success: true, prestation: result.rows[0] });
      } else {
          return res.status(404).json({ success: false, message: 'Prestation not found' });
      }
    
  } catch (err) {
      console.error('Server error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createMission = async (req, res) => {
    const { worker_id, user_id, prestation_id, date_debut, date_fin } = req.body;
  
    try {
      const result = await pool.query(
        'INSERT INTO Mission (worker_id, user_id, prestation_id, date_debut, date_fin) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [worker_id, user_id, prestation_id, date_debut, date_fin]
      );
  
      return res.status(201).json({ success: true, mission: result.rows[0] });
  
    } catch (err) {
      console.error('Server error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllPrestationSearch = async (req,res) => {
  
  try {
    // Récupérer le worker_id à partir de l'account_id
    // Récupérer toutes les prestations associées au worker_id
    const result = await pool.query('SELECT * FROM Prestation LIMIT 10');

    // Retourner les prestations trouvées
    return res.status(200).json({ success: true, prestations: result.rows });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.getAllMetierNames = async (req, res) => {
  try {
    // Récupérer tous les 'nom' dans la table 'metier'
    const result = await pool.query('SELECT name FROM metier');

    // Retourner les noms trouvés
    return res.status(200).json({ success: true, metierNames: result.rows });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMetierByName = async (req, res) => {
  try {
    // Récupérer le 'name' depuis les paramètres de la requête
    const { name } = req.body;
    console.log(req.body)
    // Requête SQL pour récupérer toutes les colonnes de la table 'metier' où 'name' correspond
    const result = await pool.query('SELECT * FROM metier WHERE name = $1', [name]);

    // Vérifier si un métier a été trouvé
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Metier not found' });
    }

    // Retourner le métier trouvé
    return res.status(200).json({ success: true, metier: result.rows[0] });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateRemuneration = async (req, res) => {
  const { prestation_id, remuneration } = req.body;

  try {
    // Mise à jour de la rémunération de la prestation
    const result = await pool.query(
      'UPDATE Prestation SET remuneration = $1 WHERE id = $2 RETURNING *',
      [remuneration, prestation_id]
    );

    // Vérifier si la prestation a bien été mise à jour
    if (result.rows.length > 0) {
      return res.status(200).json({ success: true, prestation: result.rows[0] });
    } else {
      return res.status(404).json({ success: false, message: 'Prestation not found' });
    }
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getWorkersWithMetiers = async (req, res) => {
  try {
    // Requête SQL pour récupérer worker_id, métiers associés, profile_picture_url et firstname
    const result = await pool.query(
      `SELECT p.worker_id, 
              ARRAY_AGG(DISTINCT ROW(p.id, p.metier)) AS metiers_raw,
              a.profile_picture_url, 
              a.firstname
       FROM Prestation p
       JOIN Account a ON a.worker = p.worker_id
       GROUP BY p.worker_id, a.profile_picture_url, a.firstname`
    );
    console.log('Résultats bruts :', result.rows);
    // Transformation des résultats
    const workers = result.rows.map(row => {
      // Convertir la chaîne brute `metiers_raw` en un tableau en la décomposant
      const rawMetiers = row.metiers_raw
        .slice(1, -1) // Retirer les accolades externes
        .split('","') // Séparer les tuples
        .map(item => item.replace(/(^"|"$)/g, '')); // Retirer les guillemets autour de chaque tuple

      // Transformer chaque tuple en objet
      const metiers = rawMetiers.map(tuple => {
        const [id, name] = tuple.slice(1, -1).split(','); // Retirer les parenthèses et diviser
        return {
          id: id.trim(),
          name: name.trim().replace(/\\"/g, '') // Nettoyer les guillemets échappés
        };
      });

      return {
        worker_id: row.worker_id,
        metiers,
        profile_picture_url: row.profile_picture_url,
        firstname: row.firstname
      };
    });

    // Répondre avec les données des travailleurs
    return res.status(200).json({ success: true, workers });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.searchMetier = async (req, res) => {
  try {
    // Récupération du filtre de recherche à partir du corps de la requête
    const { searchString } = req.body;

    // Vérification de la présence du filtre
    if (!searchString) {
      return res.status(400).json({ success: false, message: "Le paramètre 'searchString' est requis." });
    }

    // Requête SQL pour récupérer les travailleurs et tous leurs métiers
    const result = await pool.query(
      `SELECT p.worker_id, 
              ARRAY_AGG(DISTINCT ROW(p.id, p.metier)) AS metiers_raw,
              a.profile_picture_url, 
              a.firstname
       FROM Prestation p
       JOIN Account a ON a.worker = p.worker_id
       WHERE EXISTS (
         SELECT 1
         FROM Prestation sub_p
         WHERE sub_p.worker_id = p.worker_id
         AND (sub_p.metier ILIKE $1 OR a.firstname ILIKE $1)
       )
       GROUP BY p.worker_id, a.profile_picture_url, a.firstname`,
      [`%${searchString}%`]
    );

    // Transformation des résultats
    const workers = result.rows.map(row => {
      // Convertir la chaîne brute `metiers_raw` en un tableau en la décomposant
      const rawMetiers = row.metiers_raw
        .slice(1, -1) // Retirer les accolades externes
        .split('","') // Séparer les tuples
        .map(item => item.replace(/(^"|"$)/g, '')); // Retirer les guillemets autour de chaque tuple

      // Transformer chaque tuple en objet
      const metiers = rawMetiers.map(tuple => {
        const [id, name] = tuple.slice(1, -1).split(','); // Retirer les parenthèses et diviser
        return {
          id: id.trim(),
          name: name.trim().replace(/\\"/g, '') // Nettoyer les guillemets échappés
        };
      });

      return {
        worker_id: row.worker_id,
        metiers,
        profile_picture_url: row.profile_picture_url,
        firstname: row.firstname
      };
    });
    // Répondre avec les données des travailleurs
    return res.status(200).json({ success: true, workers });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createPlannedPrestation = async (req, res) => {
  const { worker_id, user_id, prestation_id, start_date, end_date, type_of_remuneration, remuneration } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO PlannedPrestation (worker_id, user_id, prestation_id, start_date, end_date, type_of_remuneration, remuneration, accepted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false) 
       RETURNING *`,
      [worker_id, user_id, prestation_id, start_date, end_date, type_of_remuneration, remuneration]
    );

    return res.status(201).json({ success: true, plannedPrestation: result.rows[0] });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


