#!/bin/bash
# Script to update imports to the new component structure

# Enable extended globbing for more complex patterns
shopt -s extglob

# Components
find frontend/src -name "*.js" | xargs sed -i 's|from ".*components/Layout"|from "../../components/Layout"|g'
find frontend/src -name "*.js" | xargs sed -i 's|from ".*components/PrivateRoute"|from "../../components/PrivateRoute"|g'
find frontend/src -name "*.js" | xargs sed -i 's|from ".*components/AdminRoute"|from "../../components/AdminRoute"|g'
find frontend/src -name "*.js" | xargs sed -i 's|from ".*components/AdminDashboard"|from "../../components/AdminDashboard"|g'
find frontend/src -name "*.js" | xargs sed -i 's|from ".*components/DiffViewer"|from "../../components/DiffViewer"|g'

# Pages
find frontend/src -name "*.js" | xargs sed -i 's|from ".*pages/Login"|from "../../pages/Login"|g'
find frontend/src -name "*.js" | xargs sed -i 's|from ".*pages/NotFound"|from "../../pages/NotFound"|g'
find frontend/src -name "*.js" | xargs sed -i 's|from ".*pages/CreateReport"|from "../../pages/CreateReport"|g'
find frontend/src -name "*.js" | xargs sed -i 's|from ".*pages/AnalyticsDashboard"|from "../../pages/AnalyticsDashboard"|g'
find frontend/src -name "*.js" | xargs sed -i 's|from ".*pages/AuthCallback"|from "../../pages/AuthCallback"|g'
find frontend/src -name "*.js" | xargs sed -i 's|from ".*pages/Dashboard"|from "../../pages/Dashboard"|g'
find frontend/src -name "*.js" | xargs sed -i 's|from ".*pages/ViewReport"|from "../../pages/ViewReport"|g'

# Modals
find frontend/src -name "*.js" | xargs sed -i 's|from ".*modals/CreateReportModal"|from "../../components/modals/CreateReportModal"|g'
find frontend/src -name "*.js" | xargs sed -i 's|from ".*modals/ViewCommitsModal"|from "../../components/modals/ViewCommitsModal"|g'

# Fix App.js imports specifically (they need different relative paths)
sed -i 's|from "../../components/|from "./components/|g' frontend/src/App.js
sed -i 's|from "../../pages/|from "./pages/|g' frontend/src/App.js

echo "Import paths updated successfully" 