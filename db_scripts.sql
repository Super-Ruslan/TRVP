-- DB & tables
CREATE DATABASE tolley_park;

CREATE TABLE stops (
    id UUID PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    connected_with UUID[] default '{}'
);

CREATE TABLE routes (
    id UUID PRIMARY KEY,
    number INTEGER NOT NULL CHECK (number >= 0),
    position INTEGER NOT NULL CHECK (position >= 0)
);

CREATE TABLE route_stops (
    id UUID PRIMARY KEY,
    route_id UUID NOT NULL REFERENCES routes,
    stop_id UUID NOT NULL REFERENCES stops,
    position INTEGER NOT NULL CHECK (position >= 0)
);

-- User
CREATE ROLE manager LOGIN ENCRYPTED PASSWORD 'manager';
GRANT SELECT ON stops TO manager;
GRANT SELECT, INSERT, UPDATE, DELETE ON routes, route_stops TO manager;

-- Остановки и их связи
INSERT INTO public.stops(
	id, name, connected_with)
	VALUES (
		'e82250d2-a929-4b7c-a5a6-f6f12d9efc62', 
		'A', 
		ARRAY[
			UUID('81f7260c-b9f7-4e36-bb63-4f2c9bed1676')
		]
	);
	
INSERT INTO public.stops(
	id, name, connected_with)
	VALUES (
		'92613ebf-2842-4ccf-b88f-73c989b2cc52', 
		'B', 
		ARRAY[
			UUID('81f7260c-b9f7-4e36-bb63-4f2c9bed1676'),
			UUID('00e1eb3e-59bf-412a-b867-cea5ab1521a2')
		]
	);
	
INSERT INTO public.stops(
	id, name, connected_with)
	VALUES (
		'63940fd0-d858-46b2-a9c7-4656b221bdac', 
		'C', 
		ARRAY[
			UUID('81f7260c-b9f7-4e36-bb63-4f2c9bed1676'),
			UUID('ffe1a64b-5b2f-4eab-98e0-cab5da9e8d86')
		]
	);
	
INSERT INTO public.stops(
	id, name, connected_with)
	VALUES (
		'81f7260c-b9f7-4e36-bb63-4f2c9bed1676', 
		'D', 
		ARRAY[
			UUID('e82250d2-a929-4b7c-a5a6-f6f12d9efc62'), 
			UUID('92613ebf-2842-4ccf-b88f-73c989b2cc52'),
			UUID('00e1eb3e-59bf-412a-b867-cea5ab1521a2'),
			UUID('ffe1a64b-5b2f-4eab-98e0-cab5da9e8d86'),
			UUID('63940fd0-d858-46b2-a9c7-4656b221bdac')
		]
	);
	
INSERT INTO public.stops(
	id, name, connected_with)
	VALUES (
		'00e1eb3e-59bf-412a-b867-cea5ab1521a2', 
		'E', 
		ARRAY[
			UUID('92613ebf-2842-4ccf-b88f-73c989b2cc52'),
			UUID('81f7260c-b9f7-4e36-bb63-4f2c9bed1676'),
			UUID('ffe1a64b-5b2f-4eab-98e0-cab5da9e8d86'),
			UUID('3a50d63b-1f72-4125-a755-95d26cb2a6a9')
		]
	);
	
INSERT INTO public.stops(
	id, name, connected_with)
	VALUES (
		'ffe1a64b-5b2f-4eab-98e0-cab5da9e8d86', 
		'F', 
		ARRAY[
			UUID('63940fd0-d858-46b2-a9c7-4656b221bdac'),
			UUID('81f7260c-b9f7-4e36-bb63-4f2c9bed1676'),
			UUID('00e1eb3e-59bf-412a-b867-cea5ab1521a2'),
			UUID('3a50d63b-1f72-4125-a755-95d26cb2a6a9')
		]
	);
	
INSERT INTO public.stops(
	id, name, connected_with)
	VALUES (
		'3a50d63b-1f72-4125-a755-95d26cb2a6a9', 
		'G', 
		ARRAY[
			UUID('00e1eb3e-59bf-412a-b867-cea5ab1521a2'),
			UUID('ffe1a64b-5b2f-4eab-98e0-cab5da9e8d86')
		]
	);


-- SQL QUERIES

-- Получение stops
SELECT * FROM stops;

-- Получение routes со связями с route_stops
SELECT 
	routes.id AS route_id,
	routes.number AS route_number,
	routes.position AS route_position,
	
	route_stops.id AS route_stop_id,
	route_stops.stop_id AS stop_id,
	route_stops.position AS route_stop_position
FROM
	routes LEFT JOIN route_stops ON routes.id = route_stops.route_id
ORDER BY routes.position, route_stops.position;

-- Создание route
INSERT INTO routes(id, number, position) VALUES (<route_id>, <number>, <position>);

-- Удаление route
DELETE FROM route_stops WHERE route_id = <route_id>;
DELETE FROM routes WHERE id = <route_id>;

-- Изменение route
UPDATE routes SET number = <number> WHERE id = <route_id>;

-- Создание route_stop
INSERT INTO route_stops(id, route_id, stop_id, position) VALUES (<route_stop_id>, <route_id>, <stop_id>, <position>);

-- Удаление route_stop
DELETE FROM route_stops WHERE id = <route_stop_id>;

-- Изменение route_stop
UPDATE route_stops SET stop_id = <stop_id>, position = <position> WHERE id = <route_stop_id>;

-- Перемещение route_stop между остановками
UPDATE route_stops SET route_id = <route_id> WHERE id = <route_stop_id>;