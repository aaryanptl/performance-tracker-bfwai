/* Goal and competency libraries — 135 example key results, 49 competencies.
   Replace wholesale with your own; the shape is what matters. */
export const LIB = {
"competencies": [
{
"unit": "All Units (Common)",
"name": "Communication",
"mandatory": true,
"definition": "Clarity and timeliness of written and verbal communication with team, clients, and stakeholders. Every person in the organisation — including every coach — carries this competency every half.",
"measure": "Rework caused by unclear communication (count); stakeholders informed before they ask; quality of written updates, docs, and meeting notes (coach + peer observation).",
"l5": "Updates are proactive, crisp, and need no clarification; meetings end with clear notes; clients and teammates specifically praise their clarity.",
"l3": "Generally clear; occasionally needs a follow-up question to fully understand.",
"l1": "Frequent misunderstandings; status unknown unless asked; communication gaps cause rework."
},
{
"unit": "All Units (Common)",
"name": "Discipline & Documentation",
"mandatory": true,
"definition": "Works in a disciplined, traceable way: commitments tracked, work documented, trackers and records current. The habit that keeps a 15-person company running without chaos.",
"measure": "Trackers/CRM/docs current at spot-check; deliverables filed where agreed; meeting actions recorded and closed; % of work findable without asking the person.",
"l5": "Records are always current and complete; others rely on their documentation; nothing lives only in their head.",
"l3": "Records mostly current; occasional gap caught and fixed at check-ins.",
"l1": "Trackers stale, work undocumented; status requires asking them directly."
},
{
"unit": "All Units (Common)",
"name": "Collaboration",
"mandatory": true,
"definition": "Makes teammates' work better — responsive on handoffs, shares knowledge, unblocks others.",
"measure": "Handoff turnaround time; help-given instances noted in check-ins; coach observation across the half.",
"l5": "Named by teammates as a multiplier; handoffs are clean; actively unblocks others unprompted.",
"l3": "Cooperative when asked; handoffs mostly clean.",
"l1": "Teammates route around them; handoffs create rework or delays."
},
{
"unit": "All Units (Common)",
"name": "Ownership & Accountability",
"mandatory": false,
"definition": "Takes work from assignment to completion without follow-ups; owns outcomes, not tasks.",
"measure": "% of committed items closed without a reminder; count of chase-ups needed per month (from coach check-in notes).",
"l5": "Zero chase-ups all half; flags risk 1+ week before deadlines; owns fixes for own misses.",
"l3": "Occasional reminder needed; delivers most commitments on time.",
"l1": "Work regularly stalls until chased; misses surface only at the deadline."
},
{
"unit": "All Units (Common)",
"name": "Learning Agility",
"mandatory": false,
"definition": "Speed of picking up new tools, models, and methods and applying them to live work.",
"measure": "New skills/tools applied in real deliverables this half (count + named examples); time from 'new thing exists' to 'used it'.",
"l5": "Applies a new tool/model to live work within days; teaches it to others.",
"l3": "Learns what is assigned within reasonable time; applies with some guidance.",
"l1": "Sticks to known methods; new tools remain unlearned after repeated exposure."
},
{
"unit": "All Units (Common)",
"name": "Reliability & Time Discipline",
"mandatory": false,
"definition": "Predictability: meetings, deadlines, and response SLAs honoured consistently.",
"measure": "On-time delivery % of committed dates; meeting punctuality; response time on internal asks (spot-checked).",
"l5": "100% on committed dates or renegotiates early; always reachable within agreed hours.",
"l3": "Mostly on time; rare slips are communicated.",
"l1": "Deadlines and meetings slip without warning."
},
{
"unit": "All Units (Common)",
"name": "Initiative & Proactiveness",
"mandatory": false,
"definition": "Proposes improvements and starts valuable work without being asked.",
"measure": "Count of self-initiated improvements/experiments this half that were adopted (named in review).",
"l5": "3+ adopted improvements per half that others now use.",
"l3": "Occasionally suggests improvements when prompted.",
"l1": "Waits for instructions; no self-started work all half."
},
{
"unit": "All Units (Common)",
"name": "Quality Orientation",
"mandatory": false,
"definition": "First-pass quality of work — how often output is usable without rework.",
"measure": "Rework/review cycles per deliverable (count from coach notes or PR/edit history).",
"l5": "Work is client-ready or ship-ready first pass; catches own errors before review.",
"l3": "1–2 review cycles typical; quality is dependable after feedback.",
"l1": "3+ cycles common; errors reach clients or production."
},
{
"unit": "All Units (Common)",
"name": "AI Tool Fluency",
"mandatory": false,
"definition": "Uses AI tools (Claude, ChatGPT, agents, automation) to multiply own daily output — core to the company's identity.",
"measure": "Documented AI-assisted workflows in own role (count + demo); time saved on recurring tasks (self-report, coach-verified).",
"l5": "Has automated/accelerated 3+ recurring workflows; others copy their setups.",
"l3": "Uses AI tools daily for standard tasks.",
"l1": "Rarely uses AI tooling despite it fitting the work."
},
{
"unit": "AI & Engineering",
"name": "Technical Craft & Code Quality",
"mandatory": false,
"definition": "Robustness and cleanliness of code/notebooks — solutions, not just demos.",
"measure": "Review comments per PR (trend); post-delivery bug count per project; % code merged without major rework.",
"l5": "PRs pass with minor nits; zero post-delivery bugs; code is reused by others.",
"l3": "Sound code with normal review feedback; occasional post-delivery fix.",
"l1": "Fragile code; repeated bugs on the same projects."
},
{
"unit": "AI & Engineering",
"name": "Shipping Velocity",
"mandatory": false,
"definition": "Rate of converting committed scope into deployed/delivered work.",
"measure": "% of committed sprint items shipped per fortnight; cycle time from start to deploy (tracked per task).",
"l5": "95%+ of commitments shipped; consistently pulls extra scope.",
"l3": "70–90% shipped; slippage is communicated early.",
"l1": "Under 50% shipped; work-in-progress piles up."
},
{
"unit": "AI & Engineering",
"name": "Debugging & Problem-Solving Independence",
"mandatory": false,
"definition": "Unblocks self; escalates with attempted solutions, not raw problems.",
"measure": "Escalations per month and their quality (did they include what was tried?); time stuck before resolving/escalating.",
"l5": "Resolves 90% of own blockers; escalations arrive with 2–3 attempted fixes documented.",
"l3": "Resolves common issues; escalates hard ones reasonably.",
"l1": "Escalates immediately and without context; same issues recur."
},
{
"unit": "AI & Engineering",
"name": "New Model & Framework Adoption",
"mandatory": false,
"definition": "Evaluates and applies new AI releases (models, frameworks, APIs) fast — the frontier skill.",
"measure": "New models/frameworks evaluated (count) and applied in live client/product work (count) per half.",
"l5": "5+ evaluated, 2+ in production per half; team's go-to for 'what's new'.",
"l3": "Adopts new tooling when the project requires it.",
"l1": "Still on last year's stack by choice."
},
{
"unit": "AI & Engineering",
"name": "Documentation & Knowledge Sharing",
"mandatory": false,
"definition": "Leaves work findable and reusable — docs, guides, internal demos.",
"measure": "% of delivered projects with docs + handover; internal guides/demos produced (count).",
"l5": "Every project documented; 3+ internal guides per half that others actually use.",
"l3": "Documents when asked; demos own major work.",
"l1": "Knowledge lives only in their head; handovers require meetings."
},
{
"unit": "AI & Engineering",
"name": "Client Requirement Understanding",
"mandatory": false,
"definition": "Translates fuzzy client asks into correct technical scope the first time.",
"measure": "Scope-change requests caused by misread requirements (count per project); client clarification rounds needed.",
"l5": "Requirements nailed first pass; anticipates unstated needs.",
"l3": "Minor clarifications needed; scope broadly correct.",
"l1": "Regular rebuilds due to misunderstood requirements."
},
{
"unit": "AI & Engineering",
"name": "Reusable Asset Building",
"mandatory": false,
"definition": "Turns one-off project work into templates, components, and starters that speed up future projects.",
"measure": "Reusable assets created this half (count) and times reused by team (count).",
"l5": "Built 3+ assets this half that cut delivery time on later projects.",
"l3": "Reuses existing assets well; occasionally contributes one.",
"l1": "Every project starts from zero."
},
{
"unit": "AI & Engineering",
"name": "Production Reliability",
"mandatory": false,
"definition": "Deployed work stays up and stable; incidents are rare and fixed fast.",
"measure": "Uptime of owned services; incidents caused (count); mean time to fix.",
"l5": "No client-visible incidents; monitoring in place before launch.",
"l3": "Rare incidents, fixed same day.",
"l1": "Repeated outages or silent failures discovered by clients."
},
{
"unit": "AI & Engineering",
"name": "Estimation Accuracy",
"mandatory": false,
"definition": "Committed timelines match reality — the foundation of trust with clients and sales.",
"measure": "Actual vs. estimated delivery time per project (% variance, tracked).",
"l5": "Within ±15% on estimates all half; re-forecasts early when scope moves.",
"l3": "Within ±40%; occasionally over-runs with notice.",
"l1": "Estimates routinely off 2x+; deadlines discovered broken."
},
{
"unit": "AI & Engineering",
"name": "Demo & Teaching Ability",
"mandatory": false,
"definition": "Presents technical work compellingly — matters for client demos, workshops, and content.",
"measure": "Demos/workshop segments delivered (count) + audience feedback scores where collected.",
"l5": "Demos are clear and confident; requested by name for client sessions.",
"l3": "Presents own work adequately with preparation.",
"l1": "Avoids presenting; demos confuse the audience."
},
{
"unit": "Marketing & Growth",
"name": "Content Quality & Brand Consistency",
"mandatory": false,
"definition": "Output is scroll-stopping and unmistakably on-brand across formats.",
"measure": "Engagement rate vs. account average per post; brand-guideline deviations flagged (count).",
"l5": "Top-quartile engagement consistently; sets the brand bar others follow.",
"l3": "On-brand and solid; engagement around account average.",
"l1": "Off-brand output; engagement consistently below average."
},
{
"unit": "Marketing & Growth",
"name": "Publishing Consistency",
"mandatory": false,
"definition": "Hits the content calendar, week after week — volume without collapse.",
"measure": "% calendar adherence (published on planned date / total planned).",
"l5": "95%+ adherence across the half, including crunch weeks.",
"l3": "80–95% adherence; slips are announced ahead.",
"l1": "Under 60%; the calendar is a suggestion."
},
{
"unit": "Marketing & Growth",
"name": "Hook & Copy Craft",
"mandatory": false,
"definition": "First-3-seconds and first-line craft — what makes the audience stop.",
"measure": "Average watch-through / read-through rates (trend across the half); A-B tested hook wins.",
"l5": "Watch-through rates climbing month over month; hooks get copied by others in the niche.",
"l3": "Competent hooks; retention flat but acceptable.",
"l1": "Openings lose the audience; no visible iteration."
},
{
"unit": "Marketing & Growth",
"name": "Analytics-Driven Iteration",
"mandatory": false,
"definition": "Reads the numbers, doubles down on winners, kills losers — with evidence.",
"measure": "Documented iteration decisions per month (what changed and why, from data); lift achieved on iterated formats.",
"l5": "Monthly data review drives visible format changes with measured lift.",
"l3": "Checks analytics; occasionally acts on them.",
"l1": "Publishes on instinct alone; dashboards untouched."
},
{
"unit": "Marketing & Growth",
"name": "Trend Responsiveness",
"mandatory": false,
"definition": "Speed from 'AI news breaks' to 'the company content is live' — newsjacking discipline.",
"measure": "Median hours from major AI news to published post; trend posts published per month (count).",
"l5": "Live within hours of major releases; regularly rides the wave early.",
"l3": "Covers big news within 1–2 days.",
"l1": "News cycles pass without the company content."
},
{
"unit": "Marketing & Growth",
"name": "Video & Visual Production Quality",
"mandatory": false,
"definition": "Edit quality, pacing, captions, and polish of visual output.",
"measure": "Revision rounds per video (count); watch-through rate; publish-ready rate on first cut.",
"l5": "First cuts are publish-ready; pacing and polish visibly above peers.",
"l3": "Good quality after 1 revision round.",
"l1": "3+ revision rounds standard; quality complaints from viewers."
},
{
"unit": "Marketing & Growth",
"name": "Turnaround Time",
"mandatory": false,
"definition": "Raw input to published output speed, without quality loss.",
"measure": "Median hours from brief/footage received to publish-ready (tracked per piece).",
"l5": "Beats agreed turnaround consistently (e.g. <48h) at full quality.",
"l3": "Meets agreed turnaround most of the time.",
"l1": "Regularly blows past turnaround; bottlenecks the calendar."
},
{
"unit": "Marketing & Growth",
"name": "Lead Generation Orientation",
"mandatory": false,
"definition": "Content and campaigns tie back to leads, not just likes.",
"measure": "MQLs sourced from owned content/campaigns per month (count via UTM/forms); conversion of content viewers to sign-ups.",
"l5": "Owned content is a measurable lead engine; tracks and reports it unprompted.",
"l3": "Aware of the lead goal; some content carries CTAs and tracking.",
"l1": "No line of sight from own work to leads."
},
{
"unit": "Marketing & Growth",
"name": "Channel Expertise Growth",
"mandatory": false,
"definition": "Deepening mastery of each platform's algorithm and formats (X, LinkedIn, IG, YouTube).",
"measure": "Platform-specific wins this half (reach/follower lift per channel); new formats tested per channel (count).",
"l5": "Demonstrable algorithm fluency; growth on every owned channel.",
"l3": "Solid on primary channel; learning others.",
"l1": "One-size-fits-all posting; no channel growth."
},
{
"unit": "Marketing & Growth",
"name": "Campaign Planning & Execution",
"mandatory": false,
"definition": "End-to-end campaign delivery: plan, assets, launch, measure — for launches, cohorts, workshops.",
"measure": "Campaigns delivered vs. planned; campaign goal attainment % (sign-ups, registrations).",
"l5": "Campaigns land on time and hit goals; post-mortems documented.",
"l3": "Campaigns ship with minor delays; results reviewed.",
"l1": "Campaigns half-launch; no measurement after."
},
{
"unit": "Sales & Service",
"name": "Prospecting & Pipeline Building",
"mandatory": false,
"definition": "Consistently feeds the top of funnel with qualified opportunities.",
"measure": "New qualified opportunities added per month (count + value); pipeline coverage vs. target (x multiple).",
"l5": "Maintains 3x+ pipeline coverage; sources own leads beyond inbound.",
"l3": "Works inbound well; pipeline covers ~2x target.",
"l1": "Pipeline below 1x target; waits for leads to arrive."
},
{
"unit": "Sales & Service",
"name": "Follow-up Discipline & CRM Hygiene",
"mandatory": false,
"definition": "No lead goes cold; the tracker reflects reality at all times.",
"measure": "% leads contacted within 48h SLA; CRM fields complete and current (spot-audit); stale deals older than 30 days (count).",
"l5": "100% SLA compliance; CRM is audit-clean; zero silent stale deals.",
"l3": "Minor SLA misses; CRM mostly current.",
"l1": "Leads discovered cold weeks later; CRM fiction."
},
{
"unit": "Sales & Service",
"name": "Discovery & Needs Analysis",
"mandatory": false,
"definition": "Uncovers the client's real problem and budget before pitching.",
"measure": "Discovery notes on file per deal (quality-checked by coach); proposal win-rate as downstream signal.",
"l5": "Discovery so sharp that proposals rarely miss; clients say 'you understood us'.",
"l3": "Covers standard discovery questions; occasional surprises later.",
"l1": "Pitches before understanding; deals die on mismatch."
},
{
"unit": "Sales & Service",
"name": "Proposal & Pitch Quality",
"mandatory": false,
"definition": "Proposals and pitches that are sharp, tailored, and close-worthy.",
"measure": "Proposal-to-close conversion %; revision rounds requested by client (count).",
"l5": "Proposals convert at high rate with minimal revision; reused as team templates.",
"l3": "Competent proposals; normal conversion.",
"l1": "Generic proposals; conversion well below team norm."
},
{
"unit": "Sales & Service",
"name": "Objection Handling & Closing",
"mandatory": false,
"definition": "Converts hesitation into commitment without over-discounting.",
"measure": "Close rate from proposal stage; average discount given vs. list (%; lower is better).",
"l5": "Closes at strong rates with minimal discounting; handles pushback in the room.",
"l3": "Closes standard deals; escalates hard objections.",
"l1": "Deals stall at objection stage or close only on heavy discounts."
},
{
"unit": "Sales & Service",
"name": "Client Relationship Depth",
"mandatory": false,
"definition": "Relationships that outlast the transaction — trust that produces referrals.",
"measure": "Repeat/referral revenue from owned accounts (₹ + count); relationship touchpoints logged between deals.",
"l5": "Clients proactively refer and return; relationships survive price discussions.",
"l3": "Cordial relationships; some repeat business.",
"l1": "Purely transactional; clients don't return calls after delivery."
},
{
"unit": "Sales & Service",
"name": "Product & AI Fluency",
"mandatory": false,
"definition": "Credibly discusses the company offerings and the AI landscape without engineering backup.",
"measure": "Escalations to engineering for standard questions (count; lower is better); passes internal product quiz / mock pitch.",
"l5": "Handles technical Q&A solo in client calls; corrects client misconceptions confidently.",
"l3": "Knows offerings well; escalates deep technical questions.",
"l1": "Cannot go beyond the brochure; loses credibility in calls."
},
{
"unit": "Sales & Service",
"name": "Customer Issue Resolution",
"mandatory": false,
"definition": "(Customer Success) Issues acknowledged fast, resolved fully, loyalty preserved.",
"measure": "% issues acknowledged <24h; % resolved <5 days; CSAT on resolved issues.",
"l5": "Issues resolved so well clients praise the recovery; zero repeat complaints.",
"l3": "SLAs mostly met; occasional lingering issue.",
"l1": "Issues age silently; clients escalate to Leadership."
},
{
"unit": "Sales & Service",
"name": "Upsell & Repeat Business Orientation",
"mandatory": false,
"definition": "Spots and lands expansion opportunities inside serviced accounts.",
"measure": "Expansion/repeat revenue closed (₹); expansion opportunities logged per half (count).",
"l5": "Consistently converts serviced accounts into next engagements.",
"l3": "Flags opportunities; converts some.",
"l1": "Accounts end at delivery; no expansion motion."
},
{
"unit": "Sales & Service",
"name": "Internal Handoff Quality",
"mandatory": false,
"definition": "Sales-to-delivery handoffs are complete; client intelligence flows to the team.",
"measure": "Handoff docs complete per closed deal (checklist %); delivery-team complaints about missing context (count).",
"l5": "Delivery never surprised; handoff docs are the team standard.",
"l3": "Handoffs adequate; occasional missing detail.",
"l1": "Delivery learns client expectations from the client."
},
{
"unit": "Product",
"name": "User Research & Empathy",
"mandatory": false,
"definition": "Decisions grounded in real user behaviour and feedback, not assumptions.",
"measure": "User conversations/feedback items reviewed per month (count); decisions citing user evidence (named in specs).",
"l5": "10+ user touchpoints monthly; every major decision traces to user evidence.",
"l3": "Reviews feedback when planning; some direct user contact.",
"l1": "Builds from assumption; hasn't talked to a user this half."
},
{
"unit": "Product",
"name": "Prioritization & Scoping",
"mandatory": false,
"definition": "Cuts scope to ship value early; can defend why X before Y.",
"measure": "% roadmap items shipped as scoped vs. bloated/late; documented prioritization rationale per cycle.",
"l5": "Ruthless scoping; MVPs ship fast and the 'why this first' is always defensible.",
"l3": "Reasonable priorities; some scope creep.",
"l1": "Everything is P0; nothing ships."
},
{
"unit": "Product",
"name": "Spec & Requirement Clarity",
"mandatory": false,
"definition": "Engineering rarely returns with 'what did you mean?'",
"measure": "Clarification rounds per spec (count from engineering); % specs accepted first pass.",
"l5": "Specs accepted first pass; engineers cite them as the standard.",
"l3": "1 clarification round typical.",
"l1": "Specs trigger meetings to decode; rework from ambiguity."
},
{
"unit": "Product",
"name": "Data & Experimentation",
"mandatory": false,
"definition": "Defines metrics before shipping, reads results honestly, iterates.",
"measure": "Experiments run with pre-defined success metrics (count); % with documented learnings regardless of outcome.",
"l5": "4+ experiments per half, all with pre-registered metrics and written learnings.",
"l3": "Tracks core metrics; occasional experiment.",
"l1": "Ships without metrics; success is vibes."
},
{
"unit": "Product",
"name": "Shipping Coordination",
"mandatory": false,
"definition": "Keeps features moving across engineering, design, and marketing to actual launch.",
"measure": "Features shipped vs. roadmap (%); launch checklist completion (announcement, docs, tracking live at launch).",
"l5": "Launches land complete — build, comms, and measurement together, on schedule.",
"l3": "Features ship; launch trimmings sometimes lag.",
"l1": "Features 'done' but never actually launched to users."
},
{
"unit": "Product",
"name": "Feedback Loop Closure",
"mandatory": false,
"definition": "User-reported issues and requests get triaged, decided, and answered.",
"measure": "% feedback items triaged within 1 week; loop-closed rate (user informed of outcome).",
"l5": "Every item triaged in days; users hear back — even on 'no'.",
"l3": "Major items handled; small ones drift.",
"l1": "Feedback goes into a void."
},
{
"unit": "Product",
"name": "Market & Competitor Awareness",
"mandatory": false,
"definition": "Knows the competing products and where the category is moving.",
"measure": "Competitor/market updates shared with team per month (count); feature decisions referencing competitive context.",
"l5": "Monthly competitive briefs; spots category shifts before they're obvious.",
"l3": "Aware of main competitors; checks occasionally.",
"l1": "Surprised by competitor launches users mention."
},
{
"unit": "Product",
"name": "North-Star Metric Ownership",
"mandatory": false,
"definition": "Owns the product's core metric — knows it cold and moves it.",
"measure": "Can state current north-star value and trend on demand (coach spot-check); initiatives tied to it (count) and measured lift.",
"l5": "Knows the number daily; every initiative maps to it; moved it this half.",
"l3": "Knows the metric; reviews it weekly.",
"l1": "Cannot state the current number."
},
{
"unit": "Coaches (Add-on)",
"name": "Coaching & Collaboration",
"mandatory": true,
"definition": "Grows coachees' capability while being a multiplier for the wider team — the coach's third fixed competency, replacing plain Collaboration.",
"measure": "Coachee half-yearly score trajectory (improving/holding); check-in completion rate (Form A count vs. schedule); handoff quality and help given across teams; coachee feedback on coaching quality.",
"l5": "Every coachee improving or solidly ≥3; check-ins never missed; coachees and teammates name them as a reason they're growing.",
"l3": "Check-ins mostly regular; coachees stable; cooperative across teams when asked.",
"l1": "Check-ins skipped; coachees stagnating; issues surface at review time as surprises."
},
{
"unit": "Coaches (Add-on)",
"name": "Feedback Quality & Candor",
"mandatory": false,
"definition": "Gives specific, timely, honest feedback — praise and correction both — instead of saving it for review day.",
"measure": "Coachee reports of receiving useful feedback during the half; specificity of review-form narratives; nothing at review is a surprise.",
"l5": "Feedback is concrete, timely, and actionable; hard messages delivered kindly and early.",
"l3": "Gives feedback when prompted; mostly specific.",
"l1": "Vague or absent feedback; reviews contain surprises."
}
],
"okrs": [
{
"unit": "AI & Engineering",
"objective": "Deliver client projects at a zero-rework quality bar",
"kr": "Ship 100% of committed sprint items for the half",
"source": "Sprint tracker: shipped / committed per fortnight"
},
{
"unit": "AI & Engineering",
"objective": "Deliver client projects at a zero-rework quality bar",
"kr": "≤1 post-delivery bug or rework request per project",
"source": "Client issue log per project"
},
{
"unit": "AI & Engineering",
"objective": "Deliver client projects at a zero-rework quality bar",
"kr": "Every delivered project has documentation + recorded handover demo",
"source": "Project checklist: docs link + demo recording on file"
},
{
"unit": "AI & Engineering",
"objective": "Stay at the frontier of AI tooling",
"kr": "Evaluate and internally demo 5 new models/frameworks this half",
"source": "Internal demo calendar; eval notes filed"
},
{
"unit": "AI & Engineering",
"objective": "Stay at the frontier of AI tooling",
"kr": "Apply at least 2 new models/frameworks in live client or product builds",
"source": "Named projects + PR/deploy evidence"
},
{
"unit": "AI & Engineering",
"objective": "Stay at the frontier of AI tooling",
"kr": "Publish 3 internal build-guides the team reuses",
"source": "Guide links + reuse instances counted"
},
{
"unit": "AI & Engineering",
"objective": "Cut delivery time through reusable assets",
"kr": "Build 3 reusable templates/components adopted by the team",
"source": "Asset repo; adoption count by other engineers"
},
{
"unit": "AI & Engineering",
"objective": "Cut delivery time through reusable assets",
"kr": "Reduce average project setup time from X days to Y days",
"source": "Time log: kickoff to first working build, per project"
},
{
"unit": "AI & Engineering",
"objective": "Cut delivery time through reusable assets",
"kr": "Standardise deployment: 100% of new projects on the standard pipeline",
"source": "Deploy config audit at half end"
},
{
"unit": "AI & Engineering",
"objective": "Keep production rock-solid",
"kr": "99%+ uptime on all owned client-facing services",
"source": "Monitoring dashboard (uptime tool)"
},
{
"unit": "AI & Engineering",
"objective": "Keep production rock-solid",
"kr": "Zero client-discovered incidents (we find issues first)",
"source": "Incident log: source of first report"
},
{
"unit": "AI & Engineering",
"objective": "Keep production rock-solid",
"kr": "Mean time to fix production issues < 24 hours",
"source": "Incident log timestamps"
},
{
"unit": "AI & Engineering",
"objective": "Grow into a client-facing engineer",
"kr": "Lead 3 client demos or workshop segments this half",
"source": "Session calendar + coach observation"
},
{
"unit": "AI & Engineering",
"objective": "Grow into a client-facing engineer",
"kr": "Client satisfaction ≥ 4.5/5 on sessions delivered",
"source": "Post-session feedback form"
},
{
"unit": "AI & Engineering",
"objective": "Grow into a client-facing engineer",
"kr": "Handle project scoping calls for 2 new deals alongside sales",
"source": "Deal records: scoping call attendance + notes"
},
{
"unit": "AI & Engineering",
"objective": "Automate the company's internal operations with AI agents",
"kr": "Build 3 internal automations adopted by other teams",
"source": "Automation registry + usage count by team"
},
{
"unit": "AI & Engineering",
"objective": "Automate the company's internal operations with AI agents",
"kr": "Save 10+ team-hours per week through automations",
"source": "Before/after time log, coach-verified"
},
{
"unit": "AI & Engineering",
"objective": "Automate the company's internal operations with AI agents",
"kr": "Document every automation so it survives without you",
"source": "Docs on file per automation"
},
{
"unit": "AI & Engineering",
"objective": "Build deep specialization in one AI domain (RAG / agents / voice / fine-tuning)",
"kr": "Complete 1 advanced build showcasing the specialization",
"source": "Repo/demo + internal presentation"
},
{
"unit": "AI & Engineering",
"objective": "Build deep specialization in one AI domain (RAG / agents / voice / fine-tuning)",
"kr": "Deliver 1 internal masterclass on the domain",
"source": "Session calendar + attendance"
},
{
"unit": "AI & Engineering",
"objective": "Build deep specialization in one AI domain (RAG / agents / voice / fine-tuning)",
"kr": "Become the named owner for that domain's client questions",
"source": "Question routing log; escalations handled solo"
},
{
"unit": "AI & Engineering",
"objective": "Raise the team's code review culture",
"kr": "Review 100% of assigned PRs within 24 hours",
"source": "PR timestamps"
},
{
"unit": "AI & Engineering",
"objective": "Raise the team's code review culture",
"kr": "Review comments rated useful by authors (≥4/5)",
"source": "Lightweight author feedback per review cycle"
},
{
"unit": "AI & Engineering",
"objective": "Raise the team's code review culture",
"kr": "Zero unreviewed merges to main",
"source": "Repo audit at half end"
},
{
"unit": "AI & Engineering",
"objective": "Cut infrastructure and API costs",
"kr": "Reduce monthly API/compute spend by X% at the same output",
"source": "Billing dashboards, month over month"
},
{
"unit": "AI & Engineering",
"objective": "Cut infrastructure and API costs",
"kr": "Implement caching/batching on the 2 highest-cost workflows",
"source": "Deploy evidence + cost delta"
},
{
"unit": "AI & Engineering",
"objective": "Cut infrastructure and API costs",
"kr": "Publish a monthly cost report to Leadership",
"source": "Report on file, 6/6 months"
},
{
"unit": "AI & Engineering",
"objective": "Build the company's public technical credibility",
"kr": "Publish 2 open-source repos/notebooks under the company",
"source": "GitHub links"
},
{
"unit": "AI & Engineering",
"objective": "Build the company's public technical credibility",
"kr": "Reach X combined stars/forks on published repos",
"source": "GitHub metrics"
},
{
"unit": "AI & Engineering",
"objective": "Build the company's public technical credibility",
"kr": "Support 3 content pieces with working code examples",
"source": "Published content + linked code"
},
{
"unit": "AI & Engineering",
"objective": "Strengthen data security & client compliance",
"kr": "100% client projects follow the data-handling checklist",
"source": "Checklist audit per project"
},
{
"unit": "AI & Engineering",
"objective": "Strengthen data security & client compliance",
"kr": "Zero client data incidents",
"source": "Incident log"
},
{
"unit": "AI & Engineering",
"objective": "Strengthen data security & client compliance",
"kr": "Document and get sign-off on the company's security practices doc",
"source": "Doc approved by Leadership"
},
{
"unit": "AI & Engineering",
"objective": "(Senior / Coach) Grow the interns",
"kr": "Complete 100% of monthly check-ins on schedule",
"source": "Form A count vs. calendar"
},
{
"unit": "AI & Engineering",
"objective": "(Senior / Coach) Grow the interns",
"kr": "Each coachee ships 1 independent project by half end",
"source": "Project log per coachee"
},
{
"unit": "AI & Engineering",
"objective": "(Senior / Coach) Grow the interns",
"kr": "Coachee feedback on coaching ≥4/5",
"source": "Anonymous pulse survey"
},
{
"unit": "Marketing & Growth",
"objective": "Turn organic content into a lead engine",
"kr": "Generate 300 marketing-qualified leads for workshops/cohorts this half",
"source": "Lead form + UTM tracking in CRM"
},
{
"unit": "Marketing & Growth",
"objective": "Turn organic content into a lead engine",
"kr": "Grow combined social following by 40%",
"source": "Platform analytics, start vs. end of half"
},
{
"unit": "Marketing & Growth",
"objective": "Turn organic content into a lead engine",
"kr": "Publish 24 blogs + 48 reels at ≥95% calendar adherence",
"source": "Content calendar: planned vs. published dates"
},
{
"unit": "Marketing & Growth",
"objective": "Win the AI news cycle",
"kr": "Publish reaction content within 24h for every major AI release (≥90% hit rate)",
"source": "News log vs. publish timestamps"
},
{
"unit": "Marketing & Growth",
"objective": "Win the AI news cycle",
"kr": "4 trend posts per month exceed 2x account-average engagement",
"source": "Platform analytics per post"
},
{
"unit": "Marketing & Growth",
"objective": "Win the AI news cycle",
"kr": "Grow X/LinkedIn impressions by 60% over the half",
"source": "Platform analytics"
},
{
"unit": "Marketing & Growth",
"objective": "Make video the company's highest-performing format",
"kr": "Ship 48 edited videos/reels on schedule",
"source": "Content calendar adherence"
},
{
"unit": "Marketing & Growth",
"objective": "Make video the company's highest-performing format",
"kr": "Lift average watch-through rate from X% to Y%",
"source": "Platform retention analytics, monthly trend"
},
{
"unit": "Marketing & Growth",
"objective": "Make video the company's highest-performing format",
"kr": "Raw-footage-to-publish turnaround ≤72h on 100% of videos",
"source": "Production log timestamps"
},
{
"unit": "Marketing & Growth",
"objective": "Fill the next cohorts/workshops",
"kr": "Drive 600 registrations via owned channels",
"source": "Registration source tracking (UTM)"
},
{
"unit": "Marketing & Growth",
"objective": "Fill the next cohorts/workshops",
"kr": "Landing page conversion rate ≥ X%",
"source": "Page analytics: visits to sign-ups"
},
{
"unit": "Marketing & Growth",
"objective": "Fill the next cohorts/workshops",
"kr": "Email sequences: open rate ≥40%, click rate ≥5%",
"source": "Email platform analytics"
},
{
"unit": "Marketing & Growth",
"objective": "Build repeatable campaign machinery",
"kr": "Run 4 end-to-end campaigns with documented post-mortems",
"source": "Campaign docs + post-mortems on file"
},
{
"unit": "Marketing & Growth",
"objective": "Build repeatable campaign machinery",
"kr": "Create a reusable launch playbook (checklist + asset templates)",
"source": "Playbook doc adopted for next launch"
},
{
"unit": "Marketing & Growth",
"objective": "Build repeatable campaign machinery",
"kr": "Cut campaign asset production time by 30% using AI tools",
"source": "Time log per asset, before vs. after"
},
{
"unit": "Marketing & Growth",
"objective": "Grow the newsletter into an owned audience",
"kr": "Grow subscribers from X to Y",
"source": "Email platform subscriber count"
},
{
"unit": "Marketing & Growth",
"objective": "Grow the newsletter into an owned audience",
"kr": "Maintain open rate ≥40% across the half",
"source": "Email platform analytics"
},
{
"unit": "Marketing & Growth",
"objective": "Grow the newsletter into an owned audience",
"kr": "Launch 1 lead magnet driving Z new signups",
"source": "UTM/source tracking"
},
{
"unit": "Marketing & Growth",
"objective": "Win search: SEO & blog rankings",
"kr": "Get 10 blogs ranking top-10 for target keywords",
"source": "Rank tracker report"
},
{
"unit": "Marketing & Growth",
"objective": "Win search: SEO & blog rankings",
"kr": "Grow organic sessions by X%",
"source": "Web analytics"
},
{
"unit": "Marketing & Growth",
"objective": "Win search: SEO & blog rankings",
"kr": "Publish 24 SEO-optimised blogs on calendar",
"source": "Calendar adherence + SEO checklist per post"
},
{
"unit": "Marketing & Growth",
"objective": "Grow YouTube long-form",
"kr": "Publish 16 long-form videos this half",
"source": "Channel upload log"
},
{
"unit": "Marketing & Growth",
"objective": "Grow YouTube long-form",
"kr": "Average view duration ≥ X minutes",
"source": "YouTube analytics"
},
{
"unit": "Marketing & Growth",
"objective": "Grow YouTube long-form",
"kr": "Grow subscribers by X%",
"source": "YouTube analytics"
},
{
"unit": "Marketing & Growth",
"objective": "Build an engaged community",
"kr": "Grow community members from X to Y",
"source": "Platform member count"
},
{
"unit": "Marketing & Growth",
"objective": "Build an engaged community",
"kr": "Weekly active participation ≥ X% of members",
"source": "Message/activity analytics"
},
{
"unit": "Marketing & Growth",
"objective": "Build an engaged community",
"kr": "Run 12 community events/AMAs",
"source": "Event log + attendance"
},
{
"unit": "Marketing & Growth",
"objective": "Lift website conversion",
"kr": "Improve landing page conversion from X% to Y%",
"source": "Page analytics: visits to sign-ups"
},
{
"unit": "Marketing & Growth",
"objective": "Lift website conversion",
"kr": "Run 6 A/B tests with documented results",
"source": "Test log with outcomes"
},
{
"unit": "Marketing & Growth",
"objective": "Lift website conversion",
"kr": "Resolve 100% of flagged UX/speed issues",
"source": "Site audit before vs. after"
},
{
"unit": "Marketing & Growth",
"objective": "Creator collabs & partnerships",
"kr": "Land 6 collaborations with relevant creators",
"source": "Published collab content"
},
{
"unit": "Marketing & Growth",
"objective": "Creator collabs & partnerships",
"kr": "Collab content reaches ≥X combined impressions",
"source": "Platform analytics"
},
{
"unit": "Marketing & Growth",
"objective": "Creator collabs & partnerships",
"kr": "2 cross-promotions drive measurable signups",
"source": "UTM/source tracking"
},
{
"unit": "Sales & Service",
"objective": "Hit revenue with a healthy pipeline behind it",
"kr": "Close ₹X in workshop/cohort/services revenue this half",
"source": "CRM: closed-won value"
},
{
"unit": "Sales & Service",
"objective": "Hit revenue with a healthy pipeline behind it",
"kr": "Maintain qualified pipeline ≥3x target at all times",
"source": "CRM pipeline report, checked monthly"
},
{
"unit": "Sales & Service",
"objective": "Hit revenue with a healthy pipeline behind it",
"kr": "100% of inbound leads contacted within 48 hours",
"source": "CRM timestamps: lead created vs. first touch"
},
{
"unit": "Sales & Service",
"objective": "Raise conversion at every stage",
"kr": "Lift proposal-to-close rate from X% to Y%",
"source": "CRM stage conversion report"
},
{
"unit": "Sales & Service",
"objective": "Raise conversion at every stage",
"kr": "Reduce average sales cycle from X to Y days",
"source": "CRM: created-to-closed duration"
},
{
"unit": "Sales & Service",
"objective": "Raise conversion at every stage",
"kr": "Keep average discount under X% of list price",
"source": "Deal records: final vs. list price"
},
{
"unit": "Sales & Service",
"objective": "Turn clients into repeat clients",
"kr": "Secure repeat or referral business from 30% of serviced accounts",
"source": "CRM: account history of closed deals"
},
{
"unit": "Sales & Service",
"objective": "Turn clients into repeat clients",
"kr": "Post-engagement CSAT ≥ 4.5/5 across all deliveries",
"source": "Post-engagement feedback form"
},
{
"unit": "Sales & Service",
"objective": "Turn clients into repeat clients",
"kr": "Log a relationship touchpoint with every past client each month",
"source": "CRM activity log"
},
{
"unit": "Sales & Service",
"objective": "(Customer Success) Make support a loyalty engine",
"kr": "Acknowledge 100% of client issues <24h; resolve 90% <5 days",
"source": "Issue tracker timestamps"
},
{
"unit": "Sales & Service",
"objective": "(Customer Success) Make support a loyalty engine",
"kr": "CSAT on resolved issues ≥ 4.5/5",
"source": "Post-resolution feedback"
},
{
"unit": "Sales & Service",
"objective": "(Customer Success) Make support a loyalty engine",
"kr": "Convert 6 support interactions into expansion conversations",
"source": "CRM: opportunities sourced from support"
},
{
"unit": "Sales & Service",
"objective": "Build outbound muscle",
"kr": "Add 60 qualified outbound opportunities to pipeline",
"source": "CRM: source = outbound"
},
{
"unit": "Sales & Service",
"objective": "Build outbound muscle",
"kr": "Book 24 discovery calls from outbound effort",
"source": "Calendar + CRM activity"
},
{
"unit": "Sales & Service",
"objective": "Build outbound muscle",
"kr": "Document a repeatable outbound playbook (ICP, sequences, scripts)",
"source": "Playbook doc reviewed by Leadership"
},
{
"unit": "Sales & Service",
"objective": "Crack corporate / B2B training accounts",
"kr": "Close X corporate training deals this half",
"source": "CRM: closed-won, segment = corporate"
},
{
"unit": "Sales & Service",
"objective": "Crack corporate / B2B training accounts",
"kr": "Build a target list of 50 companies with mapped decision-makers",
"source": "Account list on file"
},
{
"unit": "Sales & Service",
"objective": "Crack corporate / B2B training accounts",
"kr": "Hold 20 corporate discovery meetings",
"source": "Calendar + CRM activity"
},
{
"unit": "Sales & Service",
"objective": "Speed up the proposal machine",
"kr": "Proposal turnaround ≤48h from discovery call",
"source": "Timestamps: discovery to proposal sent"
},
{
"unit": "Sales & Service",
"objective": "Speed up the proposal machine",
"kr": "Build a proposal template library covering the top 3 offerings",
"source": "Templates on file, in use"
},
{
"unit": "Sales & Service",
"objective": "Speed up the proposal machine",
"kr": "Lift proposal win rate from X% to Y%",
"source": "CRM conversion report"
},
{
"unit": "Sales & Service",
"objective": "Reactivate dormant leads",
"kr": "Re-engage 150 dormant leads with a structured sequence",
"source": "CRM activity: sequence completion"
},
{
"unit": "Sales & Service",
"objective": "Reactivate dormant leads",
"kr": "Book 20 calls from the dormant list",
"source": "CRM: meetings from source = reactivation"
},
{
"unit": "Sales & Service",
"objective": "Reactivate dormant leads",
"kr": "Close ₹X from reactivated pipeline",
"source": "CRM: closed-won, source = reactivation"
},
{
"unit": "Sales & Service",
"objective": "Build the proof library",
"kr": "Collect 15 written client testimonials",
"source": "Testimonials on file with permission"
},
{
"unit": "Sales & Service",
"objective": "Build the proof library",
"kr": "Publish 4 case studies with hard metrics",
"source": "Published case studies"
},
{
"unit": "Sales & Service",
"objective": "Build the proof library",
"kr": "Record video testimonials from 3 marquee clients",
"source": "Video assets on file"
},
{
"unit": "Sales & Service",
"objective": "Keep cash healthy",
"kr": "Collect 90% of invoices within payment terms",
"source": "Finance tracker: invoice vs. payment dates"
},
{
"unit": "Sales & Service",
"objective": "Keep cash healthy",
"kr": "Reduce receivables older than 30 days to ₹X",
"source": "Monthly receivables report"
},
{
"unit": "Sales & Service",
"objective": "Keep cash healthy",
"kr": "Raise every invoice within 48h of milestone completion",
"source": "Invoice timestamps vs. delivery log"
},
{
"unit": "Sales & Service",
"objective": "Channel & partnership sales",
"kr": "Sign 3 referral/channel partners",
"source": "Signed agreements"
},
{
"unit": "Sales & Service",
"objective": "Channel & partnership sales",
"kr": "Generate ₹X partner-sourced pipeline",
"source": "CRM: source = partner"
},
{
"unit": "Sales & Service",
"objective": "Channel & partnership sales",
"kr": "Run 2 joint webinars/events with partners",
"source": "Event log + registrations"
},
{
"unit": "Product",
"objective": "Make the learning habit stick",
"kr": "Lift D7 retention from X% to Y%",
"source": "Product analytics cohort report"
},
{
"unit": "Product",
"objective": "Make the learning habit stick",
"kr": "Grow weekly active learners from X to Y",
"source": "Product analytics"
},
{
"unit": "Product",
"objective": "Make the learning habit stick",
"kr": "Lift activation (signup → first session complete) from X% to Y%",
"source": "Funnel analytics"
},
{
"unit": "Product",
"objective": "Ship the roadmap with first-pass clarity",
"kr": "Ship 8 prioritized roadmap features on schedule",
"source": "Roadmap tracker: planned vs. shipped"
},
{
"unit": "Product",
"objective": "Ship the roadmap with first-pass clarity",
"kr": "≥80% of specs accepted by engineering without a clarification round",
"source": "Engineering feedback per spec"
},
{
"unit": "Product",
"objective": "Ship the roadmap with first-pass clarity",
"kr": "Every launch goes out with announcement + tracking live on day 1",
"source": "Launch checklist per feature"
},
{
"unit": "Product",
"objective": "Learn faster than we build",
"kr": "Run 4 experiments with pre-defined success metrics",
"source": "Experiment docs: hypothesis + metric set before launch"
},
{
"unit": "Product",
"objective": "Learn faster than we build",
"kr": "Document learnings for 100% of experiments, win or lose",
"source": "Learnings log"
},
{
"unit": "Product",
"objective": "Learn faster than we build",
"kr": "Conduct 20 user conversations and publish insight summaries",
"source": "Interview notes + summary docs"
},
{
"unit": "Product",
"objective": "Close the loop with users",
"kr": "Triage 100% of user feedback within 1 week",
"source": "Feedback tracker timestamps"
},
{
"unit": "Product",
"objective": "Close the loop with users",
"kr": "Ship fixes for the top 10 user-reported issues",
"source": "Issue tracker: reported vs. shipped"
},
{
"unit": "Product",
"objective": "Close the loop with users",
"kr": "Reply to every feature request with a decision (yes/no/later)",
"source": "Feedback tracker: loop-closed status"
},
{
"unit": "Product",
"objective": "Convert learners to paying users",
"kr": "Lift free-to-paid conversion from X% to Y%",
"source": "Billing + funnel analytics"
},
{
"unit": "Product",
"objective": "Convert learners to paying users",
"kr": "Run 2 pricing/paywall experiments with documented results",
"source": "Experiment log"
},
{
"unit": "Product",
"objective": "Convert learners to paying users",
"kr": "Grow MRR from ₹X to ₹Y",
"source": "Billing dashboard"
},
{
"unit": "Product",
"objective": "Reduce churn",
"kr": "Cut monthly churn from X% to Y%",
"source": "Product analytics"
},
{
"unit": "Product",
"objective": "Reduce churn",
"kr": "Exit survey on 100% of churned users, with monthly insight summaries",
"source": "Survey log + summaries"
},
{
"unit": "Product",
"objective": "Reduce churn",
"kr": "Launch a win-back flow recovering X% of churned users",
"source": "Analytics: reactivation cohort"
},
{
"unit": "Product",
"objective": "Strengthen the in-app content engine",
"kr": "Publish 100 new learning cards live in-app",
"source": "CMS count"
},
{
"unit": "Product",
"objective": "Strengthen the in-app content engine",
"kr": "Card completion rate ≥ X%",
"source": "Product analytics"
},
{
"unit": "Product",
"objective": "Strengthen the in-app content engine",
"kr": "Average user content rating ≥ 4/5",
"source": "In-app rating data"
},
{
"unit": "Product",
"objective": "Own the analytics foundation",
"kr": "Event tracking live for 100% of core user actions",
"source": "Tracking plan audit"
},
{
"unit": "Product",
"objective": "Own the analytics foundation",
"kr": "Weekly metrics dashboard auto-published to the team",
"source": "Dashboard link + publish log"
},
{
"unit": "Product",
"objective": "Own the analytics foundation",
"kr": "Resolve any data discrepancy within 1 week",
"source": "Data issue log"
},
{
"unit": "Product",
"objective": "Grow app store presence",
"kr": "Reach rating ≥4.5 with X new reviews",
"source": "Store listing metrics"
},
{
"unit": "Product",
"objective": "Grow app store presence",
"kr": "Improve store conversion (views → installs) by X%",
"source": "Store analytics"
},
{
"unit": "Product",
"objective": "Grow app store presence",
"kr": "Ship 2 store-listing experiments (screenshots, copy)",
"source": "Experiment log"
},
{
"unit": "Coaches (Add-on)",
"objective": "Run the coaching rhythm flawlessly",
"kr": "Complete 100% of monthly Form A check-ins on schedule",
"source": "Form A count vs. calendar"
},
{
"unit": "Coaches (Add-on)",
"objective": "Run the coaching rhythm flawlessly",
"kr": "Submit all Half-Yearly Review Forms before the calibration deadline",
"source": "Submission log"
},
{
"unit": "Coaches (Add-on)",
"objective": "Run the coaching rhythm flawlessly",
"kr": "Every competency score backed by written evidence",
"source": "Calibration audit"
},
{
"unit": "Coaches (Add-on)",
"objective": "Grow my coachees measurably",
"kr": "Every coachee's half-yearly score improves or holds ≥3",
"source": "Score records vs. prior half"
},
{
"unit": "Coaches (Add-on)",
"objective": "Grow my coachees measurably",
"kr": "One development action completed per coachee this half",
"source": "Action log from review forms"
},
{
"unit": "Coaches (Add-on)",
"objective": "Grow my coachees measurably",
"kr": "Coachee feedback on coaching quality ≥4/5",
"source": "Anonymous pulse survey"
}
]
};
