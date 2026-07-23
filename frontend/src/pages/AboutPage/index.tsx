import { UiContainer, UiSubtitle, UiTitle } from '../../ui'

export function AboutPage() {
  return (
    <UiContainer width="narrow">
      <UiTitle>About FoodBridge</UiTitle>
      <UiSubtitle>
        A web platform that connects people with surplus food to the organisations and individuals
        who can use it before it expires.
      </UiSubtitle>

      <section style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--fb-slate)' }}>
        <p>
          Restaurants, caterers, and households routinely end the day with edible food they cannot
          store. Shelters and community kitchens routinely end the day short. The gap between them
          is rarely distance — it is that neither side knows the other exists in time to act.
        </p>
        <p>
          FoodBridge closes that gap with a short list of things: a donor publishes what is
          available and when it must be collected, a recipient requests it, and the donor approves
          one request. Approving reserves the listing and declines the rest, so two people never
          travel for the same meal.
        </p>
        <p>Built for CSE309 — Software Engineering.</p>
      </section>
    </UiContainer>
  )
}
