import RouteStop from './RouteStop.js';
import AppModel from '../model/AppModel.js';

export default class Route {
  #routeStops = [];
  #routeNumber = -1;
  #routeID = null;
  #routePosition = -1;

  constructor({
    routeID = null,
    name,
    position,
    onDropTaskInTasklist,
    onDeleteTask,
    onDeleteRoute,
    onEditRoute
  }) {
    this.#routeNumber = name;
    this.#routeID = routeID || crypto.randomUUID();
    this.#routePosition = position;
    this.onDropTaskInTasklist = onDropTaskInTasklist;
    this.onDeleteTask = onDeleteTask;
    this.onDeleteRoute = onDeleteRoute;
    this.onEditRoute = onEditRoute;
  }

  get tasklistID() { return this.#routeID; }

  get routePosition() { return this.#routePosition; }

  get routeNumber() { return this.#routeNumber; }
  set routeNumber(value) {
    if (typeof value === 'number' && value >= 0) {
      this.#routeNumber = value;
    }
  }

  addTask = ({ task }) => this.#routeStops.push(task);

  getTaskById = ({ taskID }) => this.#routeStops.find(task => task.taskID === taskID);

  deleteTask = ({ taskID }) => {
    const deleteTaskIndex = this.#routeStops.findIndex(task => task.taskID === taskID);

    if (deleteTaskIndex === -1) return;

    const [deletedTask] = this.#routeStops.splice(deleteTaskIndex, 1);

    return deletedTask;
  };

  reorderTasks = async () => {
    const orderedTasksIDs = Array.from(
      document.querySelector(`[id="${this.#routeID}"] .tasklist__tasks-list`).children,
      elem => elem.getAttribute('id')
    );

    const reorderedRouteStopsInfo = [];

    orderedTasksIDs.forEach((taskID, position) => {
      const routeStop = this.#routeStops.find(task => task.taskID === taskID);

      if (routeStop.routeStopPosition !== position) {
        routeStop.routeStopPosition = position;
        reorderedRouteStopsInfo.push({ routeStopID: taskID, position });
      }
    });

    if (reorderedRouteStopsInfo.length > 0) {
      try {
        await AppModel.updateRouteStops({ reorderedRouteStops: reorderedRouteStopsInfo });
      } catch (err) {
        console.error(err);
      }
    }
  };

  addNewStop = async ({ stopID }) => {
    try {
      const routeStopID = crypto.randomUUID();

      const addRouteStopResult = await AppModel.addRouteStop({
        routeStopID, 
        routeID: this.#routeID, 
        stopID, 
        position: this.#routeStops.length
      });

      const stops = await AppModel.getStops();
      this.addNewRouteStopLocal({ 
        stopID,
        stops,
        position: this.#routeStops.length
      });

      console.log(addRouteStopResult);
    } catch (err) {
      console.error(err);
    }
  };

  addNewRouteStopLocal = ({ routeStopID = null, stopID, stops, position }) => {
    const newTask = new RouteStop({
      routeStopID,
      text: stopID,
      stops,
      position,
      onDeleteTask: this.onDeleteTask
    });
    this.#routeStops.push(newTask);

    const newTaskElement = newTask.render();
    document.querySelector(`[id="${this.#routeID}"] .tasklist__tasks-list`)
      .appendChild(newTaskElement);
  }

  render() {
    const liElement = document.createElement('li');
    liElement.classList.add(
      'tasklists-list__item',
      'tasklist'
    );
    liElement.setAttribute('id', this.#routeID);
    liElement.addEventListener(
      'dragstart',
      () => localStorage.setItem('srcTasklistID', this.#routeID)
    );
    liElement.addEventListener('drop', this.onDropTaskInTasklist);

    const h2Element = document.createElement('h2');
    h2Element.classList.add('tasklist__name');
    h2Element.innerHTML = `Маршрут №${this.#routeNumber}`;
    h2Element.addEventListener('click', () => this.onEditRoute({ routeID: this.#routeID }));
    liElement.appendChild(h2Element);

    const innerUlElement = document.createElement('ul');
    innerUlElement.classList.add('tasklist__tasks-list');
    liElement.appendChild(innerUlElement);

    const addStopBtn = document.createElement('button');
    addStopBtn.setAttribute('type', 'button');
    addStopBtn.classList.add('tasklist__add-task-btn');
    addStopBtn.innerHTML = '&#10010; Добавить остановку';
    addStopBtn.addEventListener('click', () => {
      localStorage.setItem('selectStopRouteID', this.#routeID);
      document.getElementById('modal-select-stop').showModal();
    });
    liElement.appendChild(addStopBtn);

    const deleteRouteBtn = document.createElement('button');
    deleteRouteBtn.setAttribute('type', 'button');
    deleteRouteBtn.classList.add('tasklist__delete-route-btn');
    deleteRouteBtn.innerHTML = '&#10060; Удалить маршрут';
    deleteRouteBtn.addEventListener('click', () => this.onDeleteRoute({ routeID: this.#routeID }));
    liElement.appendChild(deleteRouteBtn);

    const adderElement = document.querySelector('.tasklist-adder');
    adderElement.parentElement.insertBefore(liElement, adderElement);
  }
};
