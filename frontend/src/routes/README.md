# Routes

Routes are special components that handle routing logic and access control. They:

- Verify user permissions before rendering protected content
- Handle redirection when required
- Wrap views with necessary context or layout

## Structure

Each route component follows this pattern:
- `RouteName/RouteNameComponent.js` - Route logic 
- `RouteName/index.js` - Export file 