# Views

Views represent page-level components in the application. Each view:

- Is a top-level component that corresponds to a route
- Handles page-specific logic and state
- Uses templates for presentation

Views should not be imported and used by other components. Instead, they are referenced directly in the routing configuration.

## Structure

Each view follows this pattern:
- `ViewName/ViewNameComponent.js` - Component logic
- `ViewName/ViewNameComponent.jsx` - Component presentation
- `ViewName/ViewNameComponent.css` - Component styles
- `ViewName/index.js` - Export file 