const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

console.log('Server is starting...');

// Fonction pour extraire l'email d'une ligne
function extractEmail(line) {
    console.log(`Extracting email from line: ${line}`);
    const emailMatch = line.match(/- (.+@.+\..+)$/);
    return emailMatch ? emailMatch[1].trim() : null;
}

// Fonction pour vérifier si l'email existe déjà
async function checkEmailExists(newEmail) {
    console.log(`Checking if email exists: ${newEmail}`);
    try {
        // Vérifier si le fichier existe
        try {
            await fs.access('email.txt');
            console.log('email.txt file exists.');
        } catch {
            // Si le fichier n'existe pas, l'email n'est pas un doublon
            console.log('email.txt file does not exist.');
            return false;
        }

        // Lire le contenu du fichier
        const fileContent = await fs.readFile('email.txt', 'utf-8');
        console.log('email.txt content read successfully.');
        const lines = fileContent.split('\n').filter(line => line.trim()); // Ignorer les lignes vides

        // Extraire tous les emails et vérifier si le nouvel email existe déjà
        for (const line of lines) {
            const existingEmail = extractEmail(line);
            if (existingEmail && existingEmail.toLowerCase() === newEmail.toLowerCase()) {
                console.log(`Email already exists: ${existingEmail}`);
                return true; // Email trouvé
            }
        }

        console.log('Email does not exist.');
        return false; // Email non trouvé
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'email:', error);
        throw error;
    }
}

// Définir une route pour la racine
app.get('/', (req, res) => {
    console.log('GET / request received');
    res.send('Bienvenue sur le serveur backend');
});

// Route pour vérifier si le serveur fonctionne
app.get('/health', (req, res) => {
    console.log('GET /health request received');
    res.send({ status: 'Le serveur fonctionne correctement' });
});

app.post('/api/emails', async (req, res) => {
    console.log('POST /api/emails request received');
    try {
        const { email } = req.body;
        console.log(`Email to be checked: ${email}`);

        // Vérifier si l'email est valide
        if (!email || !email.includes('@')) {
            console.log('Invalid email address');
            return res.status(400).json({
                error: 'Email invalide'
            });
        }

        // Vérifier si l'email existe déjà (en ignorant la casse)
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
            console.log('Email already registered');
            return res.status(409).json({
                error: 'Cet email est déjà inscrit'
            });
        }

        // Si l'email n'existe pas, l'ajouter au fichier
        const timestamp = new Date().toISOString();
        const emailEntry = `${timestamp} - ${email}\n`;
        await fs.appendFile('email.txt', emailEntry);
        console.log('Email registered successfully');

        res.json({
            success: true,
            message: 'Email enregistré avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'email:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'enregistrement de l\'email'
        });
    }
});

// Endpoint pour voir tous les emails enregistrés (optionnel, pour le débogage)
app.get('/api/emails', async (req, res) => {
    console.log('GET /api/emails request received');
    try {
        const content = await fs.readFile('email.txt', 'utf-8');
        console.log('email.txt content read successfully');
        res.send(content);
    } catch (error) {
        console.error('Erreur lors de la lecture des emails:', error);
        res.status(500).json({ error: 'Erreur lors de la lecture des emails' });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});