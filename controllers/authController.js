// authcontroller.js
const pool = require('../db').pool; // Assurez-vous que le chemin vers db.js est correct


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Requête pour récupérer l'utilisateur avec l'email et le mot de passe spécifiés
    const result = await pool.query('SELECT * FROM Account WHERE Email = $1 AND Password = $2', [email, password]);

    if (result.rows.length > 0) {
      // Si l'utilisateur existe, renvoyer tout l'objet Account
      res.json({ success: true, account: result.rows[0] });
    } else {
      // Si aucun utilisateur n'est trouvé
      res.json({ success: false, message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};



exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifiez si l'adresse e-mail existe déjà
    const checkEmailResult = await pool.query('SELECT * FROM Account WHERE Email = $1', [email]);

    if (checkEmailResult.rows.length > 0) {
      // L'adresse e-mail existe déjà
      return res.status(400).json({ success: false, message: 'Email already exists' });
    } 

    // Créez un nouveau compte
    const insertAccountResult = await pool.query(
      'INSERT INTO Account (Email, Password) VALUES ($1, $2) RETURNING *',
      [email, password]
    );

    const newAccountId = insertAccountResult.rows[0].id;

    // Créez un nouveau Worker sans informations supplémentaires
    const insertWorkerResult = await pool.query(
      'INSERT INTO Worker DEFAULT VALUES RETURNING *'
    );

    const newWorkerId = insertWorkerResult.rows[0].id;

    // Mettez à jour la colonne Worker du compte avec l'ID du nouveau Worker
    await pool.query(
      'UPDATE Account SET Worker = $1 WHERE Id = $2',
      [newWorkerId, newAccountId]
    );

    // Renvoie la réponse avec les informations du compte et du worker
    return res.status(201).json({
      success: true,
      account: {
        ...insertAccountResult.rows[0],
        worker: insertWorkerResult.rows[0],
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.updateAccount = async (req, res) => {
  const { firstName, lastName, birthDate, address, phoneNumber, accountId } = req.body;

  try {
    // Vérifiez si le compte existe
    const checkAccountResult = await pool.query('SELECT * FROM Account WHERE Id = $1', [accountId]);

    if (checkAccountResult.rows.length === 0) {
      // Le compte n'existe pas
      return res.status(404).json({ success: false, message: 'Account not found' });
    } 

    // Mettez à jour les informations du compte
    const updateResult = await pool.query(
      'UPDATE Account SET FirstName = $1, LastName = $2, DateOfBirth = $3, Address = $4, Number = $5 WHERE Id = $6 RETURNING *',
      [firstName, lastName, birthDate, address, phoneNumber, accountId]
    );

    // Envoyer une réponse avec les nouvelles informations de compte
    return res.status(200).json({ success: true, account: updateResult.rows[0] });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.getWorkerId = async (account_id) => {
  

  try {
    // Vérifiez si le compte existe
    const result = await pool.query('SELECT worker FROM Account WHERE Id = $1', [account_id]);
    if (result.rowCount > 0) {
      // Récupérez le worker_id
      const worker_id = result.rows[0].worker;
      return worker_id;
    } else {
      // Si aucun résultat, renvoyer une erreur ou une réponse appropriée
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    
    

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};