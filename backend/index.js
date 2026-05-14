const express = require('express');
const cors = require('cors');
const db = require('./db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize table
const initDb = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(255) PRIMARY KEY,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS month_budgets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                month INT NOT NULL,
                year INT NOT NULL,
                max_budget DECIMAL(15,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_month_year_user (user_id, month, year)
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS category_budgets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                month_budget_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                budget_amount DECIMAL(15,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (month_budget_id) REFERENCES month_budgets(id) ON DELETE CASCADE
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                month_budget_id INT NOT NULL,
                category_budget_id INT NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                transaction_date DATE NOT NULL,
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (month_budget_id) REFERENCES month_budgets(id) ON DELETE CASCADE,
                FOREIGN KEY (category_budget_id) REFERENCES category_budgets(id) ON DELETE CASCADE
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS savings_goals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                target_amount DECIMAL(15,2) NOT NULL,
                current_amount DECIMAL(15,2) DEFAULT 0,
                deadline DATE,
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS savings_histories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                savings_goal_id INT NOT NULL,
                amount_added DECIMAL(15,2) NOT NULL,
                type ENUM('nabung', 'tarik') DEFAULT 'nabung',
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (savings_goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE
            )
        `);

        // Migration for existing tables
        const addColumnIfNotExist = async (tableName, columnName, columnDef) => {
            try {
                const [columns] = await db.query(`SHOW COLUMNS FROM ${tableName} LIKE '${columnName}'`);
                if (columns.length === 0) {
                    await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
                    console.log(`Added column ${columnName} to ${tableName}`);
                }
            } catch (err) {
                console.error(`Error adding column ${columnName} to ${tableName}:`, err.message);
            }
        };

        await addColumnIfNotExist('savings_histories', 'type', "ENUM('nabung', 'tarik') DEFAULT 'nabung'");
        await addColumnIfNotExist('savings_histories', 'note', "TEXT");
        await addColumnIfNotExist('transactions', 'is_reimbursed', "TINYINT(1) DEFAULT 0");


        console.log('Database tables initialized');
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
};

initDb();

// Middleware
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: "Token tidak ditemukan" });
    }
    try {
        const [rows] = await db.query('SELECT user_id FROM sessions WHERE id = ?', [token]);
        if (rows.length === 0) {
            return res.status(401).json({ message: "Sesi tidak valid atau telah kedaluwarsa" });
        }
        req.userId = rows[0].user_id;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Routes
app.get('/api/notes', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM notes ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/notes', async (req, res) => {
    const { title, content } = req.body;
    try {
        const [result] = await db.query('INSERT INTO notes (title, content) VALUES (?, ?)', [title, content]);
        res.status(201).json({ id: result.insertId, title, content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/notes/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    try {
        await db.query('UPDATE notes SET title = ?, content = ? WHERE id = ?', [title, content, id]);
        res.json({ message: 'Note updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/notes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM notes WHERE id = ?', [id]);
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: "User berhasil ditambahkan" });
    } catch (err) {
        res.status(500).json({ message: "User gagal dibuat" });
    }
});

app.post('/api/users/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ message: "Username atau password salah" });
        }

        const user = rows[0];
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Username atau password salah" });
        }

        const token = crypto.randomUUID();
        await db.query('INSERT INTO sessions (id, user_id) VALUES (?, ?)', [token, user.id]);

        res.json({
            message: "Login berhasil",
            token: token
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/logout', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: "Token tidak ditemukan" });
    }

    try {
        await db.query('DELETE FROM sessions WHERE id = ?', [token]);
        res.json({ message: "Logout berhasil" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/change-password', authenticate, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password lama salah" });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.userId]);

        res.json({ message: "Password berhasil diubah" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/reset-password', async (req, res) => {
    const { username } = req.body;
    try {
        const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Username tidak ditemukan" });
        }

        const defaultPassword = "halokalin";
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
        await db.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username]);

        res.json({ message: "Password berhasil direset menjadi halokalin" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Month Budgets Routes
app.get('/api/months', authenticate, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM month_budgets WHERE user_id = ? ORDER BY year DESC, month DESC', [req.userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/months', authenticate, async (req, res) => {
    const { month, year, max_budget } = req.body;
    try {
        await db.query('INSERT INTO month_budgets (user_id, month, year, max_budget) VALUES (?, ?, ?, ?)', [req.userId, month, year, max_budget]);
        res.status(201).json({ message: "Budget bulanan berhasil dibuat" });
    } catch (err) {
        res.status(500).json({ message: "Gagal membuat budget bulanan. Pastikan data belum ada." });
    }
});

app.put('/api/months/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { month, year, max_budget } = req.body;
    try {
        const [result] = await db.query('UPDATE month_budgets SET month = ?, year = ?, max_budget = ? WHERE id = ? AND user_id = ?', [month, year, max_budget, id, req.userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Budget tidak ditemukan atau bukan milik Anda" });
        }
        res.json({ message: "Budget bulanan berhasil diubah" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/months/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM month_budgets WHERE id = ? AND user_id = ?', [id, req.userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Budget tidak ditemukan atau bukan milik Anda" });
        }
        res.json({ message: "Budget bulanan berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Category Budgets Routes
app.get('/api/months/:monthId/categories', authenticate, async (req, res) => {
    const { monthId } = req.params;
    try {
        // Optional: Check if the month budget belongs to the user
        const [monthRows] = await db.query('SELECT * FROM month_budgets WHERE id = ? AND user_id = ?', [monthId, req.userId]);
        if (monthRows.length === 0) {
            return res.status(404).json({ message: "Bulan budget tidak ditemukan" });
        }

        const [rows] = await db.query('SELECT * FROM category_budgets WHERE month_budget_id = ? ORDER BY created_at ASC', [monthId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/months/:monthId/categories', authenticate, async (req, res) => {
    const { monthId } = req.params;
    const { name, budget_amount, isAddToSavings, savings_goal_id } = req.body;
    try {
        const [monthRows] = await db.query('SELECT * FROM month_budgets WHERE id = ? AND user_id = ?', [monthId, req.userId]);
        if (monthRows.length === 0) {
            return res.status(404).json({ message: "Bulan budget tidak ditemukan" });
        }

        if (isAddToSavings && (!budget_amount || budget_amount <= 0)) {
            return res.status(400).json({ message: "Nominal budget tidak valid untuk dimasukkan ke savings" });
        }

        const [catResult] = await db.query('INSERT INTO category_budgets (month_budget_id, name, budget_amount) VALUES (?, ?, ?)', [monthId, name, budget_amount]);

        if (isAddToSavings) {
            const categoryId = catResult.insertId;
            const transactionDate = new Date().toISOString().split('T')[0];
            const note = `Alokasi savings dari : ${name}`;

            // Create expense transaction
            await db.query(`
                INSERT INTO transactions (user_id, month_budget_id, category_budget_id, type, amount, transaction_date, note, is_reimbursed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [req.userId, monthId, categoryId, 'expense', budget_amount, transactionDate, note, 0]);

            // Update savings goal
            if (savings_goal_id) {
                // If savings_goal_id is provided, use it
                await db.query('INSERT INTO savings_histories (savings_goal_id, amount_added, type, note) VALUES (?, ?, ?, ?)', [savings_goal_id, budget_amount, 'nabung', note]);
                await db.query('UPDATE savings_goals SET current_amount = current_amount + ? WHERE id = ? AND user_id = ?', [budget_amount, savings_goal_id, req.userId]);
            } else {
                // Fallback: search by name only (don't create new automatically to avoid confusion)
                const [existingGoals] = await db.query('SELECT id FROM savings_goals WHERE user_id = ? AND name = ? LIMIT 1', [req.userId, name]);
                if (existingGoals.length > 0) {
                    const goalId = existingGoals[0].id;
                    await db.query('INSERT INTO savings_histories (savings_goal_id, amount_added, type, note) VALUES (?, ?, ?, ?)', [goalId, budget_amount, 'nabung', note]);
                    await db.query('UPDATE savings_goals SET current_amount = current_amount + ? WHERE id = ?', [budget_amount, goalId]);
                }
            }
        }

        res.status(201).json({ message: "Kategori budget berhasil ditambahkan" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/categories/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { name, budget_amount } = req.body;
    try {
        // Verify ownership through month_budgets
        const [rows] = await db.query(`
            SELECT cb.* FROM category_budgets cb
            JOIN month_budgets mb ON cb.month_budget_id = mb.id
            WHERE cb.id = ? AND mb.user_id = ?
        `, [id, req.userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Kategori tidak ditemukan atau bukan milik Anda" });
        }

        await db.query('UPDATE category_budgets SET name = ?, budget_amount = ? WHERE id = ?', [name, budget_amount, id]);
        res.json({ message: "Kategori budget berhasil diubah" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/categories/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT cb.* FROM category_budgets cb
            JOIN month_budgets mb ON cb.month_budget_id = mb.id
            WHERE cb.id = ? AND mb.user_id = ?
        `, [id, req.userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Kategori tidak ditemukan atau bukan milik Anda" });
        }

        await db.query('DELETE FROM category_budgets WHERE id = ?', [id]);
        res.json({ message: "Kategori budget berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Transaction Routes
app.get('/api/transactions', authenticate, async (req, res) => {
    const { month_budget_id, category_budget_id, start_date, end_date } = req.query;
    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    let params = [req.userId];

    if (month_budget_id) {
        query += ' AND month_budget_id = ?';
        params.push(month_budget_id);
    }
    if (category_budget_id) {
        query += ' AND category_budget_id = ?';
        params.push(category_budget_id);
    }
    if (start_date) {
        query += ' AND transaction_date >= ?';
        params.push(start_date);
    }
    if (end_date) {
        query += ' AND transaction_date <= ?';
        params.push(end_date);
    }

    query += ' ORDER BY transaction_date DESC, created_at DESC';

    try {
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/transactions', authenticate, async (req, res) => {
    const { month_budget_id, category_budget_id, type, amount, transaction_date, note, is_reimbursed } = req.body;

    if (!amount || amount <= 0 || !['income', 'expense'].includes(type)) {
        return res.status(400).json({ message: "Data tidak valid" });
    }

    try {
        await db.query(`
            INSERT INTO transactions (user_id, month_budget_id, category_budget_id, type, amount, transaction_date, note, is_reimbursed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [req.userId, month_budget_id, category_budget_id, type, amount, transaction_date, note, is_reimbursed ? 1 : 0]);
        res.status(201).json({ message: "Transaksi berhasil dicatat" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/transactions/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { month_budget_id, category_budget_id, type, amount, transaction_date, note, is_reimbursed } = req.body;

    if (!amount || amount <= 0 || !['income', 'expense'].includes(type)) {
        return res.status(400).json({ message: "Data tidak valid" });
    }

    try {
        const [result] = await db.query(`
            UPDATE transactions 
            SET month_budget_id = ?, category_budget_id = ?, type = ?, amount = ?, transaction_date = ?, note = ?, is_reimbursed = ?
            WHERE id = ? AND user_id = ?
        `, [month_budget_id, category_budget_id, type, amount, transaction_date, note, is_reimbursed ? 1 : 0, id, req.userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Transaksi tidak ditemukan atau bukan milik Anda" });
        }
        res.json({ message: "Transaksi berhasil diperbarui" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/transactions/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Transaksi tidak ditemukan atau bukan milik Anda" });
        }
        res.json({ message: "Transaksi berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard Route
app.get('/api/dashboard/:monthId', authenticate, async (req, res) => {
    const { monthId } = req.params;

    try {
        // Langkah 1: Ambil Data Master Bulan Ini
        const [monthRows] = await db.query('SELECT max_budget FROM month_budgets WHERE id = ? AND user_id = ?', [monthId, req.userId]);
        if (monthRows.length === 0) {
            return res.status(404).json({ message: "Bulan budget tidak ditemukan" });
        }
        const max_budget = parseFloat(monthRows[0].max_budget);

        // Langkah 2: Hitung Total Pemasukan & Pengeluaran Sekaligus
        const [transSummary] = await db.query(`
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
            FROM transactions 
            WHERE month_budget_id = ? AND user_id = ?
        `, [monthId, req.userId]);

        const total_income = parseFloat(transSummary[0].total_income || 0);
        const total_expense = parseFloat(transSummary[0].total_expense || 0);

        // Langkah 3: Kalkulasi Sisa Budget & Progress
        const sisa_budget = max_budget - total_expense;
        const progress_percentage = (total_expense / max_budget) * 100;

        // Langkah 4: Hitung Pengeluaran per Kategori
        const [detail_kategori] = await db.query(`
            SELECT 
                cb.id, 
                cb.name, 
                cb.budget_amount,
                COALESCE(SUM(t.amount), 0) AS total_spent
            FROM category_budgets cb
            LEFT JOIN transactions t ON cb.id = t.category_budget_id AND t.type = 'expense'
            WHERE cb.month_budget_id = ?
            GROUP BY cb.id, cb.name, cb.budget_amount
            ORDER BY total_spent DESC
        `, [monthId]);

        // Memproses hasil kategori
        const kategori_terboros = detail_kategori.length > 0 && parseFloat(detail_kategori[0].total_spent) > 0 
            ? { name: detail_kategori[0].name, total_spent: parseFloat(detail_kategori[0].total_spent) }
            : null;

        const kategori_over_budget = detail_kategori.filter(cat => parseFloat(cat.total_spent) > parseFloat(cat.budget_amount));

        // Langkah 5: Gabungkan dan Kembalikan Response JSON
        res.json({
            month_budget_id: parseInt(monthId),
            max_budget,
            total_income,
            total_expense,
            sisa_budget,
            progress_percentage,
            kategori_terboros,
            kategori_over_budget,
            detail_kategori: detail_kategori.map(cat => ({
                ...cat,
                budget_amount: parseFloat(cat.budget_amount),
                total_spent: parseFloat(cat.total_spent)
            }))
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Savings Goals Routes
app.get('/api/savings', authenticate, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
        const savings = rows.map(item => ({
            ...item,
            target_amount: parseFloat(item.target_amount),
            current_amount: parseFloat(item.current_amount),
            progress_percentage: (parseFloat(item.current_amount) / parseFloat(item.target_amount)) * 100
        }));
        res.json(savings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/savings', authenticate, async (req, res) => {
    const { name, target_amount, deadline } = req.body;
    try {
        await db.query('INSERT INTO savings_goals (user_id, name, target_amount, deadline) VALUES (?, ?, ?, ?)', [req.userId, name, target_amount, deadline]);
        res.status(201).json({ message: "Savings goal berhasil dibuat" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/savings/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { name, target_amount, deadline } = req.body;
    try {
        const [result] = await db.query('UPDATE savings_goals SET name = ?, target_amount = ?, deadline = ? WHERE id = ? AND user_id = ?', [name, target_amount, deadline, id, req.userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Goal tidak ditemukan atau bukan milik Anda" });
        }
        res.json({ message: "Savings goal berhasil diperbarui" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/savings/:id/add', authenticate, async (req, res) => {
    const { id } = req.params;
    const { amount_added, note } = req.body;
    try {
        // 1. Validasi kepemilikan
        const [rows] = await db.query('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?', [id, req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Goal tidak ditemukan atau bukan milik Anda" });
        }

        const type = amount_added >= 0 ? 'nabung' : 'tarik';

        // 2. Insert riwayat
        await db.query('INSERT INTO savings_histories (savings_goal_id, amount_added, type, note) VALUES (?, ?, ?, ?)', [id, amount_added, type, note]);

        // 3. Update total di tabel utama (Atomic Update)
        await db.query('UPDATE savings_goals SET current_amount = current_amount + ? WHERE id = ?', [amount_added, id]);

        res.json({ message: amount_added >= 0 ? "Tabungan berhasil ditambahkan" : "Saldo berhasil ditarik" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/savings/:id/history', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Validasi kepemilikan
        const [goalRows] = await db.query('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?', [id, req.userId]);
        if (goalRows.length === 0) {
            return res.status(404).json({ message: "Goal tidak ditemukan atau bukan milik Anda" });
        }

        // 2. Ambil riwayat
        const [rows] = await db.query('SELECT * FROM savings_histories WHERE savings_goal_id = ? ORDER BY created_at DESC', [id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/savings/:id/complete', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('UPDATE savings_goals SET is_completed = true WHERE id = ? AND user_id = ?', [id, req.userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Goal tidak ditemukan atau bukan milik Anda" });
        }
        res.json({ message: "Goal berhasil diselesaikan" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/savings/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [id, req.userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Goal tidak ditemukan atau bukan milik Anda" });
        }
        res.json({ message: "Goal berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
