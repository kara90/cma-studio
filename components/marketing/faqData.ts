/**
 * FAQ content — a PLAIN (non-'use client') module so both the client Faq
 * accordion and the server /faq page can import the real array. (Exporting data
 * from a 'use client' file gives server importers a client *reference*, not the
 * array, which breaks server-side JSON-LD generation.)
 */

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqGroup {
  label: string;
  items: readonly FaqItem[];
}

export const GROUPS: readonly FaqGroup[] = [
  {
    label: 'Getting started',
    items: [
      {
        q: 'What is CMA Studio, and how is it different from credit platforms?',
        a: 'CMA Studio is one clean cockpit for the strongest AI video, image and audio models, built by filmmakers. Credit platforms resell compute in bundles that expire; we charge a low flat fee for the software and your renders run on your own fal.ai key at fal’s own rate. Nothing evaporates at the end of the month.',
      },
      {
        q: 'What do I need to start?',
        a: 'Three things: a CMA account, an active plan, and a fal.ai API key. That is the whole setup, and the Studio walks you through each step the first time you sign in.',
      },
      {
        q: 'What is a fal key and is it hard to set up?',
        a: 'It is a free account credential from fal.ai, the infrastructure our renders run on. Setup takes about five minutes once. Full walkthrough in the key guide.',
      },
      {
        q: 'Is it safe to paste my key here?',
        a: 'Yes. Your key is used only at render time to call the model on your behalf and is never stored on our servers. You can revoke or rotate it in your fal dashboard whenever you like.',
      },
      {
        q: 'Which models are available?',
        a: 'Video: Seedance 2, Kling 3 Pro, Veo 3.1 and Veo 3.1 Fast, Hailuo 2.3, Wan 2.5, LTX-2, Seedance 1.5 Pro and the Kling 2.x line. Image: Nano Banana Pro, Seedream 5 Pro and Lite, Seedream 4.5, FLUX.2 Pro, Ideogram V3, FLUX 1.1 Ultra, Recraft V4.1, Nano Banana 2 and GPT Image 2. Audio covers music, voiceover and sound design with ElevenLabs, Lyria 2, Stable Audio 2.5 and more. Every listed model is verified live on fal before we offer it, and the lineup keeps growing as strong new models land.',
      },
    ],
  },
  {
    label: 'Costs',
    items: [
      {
        q: 'What does the subscription cover, and what does fal bill me?',
        a: 'The subscription covers the software: unlimited use of the interface, your Library, your retention window, and your included engine generations (500 a month on Filmmaker, 750 a month on Pro; Starter is the clean interface over fal and sends your prompts as written, without the engine). Compute is separate. fal bills your own account for each render at fal’s rate, and we never touch or mark up that charge.',
      },
      {
        q: 'How much does a render cost?',
        a: 'It depends on the model, the length, the resolution and whether sound is on. The plain generator pages show an approximate cost hint for the selected model, and the pricing page lists indicative fal rates for the most-used models, so you know roughly what a shot costs before you commit. fal bills you at fal’s own rate, with no markup from us.',
      },
      {
        q: 'Can my bill surprise me?',
        a: 'It is built not to. Our software fee is flat and known upfront, compute is pay-per-render on your own key, and cost guidance lives on the generator pages and the pricing page. Nothing runs until you press the button.',
      },
      {
        q: 'Do prices ever change?',
        a: 'Your rate is locked: the price you subscribe at stays your price for as long as you stay subscribed. Any future price change applies to new subscribers only. Plans cover today’s toolset and may evolve as new tools join the family, always announced ahead of your next billing cycle.',
      },
      {
        q: 'What about refunds?',
        a: 'Monthly plans cancel anytime: you keep access to the end of the paid month and are never charged again. Yearly plans are a one-year commitment and are non-refundable: at checkout you request immediate access to the Service and acknowledge that the withdrawal right ends once it begins, except where a law that cannot be waived says otherwise. One exception is ours: if the platform stops working for an extended period, we refund the unused time pro-rata. Compute is billed by fal.ai on your own key, so it is never ours to refund. The full rules live in the Refund & Cancellation Policy.',
      },
      {
        q: 'Why does this cost less for most people?',
        a: 'Not because any single render is cheaper — the best models cost what they cost everywhere. It is because we do not mark up compute and nothing expires: you pay fal directly at their published rate, only when you actually render. On credit platforms you buy a pack whether you create or not, and unused credits vanish every month, so most people pay for renders they never make. Our margin is on the software, never on your renders.',
      },
      {
        q: 'What counts as a Cinematographer generation?',
        a: 'One engine call. Each time the Cinematographer engine composes or recomposes a prompt for you, that is one generation. Raw renders on your own key are never counted.',
      },
      {
        q: 'What happens if I use all my engine generations?',
        a: 'You can keep rendering with your own prompts on your key, upgrade your tier, or wait for your monthly refresh. Nothing expires and nothing is charged automatically.',
      },
      {
        q: 'What happens when CMA launches new tools?',
        a: 'Your rate never goes up. Lightweight tools join your plan at no charge. Tools that use the engine draw from your monthly generation pool. Heavy standalone products may launch with their own optional pricing, always announced before your next billing cycle, and never required.',
      },
    ],
  },
  {
    label: 'Rendering',
    items: [
      {
        q: 'Can I control the first and last frame of a shot?',
        a: 'Yes. Drop a start frame into any video generator and the platform automatically switches to that model’s image-to-video mode; on models that support it (Seedance 2, Kling, Veo 3.1) you can pin an end frame too and the model builds the transition between them. Image models accept a reference image the same way.',
      },
      {
        q: 'Can a generation be blocked or fail?',
        a: 'Yes. Every model enforces its own content rules and can decline a request, and even a clean request can occasionally miss. A blocked or imperfect generation may still consume compute on your fal account; that charge sits between you and the model provider, so it is not something we can refund.',
      },
      {
        q: 'Will every render match what I imagined?',
        a: 'Not every one, on any platform. AI still misses sometimes. The Studio’s Cinematographer engine narrows that gap with real cinematography language, which is why it tends to land the shot in fewer tries.',
      },
      {
        q: 'What is the difference between the plain generators and the Studio?',
        a: 'The generators send your prompt to the model exactly as written, clean and unfiltered. The Studio compiles real cinematography server side: camera, lens, film stock and lighting choices engineered into the prompt before it ever reaches the model.',
      },
      {
        q: 'Can I use start frames, end frames, or sound?',
        a: 'Yes. Supported video models accept a start frame, several accept an end frame too, and image models can take reference images. Sound can be toggled wherever the model supports it, and turning it on can change the compute price shown before you render.',
      },
    ],
  },
  {
    label: 'Your work',
    items: [
      {
        q: 'How long are my renders kept?',
        a: 'Retention runs by plan tier, about 30 days on Starter, about 90 days on Filmmaker and about 1 year on Pro, with fair use. fal deletes its own copies after about 7 days, so your Library is where your work actually lives. Download anything you want to keep offline.',
      },
      {
        q: 'Where do I find everything I made?',
        a: 'In your Library. Every render is cached and indexed there and synced to your account, so you can sign in from any device and pick up exactly where you left off.',
      },
      {
        q: 'Who owns what I make?',
        a: 'Your prompts and your outputs are yours, to the extent the model providers allow. We never claim rights over your work.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes, in a couple of clicks. Your access and your storage run to the end of the period you paid for, so you have time to download everything you want to keep.',
      },
    ],
  },
];
