const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const app = express();
const port = 3000; // API de Proyectos escucha en el puerto 3000

app.use(bodyParser.json());

// Configuración de AWS SDK
AWS.config.update({ region: 'us-east-1' }); 
const sqs = new AWS.SQS();


let proyectos = [
  { id: 1, nombre: 'Desarrollo de Plataforma E-learning', descripcion: 'Creación de un sistema de aprendizaje en línea.', estado: 'Completado' },
  { id: 2, nombre: 'Integración de Pasarela de Pagos', descripcion: 'Conexión con Stripe para pagos de cursos.', estado: 'En progreso' },
  { id: 3, nombre: 'Campaña de Marketing Digital', descripcion: 'Estrategia SEO y SEM para el lanzamiento del producto.', estado: 'Pendiente' }
];

let proyectoId = 4;

app.get('/proyectos', (req, res) => {
  res.json(proyectos);
});

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

app.post('/proyectos/:id/tareas', async (req, res) => {
  const idProyectoAsociado = parseInt(req.params.id); 

  const mensaje = {
    action: 'create', 
    payload: {
      idProyecto: idProyectoAsociado, 
      ...req.body 
    }
  };

  const params = {
    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/472513086006/tareas-queue', 
    MessageBody: JSON.stringify(mensaje)
  };

  try {
    await sqs.sendMessage(params).promise();
    console.log(`Mensaje de tarea enviado a SQS para proyecto ${idProyectoAsociado}:`, mensaje);
    res.status(202).json({ mensaje: 'Tarea enviada a la cola para procesamiento asíncrono' });
  } catch (error) {
    console.error('Error al enviar mensaje a SQS:', error);
    res.status(500).json({ mensaje: 'Error interno al intentar crear tarea', error: error.message });
  }
});

app.listen(port, () => console.log(`API Proyectos escuchando en puerto ${port}`));