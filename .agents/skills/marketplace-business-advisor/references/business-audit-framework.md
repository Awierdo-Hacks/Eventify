# Business Audit Framework

## Table of Contents

- Interview question bank
- Funnel and conversion heuristics
- Marketplace red flags
- Monetization and pricing checks
- Financing decision tree
- Belgium and Europe structure checklist
- Output template
- Prioritization rubric

## Interview Question Bank

Ask only the subset needed to unblock a strong assessment. Start with the highest-leverage unknowns.

### Business basics

- Who is the primary customer?
- What exact problem do they pay to solve?
- Why is this problem urgent now?
- Which geography matters first?
- What launch wedge comes first: one city, one event type, one customer segment, or one provider category?
- What stage is the business in: idea, prototype, waitlist, pilot, early revenue, or live marketplace?
- What traction exists already: leads, waitlist, pilot users, GMV, bookings, repeat usage, or revenue?

### Demand side

- How will customers discover the product?
- What is the first acquisition channel that can work without large spend?
- What makes a customer trust the platform enough to submit a request or pay?
- What would make a customer choose the platform instead of direct outreach, Google, Instagram, or word of mouth?
- What is the expected customer journey from first visit to booking?

### Supply side

- Which providers need to join first?
- Why would providers join before large demand exists?
- What operational burden falls on providers during onboarding?
- How are quality, availability, and compliance checked?
- What prevents low-quality supply from damaging trust early?

### Revenue and pricing

- Who pays: customer, provider, both, or neither at first?
- What is the pricing mechanic: commission, listing fee, subscription, lead fee, premium placement, SaaS fee, or hybrid?
- When is value realized relative to when payment is requested?
- What refund, dispute, cancellation, or no-show costs could erode margin?
- What payment processing costs, VAT effects, support costs, and verification costs hit the model?

### Legal and operating reality

- Who is the legal contracting party today?
- What company structure exists now?
- How are payments intended to flow?
- Does the platform hold funds or does a licensed PSP handle them?
- Which contracts or terms already exist?
- What data is collected and how is consent handled?

### Financing and company building

- Why is financing needed now?
- What milestone should that financing buy?
- What proof exists today that the model deserves outside capital?
- Is the team trying to raise because the business is ready, or because the business is still uncertain?
- How are founder roles, ownership, and decision rights planned?

## Funnel and Conversion Heuristics

Use these checks when reviewing the website or app flow.

| Stage | What to test | Common decline signals |
| --- | --- | --- |
| Landing page | Does the headline clearly name the audience, pain, and promise? | Generic copy, weak trust, no clear next action |
| Search or browse | Can users quickly see relevant supply? | Empty states, low density, vague filters, unclear quality |
| Waitlist or lead capture | Is the ask proportional to the value shown? | Long forms, weak reason to join, no expectation setting |
| Signup or login | Is account creation justified at that step? | Forced auth before value, unclear benefit, too much friction |
| Request or quote flow | Does the user understand what happens next? | Long multi-step forms, no timeline, no trust or pricing anchors |
| Compare and decide | Can users compare providers confidently? | Weak reviews, poor differentiation, hidden fees, no guarantees |
| Book or pay | Does trust peak before money is requested? | Unclear refund terms, vague payment handling, no dispute path |
| Dashboard or follow-up | Does the product reduce anxiety after signup? | Empty dashboards, no progress cues, no operational clarity |
| Provider onboarding | Is supply acquisition credible and efficient? | High setup burden, unclear upside, weak verification process |

## Marketplace Red Flags

- No launch wedge. The product tries to serve too many locations, categories, or personas at once.
- No liquidity plan. Supply and demand are both treated as future problems.
- No reason for providers to join early.
- No reason for customers to trust the platform over direct outreach.
- Pricing exists, but the value exchange is still vague.
- Trust language is stronger than the actual safeguards.
- Payment complexity is underestimated.
- Operational work is hidden inside the "platform" story.
- The company wants to raise money before validating demand.
- The product looks polished, but the business assumptions are still weak.

## Monetization and Pricing Checks

- Check whether the paying side experiences value before the bill appears.
- Check whether the take rate survives PSP fees, disputes, support load, VAT, and onboarding costs.
- Check whether the pricing model aligns with user psychology:
  - commission works when trust and conversion are high
  - subscription works when providers expect recurring demand
  - lead fees work only if lead quality is credible
  - hybrid models add complexity and can confuse both sides
- Check whether pricing punishes early adoption. A marketplace often needs trust and liquidity before aggressive monetization.
- Check whether any guarantee, escrow, or protection promise creates hidden cost or compliance exposure.

## Financing Decision Tree

- Idea or prototype, no traction:
  - Prefer founder capital, bootstrapping, grants, and customer discovery.
  - Treat equity fundraising as premature unless the founders have unusual leverage.
- Waitlist, pilots, or early proof:
  - Consider grants, small founder capital, angels, or a light pre-seed conversation.
  - Raise only if capital accelerates a validated wedge instead of funding broad uncertainty.
- Early marketplace activity with real bookings or repeat demand:
  - Angels or pre-seed can make sense if the company can explain traction, retention, and the next milestone.
- Repeatable demand, stronger liquidity, and usable unit economics:
  - A larger pre-seed or seed conversation becomes more credible.

Use stock, share classes, and equity-structure discussion carefully. Keep it strategic unless the user explicitly wants deeper financing mechanics.

## Belgium and Europe Structure Checklist

Use this as a business-risk checklist, not as formal legal or tax advice.

- Company form:
  - Multi-founder marketplaces in Belgium often point toward a BV when limited liability and cleaner governance matter.
  - Confirm founder roles, ownership, and shareholder expectations early.
- Banking and bookkeeping:
  - Separate business banking is essential.
  - A Belgian BV usually implies double-entry bookkeeping and formal annual reporting.
  - Flag the need for a startup-aware accountant if transactions, commissions, or marketplace flows are involved.
- VAT and invoicing:
  - Check who invoices whom, which services are VAT-bearing, and whether the marketplace is principal or intermediary.
  - Flag VAT uncertainty early instead of guessing.
- Payments:
  - If the platform handles customer funds, check PSD2 exposure immediately.
  - Prefer licensed payment providers or marketplace payment products when possible.
  - Distinguish between marketing language and regulated financial language.
- Contracts and terms:
  - Separate customer-facing terms from provider agreements.
  - Check cancellation, refunds, liability allocation, dispute handling, and digital acceptance.
- Provider compliance:
  - Verify whether providers need sector-specific licenses or registrations.
  - Treat provider verification as a trust and compliance issue, not just an ops detail.
- Privacy and data:
  - Check what personal data is collected, why it is collected, and what legal basis is claimed.
  - Flag the need for privacy notice, processor agreements, records of processing, and possible DPIA review where relevant.

If `docs/juridisch-operationeel-overzicht.md` exists in the repo, read it before making Belgium-specific claims. It is the preferred internal source for this project.

## Output Template

Use this structure for the final audit.

```markdown
## Context Summary
- Confirmed facts
- Assumptions

## Top Business Risks
- Risk
- Why it matters
- What must be true for it to work

## Funnel and Conversion Risks
- Stage
- Friction point
- Why users may decline

## Monetization and Financing Review
- Current model
- Pricing risks
- Financing recommendation

## Belgium/EU Structure and Compliance Review
- Company setup
- Payment and accounting implications
- Professional advice needed

## Critical Unanswered Questions
- Missing facts that change the recommendation

## Prioritized Next Actions
- 1 to 5 concrete moves in order
```

## Prioritization Rubric

Use this rubric when ordering recommendations.

- P0: Immediate blocker to legality, trust, payment flow, or launch viability.
- P1: Major business or conversion weakness that will likely kill adoption if left unresolved.
- P2: Important improvement that strengthens economics, clarity, or operations.
- P3: Useful optimization, but not the next best move.

Prefer shorter, sharper audits over exhaustive but low-signal lists.
