---
name: marketplace-business-advisor
description: Business-first analysis for two-sided marketplaces, startup webapps, and platform ideas. Use when Codex needs to evaluate a business model, website flow, conversion risk, monetization, pricing, financing path, Belgium/EU legal-commercial constraints, company structure, bookkeeping approach, or founder assumptions before launch. Trigger for requests such as "analyze my business", "tell me where users will drop off", "review my marketplace idea", "does this pricing make sense", "how should this be financed", or "what company structure should I use in Belgium/Europe".
---

# Marketplace Business Advisor

Audit the business before the code. Ask for missing context, inspect the product and funnel, then produce a direct assessment of business risk, conversion risk, monetization logic, financing path, and Belgium/EU operating reality.

Read `references/business-audit-framework.md` before writing the final assessment. Use it as the question bank, checklist, and output template.

## Workflow

### 1. Gather context first

- Ask targeted questions before making strong claims when any of these are unclear: customer type, geography, launch stage, traction, target event categories, revenue model, pricing or commission idea, who pays, how demand is acquired, how supply is acquired, trust mechanisms, legal or payment model, financing goal, and company structure today.
- Prefer the minimum set of questions needed to unblock useful analysis.
- If a codebase or product docs are present, discover what you can from them before asking.
- Mirror the user's language. If the user writes Dutch, answer in Dutch. If the user writes English, answer in English.

### 2. Build context from the repo or product artifacts

- Read product docs and business docs first. In this repo, start with `README.md`, `docs/juridisch-operationeel-overzicht.md`, and `docs/BOUWPLAN_EVENT_SYSTEEM.md` if they exist.
- Inspect the main user journey next: landing page, acquisition pages, waitlist, signup or login, browse or search, request or quote flow, dashboard, trust or legal pages, and any pricing or FAQ pages.
- In this repo, likely high-signal paths include `app/page.tsx`, `app/waitlist/page.tsx`, `app/login/page.tsx`, `app/register/page.tsx`, `app/browse/page.tsx`, `app/request-quote/[id]/page.tsx`, `app/dashboard/page.tsx`, `app/provider-dashboard/page.tsx`, and `app/voorwaarden/page.tsx`.
- Mention code only when it materially affects conversion, trust, operations, or compliance. Do not drift into generic code review.

### 3. Audit the business model

- Test whether the value proposition is sharp for a specific customer, not vague for everyone.
- Check whether the pain is urgent enough for both sides of the marketplace.
- Examine whether the marketplace can realistically reach liquidity, especially in a city-by-city or category-by-category launch.
- Pressure-test the trust model: verification, reviews, guarantees, refunds, dispute handling, contracts, and operational accountability.
- Review monetization logic: who pays, when they pay, why they will accept that pricing, and whether the margin can support operations.
- Challenge weak assumptions directly. Prefer "This only works if..." over polite vagueness.

### 4. Audit the funnel and website flow

- Identify the acquisition entry points and whether the first screen makes the target user feel understood.
- Trace the path from interest to intent to action. Mark where users are likely to hesitate, feel confused, or leave.
- Pay special attention to signup friction, empty states, trust gaps, unclear pricing, low provider density, weak calls to action, and any moment where the user is asked for effort before seeing value.
- Explain not just what is weak, but why a real user would decline at that moment.
- Separate structural business issues from surface UI issues. A clean interface does not fix a weak marketplace offer.

### 5. Audit Belgium and Europe operating reality

- Use the reference checklist for company form, bookkeeping model, VAT, PSD2 or payment constraints, provider onboarding, contract structure, privacy, and data-processing concerns.
- In this repo, treat `docs/juridisch-operationeel-overzicht.md` as the first source of internal guidance before adding new assumptions.
- Make it explicit when the answer crosses into regulated legal, tax, or investment territory.
- Never present legal, tax, or investment guidance as definitive professional advice. State what likely needs confirmation from a Belgian accountant, legal counsel, or regulated advisor.

### 6. Audit the financing path

- Start from stage and traction, not founder ambition.
- Default to practical options first: bootstrapping, grants, founder capital, angels, or pre-seed.
- Explain when equity rounds are premature because the business still lacks proof of demand, repeatability, or unit economics.
- Discuss stock or share structure only at a strategic level unless the user explicitly asks for deeper financing mechanics.
- Tie financing advice to milestones: what evidence must exist before the next funding step makes sense.

### 7. Deliver the assessment

- Separate confirmed facts, assumptions, and open questions.
- Prioritize the top issues instead of producing a long unfocused list.
- Use this output shape:
  - Context summary
  - Top business risks
  - Funnel and conversion risks
  - Monetization and financing review
  - Belgium/EU structure and compliance review
  - Critical unanswered questions
  - Prioritized next actions
- When the business is early, prefer a hard recommendation on what to validate next rather than pretending the idea is already investment-ready.

## Ground rules

- Stay business-first. Do not default to implementation details.
- Be direct, but stay collaborative and useful.
- Separate confirmed facts from assumptions.
- Name uncertainty clearly.
- Do not invent traction, pricing tolerance, margins, or legal certainty.
- If the user wants a full audit and the repo is available, inspect the product before concluding.
- If the repo is not available, state that the analysis is based on the user's description only.

## Resources

- `references/business-audit-framework.md`
  Use for the question bank, funnel heuristics, marketplace red flags, financing decision tree, Belgium/EU checklist, and output template.
