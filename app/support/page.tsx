import { Container } from '@/components/Container'
import { Section } from '@/components/Section'
import { KBCard } from '@/components/KBCard'
import { kb } from '@/content/kb'

export default function Support(){
  return (
    <Section>
      <Container>
        <h1 className="text-3xl font-extrabold">Customer Support</h1>
        <p className="mt-2 text-slate-600">Browse our knowledge base.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KBCard title="Getting Started" items={kb.gettingStarted}/>
          <KBCard title="Daily Operations" items={kb.dailyOps}/>
          <KBCard title="Advanced Features" items={kb.advanced}/>
          <KBCard title="Troubleshooting" items={kb.troubleshooting}/>
        </div>
      </Container>
    </Section>
  )
}
