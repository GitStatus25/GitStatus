#!/bin/bash
# Script to set up component folder structure across the codebase

# Function to create the folder structure for a component or page
setup_component() {
  TYPE=$1  # "pages" or "components"
  NAME=$2  # Component name
  ORIGINAL=$3  # Original file name without extension
  
  # Create component directory if it doesn't exist
  mkdir -p "frontend/src/$TYPE/$NAME"
  
  # Determine suffix based on type
  if [ "$TYPE" = "pages" ]; then
    SUFFIX="Page"
  else
    SUFFIX="Component"
  fi
  
  # Create index.js file
  echo "export { default } from './${NAME}${SUFFIX}';" > "frontend/src/$TYPE/$NAME/index.js"
  
  # Create empty CSS file
  touch "frontend/src/$TYPE/$NAME/${NAME}${SUFFIX}.css"
  
  # Create empty JSX file
  touch "frontend/src/$TYPE/$NAME/${NAME}${SUFFIX}.jsx"
  
  # Create empty JS file
  touch "frontend/src/$TYPE/$NAME/${NAME}${SUFFIX}.js"
  
  echo "Created folder structure for $TYPE/$NAME"
}

# Pages to convert
echo "Setting up page components..."
setup_component "pages" "Login" "Login"
setup_component "pages" "NotFound" "NotFound"
setup_component "pages" "CreateReport" "CreateReport"
setup_component "pages" "AnalyticsDashboard" "AnalyticsDashboard"
setup_component "pages" "AuthCallback" "AuthCallback"

# Components to convert
echo "Setting up regular components..."
setup_component "components" "AdminDashboard" "AdminDashboard"
setup_component "components" "PrivateRoute" "PrivateRoute"
setup_component "components" "AdminRoute" "AdminRoute"
setup_component "components" "Layout" "Layout"
setup_component "components" "DiffViewer" "DiffViewer"

# Modal components
echo "Setting up modal components..."
mkdir -p "frontend/src/components/modals"
setup_component "components/modals" "CreateReportModal" "CreateReportModal"
setup_component "components/modals" "ViewCommitsModal" "ViewCommitsModal"

echo "Component structure setup complete!" 