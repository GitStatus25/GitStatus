import React, { createContext, useState, useContext } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    createReportOpen: false,
    viewCommitsOpen: false,
    reportData: null, // Stores the form data between modals
    commits: [], // Stores commits data
    selectedCommits: [] // Stores selected commits
  });

  const openCreateReportModal = (initialData = null) => {
    console.log('Opening CreateReport modal');
    setModalState(prev => ({
      ...prev,
      createReportOpen: true,
      viewCommitsOpen: false,
      reportData: initialData || prev.reportData
    }));
  };

  const openViewCommitsModal = (reportData = null, commits = [], selectedCommits = []) => {
    console.log('Opening ViewCommits modal with', commits.length, 'commits');
    setModalState(prev => ({
      ...prev,
      createReportOpen: false,
      viewCommitsOpen: true,
      reportData: reportData || prev.reportData,
      commits: commits.length ? commits : prev.commits,
      selectedCommits: selectedCommits.length ? selectedCommits : prev.selectedCommits
    }));
  };

  const closeModals = () => {
    console.log('Closing all modals');
    setModalState(prev => ({
      ...prev,
      createReportOpen: false,
      viewCommitsOpen: false
    }));
  };

  const updateReportData = (data) => {
    setModalState(prev => ({
      ...prev,
      reportData: { ...prev.reportData, ...data }
    }));
  };

  const updateCommits = (commits, selectedCommits = null) => {
    setModalState(prev => ({
      ...prev,
      commits,
      selectedCommits: selectedCommits !== null ? selectedCommits : prev.selectedCommits
    }));
  };

  const updateSelectedCommits = (selectedCommits) => {
    setModalState(prev => ({
      ...prev,
      selectedCommits
    }));
  };

  return (
    <ModalContext.Provider
      value={{
        modalState,
        openCreateReportModal,
        openViewCommitsModal,
        closeModals,
        updateReportData,
        updateCommits,
        updateSelectedCommits
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}; 