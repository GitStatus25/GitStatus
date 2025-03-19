#!/bin/bash
# Script to migrate an existing component to the new folder structure

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <component_type> <component_name>"
    echo "Example: $0 pages Login"
    exit 1
fi

TYPE=$1  # "pages" or "components" or "components/modals"
NAME=$2  # Component name without suffix

# Determine the appropriate suffix based on type
if [[ "$TYPE" == "pages" ]]; then
    SUFFIX="Page"
    OLD_FILE="frontend/src/$TYPE/${NAME}.js"
else
    SUFFIX="Component"
    # Check possible file naming patterns
    if [ -f "frontend/src/$TYPE/${NAME}${SUFFIX}.js" ]; then
        OLD_FILE="frontend/src/$TYPE/${NAME}${SUFFIX}.js"
    elif [ -f "frontend/src/$TYPE/${NAME}.js" ]; then
        OLD_FILE="frontend/src/$TYPE/${NAME}.js"
    else
        echo "Error: Could not find source file. Checked:"
        echo "- frontend/src/$TYPE/${NAME}${SUFFIX}.js"
        echo "- frontend/src/$TYPE/${NAME}.js"
        exit 1
    fi
fi

NEW_DIR="frontend/src/$TYPE/$NAME"
NEW_JS="${NEW_DIR}/${NAME}${SUFFIX}.js"
NEW_JSX="${NEW_DIR}/${NAME}${SUFFIX}.jsx"
NEW_CSS="${NEW_DIR}/${NAME}${SUFFIX}.css"
NEW_INDEX="${NEW_DIR}/index.js"

# Check if source file exists
if [ ! -f "$OLD_FILE" ]; then
    echo "Error: Source file $OLD_FILE not found!"
    exit 1
fi

echo "Found source file: $OLD_FILE"

# Check if destination directory already exists
if [ -d "$NEW_DIR" ]; then
    echo "Destination directory $NEW_DIR already exists. Ensuring files exist..."
    
    # Ensure index.js exists
    if [ ! -f "$NEW_INDEX" ]; then
        echo "export { default } from './${NAME}${SUFFIX}';" > "$NEW_INDEX"
        echo "Created $NEW_INDEX"
    fi
    
    # Ensure CSS file exists
    if [ ! -f "$NEW_CSS" ]; then
        touch "$NEW_CSS"
        echo "Created empty $NEW_CSS"
    fi
    
    # Copy original file if JS doesn't exist
    if [ ! -f "$NEW_JS" ]; then
        cp "$OLD_FILE" "$NEW_JS"
        echo "Copied $OLD_FILE to $NEW_JS"
    else
        echo "JS file already exists. Not overwriting."
    fi
    
    # Ensure JSX file exists
    if [ ! -f "$NEW_JSX" ]; then
        touch "$NEW_JSX"
        echo "Created empty $NEW_JSX"
    fi
else
    # Create new directory structure
    mkdir -p "$NEW_DIR"
    
    # Create index.js
    echo "export { default } from './${NAME}${SUFFIX}';" > "$NEW_INDEX"
    
    # Create empty CSS file
    touch "$NEW_CSS"
    
    # Copy original JS content to new JS file
    cp "$OLD_FILE" "$NEW_JS"
    
    # Create empty JSX file
    touch "$NEW_JSX"
    
    echo "Created folder structure for $TYPE/$NAME"
    echo "Copied $OLD_FILE to $NEW_JS"
    echo "Created empty JSX and CSS files"
fi

echo "Migration setup complete for $TYPE/$NAME!"
echo "Next steps:"
echo "1. Separate logic into $NEW_JS"
echo "2. Move presentation JSX into $NEW_JSX"
echo "3. Extract CSS styles into $NEW_CSS"
echo "4. Import the Template in the JS file and pass props" 