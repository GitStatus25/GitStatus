# GitStatus Product Roadmap

## EPIC 1: Tier Management & Monetization (Highest Priority)

### Phase 1: Free Tier Launch (Initial Release)
- Implement enhanced free tier with promotional limits
  - Standard reports (5 commits per report)
  - Big reports (20 commits per report)
- Track usage metrics to inform future pricing
  - Per-user report usage and limits tracking
  - API call counting and rate limiting
  - Token usage monitoring for cost analysis
- Implement PDF watermarking
- Basic prompt version
- Admin management system
  - Create admin role designation
  - Admin dashboard with system-wide analytics
  - Financial monitoring tools (usage costs, revenue metrics)

### Phase 2: First Paid Tier (Premium)
- Higher limits for both standard and big reports
- Remove PDF watermark
- Include code snippets option
- Enhanced prompt quality
- Keep GitStatus footer
- Usage-based pricing option
- Progressive commit loading implementation

### Phase 3: Second Paid Tier (Enterprise)
- Remove footer affiliation option
- Technical detail prompt option
- Interactive report refinement
  - PDF preview with feedback loop
  - Ability to iterate with model before finalizing
  - Limited number of iterations per report
- Pay-per-report options with variable pricing

## EPIC 2: Performance Optimization (High Priority)

### Feature: Usage Analytics (Phase 1 Priority)
- Track report generation by type (standard/big)
- Monitor commit analysis
- Implement token usage tracking
- Create usage dashboard
  - User-facing dashboard showing personal usage
  - Admin-facing dashboard showing system-wide metrics
- Cost monitoring and analysis
  - Track AI model costs
  - Calculate per-report and per-user costs

### Feature: Async Commit Loading (Phase 2)
- Implement progressive commit loading
- Add loading states and indicators
- Optimize large repository performance

## EPIC 3: Target Audience Expansion (Medium Priority)

### Feature: IC-Focused Features
- Status report generation
- Code contribution analysis
- Technical detail views

### Feature: Manager-Focused Features
- Team productivity insights
- Time-based work analysis
- Cross-team contribution views

## EPIC 4: Model Provider Integration (Lower Priority)

### Feature: Commercial Provider Integration
- Anthropic integration
- Google integration
- Grok integration
- Provider-specific optimizations

### Feature: Open Source Model Support
- Infrastructure planning
- Model hosting solution
- Performance optimization
- Cost analysis

## EPIC 5: UI/UX Improvements (Ongoing)

### Feature: Commit Author Analytics
- Enhanced author dropdown
- Commit statistics by author
- Branch-specific filtering

### Feature: Commit Token System
- Develop algorithm for measuring commit "weight"
- Smaller commits count as fewer tokens
- Token-based limit system
- Visual token usage indicators

## Product Philosophy

- Continuously improve the free tier experience
- Not all new features should be paywalled
- Regular feature releases for all tiers
- Premium features should provide clear additional value