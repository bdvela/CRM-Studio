import type { DataState, DataAction, UiState, UiAction } from './types';

export function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'LOAD_START': return { ...state, loading: true };
    case 'LOAD_COMPLETE': return { ...state, loading: false, appointments: action.appointments, staff: action.staff, services: action.services, clients: action.clients };
    case 'SET_APPOINTMENTS': return { ...state, loading: false, appointments: action.appointments };
    case 'SET_SUBMITTING': return { ...state, submitting: action.submitting };
    default: return state;
  }
}

export const initialUiState: UiState = {
  viewMode: 'list',
  listFilter: 'list',
  listFilterArtist: '',
  listFilterStatus: '',
  showModal: false,
  showDetail: false,
  showServiceConfig: false,
  showServiceSelector: false,
  overlapWarning: null,
  pendingDate: null,
  advancePaid: true,
};

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'SET_VIEW_MODE': return { ...state, viewMode: action.viewMode };
    case 'SET_LIST_FILTER': return { ...state, listFilter: action.listFilter };
    case 'SET_LIST_FILTER_ARTIST': return { ...state, listFilterArtist: action.listFilterArtist };
    case 'SET_LIST_FILTER_STATUS': return { ...state, listFilterStatus: action.listFilterStatus };
    case 'SET_SHOW_MODAL': return { ...state, showModal: action.showModal };
    case 'SET_SHOW_DETAIL': return { ...state, showDetail: action.showDetail };
    case 'SET_SHOW_SERVICE_CONFIG': return { ...state, showServiceConfig: action.showServiceConfig };
    case 'SET_SHOW_SERVICE_SELECTOR': return { ...state, showServiceSelector: action.showServiceSelector };
    case 'SET_OVERLAP_WARNING': return { ...state, overlapWarning: action.overlapWarning };
    case 'SET_PENDING_DATE': return { ...state, pendingDate: action.pendingDate };
    case 'SET_ADVANCE_PAID': return { ...state, advancePaid: action.advancePaid };
    case 'CLEAR_LIST_FILTERS': return { ...state, listFilterArtist: '', listFilterStatus: '' };
    default: return state;
  }
}
