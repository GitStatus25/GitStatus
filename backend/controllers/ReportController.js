/**
 * Generate PDF for a report
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
exports.generatePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Call the service to start PDF generation
    const result = await reportService.generatePdfReport(id);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get PDF generation status
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
exports.getPdfStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { jobId } = req.query;
    
    // Call the service to get PDF status
    const result = await reportService.getPdfStatus(id, jobId);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
}; 