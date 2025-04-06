const express = require('express');
const router = express.Router();

// Abonnement à la newsletter
router.post('/subscribe', (req, res) => {
    // Logique d'abonnement
    res.send('Abonnement à la newsletter réussi');
});

// Désabonnement de la newsletter
router.post('/unsubscribe', (req, res) => {
    // Logique de désabonnement
    res.send('Désabonnement de la newsletter réussi');
});

// Envoi de la newsletter
router.post('/send', (req, res) => {
    // Logique d'envoi de la newsletter
    res.send('Newsletter envoyée');
});

module.exports = router;
