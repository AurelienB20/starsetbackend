const pool = require('../db').pool;
exports.createWorker = async (req, res) => {
  const { accountId } = req.body;

  try {
    // Créez un nouveau worker avec les valeurs par défaut (seule la colonne ID est concernée ici)
    const insertResult = await pool.query(
      'INSERT INTO Worker DEFAULT VALUES RETURNING *'
    );

    const newWorkerId = insertResult.rows[0].id;

    // Mettez à jour la colonne worker de la table Account avec le nouvel ID du worker
    const updateAccountResult = await pool.query(
      'UPDATE Account SET Worker = $1 WHERE Id = $2',
      [newWorkerId, accountId]
    );

    return res.status(201).json({ success: true, worker: insertResult.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
};