# Database Indexes in GitStatus

## Overview

GitStatus uses MongoDB as its primary database and implements strategic indexes to optimize query performance. This document outlines the indexing strategy and provides guidance on adding new indexes.

## Indexes by Collection

### Report Collection

| Index | Fields | Description | Use Cases |
|-------|--------|-------------|-----------|
| `user_createdAt` | `{ user: 1, createdAt: -1 }` | Compound index on user ID (ascending) and creation date (descending) | - Retrieving a user's reports sorted by most recent<br>- Filtering reports by user with date sorting |
| `commitsHash` | `{ commitsHash: 1 }` | Single-field index on the hash of commit IDs | - Finding reports with identical sets of commits<br>- Preventing duplicate report generation |

### User Collection (Default)

| Index | Fields | Description |
|-------|--------|-------------|
| `_id` | `{ _id: 1 }` | Default primary key index |
| `email` | `{ email: 1 }` | Unique index on email field |
| `githubId` | `{ githubId: 1 }` | Unique index on GitHub ID |

## Performance Considerations

1. **Index Selection**: MongoDB selects the most efficient index for a given query. The query planner evaluates available indexes and execution plans to find the optimal approach.

2. **Covered Queries**: When possible, create indexes that cover the entire query (all fields in the query are part of an index), eliminating the need to fetch documents.

3. **Index Size**: Indexes consume memory and storage. Monitor index size using `db.collection.stats()` to ensure optimal resource usage.

4. **Write Performance**: While indexes speed up reads, they slightly impact write performance as each index must be updated when a document changes.

## Creating and Managing Indexes

### Adding Indexes to Models

Indexes are defined in the Mongoose schema for each model. For example:

```javascript
const ReportSchema = new mongoose.Schema({
  // Schema fields...
});

// Add indexes
ReportSchema.index({ user: 1, createdAt: -1 });
ReportSchema.index({ commitsHash: 1 });
```

### Applying Indexes

To apply indexes to existing data, run the index creation script:

```bash
node scripts/createIndexes.js
```

This script creates all indexes defined in the models and displays a list of current indexes on each collection.

### Monitoring Index Usage

To monitor whether indexes are being used effectively:

1. Enable MongoDB profiling with `db.setProfilingLevel(1, 100)` to log slow queries
2. Use `db.collection.explain()` to analyze query execution plans
3. Review query performance in MongoDB Atlas or other monitoring tools

## Best Practices

1. **Index for Query Patterns**: Create indexes based on common query patterns and access patterns
2. **Compound Indexes**: Use compound indexes for queries that filter on multiple fields
3. **Avoid Redundant Indexes**: Remove unused or redundant indexes
4. **Periodic Review**: Regularly review index usage and query performance

## Adding New Indexes

When adding new indexes, follow these steps:

1. Identify slow queries or frequently used access patterns
2. Profile the query to confirm the need for an index
3. Add the index to the appropriate model schema
4. Run the index creation script to apply the index
5. Verify improved query performance
6. Document the new index in this document