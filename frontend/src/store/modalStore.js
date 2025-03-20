/**
 * Modal Store using Zustand
 * 
 * Provides a global state management solution for modals
 * with better performance than using Context API
 */
import { create } from 'zustand';

const useModalStore = create((set) => ({
  // Track which modals are currently open
  openModals: {},
  
  // Modal data for each modal type
  modalData: {},
  
  /**
   * Open a modal with optional data
   * @param {string} modalId - Unique identifier for the modal 
   * @param {object} data - Optional data to pass to the modal
   */
  openModal: (modalId, data = {}) => {
    set((state) => ({
      openModals: {
        ...state.openModals,
        [modalId]: true
      },
      modalData: {
        ...state.modalData,
        [modalId]: data
      }
    }));
  },
  
  /**
   * Close a specific modal
   * @param {string} modalId - Unique identifier for the modal
   */
  closeModal: (modalId) => {
    set((state) => {
      const newOpenModals = { ...state.openModals };
      delete newOpenModals[modalId];
      
      return {
        openModals: newOpenModals
      };
    });
  },
  
  /**
   * Close all open modals
   */
  closeAllModals: () => {
    set({
      openModals: {}
    });
  },
  
  /**
   * Update data for a specific modal
   * @param {string} modalId - Unique identifier for the modal
   * @param {object} data - New data to merge with existing data
   */
  updateModalData: (modalId, data) => {
    set((state) => ({
      modalData: {
        ...state.modalData,
        [modalId]: {
          ...(state.modalData[modalId] || {}),
          ...data
        }
      }
    }));
  }
}));

export default useModalStore; 