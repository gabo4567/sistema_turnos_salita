const login = (req, res) => {
    const { email, password } = req.body;

    if (email === 'admin@salita.com' && password === '1234') {
        return res.json({ ok: true, token: 'token_falso_123' });
    }

    return res.status(401).json({ ok: false });
};

module.exports = { login };
