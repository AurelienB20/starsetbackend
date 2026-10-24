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

exports.updateAccountDescription = async (req, res) => {
  const { accountId, descriptionPopup } = req.body;

  try {
    
    // Mettez à jour la description du compte
    const updateResult = await pool.query(
      'UPDATE Account SET Description = $1 WHERE Id = $2 RETURNING *',
      [descriptionPopup, accountId]
    );

    // Envoyer une réponse avec les nouvelles informations du compte
    return res.status(200).json({ success: true, account: updateResult.rows[0] });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateAccount = async (req, res) => {
  const { firstname, lastname, dateofBirth, address, number, accountId, city, postcode,country, pseudo } = req.body;
  console.log(req.body)

  try {
    // Vérifiez si le compte existe
    const checkAccountResult = await pool.query('SELECT * FROM Account WHERE Id = $1', [accountId]);

    if (checkAccountResult.rows.length === 0) {
      // Le compte n'existe pas
      return res.status(404).json({ success: false, message: 'Account not found' });
    } 

    // Mettez à jour les informations du compte
    const updateResult = await pool.query(
      'UPDATE Account SET FirstName = $1, LastName = $2, DateOfBirth = $3, Address = $4, Number = $5, city = $6, postcode = $7, country = $8, pseudo = $9 WHERE Id = $10 RETURNING *',
      [firstname, lastname, dateofBirth, address, number, city,postcode, country, pseudo, accountId]
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

exports.getAccountById = async (req, res) => {
  const { accountId } = req.body; // On suppose que l'ID du compte vient des paramètres de la route
  
  try {
    const result = await pool.query('SELECT * FROM Account WHERE id = $1', [accountId]);
    
    if (result.rows.length === 0) {
      // Si aucun compte n'est trouvé, renvoyer un status 404 avec un message
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Si un compte est trouvé, renvoyer un status 200 avec l'objet du compte
    return res.status(200).json({ success: true, account: result.rows[0] });
  } catch (err) {
    console.error('Error fetching account:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getProfilePicture = async (req, res) => {
  const { accountId } = req.body; // Supposons que l'ID du compte soit envoyé dans le body de la requête
  console.log(accountId)
  console.log(1)
  try {
    // Récupérer l'URL de l'image de profil à partir de l'ID du compte
    const result = await pool.query('SELECT profile_picture_url FROM Account WHERE Id = $1', [accountId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    return res.status(200).json({ success: true, profile_picture_url: result.rows[0].profile_picture_url });
  } catch (err) {
    console.error('Error fetching profile picture:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};