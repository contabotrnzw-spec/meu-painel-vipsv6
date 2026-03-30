const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Configura o servidor para entender JSON e hospedar os arquivos da pasta 'public'
app.use(express.json());
app.use(express.static('public')); 

const DB_FILE = 'database.json';
const SENHA_MESTRA = 'admin123'; // Sua senha intocável

// Função para ler o banco de dados
const lerBanco = () => {
    if (!fs.existsSync(DB_FILE)) return {};
    return JSON.parse(fs.readFileSync(DB_FILE));
};

// Função para salvar no banco de dados
const salvarBanco = (dados) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(dados, null, 2));
};

// Rota 1: Sistema de Login
app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    
    // Acesso Master (Bruxo)
    if (user === 'bruxo' && pass === SENHA_MESTRA) {
        return res.json({ success: true, isMaster: true });
    }

    const db = lerBanco();
    const conta = db[user];

    if (!conta) {
        return res.status(401).json({ error: 'Usuário não registrado no servidor!' });
    }
    if (conta.password !== pass) {
        return res.status(401).json({ error: 'Senha incorreta!' });
    }
    if (Date.now() > conta.expiry) {
        return res.status(401).json({ error: 'Sua licença expirou!' });
    }

    // Se passou em tudo, libera o acesso
    res.json({ success: true, expiry: conta.expiry });
});

// Rota 2: Gerador de Keys (Admin)
app.post('/api/gerar-key', (req, res) => {
    const { adminPass, newUser, newPass, days } = req.body;
    
    if (adminPass !== SENHA_MESTRA) {
        return res.status(403).json({ error: 'Acesso negado. Senha master incorreta.' });
    }

    const db = lerBanco();
    const expiryDate = Date.now() + (days * 24 * 60 * 60 * 1000); // Converte dias em milissegundos
    
    // Cria ou atualiza o usuário no banco
    db[newUser] = { password: newPass, expiry: expiryDate };
    salvarBanco(db);

    res.json({ success: true, message: `Key gerada com sucesso para: ${newUser}` });
});

// Inicia o servidor na porta 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[SYSTEM] Servidor TH_BRUXO2 online na porta ${PORT}`);
    console.log(`[SYSTEM] Aguardando conexões...`);
});
