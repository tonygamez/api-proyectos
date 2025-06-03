const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

AWS.config.update({ region: 'us-east-1' });
const sqs = new AWS.SQS();

let proyectos = [];
let proyectoId = 1;

app.get('/proyectos', (req, res) => res.json(proyectos));

app.post('/proyectos', (req, res) => {
  const nuevo = { id: proyectoId++, ...req.body };
  proyectos.push(nuevo);
  res.status(201).json(nuevo);
});

app.put('/proyectos/:id', (req, res) => {
  const idx = proyectos.findIndex(p => p.id == req.params.id);
  if (idx === -1) return res.sendStatus(404);
  proyectos[idx] = { ...proyectos[idx], ...req.body };
  res.json(proyectos[idx]);
});

app.delete('/proyectos/:id', (req, res) => {
  proyectos = proyectos.filter(p => p.id != req.params.id);
  res.sendStatus(204);
});

// Crear tarea en otra API (asincrónico vía SQS)
app.post('/proyectos/:id/tareas', async (req, res) => {
  const mensaje = {
    action: 'create',
    payload: {
      idProyecto: parseInt(req.params.id),
      ...req.body
    }
  };

  const params = {
    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/472513086006/tareas-queue',
    MessageBody: JSON.stringify(mensaje)
  };

  await sqs.sendMessage(params).promise();
  res.status(202).json({ mensaje: 'Tarea enviada a la cola' });
});

app.listen(port, () => console.log(`API Proyectos escuchando en puerto ${port}`));
