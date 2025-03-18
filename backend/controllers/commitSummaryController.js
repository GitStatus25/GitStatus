const CommitSummary = require('../models/CommitSummary');

/**
 * Get all commit summaries, with optional filtering
 */
exports.getSummaries = async (req, res) => {
  try {
    const { repository, limit = 100, offset = 0 } = req.query;
    
    // Build the query
    const query = {};
    if (repository) {
      query.repository = repository;
    }
    
    // Get total count first (for pagination info)
    const totalCount = await CommitSummary.countDocuments(query);
    
    // Get the summaries
    const summaries = await CommitSummary.find(query)
      .sort({ lastAccessed: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    res.json({
      total: totalCount,
      offset: parseInt(offset),
      limit: parseInt(limit),
      summaries
    });
  } catch (error) {
    console.error('Error fetching commit summaries:', error);
    res.status(500).json({ error: 'Failed to fetch commit summaries' });
  }
};

/**
 * Get a commit summary by repository and commitId
 */
exports.getSummaryByCommitId = async (req, res) => {
  try {
    const { repository, commitId } = req.params;
    
    // Find the summary
    const summary = await CommitSummary.findOne({
      repository,
      commitId
    });
    
    if (!summary) {
      return res.status(404).json({ error: 'Commit summary not found' });
    }
    
    // Update last accessed timestamp
    summary.lastAccessed = new Date();
    await summary.save();
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching commit summary:', error);
    res.status(500).json({ error: 'Failed to fetch commit summary' });
  }
};

/**
 * Get commit details by commitIds
 */
exports.getCommitDetails = async (req, res) => {
  try {
    const { repository, commitIds } = req.body;
    
    if (!repository || !commitIds || !Array.isArray(commitIds) || commitIds.length === 0) {
      return res.status(400).json({ error: 'Repository and array of commitIds are required' });
    }
    
    console.log(`Fetching details for ${commitIds.length} commits in ${repository}`);
    
    // Find all summaries that match the repository and commitIds
    const summaries = await CommitSummary.find({
      repository,
      commitId: { $in: commitIds }
    });
    
    console.log(`Found ${summaries.length} matching commit summaries in database`);
    
    // Map the results to include only necessary fields
    const commitDetails = summaries.map(summary => {
      // Handle different author formats
      let author;
      
      console.log('Processing commit:', summary.commitId);
      console.log('Author data in DB:', JSON.stringify(summary.author));
      console.log('Author name in DB:', summary.authorName);
      
      if (summary.author) {
        if (typeof summary.author === 'object') {
          author = summary.author;
          console.log('Using author object:', JSON.stringify(author));
        } else if (typeof summary.author === 'string') {
          author = { name: summary.author };
          console.log('Converting author string to object:', JSON.stringify(author));
        }
      } else if (summary.authorName) {
        author = { name: summary.authorName, email: summary.authorEmail };
        console.log('Using authorName/Email fields:', JSON.stringify(author));
      } else {
        author = { name: 'Unknown' };
        console.log('No author information found, using Unknown');
      }
      
      return {
        id: summary.commitId,
        summary: summary.summary,
        author: author,
        date: summary.date || summary.timestamp,
        message: summary.message
      };
    });
    
    console.log('Commit details response:', commitDetails);
    
    res.json({
      commits: commitDetails
    });
  } catch (error) {
    console.error('Error fetching commit details:', error);
    res.status(500).json({ error: 'Failed to fetch commit details' });
  }
};


