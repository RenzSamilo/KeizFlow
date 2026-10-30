---
description: That last message didn't land. Re-explain it in plain English, with the context you're missing.
argument-hint: "[optional: the word or part you didn't get]"
---

The user didn't understand your last message. Explain it again so it lands.

What the user said (may be empty): $ARGUMENTS

1. Read `docs/glossary.md` first and use its words for things.
2. Start with the point in one sentence: what happened, or what you need from them.
3. Then give the missing context: where you are in the work and why this matters to them.
4. Talk like one person to another. Short sentences, common words, one idea per sentence. No jargon, no abbreviations, no file paths or commands unless the user must type them.
5. If a technical term can't be avoided, explain it in one plain sentence the first time you use it.
6. Keep it shorter than the message you're re-explaining.

Then update `docs/glossary.md`: add every technical term you just had to explain that isn't there yet, one plain sentence each, in alphabetical order. Don't change terms that are already there. Say in one line which terms you added, or say nothing if none.

If `$ARGUMENTS` names a word or part, explain only that part.

Based on `wait-what` from [mattpocock/skills](https://github.com/mattpocock/skills) and `bro` from [pstack](https://github.com/cursor/plugins/tree/main/pstack) (both MIT).
