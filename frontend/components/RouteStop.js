export default class RouteStop {
  #routeStopID = '';
  #routeID = '';
  #stopName = '';
  #routeStopPosition = -1;

  constructor({
    routeStopID = null,
    text,
    stops,
    position,
    onDeleteTask
  }) {
    this.#routeStopID = routeStopID || crypto.randomUUID();
    this.#routeID = text;
    this.#stopName = stops[this.#routeID].name;
    this.#routeStopPosition = position;
    this.onDeleteTask = onDeleteTask;
  }

  get taskID() { return this.#routeStopID; }

  get taskText() { return this.#routeID; }
  set taskText(value) {
    if (typeof value === 'string') {
      this.#routeID = value;
    }
  }

  get stopName() { return this.#stopName; }
  set stopName(value) {
    if (typeof value === 'string') {
      this.#stopName = value;
    }
  }

  get routeStopPosition() { return this.#routeStopPosition; }
  set routeStopPosition(value) {
    if (typeof value === 'number' && value >= 0) {
      this.#routeStopPosition = value;
    }
  }

  render() {
    const liElement = document.createElement('li');
    liElement.classList.add('tasklist__tasks-list-item', 'task');
    liElement.setAttribute('id', this.#routeStopID);
    liElement.setAttribute('draggable', true);
    liElement.addEventListener('dragstart', (evt) => {
      evt.target.classList.add('task_selected');
      localStorage.setItem('movedTaskID', this.#routeStopID);
    });
    liElement.addEventListener('dragend', (evt) => evt.target.classList.remove('task_selected'));

    const span = document.createElement('span');
    span.classList.add('task__text');
    span.innerHTML = `Ост. ${this.#stopName}`;
    liElement.appendChild(span);

    const controlsDiv = document.createElement('div');
    controlsDiv.classList.add('task__controls');

    const lowerRowDiv = document.createElement('div');
    lowerRowDiv.classList.add('task__controls-row');

    const editBtn = document.createElement('button');
    editBtn.setAttribute('type', 'button');
    editBtn.classList.add('task__contol-btn', 'edit-icon');
    editBtn.addEventListener('click', () => {
      localStorage.setItem('selectOtherStopRouteStopID', this.#routeStopID);
      document.getElementById('modal-select-other-stop').showModal();
    });
    lowerRowDiv.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.setAttribute('type', 'button');
    deleteBtn.classList.add('task__contol-btn', 'delete-icon');
    deleteBtn.addEventListener('click', () => this.onDeleteTask({ taskID: this.#routeStopID }));
    lowerRowDiv.appendChild(deleteBtn);

    controlsDiv.appendChild(lowerRowDiv);

    liElement.appendChild(controlsDiv);

    return liElement;
  }
};
