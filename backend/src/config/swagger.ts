import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'SmartHome AI Energy Management Platform API',
    version: '1.0.0',
    description: 'Commercial Production REST API for IoT Energy Analytics, Appliance Control & MQTT Automation.',
    contact: {
      name: 'SmartHome AI Engineering',
      email: 'support@smarthome.ai',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server',
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new SmartHome account',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Alex Rivera' },
                  email: { type: 'string', example: 'alex@example.com' },
                  password: { type: 'string', example: 'password123' },
                  role: { type: 'string', example: 'Owner' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'User created' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate and retrieve JWT tokens',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'owner@smarthome.ai' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'JWT Access and Refresh tokens' } },
      },
    },
    '/homes/stats': {
      get: {
        summary: 'Get live Dashboard stats (Power, Voltage, Current, Cost, Carbon saved)',
        responses: { 200: { description: 'Live Telemetry Dashboard statistics' } },
      },
    },
    '/devices': {
      get: { summary: 'List all connected appliances and relay channels' },
      post: { summary: 'Pair a new ESP32 appliance via 7-step wizard' },
    },
    '/devices/{deviceId}/relay': {
      put: {
        summary: 'Toggle device relay state (ON/OFF via MQTT)',
        parameters: [{ name: 'deviceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Relay updated' } },
      },
    },
    '/analytics': {
      get: { summary: 'Get energy usage breakdown, charts, and carbon emissions' },
    },
    '/ai/recommendations': {
      get: { summary: 'Get AI energy-saving insights' },
    },
  },
};

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('[Swagger] Documentation available at http://localhost:5000/api-docs');
};
