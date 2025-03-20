import useModalStore from '../../../store/modalStore';

const CreateReportModalComponent = () => {
  const { openModals, modalData, closeModal } = useModalStore();
  const isOpen = openModals['createReport'] || false;
  const data = modalData['createReport'] || {};
  
  const handleClose = () => closeModal('createReport');
}; 