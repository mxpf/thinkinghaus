---
id: "74bf8489-c7fd-485a-9104-3e41c244a486"
publicPath: "over-the-loop.md"
aliases: []
title: "Over the loop"
slug: over-the-loop
date: 2026-09-12
status: published
publishedAt: 2026-09-12T04:44:56Z
updatedAt: 2026-09-17T18:19:06.584Z
sourceLabel: "Read “The Workflow Is an Alibi”"
sourceHref: "https://firstchurchofthesingularity.com/sermons/2026-09-11"
---

[The First Church of the Singularity](https://firstchurchofthesingularity.com/about) is a fascinating art project that publishes AI-generated “sermons” about technology and the world around it. It’s a whole rabbit hole to spend time in, but for now I want to start with one sentence from their [“The Workflow Is an Alibi”](https://firstchurchofthesingularity.com/sermons/2026-09-11):

> Responsibility survives at every step in quantities too small for anyone to possess it.

This particular sermon is about automation, but not really the familiar problem of a machine being allowed to make important decisions all by itself. Its more unsettling (and common) case is a system in which plenty of humans remain very much involved. The machine recommends. A person reviews. Another approves. Another implements. There are policies, thresholds, audit logs…and yet things can happen that none of them quite decided.

There is a comforting phrase for the systems designed to prevent this: human in the loop. Whatever the software is doing, a person remains somewhere in the process, able to exercise judgment before the decision becomes a real thing.&#x20;

Between 2013 and 2015, the State of Michigan’s MiDAS unemployment system automatically identified people it believed had committed unemployment fraud and, for a period, could resolve those cases without human intervention. The state eventually [went back through tens of thousands of cases](https://www.michigan.gov/leo/news/2017/08/11/michigans-unemployment-agency-completes-review-of-fraud-determination-cases-comprehensive-changes-u). Out of more than 40,000 fraud findings originally resolved by computer, 85% were reversed.

Well, this is why a human belongs in the loop, right?

Well... Michigan also reviewed another 22K cases that had been initiated by the computer and then referred to an investigator. [44% of those fraud findings were reversed too](https://www.michigan.gov/leo/news/2017/08/11/michigans-unemployment-agency-completes-review-of-fraud-determination-cases-comprehensive-changes-u).

These were different sets of cases, so we can’t say how much the investigators helped. But their involvement didn’t prevent thousands of fraud findings that the state later reversed.

By the time a person sits down in front of their APPROVE button (or their Exec-u-Calm™ Decision Make[r](https://mitxela.com/projects/execucalm)) , a lot has already happened. A system decided which information is relevant. A model has assigned a score. Somebody determined the threshold at which that score becomes suspicious. A queue placed this case ahead of that one. The UI chose what to prioritize and what to bury. A policy has established which actions are considered “normal.” Then we point to the domino at the end of the chain and say: all good, there’s a human in the loop.

![Sam Lowry leans over a desk, turning the crank of a small decision-making machine that drops a suspended weight toward “Yes” or “No.”](/images/over-the-loop-f882511f.jpg "Sam Lowry’s executive decision maker in *Brazil* (1985), directed by Terry Gilliam. Film still via [mitxela](https://mitxela.com/projects/execucalm). Copyright remains with the film’s respective rights holders.")

Can this person understand where the recommendation came from? Do they have enough time to disagree? [Is disagreement operationally realistic?](https://www.gov.uk/government/publications/cdei-publishes-review-into-bias-in-algorithmic-decision-making/main-report-cdei-review-into-bias-in-algorithmic-decision-making) It might technically be possible to reject something, but if I’m working inside a process that makes rejection unusual, expensive, slow, or professionally risky, it gets tricky.

Obviously, [decisions are distributed on purpose all the time](https://www.who.int/news-room/questions-and-answers/item/safe-surgery-saves-lives-frequently-asked-questions). Surgeons don’t manufacture drugs, maintain imaging machines, establish hospital safety policies, or personally verify every instrument before operations. Aviation is full of [overlapping procedures, automated systems, and people responsible for different pieces of the same flight](https://www.faa.gov/regulations_policies/advisory_circulars/index.cfm/go/document.information/documentid/1030486).

So the problem isn’t that nobody possesses the entire decision. The issue is whether somebody is responsible for how the pieces behave together.

If hundreds of employees repeatedly approve recommendations from a system, somebody needs to notice what the pattern of approvals, overrides, appeals, and reversals says about the machinery producing them. The exception cannot always be treated as an isolated failure by the person who happened to touch the case last.

A [2020 UK government review of algorithmic decision-making](https://www.gov.uk/government/publications/cdei-publishes-review-into-bias-in-algorithmic-decision-making/main-report-cdei-review-into-bias-in-algorithmic-decision-making) makes a distinction between humans in the loop and humans over the loop: people who understand the system well enough to monitor the fairness and effectiveness of the whole decision process and who carry responsibility for it.

A person over the loop is able to reconstruct how choices become possible. Who chose these inputs? Who set this threshold? Who decided what our reviewers would see?

The person in the loop encounters a case. The person over the loop needs to encounter the system, to see what the chain of dominos is doing.

To bring it over to design for a minute, the idea of designing systems rather than iterating on artifacts is not new. Grid systems, style sheets, brand guidelines: we’re used to thinking about how individual choices add up to something larger.

If approving a recommendation takes one click, but questioning it means digging through supporting information and writing a justification, we’ve made agreement easier than disagreement. Requiring a justification can be reasonable. But if the extra work discourages reviewers from raising valid objections, we risk building a [dark pattern](https://deceptive.design/types/obstruction/). These are crucial design decisions about how judgment gets exercised, and we’ve made them before a reviewer ever sees a case.

Which means our responsibility has to extend beyond the click. We need to sit shotgun while people use the thing. See whether they can or will challenge it. And see whether those challenges can reach anyone with the authority to do something about it.
