<?php
/**
 * Fonctions utilitaires pour le site de compétition e-sport
 */

// Fonctions de gestion des utilisateurs

/**
 * Crée un nouvel utilisateur
 * 
 * @param string $username Nom d'utilisateur
 * @param string $email Email
 * @param string $password Mot de passe (non haché)
 * @param array $additionalData Données supplémentaires
 * @return int|bool ID de l'utilisateur ou false en cas d'échec
 */
function createUser($username, $email, $password, $additionalData = []) {
    $db = getDbConnection();
    
    // Vérification si l'utilisateur existe déjà
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    
    if ($stmt->rowCount() > 0) {
        return false; // Utilisateur déjà existant
    }
    
    // Hachage du mot de passe
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => PASSWORD_HASH_COST]);
    
    // Préparation des données
    $createdAt = date('Y-m-d H:i:s');
    
    // Insertion de l'utilisateur
    $stmt = $db->prepare("
        INSERT INTO users (username, email, password, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $result = $stmt->execute([$username, $email, $hashedPassword, $createdAt, $createdAt]);
    
    if (!$result) {
        return false;
    }
    
    $userId = $db->lastInsertId();
    
    // Insertion des données supplémentaires
    if (!empty($additionalData) && $userId) {
        $stmt = $db->prepare("
            INSERT INTO user_profiles (user_id, first_name, last_name, phone, address, city, postal_code, country)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $additionalData['first_name'] ?? '',
            $additionalData['last_name'] ?? '',
            $additionalData['phone'] ?? '',
            $additionalData['address'] ?? '',
            $additionalData['city'] ?? '',
            $additionalData['postal_code'] ?? '',
            $additionalData['country'] ?? ''
        ]);
    }
    
    return $userId;
}

/**
 * Authentifie un utilisateur
 * 
 * @param string $usernameOrEmail Nom d'utilisateur ou email
 * @param string $password Mot de passe
 * @return array|bool Données de l'utilisateur ou false en cas d'échec
 */
function authenticateUser($usernameOrEmail, $password) {
    $db = getDbConnection();
    
    // Récupération de l'utilisateur
    $stmt = $db->prepare("
        SELECT id, username, email, password, role
        FROM users
        WHERE username = ? OR email = ?
    ");
    
    $stmt->execute([$usernameOrEmail, $usernameOrEmail]);
    $user = $stmt->fetch();
    
    if (!$user) {
        return false; // Utilisateur non trouvé
    }
    
    // Vérification du mot de passe
    if (!password_verify($password, $user['password'])) {
        return false; // Mot de passe incorrect
    }
    
    // Mise à jour de la dernière connexion
    $stmt = $db->prepare("
        UPDATE users
        SET last_login = ?, updated_at = ?
        WHERE id = ?
    ");
    
    $now = date('Y-m-d H:i:s');
    $stmt->execute([$now, $now, $user['id']]);
    
    // Suppression du mot de passe des données retournées
    unset($user['password']);
    
    return $user;
}

/**
 * Récupère les données d'un utilisateur
 * 
 * @param int $userId ID de l'utilisateur
 * @param bool $withProfile Inclure les données du profil
 * @return array|bool Données de l'utilisateur ou false
 */
function getUserById($userId, $withProfile = false) {
    $db = getDbConnection();
    
    $query = "
        SELECT id, username, email, role, created_at, updated_at, last_login
        FROM users
        WHERE id = ?
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        return false;
    }
    
    // Récupération du profil si demandé
    if ($withProfile) {
        $stmt = $db->prepare("
            SELECT * FROM user_profiles
            WHERE user_id = ?
        ");
        
        $stmt->execute([$userId]);
        $profile = $stmt->fetch();
        
        if ($profile) {
            $user['profile'] = $profile;
        }
    }
    
    return $user;
}

/**
 * Met à jour les données d'un utilisateur
 * 
 * @param int $userId ID de l'utilisateur
 * @param array $userData Données à mettre à jour
 * @return bool Succès ou échec
 */
function updateUser($userId, $userData) {
    $db = getDbConnection();
    
    // Vérification de l'existence de l'utilisateur
    $stmt = $db->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    
    if ($stmt->rowCount() === 0) {
        return false; // Utilisateur non trouvé
    }
    
    // Préparation des données à mettre à jour
    $updateFields = [];
    $updateValues = [];
    
    $allowedFields = ['username', 'email', 'role'];
    
    foreach ($allowedFields as $field) {
        if (isset($userData[$field])) {
            $updateFields[] = "$field = ?";
            $updateValues[] = $userData[$field];
        }
    }
    
    // Mise à jour du mot de passe si fourni
    if (isset($userData['password']) && !empty($userData['password'])) {
        $updateFields[] = "password = ?";
        $updateValues[] = password_hash($userData['password'], PASSWORD_BCRYPT, ['cost' => PASSWORD_HASH_COST]);
    }
    
    // Ajout de la date de mise à jour
    $updateFields[] = "updated_at = ?";
    $updateValues[] = date('Y-m-d H:i:s');
    
    // Ajout de l'ID utilisateur à la fin des valeurs
    $updateValues[] = $userId;
    
    // Mise à jour de l'utilisateur
    $query = "UPDATE users SET " . implode(", ", $updateFields) . " WHERE id = ?";
    $stmt = $db->prepare($query);
    $result = $stmt->execute($updateValues);
    
    // Mise à jour du profil si des données sont fournies
    if (isset($userData['profile']) && is_array($userData['profile'])) {
        updateUserProfile($userId, $userData['profile']);
    }
    
    return $result;
}

/**
 * Met à jour le profil d'un utilisateur
 * 
 * @param int $userId ID de l'utilisateur
 * @param array $profileData Données du profil
 * @return bool Succès ou échec
 */
function updateUserProfile($userId, $profileData) {
    $db = getDbConnection();
    
    // Vérification de l'existence du profil
    $stmt = $db->prepare("SELECT user_id FROM user_profiles WHERE user_id = ?");
    $stmt->execute([$userId]);
    
    $allowedFields = [
        'first_name', 'last_name', 'phone', 'address', 
        'city', 'postal_code', 'country', 'avatar'
    ];
    
    if ($stmt->rowCount() === 0) {
        // Création du profil s'il n'existe pas
        $fields = ['user_id'];
        $placeholders = ['?'];
        $values = [$userId];
        
        foreach ($allowedFields as $field) {
            if (isset($profileData[$field])) {
                $fields[] = $field;
                $placeholders[] = '?';
                $values[] = $profileData[$field];
            }
        }
        
        $query = "INSERT INTO user_profiles (" . implode(", ", $fields) . ") VALUES (" . implode(", ", $placeholders) . ")";
        $stmt = $db->prepare($query);
        return $stmt->execute($values);
    } else {
        // Mise à jour du profil existant
        $updateFields = [];
        $updateValues = [];
        
        foreach ($allowedFields as $field) {
            if (isset($profileData[$field])) {
                $updateFields[] = "$field = ?";
                $updateValues[] = $profileData[$field];
            }
        }
        
        // Ajout de l'ID utilisateur à la fin des valeurs
        $updateValues[] = $userId;
        
        $query = "UPDATE user_profiles SET " . implode(", ", $updateFields) . " WHERE user_id = ?";
        $stmt = $db->prepare($query);
        return $stmt->execute($updateValues);
    }
}

// Fonctions de gestion des compétitions

/**
 * Crée une nouvelle compétition
 * 
 * @param array $competitionData Données de la compétition
 * @return int|bool ID de la compétition ou false en cas d'échec
 */
function createCompetition($competitionData) {
    $db = getDbConnection();
    
    // Préparation des données
    $createdAt = date('Y-m-d H:i:s');
    
    // Insertion de la compétition
    $stmt = $db->prepare("
        INSERT INTO competitions (
            name, game, description, start_date, end_date, 
            registration_fee, max_participants, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $result = $stmt->execute([
        $competitionData['name'],
        $competitionData['game'],
        $competitionData['description'] ?? '',
        $competitionData['start_date'],
        $competitionData['end_date'],
        $competitionData['registration_fee'] ?? 0,
        $competitionData['max_participants'] ?? 0,
        $competitionData['status'] ?? 'draft',
        $createdAt,
        $createdAt
    ]);
    
    if (!$result) {
        return false;
    }
    
    return $db->lastInsertId();
}

/**
 * Récupère une compétition par son ID
 * 
 * @param int $competitionId ID de la compétition
 * @return array|bool Données de la compétition ou false
 */
function getCompetitionById($competitionId) {
    $db = getDbConnection();
    
    $stmt = $db->prepare("
        SELECT * FROM competitions
        WHERE id = ?
    ");
    
    $stmt->execute([$competitionId]);
    return $stmt->fetch();
}

/**
 * Récupère la liste des compétitions
 * 
 * @param array $filters Filtres (status, game, etc.)
 * @param int $limit Limite de résultats
 * @param int $offset Offset pour la pagination
 * @return array Liste des compétitions
 */
function getCompetitions($filters = [], $limit = 10, $offset = 0) {
    $db = getDbConnection();
    
    $whereConditions = [];
    $whereValues = [];
    
    // Application des filtres
    if (isset($filters['status'])) {
        $whereConditions[] = "status = ?";
        $whereValues[] = $filters['status'];
    }
    
    if (isset($filters['game'])) {
        $whereConditions[] = "game = ?";
        $whereValues[] = $filters['game'];
    }
    
    // Construction de la requête
    $query = "SELECT * FROM competitions";
    
    if (!empty($whereConditions)) {
        $query .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $query .= " ORDER BY start_date DESC LIMIT ? OFFSET ?";
    $whereValues[] = $limit;
    $whereValues[] = $offset;
    
    $stmt = $db->prepare($query);
    $stmt->execute($whereValues);
    
    return $stmt->fetchAll();
}

/**
 * Met à jour une compétition
 * 
 * @param int $competitionId ID de la compétition
 * @param array $competitionData Données à mettre à jour
 * @return bool Succès ou échec
 */
function updateCompetition($competitionId, $competitionData) {
    $db = getDbConnection();
    
    // Vérification de l'existence de la compétition
    $stmt = $db->prepare("SELECT id FROM competitions WHERE id = ?");
    $stmt->execute([$competitionId]);
    
    if ($stmt->rowCount() === 0) {
        return false; // Compétition non trouvée
    }
    
    // Préparation des données à mettre à jour
    $updateFields = [];
    $updateValues = [];
    
    $allowedFields = [
        'name', 'game', 'description', 'start_date', 'end_date',
        'registration_fee', 'max_participants', 'status'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($competitionData[$field])) {
            $updateFields[] = "$field = ?";
            $updateValues[] = $competitionData[$field];
        }
    }
    
    // Ajout de la date de mise à jour
    $updateFields[] = "updated_at = ?";
    $updateValues[] = date('Y-m-d H:i:s');
    
    // Ajout de l'ID de la compétition à la fin des valeurs
    $updateValues[] = $competitionId;
    
    // Mise à jour de la compétition
    $query = "UPDATE competitions SET " . implode(", ", $updateFields) . " WHERE id = ?";
    $stmt = $db->prepare($query);
    
    return $stmt->execute($updateValues);
}
