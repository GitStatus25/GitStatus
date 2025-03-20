import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useModalStore from '../../store/modalStore';
import CreateReportComponentTemplate from './CreateReportComponent.jsx';

/**
 * CreateReport page - Redirects to dashboard and opens the CreateReport modal
 */
const CreateReportComponent = () => {
  const navigate = useNavigate();
  const { openModal } = useModalStore();

  useEffect(() => {
    // Open the modal and redirect to dashboard
    openModal('createReport');
    navigate('/dashboard');
  }, [navigate, openModal]);

  // Show loading spinner while redirecting
  return <CreateReportComponentTemplate />;
};

export default CreateReportComponent;
