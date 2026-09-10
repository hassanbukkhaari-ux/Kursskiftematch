import type { Metadata } from 'next'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Privatlivspolitik | Kursskifte',
  description:
    'Læs hvordan Kursskifte behandler personoplysninger i overensstemmelse med GDPR og dansk databeskyttelseslovgivning.',
  alternates: { canonical: '/privatlivspolitik' },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-serif text-xl text-[#1C3829] mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-[#4A4F48] leading-relaxed">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-2 border-b border-[#E0DAD0] last:border-0">
      <span className="w-40 shrink-0 font-medium text-[#1A1F1C] text-xs">{label}</span>
      <span className="text-xs text-[#4A4F48]">{value}</span>
    </div>
  )
}

export default function PrivatlivspolitikPage() {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <PublicNav />
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <div className="mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">Sidst opdateret: september 2026</p>
          <h1 className="font-serif text-3xl text-[#1A1F1C] mb-4">Privatlivspolitik</h1>
          <p className="text-sm text-[#6B7569] leading-relaxed">
            Kursskifte ApS behandler personoplysninger i overensstemmelse med databeskyttelsesforordningen (GDPR) og den danske databeskyttelseslov. Denne politik beskriver, hvilke oplysninger vi indsamler, hvorfor vi gør det, og hvilke rettigheder du har.
          </p>
        </div>

        <Section title="1. Dataansvarlig">
          <p>
            <strong className="text-[#1A1F1C]">Kursskifte ApS</strong><br />
            CVR-nr.: oplyses på forespørgsel<br />
            Kontakt: <a href="mailto:kontakt@kursskifte.dk" className="text-[#1C3829] underline">kontakt@kursskifte.dk</a>
          </p>
        </Section>

        <Section title="2. Hvilke oplysninger behandler vi">
          <p>Vi behandler følgende kategorier af personoplysninger afhængigt af din rolle:</p>
          <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 mt-3">
            <Row label="Borgere (Citizens)" value="Initialer, aldersgruppe, forløbstype og sagsbeskrivelse. Fulde navn og kontaktoplysninger opbevares udelukkende i det lukkede fagportal og deles aldrig med kommunen." />
            <Row label="Fagpersoner" value="Fulde navn, e-mailadresse, telefonnummer, uddannelse, erhvervserfaring, straffeattestoplysninger, børneattestoplysninger, timer og sessionslogs." />
            <Row label="Kommunale kontaktpersoner" value="Navn, e-mailadresse, telefonnummer og rolle — udelukkende til koordinering af forløb." />
            <Row label="Henvendelser" value="Navn, e-mail, telefon og beskrivelse af behov fra kommuner eller borgere der kontakter os via vores hjemmeside." />
          </div>
        </Section>

        <Section title="3. Formål og retsgrundlag">
          <p>Vi behandler personoplysninger til følgende formål:</p>
          <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 mt-3">
            <Row label="Matching og tildeling" value="Matchning af fagpersoner med borgere. Retsgrundlag: Opfyldelse af kontrakt (GDPR art. 6, stk. 1, litra b) og berettiget interesse (litra f)." />
            <Row label="Dokumentation" value="Sessionslogs og timeregistreringer til dokumentation overfor kommunen. Retsgrundlag: Retlig forpligtelse (litra c) og berettiget interesse (litra f)." />
            <Row label="Kommunikation" value="E-mailnotifikationer om sagsforløb. Retsgrundlag: Opfyldelse af kontrakt (litra b)." />
            <Row label="Straffeattester" value="Verificering af fagpersoners egnethed. Retsgrundlag: Samtykke (litra a) og retlig forpligtelse (litra c)." />
            <Row label="Markedsføring" value="Kun hvis du har givet specifikt samtykke. Du kan til enhver tid trække samtykket tilbage." />
          </div>
        </Section>

        <Section title="4. Opbevaringsperioder">
          <p>Vi opbevarer personoplysninger i følgende perioder:</p>
          <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 mt-3">
            <Row label="Aktive sagsforløb" value="Oplysningerne opbevares i forløbets varighed samt 5 år efter afslutning af hensyn til dokumentation og eventuelle tvister." />
            <Row label="Fagpersonprofiler" value="Opbevares så længe fagpersonen er aktiv. Inaktive profiler slettes eller anonymiseres efter 2 år." />
            <Row label="Henvendelser" value="Opbevares i 2 år fra modtagelse." />
            <Row label="Regnskabsbilag (timer)" value="Opbevares i 5 år jf. bogføringsloven." />
          </div>
        </Section>

        <Section title="5. Videregivelse og underdatabehandlere">
          <p>Vi videregiver kun personoplysninger til tredjeparter, når det er nødvendigt. Vi anvender følgende underdatabehandlere:</p>
          <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 mt-3">
            <Row label="Supabase Inc." value="Databasehosting og autentifikation. Data behandles i EU (Frankfurt, AWS eu-central-1). Databehandleraftale foreligger." />
            <Row label="Resend Inc." value="Udsendelse af transaktionelle e-mails. Data behandles i USA under EU-US Data Privacy Framework. Databehandleraftale foreligger." />
            <Row label="Vercel Inc." value="Hosting af webapplikationen. Data behandles primært i EU. Databehandleraftale foreligger." />
          </div>
          <p className="mt-3">Fagpersoners navne og kontaktoplysninger videregives <strong>ikke</strong> til kommunen. Kommunen modtager udelukkende anonymiserede oplysninger (initialer, rolle) i sagsbehandlingssammenhæng.</p>
        </Section>

        <Section title="6. Dine rettigheder">
          <p>Du har følgende rettigheder i henhold til GDPR:</p>
          <ul className="space-y-1.5 list-none">
            {[
              ['Indsigt', 'Du kan anmode om en kopi af de oplysninger vi har om dig.'],
              ['Berigtigelse', 'Du kan anmode om rettelse af ukorrekte oplysninger.'],
              ['Sletning', 'Du kan anmode om sletning af dine oplysninger, medmindre vi er retligt forpligtet til at opbevare dem.'],
              ['Begrænsning', 'Du kan anmode om begrænsning af behandlingen i visse situationer.'],
              ['Dataportabilitet', 'Du kan anmode om at modtage dine oplysninger i et maskinlæsbart format.'],
              ['Indsigelse', 'Du kan gøre indsigelse mod behandling baseret på berettiget interesse.'],
              ['Tilbagekaldelse af samtykke', 'Hvis behandlingen er baseret på samtykke, kan du til enhver tid trække det tilbage uden at det påvirker lovligheden af behandling foretaget inden tilbagekaldelsen.'],
            ].map(([right, desc]) => (
              <li key={right} className="flex gap-2 items-start">
                <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-[#C8993A] mt-1.5" />
                <span><strong className="text-[#1A1F1C]">{right}:</strong> {desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">Send din anmodning til <a href="mailto:kontakt@kursskifte.dk" className="text-[#1C3829] underline">kontakt@kursskifte.dk</a>. Vi besvarer henvendelser inden for 30 dage.</p>
        </Section>

        <Section title="7. Klage">
          <p>
            Hvis du mener, at vi behandler dine personoplysninger i strid med databeskyttelseslovgivningen, har du ret til at klage til Datatilsynet:
          </p>
          <p className="mt-2">
            <strong className="text-[#1A1F1C]">Datatilsynet</strong><br />
            Carl Jacobsens Vej 35, 2500 Valby<br />
            Telefon: 33 19 32 00<br />
            E-mail: dt@datatilsynet.dk<br />
            Web: datatilsynet.dk
          </p>
        </Section>

        <Section title="8. Ændringer i politikken">
          <p>
            Vi opdaterer løbende denne privatlivspolitik, når vores behandling af personoplysninger ændrer sig. Den seneste version er altid tilgængelig på denne side. Væsentlige ændringer meddeles berørte personer via e-mail.
          </p>
        </Section>

        <div className="bg-[#1C3829] rounded-2xl p-6 mt-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C8993A] mb-2">Spørgsmål?</div>
          <p className="text-sm text-white/80 mb-4">Har du spørgsmål til vores behandling af personoplysninger, er du velkommen til at kontakte os direkte.</p>
          <a
            href="mailto:kontakt@kursskifte.dk"
            className="inline-flex items-center h-9 px-5 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors"
          >
            Kontakt os
          </a>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
