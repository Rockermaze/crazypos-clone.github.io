import { Container } from '@/components/Container'
import { Section } from '@/components/Section'
import { FeatureCard } from '@/components/FeatureCard'
import { features } from '@/content/features'

export default function Products(){
  return (
    <Section>
      <Container>
        <h1 className="text-3xl font-extrabold">Product Overview</h1>
        <p className="mt-3 max-w-prose text-slate-600">Discover features designed to enhance your retail management experience.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(f=> <FeatureCard key={f.title} {...f} />)}
        </div>
      </Container>
    </Section>
  )
}
