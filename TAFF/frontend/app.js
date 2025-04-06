// JavaScript pour le frontend
console.log('Frontend JavaScript chargé');

// Gestion de l'inscription
document.getElementById('formInscription')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const pseudo = document.getElementById('pseudo').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('Inscription:', { pseudo, email, password });
});

// Gestion de la connexion
document.getElementById('formConnexion')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('Connexion:', { email, password });
});

// Gestion de la validation des résultats
document.getElementById('formValidation')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const matchId = document.getElementById('matchId').value;
    const resultat = document.getElementById('resultat').value;
    console.log('Validation du résultat:', { matchId, resultat });
});

// Gestion de l'administration
document.getElementById('formAdmin')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const action = document.getElementById('action').value;
    console.log('Action administrative:', action);
});

// Gestion de la newsletter
document.getElementById('formNewsletter')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    console.log('Abonnement à la newsletter:', email);
});
