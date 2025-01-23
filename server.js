const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
app.use(
    cors({
        origin: ["https://minima-frontend-nfvb.vercel.app"],
        credentials: true,
        exposedHeaders: ["set-cookie"],
    })
);
app.use(express.json());

// Fonction pour extraire l'email d'une ligne
function extractEmail(line) {
    const emailMatch = line.match(/- (.+@.+\..+)$/);
    return emailMatch ? emailMatch[1].trim() : null;
}

// Fonction pour vérifier si l'email existe déjà
async function checkEmailExists(newEmail) {
    try {
        // Vérifier si le fichier existe
        try {
            await fs.access('email.txt');
        } catch {
            // Si le fichier n'existe pas, l'email n'est pas un doublon
            return false;
        }

        // Lire le contenu du fichier
        const fileContent = await fs.readFile('email.txt', 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim()); // Ignorer les lignes vides

        // Extraire tous les emails et vérifier si le nouvel email existe déjà
        for (const line of lines) {
            const existingEmail = extractEmail(line);
            if (existingEmail && existingEmail.toLowerCase() === newEmail.toLowerCase()) {
                return true; // Email trouvé
            }
        }

        return false; // Email non trouvé
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'email:', error);
        throw error;
    }
}

// Définir une route pour la racine
app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur backend');
});

app.post('/api/emails', async (req, res) => {
    try {
        const { email } = req.body;

        // Vérifier si l'email est valide
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                error: 'Email invalide'
            });
        }

        // Vérifier si l'email existe déjà (en ignorant la casse)
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
            return res.status(409).json({
                error: 'Cet email est déjà inscrit'
            });
        }

        // Si l'email n'existe pas, l'ajouter au fichier
        const timestamp = new Date().toISOString();
        const emailEntry = `${timestamp} - ${email}\n`;
        await fs.appendFile('email.txt', emailEntry);

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
    try {
        const content = await fs.readFile('email.txt', 'utf-8');
        res.send(content);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la lecture des emails' });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});