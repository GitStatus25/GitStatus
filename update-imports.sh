#!/bin/bash
# Script to update imports to the new component structure

# Update in JS files
find frontend/src -name "*.js" -not -path "*/node_modules/*" | xargs grep -l "from.*LayoutComponent" | xargs sed -i 's/from.*LayoutComponent/from ".\/components\/Layout"/g'
find frontend/src -name "*.js" -not -path "*/node_modules/*" | xargs grep -l "from.*components\/PrivateRouteComponent" | xargs sed -i 's/from.*components\/PrivateRouteComponent/from ".\/components\/PrivateRoute"/g'
find frontend/src -name "*.js" -not -path "*/node_modules/*" | xargs grep -l "from.*components\/AdminRouteComponent" | xargs sed -i 's/from.*components\/AdminRouteComponent/from ".\/components\/AdminRoute"/g'
find frontend/src -name "*.js" -not -path "*/node_modules/*" | xargs grep -l "from.*components\/AdminDashboardComponent" | xargs sed -i 's/from.*components\/AdminDashboardComponent/from ".\/components\/AdminDashboard"/g'
find frontend/src -name "*.js" -not -path "*/node_modules/*" | xargs grep -l "from.*components\/DiffViewerComponent" | xargs sed -i 's/from.*components\/DiffViewerComponent/from ".\/components\/DiffViewer"/g'

# Pages
find frontend/src -name "*.js" -not -path "*/node_modules/*" | xargs grep -l "from.*pages\/LoginPage" | xargs sed -i 's/from.*pages\/LoginPage/from ".\/pages\/Login"/g'
find frontend/src -name "*.js" -not -path "*/node_modules/*" | xargs grep -l "from.*pages\/NotFoundPage" | xargs sed -i 's/from.*pages\/NotFoundPage/from ".\/pages\/NotFound"/g'
find frontend/src -name "*.js" -not -path "*/node_modules/*" | xargs grep -l "from.*pages\/CreateReportPage" | xargs sed -i 's/from.*pages\/CreateReportPage/from ".\/pages\/CreateReport"/g'
find frontend/src -name "*.js" -not -path "*/node_modules/*" | xargs grep -l "from.*pages\/AnalyticsDashboardPage" | xargs sed -i 's/from.*pages\/AnalyticsDashboardPage/from ".\/pages\/AnalyticsDashboard"/g'
find frontend/src -name "*.js" -not -path "*/node_modules/*" | xargs grep -l "from.*pages\/AuthCallbackPage" | xargs sed -i 's/from.*pages\/AuthCallbackPage/from ".\/pages\/AuthCallback"/g'

# Modals
find frontend/src -name "*.js" -not -path "*/node_modules/*" | xargs grep -l "from.*modals\/CreateReportModalComponent" | xargs sed -i 's/from.*modals\/CreateReportModalComponent/from ".\/components\/modals\/CreateReportModal"/g'
find frontend/src -name "*.js" -not -path "*/node_modules/*" | xargs grep -l "from.*modals\/ViewCommitsModalComponent" | xargs sed -i 's/from.*modals\/ViewCommitsModalComponent/from ".\/components\/modals\/ViewCommitsModal"/g'

echo "Import paths updated" 