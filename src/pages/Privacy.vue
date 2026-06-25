<script setup lang="ts">
const effectiveDate = 'June 25, 2026';
</script>

<template>
  <main class="relative min-h-screen bg-void px-6 pb-24 pt-24 text-text-primary sm:pt-28">
    <div class="pointer-events-none fixed inset-0 z-0 legal-page__wash" aria-hidden="true" />

    <div class="relative z-10 mx-auto max-w-3xl">
      <p class="text-caption font-mono uppercase tracking-[0.24em] text-gold-dim">Privacy Policy</p>
      <h1 class="text-h1 mt-3">Privacy Policy</h1>
      <p class="text-caption mt-2 text-text-secondary">Last updated: {{ effectiveDate }}</p>

      <div class="mt-10 space-y-8 text-body leading-7 text-text-secondary">
        <section>
          <p>
            Asterism ("the Service") respects your privacy. This policy explains how we collect,
            use, and protect your personal information when you use asterism.pics. By using the
            Service, you agree to the terms of this policy.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">1. Information We Collect</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong class="text-text-primary">Account information:</strong> the email address you
              provide at sign-up. Passwords are encrypted and stored by Supabase Auth; the Service
              never has access to your plaintext password.
            </li>
            <li>
              <strong class="text-text-primary">Third-party login information:</strong> when you
              sign in with Google or LINE, we receive your email address, display name, and avatar
              to create and identify your account.
            </li>
            <li>
              <strong class="text-text-primary">Usage data:</strong> content you create in the
              Service, such as saved images, moodboards, and style-quiz results.
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">2. How We Use Your Information</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5">
            <li>To create and manage your account and provide sign-in and authentication.</li>
            <li>To send system emails such as account verification and password resets.</li>
            <li>To store and display your saved content and personalized style features.</li>
            <li>To maintain security, prevent abuse, and improve the experience.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">3. Third-Party Services</h2>
          <p class="mt-3">
            To provide the Service, we share certain data with the following third parties, each
            governed by its own privacy policy:
          </p>
          <ul class="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong class="text-text-primary">Supabase:</strong> authentication and data storage.
            </li>
            <li>
              <strong class="text-text-primary">Google, LINE:</strong> third-party login (OAuth).
            </li>
            <li>
              <strong class="text-text-primary">Resend:</strong> delivery of system emails (e.g.
              verification).
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">4. Data Retention and Deletion</h2>
          <p class="mt-3">
            We retain the above information for as long as your account remains active. You may
            request access to, correction of, or deletion of your personal information at any time.
            When you delete your account, related personal data is removed, except where retention
            is required by law.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">5. Cookies and Local Storage</h2>
          <p class="mt-3">
            The Service uses browser local storage to keep your sign-in state (session) so you stay
            logged in. You can clear this data through your browser settings, though doing so may
            require you to sign in again.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">6. Your Rights</h2>
          <p class="mt-3">
            You have the right to access, correct, or delete your personal information, or to
            withdraw consent previously given. To exercise these rights, please contact us using the
            details below.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">7. Changes to This Policy</h2>
          <p class="mt-3">
            We may update this policy as the Service evolves. Updates will be posted on this page
            and the "Last updated" date will be revised accordingly.
          </p>
        </section>

        <section>
          <h2 class="text-h3 text-text-primary">8. Contact Us</h2>
          <p class="mt-3">
            If you have any questions about this policy, please email
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
