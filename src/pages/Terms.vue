<script setup lang="ts">
const effectiveDate = 'July 7, 2026';
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
            Welcome to Asterism ("the Service"). By accessing or using asterism.pics, users agree
            to be bound by these Terms of Service. If users do not agree to these Terms, they
            should not use the Service.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">1. The Service</h2>
          <p class="mt-3">
            The Service is an image and aesthetic discovery platform offering features such as
            browsing and saving images, building personal moodboards, and style quizzes. The
            Service may add, modify, or discontinue some or all features at any time.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">2. Accounts and Registration</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5">
            <li>
              Users may register with an email address or sign in through third-party services such
              as Google or LINE.
            </li>
            <li>
              Users must provide accurate and complete information and are responsible for all
              activities under their accounts.
            </li>
            <li>
              Users are responsible for keeping their login credentials secure. If users discover
              any unauthorized use of their accounts, they should notify the Service immediately.
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">3. User Responsibilities</h2>
          <p class="mt-3">Users must not:</p>
          <ul class="mt-3 list-disc space-y-2 pl-5">
            <li>
              Violate any law or infringe the rights of others, including but not limited to
              intellectual property rights.
            </li>
            <li>Upload or distribute malware, spam, or unlawful content.</li>
            <li>
              Scrape data at scale through automated means, or interfere with or disrupt the
              normal operation of the Service.
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">4. Content and Intellectual Property</h2>
          <p class="mt-3">
            Unless otherwise stated, the Service's interface, trademarks, text, layout design, data
            arrangement, and related materials are protected by intellectual property laws.
          </p>
          <p class="mt-3">
            AI-generated images in this project are used solely for educational and non-commercial
            demonstration purposes. The Service does not claim rights in such AI-generated images
            beyond the extent permitted by applicable law.
          </p>
          <p class="mt-3">
            Rights to image materials, where owned by third parties or respective rights holders,
            remain with their lawful owners. Users may use such content only within the scope
            permitted by the Service.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">5. AI-generated Content Disclaimer</h2>
          <p class="mt-3">
            Images in this project may include AI-generated content and are used solely for
            educational and non-commercial demonstration purposes.
          </p>
          <p class="mt-3">
            They are intended as visual style references only and do not represent real people, real
            idols, real brands, or real commercial campaigns.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">6. Third-Party Services</h2>
          <p class="mt-3">
            The Service integrates third-party services including Supabase, Google, LINE, and
            Resend. Users' use of these third-party services may also be governed by their
            respective terms and policies.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">7. Disclaimer</h2>
          <p class="mt-3">
            The Service is provided "as is" without warranty that it will be uninterrupted, secure,
            error-free, or meet users' specific requirements.
          </p>
          <p class="mt-3">
            To the maximum extent permitted by law, the Service shall not be liable for any direct,
            indirect, incidental, special, or consequential damages arising from users' use of, or
            inability to use, the Service.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">8. Suspension and Termination</h2>
          <p class="mt-3">
            If users violate these Terms, the Service may suspend or terminate their access and
            reserves the right to pursue any related remedies.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">9. Changes to These Terms</h2>
          <p class="mt-3">
            The Service may update these Terms from time to time and will post any changes on this
            page.
          </p>
          <p class="mt-3">
            Continued use of the Service after changes take effect constitutes acceptance of the
            revised Terms.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">10. Contact Us</h2>
          <p class="mt-3">
            If users have any questions about these Terms, please contact:
            <a class="text-text-primary underline" href="mailto:asterism.f2e@gmail.com"
              >asterism.f2e@gmail.com</a
            >.
          </p>
        </section>

        <p class="text-caption text-text-secondary">© 2026 Asterism</p>
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
