# GitStatus Design Guide

This guide outlines the design principles and UI patterns to maintain consistency across the GitStatus application.

## Color Palette

- **Primary**: Electric blue (`#4dabf5`) - Used for primary actions, links, and important UI elements
- **Secondary**: Deep purple (`#b388ff`) - Used for secondary actions and accents
- **Accent**: Teal (`#00bcd4`) - Used for tertiary elements and special highlights
- **Background**: Dark theme with subtle gradients
  - Base: `#121212`
  - Paper: `#1e1e1e` 
  - Gradient: `linear-gradient(145deg, #121212 0%, #1a1a1a 100%)`
  - Card Gradient: `linear-gradient(145deg, #1e1e1e 0%, #252525 100%)`

## Typography

- **Font Family**: JetBrains Mono (primary), Roboto Mono (fallback)
- **Font Weights**:
  - Headings: 500-600
  - Body: 400
  - Buttons: 500
- **Line Height**: 1.6 for better readability
- **Gradient Text**: Use for important headings with `background: linear-gradient(90deg, #fff, #81d4fa)`

## Layout Components

### Cards

```jsx
<Card 
  elevation={2}
  sx={{
    border: '1px solid rgba(255, 255, 255, 0.05)',
    backgroundImage: theme.palette.background.cardGradient,
    borderRadius: 3,
    overflow: 'hidden',
    transition: 'all 0.2s',
    '&:hover': {
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
    }
  }}
>
  <CardContent sx={{ p: 3 }}>
    {/* Card content */}
  </CardContent>
</Card>
```

### Buttons

```jsx
// Primary Button
<Button
  variant="contained"
  color="primary"
  startIcon={<Icon />}
  sx={{
    borderRadius: 2,
    boxShadow: '0 4px 12px rgba(77, 171, 245, 0.3)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(77, 171, 245, 0.4)',
    }
  }}
>
  Button Text
</Button>

// Secondary Button
<Button
  variant="outlined"
  startIcon={<Icon />}
  sx={{ 
    borderRadius: 2,
    transition: 'all 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)'
    }
  }}
>
  Button Text
</Button>
```

### Data Panels

```jsx
<Paper
  elevation={0}
  sx={{
    p: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  }}
>
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
    <Icon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
    <Typography variant="body2" color="text.secondary">Label</Typography>
  </Box>
  <Typography variant="h6" sx={{ fontWeight: 500 }}>Value</Typography>
</Paper>
```

### Tables

```jsx
<TableContainer 
  component={Paper} 
  elevation={0}
  sx={{
    borderRadius: 2,
    background: 'transparent',
    '& .MuiTable-root': {
      borderCollapse: 'separate',
      borderSpacing: '0 8px',
    }
  }}
>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>
          Header Cell
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow 
        sx={{
          background: theme.palette.background.cardGradient,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          borderRadius: 2,
          position: 'relative',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          '& td:first-of-type': { 
            borderTopLeftRadius: 8, 
            borderBottomLeftRadius: 8,
          },
          '& td:last-of-type': { 
            borderTopRightRadius: 8, 
            borderBottomRightRadius: 8,
          },
        }}
      >
        <TableCell sx={{ borderBottom: 'none' }}>Cell Content</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</TableContainer>
```

## Animation Guidelines

- **Transitions**: Use smooth transitions for all interactive elements (0.2-0.3s)
- **Hover Effects**: 
  - Subtle elevation changes
  - Small scale or position transforms
  - Color transitions
- **Page Transitions**: Use Fade component with 800ms timeout
- **Loading States**: Use CircularProgress with custom styling

```jsx
<CircularProgress 
  color="primary" 
  sx={{
    '& .MuiCircularProgress-circle': {
      strokeLinecap: 'round',
    }
  }}
/>
```

## Micro-interactions

- **Buttons**: Slight elevation and transform on hover
- **Cards**: Shadow increase on hover
- **Icons**: Rotation or color change on interaction
- **Form Fields**: Subtle highlight effects on focus

## Responsive Design

- Use the MUI breakpoint system consistently
- Design for mobile-first, then adapt for larger screens
- Use flexbox for responsive layouts:

```jsx
<Box 
  sx={{ 
    display: 'flex', 
    flexDirection: { xs: 'column', md: 'row' },
    alignItems: { xs: 'flex-start', md: 'center' },
    gap: 2
  }}
>
  {/* Content */}
</Box>
```

## Accessibility Guidelines

- Maintain sufficient color contrast
- Use proper semantic HTML elements
- Provide tooltips for icon-only buttons
- Include focus indicators for keyboard navigation
- Support screen readers with appropriate ARIA attributes

## Iconography

- Use Material Icons consistently
- Keep icon sizes consistent (small: 18px, medium: 24px, large: 36px)
- Add subtle effects to icons for interactive elements

By adhering to these guidelines, we maintain a cohesive, modern, and professional user experience across the GitStatus application. 