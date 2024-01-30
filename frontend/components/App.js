import Route from './Route.js';
import AppModel from '../model/AppModel.js';

export default class App {
  #routes = [];

  checkRouteStops = (route, stops) => {
    const orderedRouteStops = route.routeStops;
    orderedRouteStops.sort((stop1, stop2) => (stop1.routeStopPosition - stop2.routeStopPosition));

    function findNextStopIndex(fromIndex) {
      for (let i = fromIndex + 1; i < orderedRouteStops.length; i++) {
        if (orderedRouteStops[fromIndex].stopID === orderedRouteStops[i].stopID) {
          return i;
        }
      }
      return -1;
    }
    
    for (let i = 0; i < orderedRouteStops.length - 1; i++) {
      const currStopID = orderedRouteStops[i].stopID;
      const nextStopID = orderedRouteStops[i + 1].stopID;
      if (stops[currStopID].connected_with.findIndex(stopID => stopID === nextStopID) === -1) {
        return false;
      }

      const nextStopIndex = findNextStopIndex(i);
      if (i === 0 && ((nextStopIndex !== -1) && (nextStopIndex !== orderedRouteStops.length - 1))) {
        return false;
      }
      else if (i !== 0 && nextStopIndex !== -1) {
        return false;
      }
    }

    return true;
  }

  checkRoutes = async () => {
    const wrongRoutes = [];
    const [routes, stops] = await Promise.all([AppModel.getRoutes(), AppModel.getStops()]);
    for (const route of routes) {
      if (!this.checkRouteStops(route, stops)) {
        wrongRoutes.push(route.routeNumber);
      }
    }

    return wrongRoutes;
  }

  onEscapeKeydown = (event) => {
    if (event.key === 'Escape') {
      const input = document.querySelector('.tasklist-adder__input');
      input.style.display = 'none';
      input.value = '';

      document.querySelector('.tasklist-adder__btn')
        .style.display = 'inherit';
    }
  };

  onInputKeydown = async (event) => {
    if (event.key !== 'Enter') return;
    const value = Number(event.target.value);
    if (!Number.isInteger(value) || value <= 1) {
      alert('Номера маршрутов задаются положительными целочисленными цифрами');
      return;
    }

    if (event.target.value) {
      const routeID = crypto.randomUUID();

      let position = 0;
      if (this.#routes.length > 0)
      {
        position = this.#routes[this.#routes.length - 1].routePosition + 1;
      } 

      try {
        const addRouteResult = await AppModel.addRoute({
          routeID, 
          number: value, 
          position
        });

        const newRoute = new Route({
          routeID,
          name: event.target.value,
          position,
          onDropTaskInTasklist: this.onDropTaskInTasklist,
          onDeleteTask: this.onDeleteTask,
          onDeleteRoute: this.onDeleteRoute,
          onEditRoute: this.onEditRoute
        });

        this.#routes.push(newRoute);
        newRoute.render();

        console.log(addRouteResult);
      } catch (err) {
        console.error(err);
      }
    }

    event.target.style.display = 'none';
    event.target.value = '';

    document.querySelector('.tasklist-adder__btn')
      .style.display = 'inherit';
  };

  onDropTaskInTasklist = async (evt) => {
    evt.stopPropagation();

    const destTasklistElement = evt.currentTarget;
    destTasklistElement.classList.remove('tasklist_droppable');

    const movedTaskID = localStorage.getItem('movedTaskID');
    const srcTasklistID = localStorage.getItem('srcTasklistID');
    const destTasklistID = destTasklistElement.getAttribute('id');

    localStorage.setItem('movedTaskID', '');
    localStorage.setItem('srcTasklistID', '');

    if (!destTasklistElement.querySelector(`[id="${movedTaskID}"]`)) return;

    const srcTasklist = this.#routes.find(tasklist => tasklist.tasklistID === srcTasklistID);
    const destTasklist = this.#routes.find(tasklist => tasklist.tasklistID === destTasklistID);

    try {
      await AppModel.moveRouteStop({ routeStopID: movedTaskID, routeID: destTasklistID });

      if (srcTasklistID !== destTasklistID) {
        const movedTask = srcTasklist.deleteTask({ taskID: movedTaskID });
        destTasklist.addTask({ task: movedTask });
  
        await srcTasklist.reorderTasks();

        console.log(`Остановка маршрута с id ${movedTaskID} перемещена`);
      }
  
      await destTasklist.reorderTasks();

      const wrongRoutes = await this.checkRoutes();
        if (wrongRoutes.length > 0) {
          alert(`Некорректные маршруты ${wrongRoutes}`);
        }
    } catch (err) {
      console.error(err);
    }
  };

  onEditRoute = async ({ routeID }) => {
    let fRoute = this.#routes.find((route => route.tasklistID == routeID));

    const routeNumberInput = prompt('Введите новый номер маршрута', fRoute.routeNumber);
    if (!routeNumberInput) return;
    const newRouteNumber = Number(routeNumberInput);
    if (!Number.isInteger(newRouteNumber) || newRouteNumber <= 0) {
      alert('Номера маршрутов задаются положительными целочисленными цифрами');
      return;
    }
    if (newRouteNumber === fRoute.routeNumber) return;

    try {
      const editRouteResult = await AppModel.updateRoute({ routeID, number: newRouteNumber });

      const editRouteIndex = this.#routes.findIndex(route => route.tasklistID === routeID);
      if (editRouteIndex === -1) return;
      this.#routes.splice(editRouteIndex, 1);

      document.getElementById(routeID).querySelector('.tasklist__name').innerText = `Маршрут №${newRouteNumber}`;

      console.log(editRouteResult);
    } catch (err) {
      console.error(err);
    }
  }

  editTask = async ({ taskID, newStopID }) => {
    let fTask = null;
    for (let tasklist of this.#routes) {
      fTask = tasklist.getTaskById({ taskID });
      if (fTask) break;
    }

    const curStopID = fTask.taskText;

    if (!newStopID || newStopID === curStopID) return;

    try {
      const updateRouteStopResult = AppModel.updateRouteStop({
        routeStopID: taskID, 
        stopID: newStopID, 
      });

      const stops = await AppModel.getStops();
      const stopName = stops[newStopID].name;

      fTask.taskText = newStopID;
      fTask.stopName = stopName;

      document.querySelector(`[id="${taskID}"] span.task__text`).innerHTML = `Ост. ${stopName}`;

      console.log(updateRouteStopResult);

      const wrongRoutes = await this.checkRoutes();
        if (wrongRoutes.length > 0) {
          alert(`Некорректные маршруты ${wrongRoutes}`);
        }
    } catch (err) {
      console.log(err);
    }
  };

  onDeleteRoute = async ({ routeID }) => {
    let fRoute = this.#routes.find((route => route.tasklistID == routeID));

    const routeShouldBeDeleted = confirm(`Маршрут будет удален. Прододлжить?`);

    if (!routeShouldBeDeleted) return;

    try {
      const deleteRouteStopResult = await AppModel.deleteRoute({ routeID });

      const deleteRouteIndex = this.#routes.findIndex(route => route.tasklistID === routeID);
      if (deleteRouteIndex === -1) return;
      this.#routes.splice(deleteRouteIndex, 1);

      document.getElementById(routeID).remove();

      console.log(deleteRouteStopResult);
    } catch (err) {
      console.error(err);
    }
  };

  onDeleteTask = async ({ taskID }) => {
    let fTask = null;
    let fTasklist = null;
    for (let tasklist of this.#routes) {
      fTasklist = tasklist;
      fTask = tasklist.getTaskById({ taskID });
      if (fTask) break;
    }

    const routeStopShouldBeDeleted = confirm(`Остановка будет удалена из маршрута. Прододлжить?`);

    if (!routeStopShouldBeDeleted) return;

    try {
      const deleteRouteStopResult = await AppModel.deleteRouteStop({ routeStopID: taskID });

      fTasklist.deleteTask({ taskID });
      document.getElementById(taskID).remove();

      console.log(deleteRouteStopResult);

      const wrongRoutes = await this.checkRoutes();
        if (wrongRoutes.length > 0) {
          alert(`Некорректные маршруты ${wrongRoutes}`);
        }
    } catch (err) {
      console.error(err);
    }
  };

  initSelectStopModal(stops) {
    const selectStopModal = document.querySelector('#modal-select-stop');

    const selectElement = selectStopModal.querySelector('.app-modal__select');
    for (const stopID in stops) {
      const optionElement = document.createElement('option');

      optionElement.setAttribute('value', stopID);
      optionElement.classList.add('select-option');
      optionElement.innerText = stops[stopID].name;

      selectElement.appendChild(optionElement);
    }

    const cancelHandler = () => {
      selectStopModal.close();
      localStorage.setItem('selectStopRouteID', '');
    }

    const okHandler = async () => {
      const routeID = localStorage.getItem('selectStopRouteID');
      
       if (routeID) {
        this.#routes.find(route => route.tasklistID === routeID)
          .addNewStop({ stopID: selectElement.value });
       }

       cancelHandler();

       const wrongRoutes = await this.checkRoutes();
        if (wrongRoutes.length > 0) {
          alert(`Некорректные маршруты ${wrongRoutes}`);
        }
    }

    selectStopModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
    selectStopModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
    selectStopModal.addEventListener('close', cancelHandler);
  }

  initSelectOtherStopModal(stops) {
    const selectOtherStopModal = document.querySelector('#modal-select-other-stop');

    const selectElement = selectOtherStopModal.querySelector('.app-modal__select');
    for (const stopID in stops) {
      const optionElement = document.createElement('option');

      optionElement.setAttribute('value', stopID);
      optionElement.classList.add('select-option');
      optionElement.innerText = stops[stopID].name;

      selectElement.appendChild(optionElement);
    }

    const cancelHandler = () => {
      selectOtherStopModal.close();
      localStorage.setItem('selectOtherStopRouteStopID', '');
    }

    const okHandler = () => {
      const routeStopID = localStorage.getItem('selectOtherStopRouteStopID');
      
       if (routeStopID) {
        this.editTask({ taskID: routeStopID, newStopID: selectElement.value });
       }

       cancelHandler();
    }

    selectOtherStopModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
    selectOtherStopModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
    selectOtherStopModal.addEventListener('close', cancelHandler);
  }

  async init() {
    document.querySelector('.tasklist-adder__btn')
      .addEventListener(
        'click',
        (event) => {
          event.target.style.display = 'none';

          const input = document.querySelector('.tasklist-adder__input');
          input.style.display = 'inherit';
          input.focus();
        }
      );

    document.addEventListener('keydown', this.onEscapeKeydown);

    document.querySelector('.tasklist-adder__input')
      .addEventListener('keydown', this.onInputKeydown);

    document.getElementById('theme-switch')
      .addEventListener('change', (evt) => {
        (evt.target.checked
          ? document.body.classList.add('dark-theme')
          : document.body.classList.remove('dark-theme'));
      });

    document.addEventListener('dragover', (evt) => {
      evt.preventDefault();

      const draggedElement = document.querySelector('.task.task_selected');
      const draggedElementPrevList = draggedElement.closest('.tasklist');

      const currentElement = evt.target;
      const prevDroppable = document.querySelector('.tasklist_droppable');
      let curDroppable = evt.target;
      while (!curDroppable.matches('.tasklist') && curDroppable !== document.body) {
        curDroppable = curDroppable.parentElement;
      }

      if (curDroppable !== prevDroppable) {
        if (prevDroppable) prevDroppable.classList.remove('tasklist_droppable');

        if (curDroppable.matches('.tasklist')) {
          curDroppable.classList.add('tasklist_droppable');
        }
      }

      if (!curDroppable.matches('.tasklist') || draggedElement === currentElement) return;

      if (curDroppable === draggedElementPrevList) {
        if (!currentElement.matches('.task')) return;

        const nextElement = (currentElement === draggedElement.nextElementSibling)
          ? currentElement.nextElementSibling
          : currentElement;

        curDroppable.querySelector('.tasklist__tasks-list')
          .insertBefore(draggedElement, nextElement);

        return;
      }

      if (currentElement.matches('.task')) {
        curDroppable.querySelector('.tasklist__tasks-list')
          .insertBefore(draggedElement, currentElement);

        return;
      }

      if (!curDroppable.querySelector('.tasklist__tasks-list').children.length) {
        curDroppable.querySelector('.tasklist__tasks-list')
          .appendChild(draggedElement);
      }
    });

    try {
      const routes = await AppModel.getRoutes();
      const stops = await AppModel.getStops();
      this.initSelectStopModal(stops);
      this.initSelectOtherStopModal(stops);
      //console.log(stops);
      for (const route of routes)
      {
        console.log(route);
        console.log(this.checkRouteStops(route, stops));
        this.checkRouteStops(route, stops);
        const routeObj = new Route({
          routeID: route.routeID,
          name: route.routeNumber,
          position: route.routePosition,
          onDropTaskInTasklist: this.onDropTaskInTasklist,
          onDeleteTask: this.onDeleteTask,
          onDeleteRoute: this.onDeleteRoute,
          onEditRoute: this.onEditRoute
        });

        this.#routes.push(routeObj);
        routeObj.render();

        for (const routeStop of route.routeStops) {
          routeObj.addNewRouteStopLocal({
            routeStopID: routeStop.routeStopID, 
            stopID: routeStop.stopID, 
            stops,
            position: routeStop.routeStopPosition
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
};
