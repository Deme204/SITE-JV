<?php
/**
 * Fonctions utilitaires pour le site de compétition e-sport - Partie 2
 * Gestion des résultats, paiements et newsletter
 */

// Fonctions de gestion des résultats

/**
 * Enregistre un résultat de match
 * 
 * @param array $resultData Données du résultat
 * @return int|bool ID du résultat ou false en cas d'échec
 */
function submitResult($resultData) {
    $db = getDbConnection();
    
    // Préparation des données
    $createdAt = date('Y-m-d H:i:s');
    
    // Insertion du résultat
    $stmt = $db->prepare("
        INSERT INTO results (
            competition_id, player1_id, player2_id, player1_score, player2_score,
            match_date, player1_validated, player2_validated, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $result = $stmt->execute([
        $resultData['competition_id'],
        $resultData['player1_id'],
        $resultData['player2_id'],
        $resultData['player1_score'],
        $resultData['player2_score'],
        $resultData['match_date'] ?? date('Y-m-d H:i:s'),
        $resultData['player1_validated'] ?? 0,
        $resultData['player2_validated'] ?? 0,
        $resultData['status'] ?? 'pending',
        $createdAt,
        $createdAt
    ]);
    
    if (!$result) {
        return false;
    }
    
    $resultId = $db->lastInsertId();
    
    // Journalisation de l'action
    logMessage("Nouveau résultat soumis: ID $resultId, Compétition: {$resultData['competition_id']}, Joueur1: {$resultData['player1_id']}, Joueur2: {$resultData['player2_id']}");
    
    return $resultId;
}

/**
 * Valide un résultat par un joueur
 * 
 * @param int $resultId ID du résultat
 * @param int $playerId ID du joueur qui valide
 * @return bool Succès ou échec
 */
function validateResult($resultId, $playerId) {
    $db = getDbConnection();
    
    // Récupération du résultat
    $stmt = $db->prepare("
        SELECT * FROM results
        WHERE id = ?
    ");
    
    $stmt->execute([$resultId]);
    $result = $stmt->fetch();
    
    if (!$result) {
        return false; // Résultat non trouvé
    }
    
    // Détermination du champ à mettre à jour
    $field = null;
    if ($result['player1_id'] == $playerId) {
        $field = 'player1_validated';
    } elseif ($result['player2_id'] == $playerId) {
        $field = 'player2_validated';
    } else {
        return false; // Le joueur n'est pas impliqué dans ce match
    }
    
    // Mise à jour de la validation
    $stmt = $db->prepare("
        UPDATE results
        SET $field = 1, updated_at = ?
        WHERE id = ?
    ");
    
    $updateResult = $stmt->execute([date('Y-m-d H:i:s'), $resultId]);
    
    // Vérification si les deux joueurs ont validé
    if ($updateResult) {
        $stmt = $db->prepare("
            SELECT player1_validated, player2_validated
            FROM results
            WHERE id = ?
        ");
        
        $stmt->execute([$resultId]);
        $validationStatus = $stmt->fetch();
        
        if ($validationStatus['player1_validated'] == 1 && $validationStatus['player2_validated'] == 1) {
            // Les deux joueurs ont validé, mise à jour du statut
            $stmt = $db->prepare("
                UPDATE results
                SET status = 'validated', updated_at = ?
                WHERE id = ?
            ");
            
            $stmt->execute([date('Y-m-d H:i:s'), $resultId]);
            
            // Mise à jour des classements
            updateRankings($result['competition_id']);
            
            // Journalisation
            logMessage("Résultat ID $resultId entièrement validé par les deux joueurs.");
        }
    }
    
    return $updateResult;
}

/**
 * Récupère les résultats d'une compétition
 * 
 * @param int $competitionId ID de la compétition
 * @param string $status Statut des résultats (all, pending, validated)
 * @return array Liste des résultats
 */
function getResults($competitionId, $status = 'all') {
    $db = getDbConnection();
    
    $query = "
        SELECT r.*, 
            u1.username as player1_username,
            u2.username as player2_username
        FROM results r
        JOIN users u1 ON r.player1_id = u1.id
        JOIN users u2 ON r.player2_id = u2.id
        WHERE r.competition_id = ?
    ";
    
    $params = [$competitionId];
    
    if ($status !== 'all') {
        $query .= " AND r.status = ?";
        $params[] = $status;
    }
    
    $query .= " ORDER BY r.match_date DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    
    return $stmt->fetchAll();
}

/**
 * Met à jour les classements d'une compétition
 * 
 * @param int $competitionId ID de la compétition
 * @return bool Succès ou échec
 */
function updateRankings($competitionId) {
    $db = getDbConnection();
    
    // Récupération de tous les résultats validés
    $stmt = $db->prepare("
        SELECT * FROM results
        WHERE competition_id = ? AND status = 'validated'
    ");
    
    $stmt->execute([$competitionId]);
    $results = $stmt->fetchAll();
    
    // Calcul des points pour chaque joueur
    $playerPoints = [];
    $playerMatches = [];
    $playerWins = [];
    $playerLosses = [];
    
    foreach ($results as $result) {
        // Initialisation des compteurs si nécessaire
        if (!isset($playerPoints[$result['player1_id']])) {
            $playerPoints[$result['player1_id']] = 0;
            $playerMatches[$result['player1_id']] = 0;
            $playerWins[$result['player1_id']] = 0;
            $playerLosses[$result['player1_id']] = 0;
        }
        
        if (!isset($playerPoints[$result['player2_id']])) {
            $playerPoints[$result['player2_id']] = 0;
            $playerMatches[$result['player2_id']] = 0;
            $playerWins[$result['player2_id']] = 0;
            $playerLosses[$result['player2_id']] = 0;
        }
        
        // Incrémentation du nombre de matchs
        $playerMatches[$result['player1_id']]++;
        $playerMatches[$result['player2_id']]++;
        
        // Attribution des points selon le résultat
        if ($result['player1_score'] > $result['player2_score']) {
            // Victoire du joueur 1
            $playerPoints[$result['player1_id']] += 3;
            $playerWins[$result['player1_id']]++;
            $playerLosses[$result['player2_id']]++;
        } elseif ($result['player1_score'] < $result['player2_score']) {
            // Victoire du joueur 2
            $playerPoints[$result['player2_id']] += 3;
            $playerWins[$result['player2_id']]++;
            $playerLosses[$result['player1_id']]++;
        } else {
            // Match nul
            $playerPoints[$result['player1_id']] += 1;
            $playerPoints[$result['player2_id']] += 1;
        }
    }
    
    // Mise à jour ou création des entrées de classement
    foreach ($playerPoints as $playerId => $points) {
        // Vérification si une entrée existe déjà
        $stmt = $db->prepare("
            SELECT id FROM rankings
            WHERE competition_id = ? AND player_id = ?
        ");
        
        $stmt->execute([$competitionId, $playerId]);
        $ranking = $stmt->fetch();
        
        if ($ranking) {
            // Mise à jour
            $stmt = $db->prepare("
                UPDATE rankings
                SET points = ?, matches_played = ?, wins = ?, losses = ?, updated_at = ?
                WHERE id = ?
            ");
            
            $stmt->execute([
                $points,
                $playerMatches[$playerId],
                $playerWins[$playerId],
                $playerLosses[$playerId],
                date('Y-m-d H:i:s'),
                $ranking['id']
            ]);
        } else {
            // Création
            $stmt = $db->prepare("
                INSERT INTO rankings (competition_id, player_id, points, matches_played, wins, losses, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $now = date('Y-m-d H:i:s');
            $stmt->execute([
                $competitionId,
                $playerId,
                $points,
                $playerMatches[$playerId],
                $playerWins[$playerId],
                $playerLosses[$playerId],
                $now,
                $now
            ]);
        }
    }
    
    return true;
}

/**
 * Récupère le classement d'une compétition
 * 
 * @param int $competitionId ID de la compétition
 * @param int $limit Limite de résultats
 * @return array Classement des joueurs
 */
function getRanking($competitionId, $limit = 0) {
    $db = getDbConnection();
    
    $query = "
        SELECT r.*, u.username
        FROM rankings r
        JOIN users u ON r.player_id = u.id
        WHERE r.competition_id = ?
        ORDER BY r.points DESC, r.wins DESC
    ";
    
    if ($limit > 0) {
        $query .= " LIMIT ?";
    }
    
    $stmt = $db->prepare($query);
    
    if ($limit > 0) {
        $stmt->execute([$competitionId, $limit]);
    } else {
        $stmt->execute([$competitionId]);
    }
    
    return $stmt->fetchAll();
}

// Fonctions de gestion des paiements

/**
 * Crée une nouvelle transaction de paiement
 * 
 * @param array $paymentData Données du paiement
 * @return int|bool ID de la transaction ou false en cas d'échec
 */
function createPayment($paymentData) {
    $db = getDbConnection();
    
    // Préparation des données
    $createdAt = date('Y-m-d H:i:s');
    
    // Insertion de la transaction
    $stmt = $db->prepare("
        INSERT INTO payments (
            user_id, competition_id, amount, currency, payment_method,
            transaction_id, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $result = $stmt->execute([
        $paymentData['user_id'],
        $paymentData['competition_id'] ?? null,
        $paymentData['amount'],
        $paymentData['currency'] ?? PAYMENT_CURRENCY,
        $paymentData['payment_method'] ?? PAYMENT_GATEWAY,
        $paymentData['transaction_id'] ?? '',
        $paymentData['status'] ?? 'pending',
        $createdAt,
        $createdAt
    ]);
    
    if (!$result) {
        return false;
    }
    
    $paymentId = $db->lastInsertId();
    
    // Journalisation
    logMessage("Nouvelle transaction de paiement: ID $paymentId, Utilisateur: {$paymentData['user_id']}, Montant: {$paymentData['amount']} {$paymentData['currency']}");
    
    return $paymentId;
}

/**
 * Met à jour le statut d'un paiement
 * 
 * @param int $paymentId ID du paiement
 * @param string $status Nouveau statut
 * @param string $transactionId ID de transaction externe (optionnel)
 * @return bool Succès ou échec
 */
function updatePaymentStatus($paymentId, $status, $transactionId = null) {
    $db = getDbConnection();
    
    $query = "
        UPDATE payments
        SET status = ?, updated_at = ?
    ";
    
    $params = [$status, date('Y-m-d H:i:s')];
    
    if ($transactionId !== null) {
        $query .= ", transaction_id = ?";
        $params[] = $transactionId;
    }
    
    $query .= " WHERE id = ?";
    $params[] = $paymentId;
    
    $stmt = $db->prepare($query);
    $result = $stmt->execute($params);
    
    if ($result && $status === 'completed') {
        // Si le paiement est complété, vérifier s'il est lié à une compétition
        $stmt = $db->prepare("
            SELECT user_id, competition_id FROM payments
            WHERE id = ?
        ");
        
        $stmt->execute([$paymentId]);
        $payment = $stmt->fetch();
        
        if ($payment && $payment['competition_id']) {
            // Inscrire l'utilisateur à la compétition
            registerUserToCompetition($payment['user_id'], $payment['competition_id']);
        }
        
        // Journalisation
        logMessage("Paiement ID $paymentId marqué comme complété.");
    }
    
    return $result;
}

/**
 * Inscrit un utilisateur à une compétition
 * 
 * @param int $userId ID de l'utilisateur
 * @param int $competitionId ID de la compétition
 * @return bool Succès ou échec
 */
function registerUserToCompetition($userId, $competitionId) {
    $db = getDbConnection();
    
    // Vérification si l'utilisateur est déjà inscrit
    $stmt = $db->prepare("
        SELECT id FROM competition_registrations
        WHERE user_id = ? AND competition_id = ?
    ");
    
    $stmt->execute([$userId, $competitionId]);
    
    if ($stmt->rowCount() > 0) {
        return true; // Déjà inscrit
    }
    
    // Inscription
    $stmt = $db->prepare("
        INSERT INTO competition_registrations (user_id, competition_id, status, created_at)
        VALUES (?, ?, ?, ?)
    ");
    
    $result = $stmt->execute([
        $userId,
        $competitionId,
        'active',
        date('Y-m-d H:i:s')
    ]);
    
    if ($result) {
        // Journalisation
        logMessage("Utilisateur ID $userId inscrit à la compétition ID $competitionId");
    }
    
    return $result;
}

// Fonctions de gestion de la newsletter

/**
 * Inscrit un email à la newsletter
 * 
 * @param string $email Adresse email
 * @param array $preferences Préférences d'abonnement
 * @return bool Succès ou échec
 */
function subscribeToNewsletter($email, $preferences = []) {
    $db = getDbConnection();
    
    // Vérification si l'email est déjà inscrit
    $stmt = $db->prepare("
        SELECT id FROM newsletter_subscribers
        WHERE email = ?
    ");
    
    $stmt->execute([$email]);
    $subscriber = $stmt->fetch();
    
    $now = date('Y-m-d H:i:s');
    
    if ($subscriber) {
        // Mise à jour de l'abonnement existant
        $stmt = $db->prepare("
            UPDATE newsletter_subscribers
            SET active = 1, updated_at = ?
            WHERE id = ?
        ");
        
        $result = $stmt->execute([$now, $subscriber['id']]);
        
        // Mise à jour des préférences
        if ($result && !empty($preferences)) {
            updateNewsletterPreferences($subscriber['id'], $preferences);
        }
        
        return $result;
    } else {
        // Nouvel abonnement
        $stmt = $db->prepare("
            INSERT INTO newsletter_subscribers (email, active, created_at, updated_at)
            VALUES (?, 1, ?, ?)
        ");
        
        $result = $stmt->execute([$email, $now, $now]);
        
        if ($result) {
            $subscriberId = $db->lastInsertId();
            
            // Enregistrement des préférences
            if (!empty($preferences)) {
                updateNewsletterPreferences($subscriberId, $preferences);
            }
            
            // Journalisation
            logMessage("Nouvel abonnement à la newsletter: $email");
        }
        
        return $result;
    }
}

/**
 * Désabonne un email de la newsletter
 * 
 * @param string $email Adresse email
 * @return bool Succès ou échec
 */
function unsubscribeFromNewsletter($email) {
    $db = getDbConnection();
    
    $stmt = $db->prepare("
        UPDATE newsletter_subscribers
        SET active = 0, updated_at = ?
        WHERE email = ?
    ");
    
    $result = $stmt->execute([date('Y-m-d H:i:s'), $email]);
    
    if ($result) {
        logMessage("Désabonnement de la newsletter: $email");
    }
    
    return $result;
}

/**
 * Met à jour les préférences d'un abonné à la newsletter
 * 
 * @param int $subscriberId ID de l'abonné
 * @param array $preferences Préférences (competitions, results, news, etc.)
 * @return bool Succès ou échec
 */
function updateNewsletterPreferences($subscriberId, $preferences) {
    $db = getDbConnection();
    
    // Suppression des préférences existantes
    $stmt = $db->prepare("
        DELETE FROM newsletter_preferences
        WHERE subscriber_id = ?
    ");
    
    $stmt->execute([$subscriberId]);
    
    // Insertion des nouvelles préférences
    $success = true;
    
    foreach ($preferences as $category => $value) {
        if ($value) {
            $stmt = $db->prepare("
                INSERT INTO newsletter_preferences (subscriber_id, preference_key, created_at)
                VALUES (?, ?, ?)
            ");
            
            $result = $stmt->execute([$subscriberId, $category, date('Y-m-d H:i:s')]);
            
            if (!$result) {
                $success = false;
            }
        }
    }
    
    return $success;
}

/**
 * Envoie une newsletter aux abonnés
 * 
 * @param string $subject Sujet de l'email
 * @param string $content Contenu HTML
 * @param array $filters Filtres (préférences, etc.)
 * @return array Statistiques d'envoi
 */
function sendNewsletter($subject, $content, $filters = []) {
    $db = getDbConnection();
    
    // Construction de la requête pour récupérer les abonnés
    $query = "
        SELECT DISTINCT ns.id, ns.email
        FROM newsletter_subscribers ns
        WHERE ns.active = 1
    ";
    
    $params = [];
    
    // Application des filtres par préférence
    if (!empty($filters['preferences'])) {
        $query .= "
            AND EXISTS (
                SELECT 1 FROM newsletter_preferences np
                WHERE np.subscriber_id = ns.id
                AND np.preference_key IN (?)
            )
        ";
        
        $params[] = implode(',', $filters['preferences']);
    }
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $subscribers = $stmt->fetchAll();
    
    // Statistiques d'envoi
    $stats = [
        'total' => count($subscribers),
        'sent' => 0,
        'failed' => 0
    ];
    
    // Enregistrement de la newsletter
    $stmt = $db->prepare("
        INSERT INTO newsletters (subject, content, sent_at, total_recipients)
        VALUES (?, ?, ?, ?)
    ");
    
    $stmt->execute([$subject, $content, date('Y-m-d H:i:s'), $stats['total']]);
    $newsletterId = $db->lastInsertId();
    
    // Envoi des emails
    foreach ($subscribers as $subscriber) {
        // Dans un environnement de production, utilisez une bibliothèque d'envoi d'emails
        // comme PHPMailer ou SwiftMailer, ou un service comme SendGrid ou Mailgun
        
        // Simulation d'envoi pour cet exemple
        $success = true; // Remplacer par le résultat réel de l'envoi
        
        if ($success) {
            $stats['sent']++;
            
            // Enregistrement de l'envoi
            $stmt = $db->prepare("
                INSERT INTO newsletter_logs (newsletter_id, subscriber_id, status, sent_at)
                VALUES (?, ?, 'sent', ?)
            ");
            
            $stmt->execute([$newsletterId, $subscriber['id'], date('Y-m-d H:i:s')]);
        } else {
            $stats['failed']++;
            
            // Enregistrement de l'échec
            $stmt = $db->prepare("
                INSERT INTO newsletter_logs (newsletter_id, subscriber_id, status, sent_at)
                VALUES (?, ?, 'failed', ?)
            ");
            
            $stmt->execute([$newsletterId, $subscriber['id'], date('Y-m-d H:i:s')]);
        }
    }
    
    // Mise à jour des statistiques
    $stmt = $db->prepare("
        UPDATE newsletters
        SET sent_count = ?, failed_count = ?
        WHERE id = ?
    ");
    
    $stmt->execute([$stats['sent'], $stats['failed'], $newsletterId]);
    
    // Journalisation
    logMessage("Newsletter envoyée: $subject, {$stats['sent']}/{$stats['total']} emails envoyés");
    
    return $stats;
}
