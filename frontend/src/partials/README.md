# Partials

Partials are complex sub-components used within views or components. They:

- Represent a portion of a larger UI
- Can contain business logic specific to their function
- Are not designed to be used independently

## Structure

Each partial follows this pattern:
- `PartialName/PartialNameComponent.js` - Partial logic
- `PartialName/PartialNameComponent.jsx` - Partial presentation
- `PartialName/PartialNameComponent.css` - Partial styles
- `PartialName/index.js` - Export file 