import { Container } from '@/components/Container'
import { Section } from '@/components/Section'

export default function About(){
  return (
    <Section>
      <Container>
        <blockquote className="text-2xl font-bold italic">“Together, let’s redefine the future of retail.”</blockquote>
        <div className="prose prose-slate mt-8">
          <h3>Our Journey</h3>
          <p>Write your origin story and the problems you observed in retail.</p>
          <h3>Our Vision</h3>
          <p>Explain how your platform empowers retailers and customers.</p>
          <h3>Our Solution</h3>
          <p>Describe modules: POS, Sales, Repairs, Trade‑ins, Booking, Inventory.</p>
          <h3>Our Commitment</h3>
          <p>State your product/engineering and customer support values.</p>
        </div>
      </Container>
    </Section>
  )
}
