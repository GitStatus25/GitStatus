import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../contexts/ModalContext.js';
import CreateReportPageTemplate from './CreateReportPage.jsx';

/**
 * CreateReport page - Redirects to dashboard and opens the CreateReport modal
 */
const CreateReportPage = () => {
  const navigate = useNavigate();
  const { openCreateReportModal } = useModal();

  useEffect(() => {
    // Open the modal and redirect to dashboard
    openCreateReportModal();
    navigate('/dashboard');
  }, [navigate, openCreateReportModal]);

  // Show loading spinner while redirecting
  return <CreateReportPageTemplate />;
};

export default CreateReportPage;
