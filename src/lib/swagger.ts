import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "10xDevFiszki API",
      version: "1.0.0",
      description: "API dokumentacja dla aplikacji 10xDevFiszki",
    },
    servers: [
      {
        url: "/api",
        description: "API server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Ścieżki do plików zawierających adnotacje JSDoc
  apis: ["./src/pages/api/**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
