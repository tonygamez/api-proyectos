const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const app = express();
const port = 3000; // API de Proyectos escucha en el puerto 3000

app.use(bodyParser.json());

// Configuración de AWS SDK
AWS.config.update({ region: 'us-east-1' }); // Asegúrate de que esta región coincida con la de tu cola SQS
const sqs = new AWS.SQS();

// Datos de ejemplo para proyectos
let proyectos = [
  { id: 1, nombre: 'Desarrollo de Plataforma E-learning', descripcion: 'Creación de un sistema de aprendizaje en línea.', estado: 'Completado' },
  { id: 2, nombre: 'Integración de Pasarela de Pagos', descripcion: 'Conexión con Stripe para pagos de cursos.', estado: 'En progreso' },
  { id: 3, nombre: 'Campaña de Marketing Digital', descripcion: 'Estrategia SEO y SEM para el lanzamiento del producto.', estado: 'Pendiente' }
];

// ID inicial para nuevos proyectos, comienza después del ID más alto de los datos de ejemplo
let proyectoId = 4;

// Ruta GET /proyectos: Devuelve todos los proyectos (incluyendo los de ejemplo)
app.get('/proyectos', (req, res) => {
  res.json(proyectos);
});

// Ruta POST /proyectos: Crea un nuevo proyecto
app.post('/proyectos', (req, res) => {
  const nuevo = { id: proyectoId++, ...req.body };
  proyectos.push(nuevo);
  res.status(201).json(nuevo);
});

// Ruta PUT /proyectos/:id: Actualiza un proyecto existente
app.put('/proyectos/:id', (req, res) => {
  const idx = proyectos.findIndex(p => p.id == req.params.id);
  if (idx === -1) return res.sendStatus(404);
  proyectos[idx] = { ...proyectos[idx], ...req.body };
  res.json(proyectos[idx]);
});

// Ruta DELETE /proyectos/:id: Elimina un proyecto
app.delete('/proyectos/:id', (req, res) => {
  proyectos = proyectos.filter(p => p.id != req.params.id);
  res.sendStatus(204);
});

// Ruta POST /proyectos/:id/tareas: Crea una tarea asociada a un proyecto (asincrónico vía SQS)
// Similar a POST /cursos/:id/alumnos del ejemplo
app.post('/proyectos/:id/tareas', async (req, res) => {
  const idProyectoAsociado = parseInt(req.params.id); // Captura el ID del proyecto de la URL

  const mensaje = {
    action: 'create', // La acción que la API de Tareas debe realizar
    payload: {
      idProyecto: idProyectoAsociado, // Este es el 'idCurso' de tu ejemplo
      ...req.body // Datos de la tarea (titulo, descripcion, etc.)
    }
  };

  const params = {
    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/472513086006/tareas-queue', // URL de tu cola SQS
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

// Inicia el servidor
app.listen(port, () => console.log(`API Proyectos escuchando en puerto ${port}`));