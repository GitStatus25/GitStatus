import useModalStore from '../../../store/modalStore';

const ViewCommitsModalComponent = () => {
  const { openModals, modalData, closeModal } = useModalStore();
  const isOpen = openModals['viewCommits'] || false;
  const data = modalData['viewCommits'] || {};
  
  const handleClose = () => closeModal('viewCommits');
  
  // ... existing code ...
}; 