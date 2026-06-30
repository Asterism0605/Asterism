<script setup lang="ts">
const effectiveDate = 'June 25, 2026';
</script>

<template>
  <main class="relative min-h-screen bg-void px-6 pb-24 pt-24 text-text-primary sm:pt-28">
    <div class="pointer-events-none fixed inset-0 z-0 legal-page__wash" aria-hidden="true" />

    <div class="relative z-10 mx-auto max-w-3xl">
      <p class="text-caption font-mono uppercase tracking-[0.24em] text-gold-dim">
        Terms of Service
      </p>
      <h1 class="text-h1 mt-3">Terms of Service</h1>
      <p class="text-caption mt-2 text-text-secondary">Last updated: {{ effectiveDate }}</p>

      <div class="mt-10 space-y-8 text-body leading-7 text-text-secondary">
        <section>
          <p>
            Welcome to Asterism ("the Service"). By accessing or using asterism.pics, you agree to
            be bound by these Terms of Service. If you do not agree, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">1. The Service</h2>
          <p class="mt-3">
            The Service is an image and aesthetic discovery platform offering features such as
            browsing and saving images, building personal moodboards, and style quizzes. We may add,
            modify, or discontinue features at any time.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">2. Accounts and Registration</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5">
            <li>
              You may register with an email address or sign in with a third party such as Google or
              LINE.
            </li>
            <li>
              You must provide accurate information and are responsible for all activity under your
              account.
            </li>
            <li>Keep your credentials secure and notify us immediately of any unauthorized use.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">3. User Responsibilities</h2>
          <p class="mt-3">You agree not to:</p>
          <ul class="mt-3 list-disc space-y-2 pl-5">
            <li>
              Violate the law or infringe the rights of others, including intellectual property
              rights.
            </li>
            <li>Upload or distribute malware, spam, or unlawful content.</li>
            <li>
              Scrape data at scale through automated means, or interfere with or disrupt the
              Service.
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">4. Content and Intellectual Property</h2>
          <p class="mt-3">
            The Service and its interface, trademarks, and content are protected by intellectual
            property rights. Rights to image materials belong to their respective owners; you may
            use them only within the scope permitted by the Service.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">5. Third-Party Services</h2>
          <p class="mt-3">
            The Service integrates third-party services including Supabase, Google, LINE, and
            Resend, whose use is additionally governed by their respective terms.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">6. Disclaimer</h2>
          <p class="mt-3">
            The Service is provided "as is" without warranty that it will be uninterrupted or
            error-free. To the extent permitted by law, we are not liable for any damages arising
            from your use of, or inability to use, the Service.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">7. Suspension and Termination</h2>
          <p class="mt-3">
            If you violate these Terms, we may suspend or terminate your access to the Service and
            reserve the right to pursue any related remedies.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">8. Changes to These Terms</h2>
          <p class="mt-3">
            We may update these Terms and will post changes on this page. Continued use of the
            Service after changes take effect constitutes your acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">9. Contact Us</h2>
          <p class="mt-3">
            If you have any questions about these Terms, please email
            <a class="text-text-primary underline" href="mailto:asterism.f2e@gmail.com"
              >asterism.f2e@gmail.com</a
            >.
          </p>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.legal-page__wash {
  background:
    radial-gradient(circle at 78% 12%, rgb(168 137 58 / 0.06), transparent 30%),
    linear-gradient(180deg, var(--color-void) 0%, var(--color-deep) 60%, var(--color-void) 100%);
}

.legal-page__wash::after {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0.3;
  background-image:
    linear-gradient(rgb(240 237 230 / 0.6) 1px, transparent 1px),
    linear-gradient(90deg, rgb(240 237 230 / 0.6) 1px, transparent 1px);
  background-size: 118px 118px;
  mask-image: linear-gradient(180deg, transparent, black 12%, black 78%, transparent);
}
</style>
