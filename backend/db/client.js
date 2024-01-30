import pg from 'pg';

export default class DB {
    #dbClient = null;
    #dbHost = '';
    #dbPort = '';
    #dbName = '';
    #dbLogin = '';
    #dbPassword = '';

    constructor(){
        this.#dbHost = 'localhost';
        this.#dbPort = '5432';
        this.#dbName = 'tolley_park';
        this.#dbLogin = 'manager';
        this.#dbPassword = 'manager';

        this.#dbClient = new pg.Client({
            user: this.#dbLogin,
            password: this.#dbPassword,
            host: this.#dbHost,
            port: this.#dbPort,
            database: this.#dbName
        });
    }

    async connect(){
        console.log('DB_HOST is set:', process.env.DB_HOST);
        console.log(`${this.#dbHost}`);
        try {
            await this.#dbClient.connect();
            console.log('DB connection established');
        } catch(error) {
            console.error('Unable to connect to DB: ', error);
            return Promise.reject(error);
        }
    }

    async disconnect(){
        await this.#dbClient.end();
        console.log('DB connection was closed');
    }

    // Получение stops
    async getStops() {
      try {

          const stopsQuery = await this.#dbClient.query(
              'SELECT * FROM stops;'
          );

          const stopsRows = stopsQuery.rows;

          const stops = {};
          for (let stop of stopsRows) {
            stops[stop.id] = {
              name: stop.name,
              connected_with: stop.connected_with
            };
          }

          return stops;
      } catch(error) {
          console.error('Unable get stops, error:', error);
          return Promise.reject({
              type: 'internal',
              error
          });
      }
    }
    
    // Получение routes со связями с route_stops
    async getRoutes() {
      try {

          const routesQuery = await this.#dbClient.query(
              'SELECT\n' +
                'routes.id AS route_id,\n' +
                'routes.number AS route_number,\n' +
                'routes.position AS route_position,\n' +
                
                'route_stops.id AS route_stop_id,\n' +
                'route_stops.stop_id AS stop_id,\n' +
                'route_stops.position AS route_stop_position\n' +
              'FROM\n' +
                'routes LEFT JOIN route_stops ON routes.id = route_stops.route_id\n' +
              'ORDER BY routes.position, route_stops.position;'
          );

          const routesRows = routesQuery.rows;

          const routes = [];
          let currRouteID = '';
          for (let row of routesRows) {
            if (row.route_id !== currRouteID) {
              currRouteID = row.route_id;
              routes.push({
                routeID: currRouteID,
                routeNumber: row.route_number,
                routePosition: row.route_position,
                routeStops: []
              });
            }

            if (row.route_stop_id) {
              routes[routes.length - 1].routeStops.push({
                routeStopID: row.route_stop_id,
                stopID: row.stop_id,
                routeStopPosition: row.route_stop_position
              });
            }
          }
          
          return routes;
      } catch(error) {
          console.error('Unable get routes, error:', error);
          return Promise.reject({
              type: 'internal',
              error
          });
      }
    }

  // Создание route
  async addRoute({ routeID, number = -1, position = -1  } = { routeID: null, number: -1, position: -1 }) {
      if (!routeID || number < 0 || position < 0) {
          const errMsg = `Add route error: {routeID: ${routeID}, number: ${number}, position: ${position}}`;
          console.error(errMsg);
          return Promise.reject({
              type: 'client',
              error: new Error(errMsg)
          });
      }

      try {
          await this.#dbClient.query(
              'INSERT INTO routes(id, number, position) VALUES ($1, $2, $3);',
              [routeID, number, position]
          );
      } catch (err) {
          console.log('Unable to add route:', err);
          return Promise.reject({
              type: 'internal',
              error: err
          });
      }
  }

    // Удаление route
    async deleteRoute({ routeID } = { routeID: null }) {
      if (!routeID) {
          const errMsg = `Delete route error: {routeID: ${routeID}}`;
          console.error(errMsg);
          return Promise.reject({
              type: 'client',
              error: new Error(errMsg)
          });
      }

      try {
        await Promise.all([
            this.#dbClient.query(
                'DELETE FROM route_stops WHERE route_id = $1;',
                [routeID]
              ),

            this.#dbClient.query(
              'DELETE FROM routes WHERE id = $1;',
              [routeID]
            )
        ]);
      } catch (err) {
          console.log('Unable to delete route:', err);
          return Promise.reject({
              type: 'internal',
              error: err
          });
      }
  }

    // Изменение route
    async updateRoute({ routeID, number = -1 } = { routeID: null, number: -1 }) {
      if (!routeID || number < 0) {
          const errMsg = `Update route error: {routeID: ${routeID}, number: ${number}}`;
          console.error(errMsg);
          return Promise.reject({
              type: 'client',
              error: new Error(errMsg)
          });
      }

      try {
          await this.#dbClient.query(
              'UPDATE routes SET number = $1 WHERE id = $2;',
              [number, routeID]
          );
      } catch (err) {
          console.log('Unable to update route:', err);
          return Promise.reject({
              type: 'internal',
              error: err
          });
      }
  }

    // Создание route_stop
    async addRouteStop({ routeStopID, routeID, stopID, position = -1 } = { routeStopID: null, routeID: null, stopID: null, position: -1 }) {
      if (!routeStopID || !routeID || !stopID || position < 0) {
          const errMsg = `Add route stop error: {routeStopID: ${routeStopID}, routeID: ${routeID}, stopID: ${stopID}, position: ${position}}`;
          console.error(errMsg);
          return Promise.reject({
              type: 'client',
              error: new Error(errMsg)
          });
      }

      try {
          await this.#dbClient.query(
              'INSERT INTO route_stops(id, route_id, stop_id, position) VALUES ($1, $2, $3, $4);',
              [routeStopID, routeID, stopID, position]
          );
      } catch (err) {
          console.log('Unable to add route stop:', err);
          return Promise.reject({
              type: 'internal',
              error: err
          });
      }
  }

    // Удаление route_stop
    async deleteRouteStop({ routeStopID } = { routeStopID: null }) {
      if (!routeStopID) {
          const errMsg = `Delete route stop error: {routeStopID: ${routeStopID}}`;
          console.error(errMsg);
          return Promise.reject({
              type: 'client',
              error: new Error(errMsg)
          });
      }

      try {
          await this.#dbClient.query(
              'DELETE FROM route_stops WHERE id = $1;',
              [routeStopID]
          );
      } catch (err) {
          console.log('Unable to delete route stop:', err);
          return Promise.reject({
              type: 'internal',
              error: err
          });
      }
  }

    // Изменение route_stop
    async updateRouteStop({ routeStopID, stopID, position = -1 } = { routeStopID: null, stopID: null, position: -1 }) {
      if (!routeStopID || (!stopID && position < 0)) {
          const errMsg = `Update route stop error: {routeStopID: ${routeStopID}, stopID: ${stopID}, position: ${position}}`;
          console.error(errMsg);
          return Promise.reject({
              type: 'client',
              error: new Error(errMsg)
          });
      }

      let query = null;
      const queryParams = [];
      if (stopID && position >= 0) {
          query = 'UPDATE route_stops SET stop_id = $1, position = $2 WHERE id = $3;';
          queryParams.push(stopID, position, routeStopID);
      } else if (stopID) {
          query = 'UPDATE route_stops SET stop_id = $1 WHERE id = $2;';
          queryParams.push(stopID, routeStopID);
      } else if (position >= 0) {
          query = 'UPDATE route_stops SET position = $1 WHERE id = $2;';
          queryParams.push(position, routeStopID);
      }

      try {
          await this.#dbClient.query(
              query, queryParams
          );
      } catch (err) {
          console.log('Unable to update route stop:', err);
          return Promise.reject({
              type: 'internal',
              error: err
          });
      }
  }

    // Перемещение route_stop между остановками
    async moveRouteStop({ routeStopID, routeID } = { routeStopID: null, routeID: null }) {
      if (!routeStopID || !routeID) {
          const errMsg = `Move route stop error: {routeStopID: ${routeStopID}, routeID: ${routeID}}`;
          console.error(errMsg);
          return Promise.reject({
              type: 'client',
              error: new Error(errMsg)
          });
      }

      try {
          await this.#dbClient.query(
              'UPDATE route_stops SET route_id = $1 WHERE id = $2;',
              [routeID, routeStopID]
          );
      } catch (err) {
          console.log('Unable to move route stop:', err);
          return Promise.reject({
              type: 'internal',
              error: err
          });
      }
  }
};