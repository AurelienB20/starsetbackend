// authcontroller.js
const pool = require('../db').pool; // Assurez-vous que le chemin vers db.js est correct

  exports.createConversation = async (person1_id, person2_id, person1_type, person2_type) => {
    try {
      const result = await pool.query(
        'INSERT INTO Conversation (person1_id, person2_id, person1_type, person2_type) VALUES ($1, $2, $3, $4) RETURNING *',
        [person1_id, person2_id, person1_type, person2_type]
      );
      // Retourner l'objet conversation
      return { success: true, conversation: result.rows[0] };
    } catch (err) {
      console.error('Server error:', err);
      throw new Error('Server error'); // Lever une erreur à la place de renvoyer une réponse HTTP
    }
  };

  exports.sendMessage = async (req, res) => {
    const { id, conversation_id, sender_id, sender_type, message_text, timestamp } = req.body.newMessageObject;
    console.log(req.body)
    console.log(conversation_id)
    try {
      const result = await pool.query(
        'INSERT INTO Message (conversation_id, sender_id, sender_type, message_text) VALUES ($1, $2, $3, $4) RETURNING *',
        [conversation_id, sender_id, sender_type, message_text]
      );
  
      return res.status(201).json({ success: true, message: result.rows[0] });
  
    } catch (err) {
      console.error('Server error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  exports.checkIfConversationExists = async (person1_id, person2_id, person1_type, person2_type) => {
    console.log(person2_id)
    try {
      // Vérification si une conversation existe entre les deux personnes dans les deux sens (person1->person2 ou person2->person1)
      const result = await pool.query(
        `SELECT * FROM Conversation 
         WHERE (person1_id = $1 AND person2_id = $2 AND person1_type = $3 AND person2_type = $4) 
         OR (person1_id = $2 AND person2_id = $1 AND person1_type = $4 AND person2_type = $3)`,
        [person1_id, person2_id, person1_type, person2_type]
      );
  
      // Si le nombre de lignes est supérieur à 0, la conversation existe déjà
      return result.rows.length > 0;
    } catch (err) {
      console.error('Erreur lors de la vérification de la conversation:', err);
      throw new Error('Erreur lors de la vérification de la conversation');
    }
  };


exports.getConversation = async (req, res) => {
  const { person1_id, person2_id, person1_type, person2_type } = req.body;
  console.log(req.body)

  try {
    // Vérifier si la conversation existe déjà
    const conversationExists = await this.checkIfConversationExists(person1_id, person2_id, person1_type, person2_type);
    

    if (conversationExists) {
      // Récupérer l'ID de la conversation existante
      const result = await pool.query(
        `SELECT id FROM Conversation 
         WHERE (person1_id = $1 AND person2_id = $2 AND person1_type = $3 AND person2_type = $4) 
         OR (person1_id = $2 AND person2_id = $1 AND person1_type = $4 AND person2_type = $3)`,
        [person1_id, person2_id, person1_type, person2_type]
      );
      return res.status(200).json({ success: true, conversation_id: result.rows[0].id });
    }

    // Si la conversation n'existe pas, créer une nouvelle conversation
    const newConversation = await this.createConversation(person1_id, person2_id, person1_type, person2_type);

    // Retourner l'ID de la nouvelle conversation créée
    return res.status(201).json({ success: true, conversation_id: newConversation.conversation.id });

  } catch (err) {
    console.error('Erreur lors de la gestion de la conversation:', err);
    return res.status(500).json({ success: false, message: 'Erreur du serveur' });
  }
};

exports.getConversationWithId = async (req, res) => {
  const { conversation_id } = req.params; // Récupération de l'ID de la conversation à partir des paramètres de la requête

  try {
    // Récupérer la conversation basée sur l'ID de la conversation
    const result = await pool.query(
      `SELECT * FROM Conversation WHERE id = $1`, 
      [conversation_id]
    );

    // Si la conversation n'existe pas
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Conversation introuvable' });
    }

    // Retourner les détails de la conversation
    return res.status(200).json({ success: true, conversation: result.rows[0] });

  } catch (err) {
    console.error('Erreur lors de la récupération de la conversation:', err);
    return res.status(500).json({ success: false, message: 'Erreur du serveur' });
  }
};

exports.getMessagesByConversationId = async (req, res) => {
  
  const { conversation_id } = req.body;
  console.log(conversation_id)
  try {
    // Requête pour obtenir tous les messages de la conversation, triés par la colonne timestamp
    const result = await pool.query(
      'SELECT * FROM Message WHERE conversation_id = $1 ORDER BY timestamp ASC',
      [conversation_id]
    );

    // Si aucun message n'est trouvé, retourner un message vide
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No messages found for this conversation' });
    }

    // Retourner les messages trouvés
    return res.status(200).json({ success: true, messages: result.rows });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};



// Fonction pour récupérer toutes les conversations liées à un worker_id
exports.getAllWorkerConversation = async (req, res) => {
  console.log('Début de getAllWorkerConversation');
  const { worker_id } = req.body;
  console.log(worker_id);

  try {
    // Récupérer toutes les conversations où le worker_id est soit person1_id soit person2_id
    const conversations = await getConversations(worker_id);
    console.log(conversations)
    if (conversations.length === 0) {
      return res.status(404).json({ success: false, message: 'Aucune conversation trouvée' });
    }

    // Préparer les informations pour chaque conversation
    const conversationInfos = await Promise.all(
      conversations.map(async (conversation) => {
        const otherPersonId = getOtherPersonId(conversation, worker_id);
        const { firstname, lastname } = await getOtherPersonDetails(otherPersonId);
        const lastMessage = await getLastMessage(conversation.id);

        return {
          id: conversation.id,
          firstname: firstname || 'Inconnu',
          lastname: lastname || 'Inconnu',
          message_text: lastMessage ? lastMessage.message_text : 'Aucun message',
          timestamp: lastMessage ? lastMessage.timestamp : null,
          accepted: conversation.accepted
        };
      })
    );

    // Retourner le tableau des conversations
    console.log(conversationInfos)
    return res.status(200).json({ success: true, conversations: conversationInfos });

  } catch (err) {
    console.error('Erreur serveur :', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Fonction pour récupérer toutes les conversations où le worker_id est soit person1_id soit person2_id
const getConversations = async (worker_id) => {
  try {
    const result = await pool.query(
      'SELECT * FROM Conversation WHERE person1_id = $1 OR person2_id = $1',
      [worker_id]
    );
    return result.rows;
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations :', error);
    throw error;
  }
};

// Fonction pour déterminer l'autre personne dans une conversation
const getOtherPersonId = (conversation, worker_id) => {
  console.log('debut get other person id')
  console.log(conversation.person1_id === worker_id ? conversation.person2_id : conversation.person1_id)
  return conversation.person1_id === worker_id ? conversation.person2_id : conversation.person1_id;
};

// Fonction pour récupérer les détails (firstname et lastname) de l'autre personne
const getOtherPersonDetails = async (person_id) => {
  console.log('debut de getOtherPersonDetails')
  try {
    const result = await pool.query(
      'SELECT firstname, lastname FROM account WHERE id = $1 OR worker = $1',
      [person_id]
    );
    console.log(result.rows[0] || {})
    return result.rows[0] || {}; // Si aucun résultat, retourner un objet vide
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la personne :', error);
    throw error;
  }
};

// Fonction pour récupérer le dernier message de la conversation
const getLastMessage = async (conversation_id) => {
  console.log('debut get last message')
  try {
    const result = await pool.query(
      'SELECT message_text, timestamp FROM message WHERE conversation_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [conversation_id]
    );
    console.log(result.rows[0] || null)
    return result.rows[0] || null; // Si aucun message trouvé, retourner null
  } catch (error) {
    console.error('Erreur lors de la récupération du dernier message :', error);
    throw error;
  }
};



