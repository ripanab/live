const express = require('express');
const app = express();

const STUDENT_PASS = "class123";
const TEACHER_KEY = "admin999";

app.use(express.json());
app.use(express.static('public'));

let messages = [];
let strokes = [];
let signals = [];

// 1. Login Check
app.post('/api/login', (req, res) => {
    const { name, password, role } = req.body;
    if (role === 'teacher' && password === TEACHER_KEY) {
        messages.push({ id: Date.now(), sender: 'System', text: `${name} (Teacher) joined.` });
        return res.json({ ok: true, role: 'teacher' });
    }
    if (role === 'student' && password === STUDENT_PASS) {
        messages.push({ id: Date.now(), sender: 'System', text: `${name} joined.` });
        return res.json({ ok: true, role: 'student' });
    }
    res.status(401).json({ ok: false, error: 'Wrong password!' });
});

// 2. Sync Chat, Whiteboard & WebRTC Signals (HTTP Polling)
app.get('/api/sync', (req, res) => {
    const afterMsg = Number(req.query.afterMsg || 0);
    const afterStroke = Number(req.query.afterStroke || 0);
    const myId = req.query.myId || '';

    const newMessages = messages.filter(m => m.id > afterMsg);
    const newStrokes = strokes.filter(s => s.id > afterStroke);
    const mySignals = signals.filter(sig => sig.to === myId);
    signals = signals.filter(sig => sig.to !== myId);

    res.json({ messages: newMessages, strokes: newStrokes, signals: mySignals });
});

// 3. Post Chat Message
app.post('/api/chat', (req, res) => {
    messages.push({ id: Date.now() + Math.random(), sender: req.body.sender, text: req.body.text });
    if (messages.length > 50) messages.shift();
    res.json({ ok: true });
});

// 4. Post Whiteboard Stroke or Clear
app.post('/api/draw', (req, res) => {
    if (req.body.clear) {
        strokes = [{ id: Date.now() + Math.random(), clear: true }];
    } else {
        strokes.push({ id: Date.now() + Math.random(), ...req.body });
    }
    res.json({ ok: true });
});

// 5. Post WebRTC Signal
app.post('/api/signal', (req, res) => {
    signals.push(req.body);
    res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HTTP Classroom running on port ${PORT}`));
