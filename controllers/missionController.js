const { getWorkerId } = require('./authController');

// authcontroller.js
const pool = require('../db').pool; // Assurez-vous que le chemin vers db.js est correct

exports.createPrestation = async (req, res) => {
    const { account_id, selectedJob } = req.body;
    console.log(account_id)
    console.log(selectedJob)
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

    // Retourner la prestation avec les images associées
    return res.status(200).json({
      success: true,
      prestation: prestationResult.rows[0], // Renvoie une seule prestation
      images: imagesResult.rows,           // Tableau contenant toutes les images associées
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
    console.log(name)
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
