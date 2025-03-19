const Report = require('../../models/Report');
const s3Service = require('../../services/s3');

/**
 * Get report cache statistics
 */
exports.getCacheStats = async (req, res) => {
  try {
    // Get stats for all reports
    const allReportsCount = await Report.countDocuments({});
    
    // Get total cached accesses (sum of all access counts minus the count of reports)
    const reports = await Report.find({}, 'accessCount');
    const totalAccesses = reports.reduce((sum, report) => sum + (report.accessCount || 1), 0);
    const cachedAccesses = totalAccesses - allReportsCount;
    
    // Calculate cache hit rate
    const cacheHitRate = totalAccesses > 0 ? (cachedAccesses / totalAccesses) * 100 : 0;
    
    // Get most accessed reports
    const popularReports = await Report.find({})
      .sort({ accessCount: -1 })
      .limit(5)
      .select('name repository accessCount lastAccessed');
    
    // Get most recently accessed reports
    const recentlyAccessedReports = await Report.find({})
      .sort({ lastAccessed: -1 })
      .limit(5)
      .select('name repository accessCount lastAccessed');
    
    res.json({
      totalReports: allReportsCount,
      totalAccesses,
      cachedAccesses,
      cacheHitRate: cacheHitRate.toFixed(2) + '%',
      popularReports,
      recentlyAccessedReports
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({ error: 'Failed to fetch cache statistics' });
  }
};

/**
 * Cleanup old/unused reports from cache
 */
exports.cleanupReportsCache = async (req, res) => {
  try {
    const { olderThan = 90, accessCountLessThan = 2 } = req.query;
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));
    
    // Find reports that meet the criteria
    const reports = await Report.find({
      lastAccessed: { $lt: cutoffDate },
      accessCount: { $lt: parseInt(accessCountLessThan) }
    });
    
    // Delete reports and their S3 objects
    let deletedCount = 0;
    let s3DeletedCount = 0;
    
    for (const report of reports) {
      try {
        // Delete from S3 if it's not 'pending'
        if (report.pdfUrl && report.pdfUrl !== 'pending') {
          await s3Service.deleteObject(report.pdfUrl);
          s3DeletedCount++;
        }
        
        // Delete the report
        await Report.findByIdAndDelete(report.id);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting report ${report.id}:`, error);
      }
    }
    
    res.json({
      message: `Deleted ${deletedCount} reports and ${s3DeletedCount} S3 objects`,
      deletedCount,
      s3DeletedCount
    });
  } catch (error) {
    console.error('Error cleaning up reports cache:', error);
    res.status(500).json({ error: 'Failed to clean up reports cache' });
  }
}; 