const Report = require('../../models/Report');
const s3Service = require('../../services/s3');
const reportService = require('../../services/reportService');
const { NotFoundError } = require('../../utils/errors');

/**
 * Delete a report
 */
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmationName } = req.body;
    
    // Find the report
    const report = await reportService.getReportById(id, req.user.id);
    
    // Verify confirmation name matches
    if (!confirmationName || confirmationName !== report.name) {
      return res.status(400).json({ 
        error: 'Confirmation name does not match report name',
        reportName: report.name 
      });
    }
    
    // Delete PDF from S3 if it exists
    if (report.pdfUrl && report.pdfUrl !== 'pending') {
      try {
        await s3Service.deleteObject(report.pdfUrl);
        console.log(`Deleted PDF from S3: ${report.pdfUrl}`);
      } catch (s3Error) {
        console.error(`Error deleting PDF from S3: ${report.pdfUrl}`, s3Error);
        // Continue with report deletion even if S3 deletion fails
      }
    }
    
    // Delete report from database
    await Report.findByIdAndDelete(id);
    
    res.json({ 
      message: 'Report deleted successfully',
      reportId: id,
      reportName: report.name
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.status(500).json({ error: 'Failed to delete report' });
  }
};

/**
 * Clean up invalid reports that reference missing S3 files
 */
exports.cleanupInvalidReports = async (req, res) => {
  try {
    // Get all reports for the current user
    const reports = await Report.find({ user: req.user.id });
    
    if (!reports || reports.length === 0) {
      return res.json({ message: 'No reports found to clean up', cleaned: 0 });
    }
    
    // Track cleanup statistics
    const stats = {
      checked: 0,
      pending: 0,
      invalid: 0,
      valid: 0,
      deleted: 0,
      errors: 0
    };
    
    // Check each report
    for (const report of reports) {
      stats.checked++;
      
      try {
        if (report.pdfUrl === 'pending') {
          // Report with pending status that was never completed
          stats.pending++;
          await Report.findByIdAndDelete(report.id);
          stats.deleted++;
          console.log(`Deleted pending report ${report.id}`);
        } else {
          // Check if PDF file exists in S3
          const exists = await s3Service.objectExists(report.pdfUrl);
          
          if (!exists) {
            stats.invalid++;
            await Report.findByIdAndDelete(report.id);
            stats.deleted++;
            console.log(`Deleted report ${report.id} with missing S3 file: ${report.pdfUrl}`);
          } else {
            stats.valid++;
          }
        }
      } catch (error) {
        console.error(`Error checking report ${report.id}:`, error);
        stats.errors++;
      }
    }
    
    res.json({
      message: 'Cleanup completed successfully',
      stats
    });
  } catch (error) {
    console.error('Error cleaning up reports:', error);
    res.status(500).json({ error: `Failed to clean up reports: ${error.message}` });
  }
}; 