const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

let tasks = [
  { id: 1, title: 'Buy groceries', done: false },
  { id: 2, title: 'Read documentation', done: true },
  { id: 3, title: 'Push to GitHub', done: false }
];
let nextId = 4;

app.get('/', (req, res) => {
  res.json({ name: 'Task API', version: '1.0', endpoints: ['/tasks'] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: `Task ${id} not found` });
  res.json(task);
});

// Stage 3
app.post('/tasks', (req, res) => {
  const { title } = req.body;
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and cannot be empty' });
  }
  const task = { id: nextId++, title: title.trim(), done: false };
  tasks.push(task);
  res.status(201).json(task);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});