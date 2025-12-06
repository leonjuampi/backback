const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Conty API',
      version: '1.0.0',
      description: 'Conty POS/Inventory API documentation'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['src/routes/*.js'] // lee JSDoc de rutas
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {

  // 1. Crea una ruta para servir el JSON
  // Esta será la URL pública de tu especificación
  app.get('/conti-routes.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // 2. Configura la UI de Swagger
  // Pasa 'null' como primer argumento
  // y usa la opción 'swaggerUrl' para apuntar a tu nueva ruta
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, {
    swaggerUrl: '/conti-routes.json', // Indíca a la UI dónde encontrar el JSON
    // swaggerOptions: { // Opciones adicionales si las necesitas
    //   docExpansion: 'none'
    // }
  }));
}

module.exports = setupSwagger;
