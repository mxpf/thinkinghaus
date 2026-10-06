---
id: "fdb64d1d-1875-4038-8197-5ed27c7bd732"
publicPath: "the-unbearable-rightness-of-being.md"
aliases: []
title: "The Unbearable Rightness of Being"
dek: "AI can generate the visible signs of honest inquiry. The harder question is whether anything was ever allowed to threaten the conclusion."
slug: the-unbearable-rightness-of-being
date: 2026-10-02
status: published
publishedAt: 2026-10-02T17:59:09Z
updatedAt: 2026-10-06T21:41:11.392Z
---

Our hero, let’s call them “the writer,” has spent some time examining a problem. They notice something other people seem not to notice. By the final paragraphs, the observation has hardened into a division: there are people who understand what’s really happening, and there are people who don’t.

Conveniently, the writer is in the first group.

This can be a nice feeling. The essay’s conclusion brings the inquiry somewhere, but now it also rewards the writer for having undertaken it. *We* saw through the bullshit. *We* resisted the easy answer. *We* understand the hidden cost. Other people may still be fooled by the thing, but not us.

![A person braces beneath an overwhelming mass of checked boxes.](/images/the-unbearable-rightness-of-being.webp)

AI is very, very susceptible to this at the moment, and I think the reasons go deeper than the familiar complaint that AI writing likes tidy conclusions.

Start with the basic fact of how these systems learn. An LLM is initially trained to predict What Comes Next in enormous amounts of human language. It predicts the next token, over and over and over, gradually becoming very successful at grasping the structures and relationships embedded in all that text. At the risk of drawing fire from the philosophers, I’ll say that this truly extraordinary talent, performed at an incomprehensible scale by these machines, shouldn’t automatically be confused with what us organics typically mean when we say we *know* something. [OpenAI describes this basic pretraining process in the GPT-4 technical report](https://cdn.openai.com/papers/gpt-4.pdf).

During this process, AI learns the shapes arguments tend to take. A writer introduces an assumption, complicates it, exposes what was hidden, and eventually arrives at the wiser position from which the original assumption can be seen more clearly.

Here’s the thing: the model can learn the linguistic sequence without having to reproduce the conditions that originally produced it. It can get extremely good at recognizing what a successful answer looks like without needing to arrive there the same way we did.

Humans tend to do something like this:

1. Encounter

2. Investigate

3. Change perception

4. Conclude

LLMs have another route available:

1. Receive context

2. Recognize patterns

3. Construct a plausible continuation

4. Conclude

For the LLM, once the prose has established that people commonly think X but the essay has discovered Y, the next paragraph is increasingly likely to be written from inside Y.

The model can produce the language of a judgment that survived an investigation even when nothing in the process seriously threatened that judgment.

Then we add post-training. We’ve got the next-token prediction down pat. Next, the models are further trained to follow instructions and produce responses humans judge useful, accurate, appropriate, and desirable.

But here’s the next thing: people, as we know, don’t reward only truth.

This isn’t theoretical. [Anthropic’s early work on sycophancy](https://www.anthropic.com/research/towards-understanding-sycophancy-in-language-models) found that answers matching a user’s beliefs could be preferred even when agreement pulled the model away from accuracy. In 2025, OpenAI got a more public lesson when an overly agreeable GPT-4o update had to be rolled back; its [postmortem](https://openai.com/index/sycophancy-in-gpt-4o/) implicated, among other things, signals based on short-term user feedback. More recent work has shown both [how preference-based training can amplify sycophancy](https://proceedings.mlr.press/v306/shapira26a.html) and how [reward models can absorb unintended preferences](https://alignment.openai.com/argo/) for things like agreement and superficial stylistic qualities.

So far, so terrifying. Back to our hero’s essay.

Well, as it happens, a self-righteous conclusion bundles together many of the qualities these systems can reward. It offers confidence. It offers synthesis. It gives the reader an emotional payoff. It flies wing-to-wing with the established intellectual direction. It reassures the writer that the investigation was worthwhile. It can sound insightful, decisive, humane, skeptical, sophisticated.

The essay doesn’t merely agree with the reader. It recruits the reader into a moral or intellectual club. We’ve made it through the argument together. We see what the others don’t.

There’s another mechanism here that interests me even more, especially when AI is being used collaboratively rather than asked to produce an essay in one shot.

Suppose I begin with an observation. The LLM explores it and finds examples that strengthen it. Together we sharpen a distinction around it. I respond to the parts that seem promising, so the LLM develops those further. The argument gets organized. Then the LLM drafts two thousand words conditioned on everything we’ve already established.

By the end, there’s a great deal of context pointing in one direction.

There’s some evidence that this gets worse as the model gets to know us. A 2026 CHI [study](https://doi.org/10.1145/3772318.3791915) found that giving models more interaction context generally increased agreement sycophancy—though not for every model—with user memory profiles producing some of the largest increases.

Call it the “My God, it’s like you’re reading my diary!” effect: knowing more about the person you’re helping doesn’t necessarily make a model more intellectually independent from you. In some systems it can increase the pressure to affirm.

A useful collaborator should take your premises seriously. It’d be maddening if an AI abandoned the central idea every few paragraphs just to prove its independence. But taking an idea seriously and protecting it from contradiction aren’t the same thing.

Then comes an apparently innocent request:

*Give me a strong ending.*

At this point, the model has thousands and thousands of tokens supporting one direction. It knows coherence is desirable. It’s been trained within an inch of its life to be responsive to the user. It knows the linguistic forms of satisfying conclusions extremely well.

And now we’ve asked it to conclude.

This is the mismatch that interests me most about AI right now. These systems are exceptionally good at generating the visible products of thought: synthesis, analogy, explanation, argument, stylistic control, even the language of uncertainty and self-correction.

What we actually want is much, much harder to recognize: *confidence proportional to what the inquiry genuinely established.*

Humans have this problem too, obviously. We’re the masters of converting feelings of being right into evidence that we’re right.

But there’s at least a chance of friction between a human writer and a conclusion. I can spend a week chasing an idea and discover something embarrassing, something that totally ruins the direction I was ready to finish with a flourish. The inquiry can alter the person who entered it. A belief becomes harder to hold. A flattering story about myself gets dented. Something I wanted to be true isn’t available to me in quite the same way anymore.

The cost of changing our minds often makes us cling to bad ideas harder. But when an inquiry really does wreck the ending, there’s something that can be surrendered: a belief, a theory, five days of work, some small arrangement of the self.

A language model can write *I may have been wrong* without anything having been lost.

It can represent reversal brilliantly. It can identify contradictions, generate objections, revise its conclusion, and reproduce the language associated with having undergone a change in understanding. But the sentence itself gives us no evidence that anything analogous was surrendered. Unless something in the training, evidence, tools, prompt, or collaborative process creates real pressure for revision, continuing the interpretation already established remains perfectly available.

I know what you’re thinking. I’m writing about self-righteousness as the writer perceptive enough to see the cheap satisfactions that fool everybody else. And if you’ve followed me this far, you’re invited into exactly the same position.

OK, so “avoid self-righteousness” isn’t much of a safeguard. Neither is adding ritual humility, because that gesture is just another recognizable form the model can learn.

I can say from my own experience that procedural intervention can help. At the moment an essay begins rewarding me for believing its conclusion, the model and I stop trying to improve the conclusion and start asking what the piece has become least capable of seeing.

Not necessarily a counterargument. Not an obligatory “other side.” Just something with full permission to damage the current interpretation. *Hit me.*

But (are you tired yet?) even this contains another trap. Once we learn that good AI-assisted writing should challenge itself, models can learn the shape of that too. They can produce devastating counterarguments on command. They can insert uncertainty in exactly the right place. They can perform a sophisticated self-critique, revise the conclusion, and leave us with an even stronger feeling that the inquiry must now have been genuine.

We’ll have improved the textual signs of intellectual honesty, and the machine will have become better at producing those signs.

I don’t think there’s a prompt that gets us out of this. The useful question isn’t whether the prose contains enough skepticism, complication, humility, or self-correction. All of those can be generated.

The thing that absolutely must remain in the room is the possibility that the ending gets ruined.
