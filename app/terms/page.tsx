/**
 * TEMPLATE ONLY. This document is not legal advice. Sebastien must have a
 * licensed attorney review and approve every clause before launch.
 *
 * app/terms/page.tsx - Terms of Service for CMA Studio.
 * Facts anchored to the codebase: BYOK (components/studio/ApiKeyVault.tsx:
 * key lives in the browser, sent per render, never stored server-side),
 * uploaded frames go from the browser straight to fal storage on the user's
 * own key (lib/falUpload.ts; data-URI fallback transits our pipeline but is
 * never stored), retention by tier (lib/retention.ts / lib/plans.ts), flat
 * Stripe subscription, compute billed by fal.ai directly to the user.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { OPERATOR_IDENTITY } from '@/lib/legal';
import { TrademarkNotice } from '@/components/TrademarkNotice';

export const metadata: Metadata = {
  title: 'Terms of Service | CMA Studio',
  description:
    'The terms that govern CMA Studio: a flat software subscription, compute billed by fal.ai directly to you on your own key, your sole responsibility for prompts, uploads and outputs, model provider content rules, and render retention by plan tier.',
};

/** A section body is a sequence of paragraphs (string) and bullet lists (string[]). */
type Block = string | string[];

interface LegalSection {
  title: string;
  blocks: Block[];
}

const SECTIONS: LegalSection[] = [
  {
    title: 'Acceptance of These Terms',
    blocks: [
      'These Terms of Service (the "Terms") are a binding agreement between you and CineMaster Academy ("CineMaster Academy", "we", "us" or "our") governing your access to and use of CMA Studio, including our websites, applications, render pipeline and related services (together, the "Service"). You accept these Terms by checking the agreement box when you create your account, and you reaffirm that acceptance by purchasing a subscription or continuing to use the Service. We record the date and the version of the Terms you accepted. If you do not agree to them, do not use the Service.',
      OPERATOR_IDENTITY,
      'If you use the Service on behalf of a company or another legal entity, you represent that you have the authority to bind that entity, and "you" refers to both you and that entity.',
    ],
  },
  {
    title: 'The Service',
    blocks: [
      'CMA Studio is a software layer. It provides a professional interface, server-side prompt engineering and a render library on top of third-party AI models that are hosted and served by fal.ai and its model partners (the "Model Providers"). We are not the model provider. We do not host, train or operate the underlying models, and we do not supply the compute that runs your generations.',
      'The capabilities, availability, pricing and content rules of each model are set by the Model Providers and can change at any time without notice to us. We may add, modify or retire models, features and integrations as the platform evolves.',
      'Features labeled beta are provided for evaluation, may change or be withdrawn at any time, and may carry additional limits.',
      'Service continuity, outages, and discontinuation.',
      '(a) Temporary interruptions. The Service depends on third-party technologies, including Model Providers, our render pipeline provider, and hosting and infrastructure services, and interruptions can occur, on our side or theirs. When they do, we will use commercially reasonable efforts to restore the Service as quickly as possible. Temporary interruptions are not a breach of these Terms, and we are not liable for losses caused by unavailability beyond the remedies in this Section.',
      '(b) Extended outages. If core functionality of the Service is materially unavailable for more than seven (7) consecutive days, for any reason, including a Model Provider or infrastructure failure, we will extend your subscription by the length of the downtime or, at your request, credit or refund the affected period pro-rata. If core functionality remains materially unavailable for more than thirty (30) consecutive days, you may cancel and receive a pro-rata refund of the unused remainder of your prepaid period, whether monthly or yearly.',
      '(c) Discontinuation. If a technology that is material to operating the Service becomes unavailable or discontinued, is restricted in a way that prohibits our use, becomes unlawful for us to use, or changes in cost or terms so materially that continued operation is commercially impracticable, and no reasonable substitute is available after our commercially reasonable efforts to find one, we may retire the affected features or discontinue the Service on notice. If we discontinue the Service or a paid capability during a period you have prepaid for, we will refund the unused remainder of your prepaid period pro-rata, whether monthly or yearly, as described in the Refund & Cancellation Policy.',
      '(d) Sole remedy. The extensions, credits, and refunds in this Section are your sole and exclusive remedy for unavailability, degradation, or discontinuation of the Service, and none of these events is a breach of these Terms.',
    ],
  },
  {
    title: 'Eligibility and Accounts',
    blocks: [
      'You must be at least 18 years old, or the age of majority in your jurisdiction if that is higher, to use the Service. The Service is built for professional and creative work and is not directed to minors.',
      'You agree to provide accurate, current and complete information when you register and to keep it up to date. You are responsible for all activity under your account and for keeping your login credentials confidential. Notify us promptly at hello@cinemasteracademy.com if you suspect unauthorized access to your account. We may suspend or close accounts that violate these Terms or that we reasonably believe are compromised or being used fraudulently.',
      'One subscription is one seat for one person. You may not share your login credentials with anyone, and a single subscription may not be used by, or rotated between, multiple people, whether inside or outside your organization. Each person who uses the Service needs their own subscription. We reserve the right to enforce per-seat and session limits by technical means, including limiting the number of active sessions or devices on an account, and to suspend or terminate accounts that we reasonably believe are shared, resold or otherwise used across multiple people, in addition to any other remedy in these Terms.',
    ],
  },
  {
    title: 'Your fal.ai Key',
    blocks: [
      'The Service operates on a bring-your-own-key basis. To render, you connect your own fal.ai API key. The key is saved in your own browser for convenience. When you start a render, the key is transmitted through our render pipeline, which runs server side, solely to execute that render against fal.ai, and it is used for no other purpose. We do not store the key on our servers and we do not write it to our logs. Revoking the key in your fal.ai dashboard stops it from working in CMA Studio, and nothing on our side holds a copy.',
      [
        'Your fal.ai account is yours. You are responsible for the agreement you accept with fal.ai, for the security of your key and for all activity and charges on that account.',
        'All compute is billed by fal.ai directly to you, at fal.ai’s own rates and under fal.ai’s own terms. We add no markup and we do not process compute payments.',
        'We are not a party to your agreement with fal.ai and are not responsible for fal.ai’s pricing, availability, moderation decisions or service quality.',
      ],
    ],
  },
  {
    title: 'Fees and Billing',
    blocks: [
      'Use of the Service requires a paid subscription. Subscriptions are flat software fees billed through Stripe, our payment processor, on the billing cycle you select. The subscription covers the software only. Compute is never included and is addressed in Section 6.',
      'Prices, plans and included features may change as the platform evolves, and we will announce changes in advance. Price changes apply to NEW subscribers only: the rate you subscribed at is locked for as long as your subscription remains active without interruption. Changes to included features take effect from your next billing cycle. If you do not agree with a change, you may cancel your subscription before the next cycle begins.',
      'Prices exclude taxes unless we state otherwise. You are responsible for any sales, use, VAT or similar taxes that apply to your subscription, which may be collected through Stripe.',
      'Refunds and cancellation are governed by our Refund & Cancellation Policy (available at /refunds), which forms part of these Terms. In short: monthly plans cancel anytime and simply stop renewing, with access through the paid month; yearly plans are a one-year commitment and are non-refundable once the Service has begun, except for an extended platform outage on our side as described in Section 2, or where a law that cannot be waived requires otherwise. There is no money-back guarantee on this digital service.',
      'Immediate access and statutory withdrawal. At checkout you expressly request immediate access to the Service and acknowledge that, once the Service begins, you lose any statutory right of withdrawal, to the extent the law of your jurisdiction permits that acknowledgement. We record this acknowledgement, with the date and the document versions you accepted, alongside your consent record. Cancellation always stops future charges, and your access continues until the end of the period you have already paid for.',
    ],
  },
  {
    title: 'Third-Party Compute',
    blocks: [
      'All generation compute runs on your own fal.ai account and is billed by fal.ai directly to you. We never charge you for compute, and we cannot refund charges made by fal.ai. In particular:',
      [
        'A generation that is blocked, declined or moderated by a Model Provider may still consume compute on your fal.ai account.',
        'A generation that completes but does not match your expectations still consumes compute.',
        'Those charges sit between you and fal.ai under fal.ai’s terms, and we are not able to reverse or refund them.',
      ],
      'We work to engineer prompts so wasted renders stay rare, but we do not guarantee any particular success rate, output quality or compute cost.',
    ],
  },
  {
    title: 'Acceptable Use and Your Responsibility',
    blocks: [
      'You, and not CineMaster Academy, are solely responsible for the prompts you write, the frames and reference media you upload, the settings you choose and the outputs you generate through the Service. Every generation runs on your own fal.ai account, under your own agreement with fal.ai, at your instruction. As between you and us, you are the author and controller of everything created through the Service on your key, and all legal responsibility for it rests with you.',
      'You represent and warrant that you own, or have obtained every right, license, consent, release and permission needed for, everything you upload or submit to the Service, including images or likenesses of real people, brands, logos, artwork, footage and any other third-party material, and that your prompts, your uploads and your use of the resulting outputs comply with applicable law, these Terms and the Model Providers’ terms.',
      'You agree not to use the Service to create, request or distribute:',
      [
        'Content that is illegal where you live or where the content is directed.',
        'Child sexual abuse material or any sexual content involving minors, real or synthetic.',
        'Non-consensual intimate imagery of any person.',
        'Content that impersonates a real person, or synthetic media presented as authentic footage of real people or events without clear disclosure and a lawful basis.',
        'Content that infringes the copyright, trademark, privacy or publicity rights of others.',
        'Malware, fraud, spam, harassment, threats or content intended to abuse, deceive or endanger any person.',
      ],
      'Model Providers enforce their own content rules and may decline, block or filter a generation. We cannot override those rules, we will not help you circumvent them, and attempting to circumvent them is a breach of these Terms.',
      'Spec and brand work. If you create or share work that references real brands, products, trademarks or public figures, for example spec commercials or concept films, you do so entirely on your own responsibility. Such work does not imply, and you must not suggest, any affiliation with, sponsorship by or endorsement from the referenced brand or from CineMaster Academy. Obtaining any permission that work requires is solely your obligation.',
    ],
  },
  {
    title: 'Your Content and Outputs',
    blocks: [
      'You retain ownership of the prompts, scene notes, uploaded frames and other material you submit to the Service. To the extent permitted by the applicable Model Providers’ terms and by law, you also own the outputs you generate. Rights in AI-generated output can be limited by the Model Providers’ terms and by the law of your jurisdiction, and it is your responsibility to confirm your rights before relying on an output commercially.',
      'You grant us a limited, non-exclusive license to process and transmit your prompts, settings and uploads, and to host, cache and display your renders, solely to operate the Service for you, including storing renders in your library as described in Section 12. Uploads themselves are not stored on our servers, as the Privacy Policy describes.',
    ],
  },
  {
    title: 'No Responsibility for User Content or Outputs',
    blocks: [
      'The Service transmits, processes and displays content that users create on their own keys. We do not pre-screen, review, endorse or verify user content or outputs, and we have no obligation to monitor them. To the maximum extent permitted by law, we accept no responsibility or liability for any user content or any output, including yours, or for any loss or damage arising from its creation, publication, distribution or use.',
      'We may, at our sole discretion and without liability to you, refuse or remove any content, decline to run any render, and suspend or terminate any account that we believe violates these Terms, the law or the rights of others, or that creates risk for the platform, its users, its providers or any third party. We may act with or without prior notice, and we are not required to explain individual moderation decisions. We may preserve content and disclose it where the law requires.',
    ],
  },
  {
    title: 'AI-Specific Disclaimers',
    blocks: [
      'Generative AI is probabilistic. Outputs may be inaccurate, incomplete, unexpected, distorted or offensive, may not match your prompt and may differ between runs of the same prompt. Do not rely on any output as fact, and review every output before you use it.',
      'Outputs may resemble existing works. Because the underlying models are trained on large datasets, an output can unintentionally resemble copyrighted works, trademarks, distinctive styles, real people, places, products or voices. We make no representation or warranty that any output is original, non-infringing or available for your intended use.',
      'Clear rights before commercial use. Before you publish, broadcast, sell or otherwise commercially exploit an output, you are solely responsible for obtaining every clearance, license, release and legal review that the use requires, including any disclosure obligations that apply to synthetic media in your jurisdiction.',
      'No legal advice. Nothing in the Service, its documentation, its prompt systems or these Terms is legal advice, and none of it substitutes for advice from a qualified attorney about your specific situation.',
    ],
  },
  {
    // ========================================================================
    // PLACEHOLDER PROCESS: this is a voluntary takedown channel, not a claim
    // of DMCA safe harbor. Formal DMCA designated-agent registration with the
    // US Copyright Office (and safe-harbor wording) must be handled by a
    // licensed attorney before launch.
    // ========================================================================
    title: 'Copyright and IP Complaints',
    blocks: [
      'We respect intellectual property rights and expect the same from users. If you believe content stored or made available through the Service infringes your copyright or other intellectual property rights, send a notice to hello@cinemasteracademy.com with the subject line "IP Complaint" that includes:',
      [
        'Identification of the work you claim is infringed.',
        'Identification of the material you claim is infringing and where it appears in the Service.',
        'Your name, postal address, email address and telephone number.',
        'A statement that you have a good faith belief the use is not authorized by the rights owner, its agent or the law.',
        'A statement, under penalty of perjury, that the notice is accurate and that you are the rights owner or authorized to act for the rights owner.',
        'Your physical or electronic signature.',
      ],
      'On receipt of a valid notice we may remove or disable access to the identified material and notify the user who stored it, and where appropriate we will consider a counter-notice from that user. We terminate the accounts of repeat infringers.',
    ],
  },
  {
    title: 'Storage and Retention',
    blocks: [
      'Finished renders are cached in our storage so you can browse, replay and re-download them. Each plan tier includes a limited retention window, subject to fair use caps. The window for your tier is shown on the plan you purchase and in your library.',
      [
        'Retention is a convenience cache, not an archive. Access to stored renders ends when the retention window ends or your subscription ends, whichever comes first.',
        'We may delete renders after their retention window expires or after your access ends.',
        'Download anything you want to keep. Keeping your own copies is your responsibility.',
        'Fair use caps protect the platform. If your stored volume is far outside normal use for your tier, we may ask you to reduce it or apply limits.',
        'We do not guarantee stored renders against loss or corruption. Keep your own backups of any render that matters to you.',
      ],
      'If we reduce a plan’s retention window, the reduction applies only to renders created after the change, or we will give you at least thirty (30) days’ notice to download existing renders before it applies to them.',
    ],
  },
  {
    title: 'Our Intellectual Property',
    blocks: [
      'The Service, including its software, design, brand, documentation and, in particular, the server-side prompt engineering systems that translate your camera, lens, film stock and lighting choices into model instructions, belongs to CineMaster Academy and its licensors. We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service for its intended purpose while you hold an active subscription.',
      'You agree not to reverse engineer, decompile, scrape, crawl, probe or systematically extract any part of the Service, including any attempt to reconstruct, harvest or expose our prompt systems, whether by automated requests, output analysis at scale or any other method. Feedback you send us may be used to improve the Service without obligation to you.',
    ],
  },
  {
    title: 'Disclaimers',
    blocks: [
      'The Service is provided as is and as available. To the maximum extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, non-infringement and any warranty regarding availability, reliability or output quality.',
      'AI-generated outputs may be inaccurate, unexpected, incomplete or unsuitable for your purpose. The Service depends on third-party providers whose performance, moderation and availability we do not control. Some jurisdictions do not allow certain warranty disclaimers, so parts of this section may not apply to you.',
    ],
  },
  {
    title: 'Limitation of Liability',
    blocks: [
      'To the maximum extent permitted by law, the total aggregate liability of CineMaster Academy for all claims arising out of or relating to the Service or these Terms is capped at the subscription fees you paid to us in the 12 months preceding the event giving rise to the claim.',
      'To the same extent, we are not liable for indirect, incidental, special, consequential, exemplary or punitive damages, or for lost profits, lost revenue, lost data or business interruption, even if we were advised such damages were possible. We are also not liable for compute charges billed to you by fal.ai. Nothing in these Terms excludes liability that cannot be excluded under applicable law.',
    ],
  },
  {
    title: 'Indemnification',
    blocks: [
      'You agree to defend, indemnify and hold harmless CineMaster Academy, its owner, and their respective affiliates, officers, employees, contractors and agents (together, the "Indemnified Parties") from and against any and all claims, demands, actions, investigations, damages, liabilities, losses, judgments, settlements, costs and expenses, including reasonable legal fees, arising out of or related to:',
      [
        'Your content, including your prompts, uploaded frames and reference media.',
        'The outputs you generate and any use, publication, distribution or commercialization of them.',
        'Your use or misuse of the Service.',
        'Your violation of these Terms.',
        'Your violation of any law or regulation.',
        'Your infringement or violation of any third-party right, including intellectual property, publicity and privacy rights.',
        'Your fal.ai account and your agreement with fal.ai.',
      ],
      'We may assume the exclusive defense and control of any matter subject to indemnification by you, at your expense, in which case you agree to cooperate with our defense and not to settle any such matter without our prior written consent. This obligation survives the end of your subscription and of these Terms.',
    ],
  },
  {
    title: 'Termination',
    blocks: [
      'You may cancel your subscription and stop using the Service at any time. We may suspend or terminate your access if you materially breach these Terms, use the Service unlawfully or create risk for the platform or other users, with notice where practicable.',
      'When your access ends, your license to use the Service ends and stored renders become subject to deletion under Section 12. Download anything you want to keep before your access ends. Sections that by their nature should survive termination, including Sections 6 through 16, Section 19 and Section 20, survive.',
    ],
  },
  {
    title: 'Changes to These Terms',
    blocks: [
      'We may update these Terms as the Service, the law or our business evolves. If a change is material, we will announce it in advance by email or in the app, and it will take effect on the date stated in the notice. Your continued use of the Service after the effective date constitutes acceptance. If you do not agree, stop using the Service and cancel your subscription before the change takes effect.',
    ],
  },
  {
    // ========================================================================
    // GOVERNING LAW: Nevada / Clark County, set per operator's decision.
    // Licensed counsel confirms at the launch gate, alongside the arbitration
    // strategy decision (class-action waiver + small-claims carve-out + opt-out).
    // ========================================================================
    title: 'Governing Law and Disputes',
    blocks: [
      'These Terms are governed by the laws of the State of Nevada, USA, without regard to its conflict of law rules. You and CineMaster Academy agree to the exclusive jurisdiction of the state and federal courts located in Clark County, Nevada, for any dispute that is not resolved informally.',
      'Before filing a claim, you agree to first contact us at hello@cinemasteracademy.com and give us 30 days to work toward an informal resolution.',
      'Either party may bring a qualifying claim in small claims court. Any claim must be brought within one (1) year after it arises or it is permanently barred, to the extent permitted by law.',
    ],
  },
  {
    title: 'General',
    blocks: [
      'If any provision of these Terms is found invalid or unenforceable, that provision will be enforced to the maximum extent permitted and the remaining provisions will stay in full force. Our failure to enforce a provision is not a waiver of our right to enforce it later.',
      'These Terms, together with the Privacy Policy, the Refund & Cancellation Policy, the Acceptable Use Policy and the plan details shown at purchase, are the entire agreement between you and us regarding the Service. You may not assign or transfer these Terms without our prior written consent; we may assign them in connection with a merger, acquisition, reorganization or sale of assets, including to a business entity we form, an affiliate, or a successor.',
      'We are not liable for any delay or failure caused by events beyond our reasonable control, including outages or decisions of Model Providers, hosting or network providers, acts of government, natural disasters, internet disturbances or labor disputes.',
    ],
  },
  {
    title: 'Contact',
    blocks: [
      'Questions about these Terms can be sent to hello@cinemasteracademy.com. A real person reads and answers them.',
      OPERATOR_IDENTITY,
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[#bc9863]/18 bg-[#07080b]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={38} />
            <span className="font-[family-name:var(--font-sora)] text-[16px] font-semibold tracking-[-0.01em]">
              CMA Studio
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 font-mono text-[12px] tracking-[0.14em] text-[#8b8f99] uppercase transition hover:text-[#e7cfa3]"
          >
            <ArrowLeft size={14} /> Back home
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-14">
        <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">Legal</div>
        <h1 className="font-[family-name:var(--font-sora)] text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.03em]">
          Terms of <span className="text-[#bc9863]">Service.</span>
        </h1>
        <div className="mt-4 inline-flex items-center rounded-lg border border-white/8 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-[#8b8f99] uppercase">
          Working draft, review by counsel before launch
        </div>
        <p className="mt-4 font-mono text-[11px] tracking-[0.14em] text-[#8b909e] uppercase">
          Last updated: July 18, 2026
        </p>
        <p className="mt-6 text-[0.95rem] leading-[1.75] text-[#8b8f99]">
          The short version: CMA Studio is software. You pay us a flat subscription for the interface and the prompt
          engineering. Compute runs on your own fal.ai key and fal bills you directly. Your renders stay in your
          library for a limited window set by your plan. What you create on your key is yours to answer for: prompts,
          uploads and outputs are your responsibility. The full terms below are what actually governs.
        </p>

        <div className="glass glass-gold mt-10 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-10">
            {SECTIONS.map((s, i) => (
              <section key={s.title} id={`section-${i + 1}`} className="scroll-mt-24">
                <h2 className="mb-3 font-[family-name:var(--font-sora)] text-[1.05rem] font-semibold text-[#f4efe6]">
                  <span className="mr-2 text-[#bc9863]">{i + 1}.</span>
                  {s.title}
                </h2>
                <div className="flex flex-col gap-3">
                  {s.blocks.map((block, j) =>
                    Array.isArray(block) ? (
                      <ul key={j} className="flex flex-col gap-2.5">
                        {block.map((item) => (
                          <li key={item} className="flex gap-3 text-[0.93rem] leading-[1.75] text-[#8b8f99]">
                            <span aria-hidden className="mt-[11px] h-1 w-1 flex-none rounded-full bg-[#bc9863]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p key={j} className="text-[0.93rem] leading-[1.75] text-[#8b8f99]">
                        {block}
                      </p>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>

        <p className="mt-8 text-[13px] leading-relaxed text-[#8b909e]">
          Questions about these terms? Write to{' '}
          <a
            href="mailto:hello@cinemasteracademy.com"
            className="cursor-pointer text-[#e7cfa3] underline underline-offset-2 transition hover:opacity-80"
          >
            hello@cinemasteracademy.com
          </a>
          . See also our{' '}
          <Link href="/privacy" className="cursor-pointer text-[#e7cfa3] underline underline-offset-2 transition hover:opacity-80">
            Privacy Policy
          </Link>
          .
        </p>
        <TrademarkNotice className="mt-6" />
      </main>
    </div>
  );
}
