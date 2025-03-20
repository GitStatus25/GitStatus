const Report = require('../../models/Report');
const ReportService = require('../../services/ReportService');
const { NotFoundError } = require('../../utils/errors');

/**
 * Get all reports for the current user
 */
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    // Generate download URLs for each report
    const reportsWithUrls = await Promise.all(
      reports.map(async (report) => {
        let downloadUrl = '';
        
        if (report.pdfUrl && report.pdfUrl !== 'pending' && report.pdfUrl !== 'failed') {
          try {
            downloadUrl = await ReportService.generateReportUrls(report);
          } catch (error) {
            console.error(`Error getting download URL for report ${report.id}:`, error);
          }
        }
        
        return ReportService.formatReportResponse(report, { downloadUrl });
      })
    );
    
    res.json(reportsWithUrls);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

/**
 * Get a specific report by ID
 */
exports.getReportById = async (req, res) => {
  try {
    const report = await ReportService.getReportById(req.params.id, req.user.id);
    
    // Update access stats
    await ReportService.updateReportAccessStats(report);
    
    // Generate pre-signed URLs for viewing and downloading
    const urls = await ReportService.generateReportUrls(report);
    
    // Return formatted report
    res.json(ReportService.formatReportResponse(report, urls));
  } catch (error) {
    console.error('Error fetching report:', error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
}; 