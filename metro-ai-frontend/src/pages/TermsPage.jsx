import LegalPage from './LegalPage';

// Content matches TERMS_OF_SERVICE.md exactly - single source of truth,
// generated here rather than retyped, to avoid any drift from the
// reviewed draft. Still has bracketed placeholders ([DATE],
// [SUPPORT EMAIL], [JURISDICTION]) that need real values before this is
// shown to anyone outside of you - they're deliberately left visible
// rather than silently filled with fake defaults.
const TERMS_CONTENT = `# METRO AI — Terms of Service

**Draft for review — not yet reviewed by a lawyer.** This is a substantive starting point,
not a substitute for actual legal counsel before a real public launch. Money-adjacent products
carry real regulatory and liability exposure; have this reviewed by someone qualified before
you rely on it with real users. Replace the bracketed placeholders before publishing.

*Last updated: [DATE]*

## 1. What METRO AI is

METRO AI ("we," "us," "the Service") is a comparison tool for cross-border money transfers.
We show you exchange rates, fees, and delivery estimates from third-party money transfer
providers, and we may offer an AI-generated opinion on whether current conditions favor
sending now or waiting.

**METRO AI does not transmit, hold, or process money.** We are not a money transmitter, a
bank, or a licensed financial institution. When you choose to send money through a provider
shown in our comparison, you leave METRO AI and transact directly with that provider, under
their own terms, licensing, and protections — not ours.

## 2. The AI recommendation is not financial advice

Any "send now" or "hold" guidance, rate trend analysis, or chatbot response is generated
automatically and is provided for informational purposes only. It is not financial, legal, or
tax advice, and we do not guarantee its accuracy, timeliness, or suitability for your specific
situation. Exchange rates shown are indicative and may differ from the rate you're actually
offered on a provider's own site by the time you complete a transfer there. You are solely
responsible for your own financial decisions.

## 3. Accounts

You must provide accurate information when creating an account and are responsible for
keeping your login credentials secure. You're responsible for all activity under your account.
Let us know at [SUPPORT EMAIL] if you believe your account has been compromised.

## 4. Third-party providers

We link out to third-party money transfer providers (currently including Wise, Remitly,
WorldRemit, Xoom, Paysend, Western Union, MoneyGram, and Ria Money Transfer, among others
as we add them). We do not control these providers, are not responsible for their services,
pricing, availability, or the outcome of any transfer you make with them, and our showing a
provider is not an endorsement or guarantee. Review each provider's own terms before
transacting with them.

## 5. Acceptable use

You agree not to: use the Service for any unlawful purpose; attempt to interfere with or
disrupt the Service or its infrastructure; scrape or bulk-extract data from the Service without
permission; or misrepresent your identity when creating an account.

## 6. Data and your privacy

Our collection and use of your data is described in our [Privacy Policy]. By using the
Service, you agree to that Privacy Policy as well.

## 7. No warranty

The Service is provided "as is," without warranties of any kind, express or implied,
including but not limited to accuracy of displayed rates, uninterrupted availability, or
fitness for a particular purpose.

## 8. Limitation of liability

To the maximum extent permitted by law, METRO AI and its operators are not liable for any
indirect, incidental, or consequential damages arising from your use of the Service or any
transaction you complete with a third-party provider linked from it, including but not limited
to unfavorable exchange rate movement, transfer delays, or provider fees.

## 9. Changes to these terms

We may update these terms from time to time. Continued use of the Service after a change
constitutes acceptance of the updated terms.

## 10. Contact

Questions about these terms: [SUPPORT EMAIL]

## 11. Governing law

[JURISDICTION — this needs to be filled in based on where the business is actually
incorporated/operated; this materially affects what's enforceable and should be set with
actual legal guidance, not guessed at here.]
`;

export default function TermsPage() {
  return <LegalPage title="Terms of Service" content={TERMS_CONTENT} />;
}