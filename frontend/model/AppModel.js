export default class AppModel {
    // Получение stops
    static async getStops() {
        try {
            const stopsResponse = await fetch('http://localhost:4321/stops');
            const stopsBody = await stopsResponse.json();

            if (stopsResponse.status !== 200) {
                return Promise.reject(stopsBody);
            }

            return stopsBody;
        } catch (err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    // Получение routes со связями с route_stops
    static async getRoutes() {
        try {
            const routesResponse = await fetch('http://localhost:4321/routes');
            const routesBody = await routesResponse.json();

            if (routesResponse.status !== 200) {
                return Promise.reject(routesBody);
            }

            return routesBody.routes;
        } catch (err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    // Создание route
    static async addRoute({ routeID, number = -1, position = -1 } = { routeID: null, number: -1, position: -1 }) {
        try {
            const addRouteResponse = await fetch(
                'http://localhost:4321/routes',
                {
                    method: 'POST',
                    body: JSON.stringify({ routeID, number, position }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (addRouteResponse.status !== 200) {
                const addRouteBody = await addRouteResponse.json();
                return Promise.reject(addRouteBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Маршрут '${number}' добавлен`
            };
        } catch (err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    // Удаление route
    static async deleteRoute({ routeID } = { routeID: null }) {
        try {
            const deleteRouteResponse = await fetch(
                `http://localhost:4321/routes/${routeID}`,
                {
                    method: 'DELETE',
                }
            );

            if (deleteRouteResponse.status !== 200) {
                const deleteRouteBody = await deleteRouteResponse.json();
                return Promise.reject(deleteRouteBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Маршрут с id ${routeID} удален`
            };
        } catch (err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    // Изменение route
    static async updateRoute({ routeID, number = -1 } = { routeID: null, number: -1 }) {
        try {
            const res = await fetch(
                `http://localhost:4321/routes/${routeID}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ number }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (res.status !== 200) {
                const body = await res.json();
                return Promise.reject(body);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Маршрут '${number}' обновлен`
            };
        } catch (err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    // Создание route_stop
    static async addRouteStop({ routeStopID, routeID, stopID, position = -1 } = { routeStopID: null, routeID: null, stopID: null, position: -1 }) {
        try {
            const addRouteStopResponse = await fetch(
                'http://localhost:4321/route-stops',
                {
                    method: 'POST',
                    body: JSON.stringify({ routeStopID, routeID, stopID, position }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (addRouteStopResponse.status !== 200) {
                const addRouteStopBody = await addRouteStopResponse.json();
                return Promise.reject(addRouteStopBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Остановка с id '${stopID}' добавлена в маршрут`
            };
        } catch (err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    // Удаление route_stop
    static async deleteRouteStop({ routeStopID } = { routeStopID: null }) {
        try {
            const deleteRouteStopResponse = await fetch(
                `http://localhost:4321/route-stops/${routeStopID}`,
                {
                    method: 'DELETE',
                }
            );

            if (deleteRouteStopResponse.status !== 200) {
                const deleteRouteStopBody = await deleteRouteStopResponse.json();
                return Promise.reject(deleteRouteStopBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Остановка маршрута с id ${routeStopID} удалена`
            };
        } catch (err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    // Изменение route_stop
    static async updateRouteStop({ routeStopID, stopID, position } = { routeStopID: null, stopID: null, number: -1 }) {
        try {
            const res = await fetch(
                `http://localhost:4321/route-stops/${routeStopID}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ stopID, position }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (res.status !== 200) {
                const body = await res.json();
                return Promise.reject(body);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Остановка с id '${stopID}' обновлена`
            };
        } catch (err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    // Изменение позиций нескольких route_stop
    static async updateRouteStops({ reorderedRouteStops = [] } = { reorderedRouteStops: [] }) {
        try {
            const updateRouteStopsResponse = await fetch(
                `http://localhost:4321/routes`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ reorderedRouteStops }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (updateRouteStopsResponse.status !== 200) {
                const updateRouteStopsBody = await updateRouteStopsResponse.json();
                return Promise.reject(updateRouteStopsBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Порядок остановок в маршруте обновлен`
            };
        } catch (err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    // Перемещение route_stop между остановками
    static async moveRouteStop({ routeStopID, routeID } = { routeStopID: null, routeID: null }) {
        try {
            const res = await fetch(
                `http://localhost:4321/route-stops`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ routeStopID, routeID }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (res.status !== 200) {
                const body = await res.json();
                return Promise.reject(body);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Остановка маршрута с id ${routeStopID} перемещена`
            };
        } catch (err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }
};