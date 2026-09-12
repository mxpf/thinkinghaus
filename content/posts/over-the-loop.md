---
title: "Over the loop"
slug: over-the-loop
date: 2026-09-12
status: published
publishedAt: 2026-09-12T04:44:56Z
updatedAt: 2026-09-12T14:14:30Z
sourceLabel: "Read “The Workflow Is an Alibi”"
sourceHref: "https://firstchurchofthesingularity.com/sermons/2026-09-11"
---

The First Church of the Singularity is an art project that publishes AI-generated “sermons” about technology and the world around it. I want to start with one sentence from their [“The Workflow Is an Alibi”](https://firstchurchofthesingularity.com/sermons/2026-09-11):

> «*Responsibility survives at every step in quantities too small for anyone to possess it.*»

This particular sermon is about automation, but not really the familiar problem of a machine being allowed to make an important decision by itself. Its more unsettling case is a system in which plenty of humans remain very much involved. The machine recommends. A person reviews. Another approves. Another implements. There are policies, thresholds, and audit logs. And yet something can happen that none of them quite decided.

There is a comforting phrase for systems designed to prevent this: human in the loop. Whatever the software is doing, a person remains somewhere in the process, able to exercise judgment before the decision becomes a real thing.

About ten years ago, the State of Michigan’s [MiDAS unemployment system](https://www.michigan.gov/leo/news/2017/08/11/michigans-unemployment-agency-completes-review-of-fraud-determination-cases-comprehensive-changes-u) automatically identified people it believed had committed unemployment fraud and, for a period, could resolve those cases without human intervention. The state eventually went back through tens of thousands of cases. Out of more than 40,000 fraud findings originally resolved by computer, 85% were reversed.

Well, this is why a human belongs in the loop, right?

Well... Michigan also reviewed another 22,000 cases that had been initiated by the computer and then referred to an investigator. 44% of those fraud findings were reversed too.

Better? But not great.

By the time a person sits down in front of the big green APPROVE button, a lot has already happened. A system has decided which information is relevant. A model has assigned a score. Somebody has determined the threshold at which that score becomes suspicious. A queue has placed this case ahead of that one. The UI has chosen what to prioritize and what to bury. A policy has established which actions are considered “normal.” Then we point to the domino at the end of the chain and say: human in the loop.

Can this person understand where the recommendation came from? Do they have enough time to disagree? Is disagreement operationally realistic? It might technically be possible to reject something, but if I’m working inside a process that makes rejection unusual, expensive, slow, or professionally risky, it gets tricky.

Decisions are distributed on purpose all the time. A surgeon does not manufacture the drug, maintain the imaging machine, establish hospital safety policy, interpret every laboratory result, and personally verify every instrument before an operation. Aviation is full of overlapping procedures, independent checks, specialized roles, automated systems, and people responsible for different pieces of the same flight.

So the problem cannot simply be that nobody possesses the entire decision. The question is whether somebody is responsible for how the pieces behave together.

If hundreds of employees repeatedly approve recommendations from a system, somebody needs to notice what the pattern of approvals, overrides, appeals, and reversals says about the machinery producing them. The exception cannot always be treated as an isolated failure by the person who happened to touch the case last.

A [UK government review of algorithmic decision-making](https://www.gov.uk/government/publications/cdei-publishes-review-into-bias-in-algorithmic-decision-making/main-report-cdei-review-into-bias-in-algorithmic-decision-making) drew a distinction between a human in the loop and humans over the loop: people who understand the system well enough to monitor the fairness and effectiveness of the whole decision process and who carry responsibility for it.

The person in the loop encounters a case.

The person over the loop has to encounter the system.

They need to be able to reconstruct how a choice became possible. Who chose these inputs? Who set this threshold? Who decided what our reviewers would see?

They aren’t just the last domino. Their job is to see what the chain is doing.
