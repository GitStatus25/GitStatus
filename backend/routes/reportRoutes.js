// PDF generation
router.post('/:id/generate-pdf', authMiddleware.authenticate, reportController.generatePdf);
router.get('/:id/pdf-status', authMiddleware.authenticate, reportController.getPdfStatus); 