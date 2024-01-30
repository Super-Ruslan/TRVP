import express  from "express";
import dotenv from 'dotenv';
import DB from './db/client.js';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: './backend/.env'
});

const appHost = "localhost";
const appPort = 4321;

const app = express();
const db = new DB();

//logging middleware
app.use('*', (req, res, next) => {
    console.log(
        req.method,
        req.baseUrl || req.url,
        new Date().toISOString()
    );

    next();
});

// Middleware for static app files
app.use('/', express.static(path.resolve(__dirname, '../dist')));

// Получение stops
app.get('/stops', async (req, res) => {
    try {
        const stops = await db.getStops();

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.json(stops);
    } catch (err) {
        res.statusCode = 500;
        res.statusMessage = 'Internal server error';
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: 500,
            message: `Getting stops error: ${err.error.message || err.error}`
        });
    }
});

// Получение routes со связями с route_stops
app.get('/routes', async (req, res) => {
    try {
        const routes = await db.getRoutes();

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.json({ routes });
    } catch (err) {
        res.statusCode = 500;
        res.statusMessage = 'Internal server error';
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: 500,
            message: `Getting routes error: ${err.error.message || err.error}`
        });
    }
});

// Создание route
// Body parsing middleware
app.use('/routes', express.json());
app.post('/routes', async (req, res) => {
    try {
        const { routeID, number, position } = req.body;
        await db.addRoute({ routeID, number, position });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch (err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;

            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Add route error: ${err.error.message || err.error}`
        });
    }
});

// Удаление route
app.delete('/routes/:routeID', async (req, res) => {
    try {
        const { routeID } = req.params;
        await db.deleteRoute({ routeID });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch (err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;

            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Delete route error: ${err.error.message || err.error}`
        });
    }
});

// Изменение route
// Body parsing middleware
app.use('/routes/:routeID', express.json());
app.patch('/routes/:routeID', async (req, res) => {
    try {
        const { routeID } = req.params;
        const { number } = req.body;
        await db.updateRoute({ routeID, number });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch (err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;

            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update route error: ${err.error.message || err.error}`
        });
    }
});

// Создание route_stop
// Body parsing middleware
app.use('/route-stops', express.json());
app.post('/route-stops', async (req, res) => {
    try {
        const { routeStopID, routeID, stopID, position } = req.body;
        await db.addRouteStop({ routeStopID, routeID, stopID, position });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch (err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;

            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Add route stop error: ${err.error.message || err.error}`
        });
    }
});

// Удаление route_stop
app.delete('/route-stops/:routeStopID', async (req, res) => {
    try {
        const { routeStopID } = req.params;
        await db.deleteRouteStop({ routeStopID });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch (err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;

            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Delete route stop error: ${err.error.message || err.error}`
        });
    }
});

// Изменение route_stop
// Body parsing middleware
app.use('/route-stops/:routeStopID', express.json());
app.patch('/route-stops/:routeStopID', async (req, res) => {
    try {
        const { routeStopID } = req.params;
        const { stopID, position } = req.body;
        await db.updateRouteStop({ routeStopID, stopID, position });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch (err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;

            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update route stop error: ${err.error.message || err.error}`
        });
    }
});

// Изменение позиций нескольких route_stops
app.patch('/routes', async (req, res) => {
    try {
        const { reorderedRouteStops } = req.body;

        await Promise.all(reorderedRouteStops.map(({ routeStopID, position }) => db.updateRouteStop({ routeStopID, position })));

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch (err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;

            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update several route stops error: ${err.error.message || err.error}`
        });
    }
});

// Перемещение route_stop между остановками
app.patch('/route-stops', async (req, res) => {
    try {
        const { routeStopID, routeID } = req.body;
        await db.moveRouteStop({ routeStopID, routeID });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch (err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;

            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Move route stop error: ${err.error.message || err.error}`
        });
    }
});
    console.log(`App started at host http://${appHost}:${appPort}`);
const server = app.listen(Number(appPort), appHost, async () => {
    try {
        await db.connect();
    } catch(error) {
        console.log('Disconnect');
        process.exit(100);
    }
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        await db.disconnect();
        console.log('HTTP server closed');
    });
});