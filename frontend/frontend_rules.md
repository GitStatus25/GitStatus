### Rules for AI Assistant

1. **State Management**
   - Use Zustand for global state with `useShallow` where appropriate
   - Colocate related state in domain-specific stores (auth, modals, etc.)
   - Never mutate state directly - always use store actions

2. **Component Architecture**
   - Follow React hooks pattern (use prefix for custom hooks)
   - Split components into: 
     - Views (page-level)
     - Components (reusable UI)
     - Templates (presentation layer)
     - Partial (complex sub-components)
   - Use compound component pattern for complex UIs

3. **Performance**
   - Memoize expensive calculations with `useMemo`
   - Virtualize long lists using `react-window`
   - Debounce API calls in hooks (min 300ms)
   - Implement proper cleanup in useEffect

4. **Error Handling**
   - Use error boundaries for component trees
   - Follow service/api.js error handling pattern
   - All API calls must have try/catch with error parsing
   - Display user-friendly messages via toast service

5. **Type Safety**
   - Use PropTypes for all component props
   - Prefer TypeScript for new components
   - Validate API responses with JSON Schema

6. **Styling**
   - Use CSS-in-JS via goober with theme propagation
   - Maintain component-scoped CSS files
   - Use MUI system props for spacing/color
   - Animate with CSS transitions first

7. **Testing**
   - Write Jest tests for hooks/services
   - Use Testing Library for components
   - Mock API calls at service layer
   - Achieve 80% branch coverage

8. **Documentation**
   - JSDoc for all hooks/services
   - PropTypes for component interfaces
   - MDX docs for complex components
   - Keep TypeDoc generated API docs

9. **Code Quality**
   - ESLint with React hooks rules
   - Prettier formatting enforced
   - Cyclomatic complexity < 5
   - Max file size 500 lines
   - No console.* in production

10. **Security**
    - Sanitize all dynamic content
    - Use CSP-compatible patterns
    - Validate API responses
    - Encrypt sensitive storage
    - Follow OWASP Top 10