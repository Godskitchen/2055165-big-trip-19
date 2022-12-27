import { render } from '../framework/render.js';
import { updateItem } from '../utils/common.js';
import { SortTypes, DEFAULT_SORT_TYPE } from '../constants.js';
import { sortByDay, sortByPrice, sortByTime } from '../utils/point-event-utils.js';
import SortView from '../view/sort-view.js';
import EventsListView from '../view/events-list-view.js';
import EmptyListView from '../view/empty-list-view.js';
import EventPointPresenter from './event-point-presenter.js';

export default class ListBoardPresenter {
  //section class='trip-events'
  #listBoardContainer = null;
  #pointsModel = null;

  #currentSortType = DEFAULT_SORT_TYPE;

  #eventPoints = [];
  #destinations = [];
  #offers = [];

  #originalEventPoints = [];

  #sortComponent = null;
  #emptyListComponent = new EmptyListView();
  //'<ul class="trip-events__list"></ul>'
  #eventsListComponent = new EventsListView();

  #eventPointPresenters = new Map();


  constructor(listBoardContainer, pointsModel) {
    this.#listBoardContainer = listBoardContainer;
    this.#pointsModel = pointsModel;
  }

  init() {
    this.#originalEventPoints = [...this.#pointsModel.eventPoints];

    this.#eventPoints = [...this.#pointsModel.eventPoints];
    this.#destinations = [...this.#pointsModel.destinations];
    this.#offers = [...this.#pointsModel.offers];

    if (this.#eventPoints.length === 0) {
      this.#renderEmptyList();
      return;
    }

    this.#renderSort();
    this.#sortEventPoints(this.#currentSortType);
    this.#renderEventsList();
  }


  #renderSort() {
    this.#sortComponent = new SortView(this.#handleSortTypeChange, this.#currentSortType);
    render(this.#sortComponent, this.#listBoardContainer);
  }

  #renderEventsList() {
    render(this.#eventsListComponent, this.#listBoardContainer);

    this.#eventPoints.forEach((eventPoint) => {
      const destination = this.#destinations.find((value) => value.id === eventPoint.destination);
      const typeOffers = this.#offers.find((offers) => offers.type === eventPoint.type);

      this.#renderEventPoint(eventPoint, destination, typeOffers);
    });
  }

  #renderEventPoint(eventPoint, destination, typeOffers) {
    const eventPointPresenter = new EventPointPresenter(this.#eventsListComponent.element, this.#handleDataChange, this.#handleViewModeChange);
    this.#eventPointPresenters.set(eventPoint.id, eventPointPresenter);

    eventPointPresenter.init(eventPoint, destination, typeOffers);
  }

  #renderEmptyList() {
    render(this.#emptyListComponent, this.#listBoardContainer);
  }

  #clearEventsList() {
    this.#eventPointPresenters.forEach((presenter) => presenter.destroyPointComponents());
    this.#eventPointPresenters.clear();
  }

  #sortEventPoints(sortType) {
    switch(sortType) {
      case SortTypes.DAY:
        this.#eventPoints.sort(sortByDay);
        break;
      case SortTypes.PRICE:
        this.#eventPoints.sort(sortByPrice);
        break;
      case SortTypes.TIME:
        this.#eventPoints.sort(sortByTime);
        break;
      default:
        this.#eventPoints = [...this.#originalEventPoints];
    }
  }

  #handleViewModeChange = () => this.#eventPointPresenters.forEach((presenter) => presenter.resetView());

  #handleDataChange = (updatedEventPoint) => {
    this.#eventPoints = updateItem(this.#eventPoints, updatedEventPoint);
    this.#originalEventPoints = updateItem(this.#originalEventPoints, updatedEventPoint);

    const destination = this.#destinations.find((value) => value.id === updatedEventPoint.destination);
    const typeOffers = this.#offers.find((offers) => offers.type === updatedEventPoint.type);

    this.#eventPointPresenters.get(updatedEventPoint.id).init(updatedEventPoint, destination, typeOffers);
  };

  #handleSortTypeChange = (sortType) => {
    this.#sortEventPoints(sortType);
    this.#clearEventsList();
    this.#renderEventsList();
  };
}
