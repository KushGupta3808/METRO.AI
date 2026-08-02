import LegalPage from './LegalPage';

// Content matches PRIVACY_POLICY.md exactly - single source of truth,
// generated here rather than retyped, to avoid any drift from the
// reviewed draft. Still has bracketed placeholders that need real values
// before this is shown to anyone outside of you.
const PRIVACY_CONTENT = `# METRO AI — Privacy Policy

**Draft for review — not yet reviewed by a lawyer.** This describes what the current codebase
actually collects and stores, as a starting point — not a substitute for legal review,
especially if you'll have users in the EU (GDPR) or California (CCPA), each of which impose
specific requirements this draft doesn't fully cover on its own.

*Last updated: [DATE]*

## 1. What we collect

- **Account information:** the email address and password you sign up with. Passwords are
  hashed (bcrypt) and never stored or logged in plain text.
- **Currency preferences:** your chosen base and target currency, so your dashboard and
  comparisons default to your actual corridor.
- **Saved recipients:** name, currency, payout method, and optionally a bank name and account
  number, if you choose to save a recipient for faster transfers.
- **Transfer history:** a record of the routes you've compared and the transfers you've logged
  through the app (provider, amount, exchange rate, fee, and the AI recommendation active at
  the time).
- **Technical data:** standard request metadata (IP address, for rate-limiting abuse
  prevention) is processed but not persisted beyond what's needed to enforce those limits.

## 2. What we don't collect

We do not collect or store your money transfer provider account credentials, your actual bank
login details, or your payment card information. When you click "Send with [Provider]," you
leave METRO AI and interact directly with that provider's own site under their own privacy
practices.

## 3. How we use your data

- To operate your account and remember your preferences across sessions.
- To generate the AI rate analysis and chat responses relevant to your chosen corridor.
- To maintain your transfer ledger and recipient directory.
- To enforce rate limits and prevent abuse of the login/signup endpoints.

We do not sell your personal data.

## 4. Third-party services

- **Frankfurter (api.frankfurter.dev):** a free, keyless exchange-rate API we call directly
  from your browser to display live rates. No personal data is sent to Frankfurter beyond the
  currency codes you're viewing.
- **Google Gemini:** powers the AI chat assistant and rate analysis. Messages you send the
  chatbot, along with relevant market context, are sent to Google's API to generate a response.
- **Money transfer providers** (Wise, Remitly, WorldRemit, Xoom, Paysend, Western Union,
  MoneyGram, Ria, and others as added): we do not send your personal data to these providers.
  Clicking "Send with X" simply opens their site in a new tab; anything you enter there is
  governed by their own privacy policy, not ours.

## 5. Data retention and deletion

Your account data is retained until you delete your account. [ADD: the actual process for a
user to request account/data deletion — this needs to exist as a real, working feature before
this line can be accurate. If it doesn't exist yet, that's worth building before this policy
goes live, particularly for GDPR compliance if any EU users are expected.]

## 6. Cookies and local storage

We store your session token in your browser's local storage to keep you signed in, and use
\`sessionStorage\` to remember that you've seen the intro video within your current browser
session. We don't use third-party advertising trackers or analytics cookies. [Update this if
you add analytics later — be specific about what's added, since this line is only accurate for
the current build.]

## 7. Security

We use industry-standard password hashing and JWT-based session tokens. No system is
perfectly secure; if we become aware of a data breach affecting your information, we will
notify affected users as required by applicable law.

## 8. Your rights

Depending on where you live, you may have rights to access, correct, or delete your personal
data, and to object to certain processing. Contact us at [SUPPORT EMAIL] to exercise these
rights. [If you have EU or California users, this section needs real, specific GDPR/CCPA
compliance language — a generic line isn't sufficient on its own.]

## 9. Children

METRO AI is not directed at children, and we don't knowingly collect data from anyone under
16 (or the relevant age of consent in your jurisdiction).

## 10. Changes to this policy

We may update this policy from time to time. We'll update the "Last updated" date above when
we do.

## 11. Contact

Questions about this policy or your data: [SUPPORT EMAIL]
`;

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" content={PRIVACY_CONTENT} />;
}