// Håndbog for kontaktpersoner — indhold. Holdt som ren markdown pr. afsnit
// (renderet via MarkdownContent/prose-kursskifte) så det er nemt at redigere
// uden at røre sidens layout, søgning eller indholdsfortegnelse.

export interface HandbookSection {
  id: string
  title: string
  body: string
}

export const HANDBOOK_SECTIONS: HandbookSection[] = [
  {
    id: 'velkommen',
    title: 'Velkommen',
    body: `Denne håndbog er til dig som kontaktperson hos Kursskifte. Den er ikke en teknisk manual til systemet — den handler om, hvad du gør, når noget sker i dit arbejde med en borger. Både det hverdagsagtige (hvordan et forløb hænger sammen) og det alvorlige (hvad du gør hvis noget går galt).

**Sådan bruger du den:** Læs afsnittet om adfærd og grænser, når du starter — det forebygger de fleste alvorlige situationer. Gem selve håndbogen et sted du hurtigt kan finde den, hvis du står i en situation og har brug for at vide hvad du gør lige nu.`,
  },
  {
    id: 'forloeb',
    title: 'Sådan hænger et forløb sammen',
    body: `1. **Du bliver foreslået til en sag.** Du får besked og bekræfter din tilgængelighed, før sagen går videre til kommunen.
2. **Kommunen godkender.** Du får besked når sagen er aktiv. Tag herefter selv kontakt til kommunens sagsbehandler for at aftale et opstartsmøde, hvor I gennemgår borgeren sammen, inden forløbet starter — du logger det på sagen, og får en påmindelse hvis der ikke er sket noget efter nogle dage.
3. **Du dokumenterer undervejs.** Efter hver session skriver du en sessionslog. Den kan ikke slettes eller ændres, når den er færdiggjort — skal noget rettes, tilføjer du i stedet en rettelse til loggen.
4. **Du registrerer dine timer.** Admin godkender dem løbende.
5. **Hvis noget ændrer sig** — du bliver syg, sagen ændrer karakter, eller det er bedst at en anden overtager — håndteres det som en overdragelse. Du bliver aldrig bare taget af en sag uden dialog.
6. **Sagen lukkes**, når forløbet er færdigt eller kommunen stopper bevillingen.

Det er det praktiske. Resten af håndbogen handler om det, der ikke står i systemet.`,
  },
  {
    id: 'adfaerd',
    title: 'Generelle adfærdsregler og grænser',
    body: `Dette bygger på Kursskiftes eksisterende **Arbejdsmiljø- og sikkerhedsprocedure**. De fleste alvorlige situationer — både for borgeren og for dig — forebygges her, før de opstår.

- **Alenearbejde vurderes altid først.** Før et møde: overvej lokation, tidspunkt og om der er behov for at ændre rammerne (andet sted, flere personer til stede, kollega orienteret om hvor du er).
- **Hold kontakt til Kursskifte.** Nogen skal altid vide hvor og når du er sammen med en borger, særligt ved første møder eller sager med kendte risikofaktorer.
- **Tydelige, professionelle grænser i al kommunikation** — også digitalt. Hold kontakten til borgeren på kanaler der kan efterses (ikke private beskeder på personlige profiler).
- **Fysisk kontakt** skal altid være situationsbestemt, tydelig og professionelt begrundet — aldrig noget der kan misforstås eller ikke kan redegøres for bagefter.
- **Dokumentér løbende**, ikke kun når noget går galt. En god sessionslog er din bedste beskyttelse, hvis noget senere skal genfortælles eller efterprøves.
- **Kursskifte accepterer ikke** trusler, vold, grænseoverskridende adfærd eller chikane — hverken mod dig eller fra dig. Oplever du det, er det aldrig noget du skal håndtere alene (se afsnittet om konflikt og vold nedenfor).

Følger du disse rammer konsekvent, står du markant stærkere, hvis en situation alligevel skulle opstå — og nogen senere sætter spørgsmålstegn ved, hvad der egentlig skete.`,
  },
  {
    id: 'anklaget',
    title: 'Hvis du bliver anklaget for noget',
    body: `De fleste anklager mod fagpersoner i socialt arbejde viser sig ubegrundede (bekræftet af bl.a. Børns Vilkårs Forbund/BUPL's egen erfaring) — men **enhver anklage skal tages alvorligt fra første sekund**, både af hensyn til borgeren og til dig selv.

### Det første du gør

1. **Kontakt Kursskifte med det samme.** Ring, skriv ikke bare en besked — dette skal håndteres nu, ikke når nogen ser en mail.
2. **Kontakt din fagforening, hvis du er medlem af en** (fx BUPL, Socialpædagogerne, DS). De har erfaring med præcis denne slags sager og kan rådgive dig om dine rettigheder fra første samtale.
3. **Skriv selv ned, hvad du husker**, mens det er friskt — tid, sted, hvem der var til stede, hvad der skete. Til dig selv, ikke som et offentligt forsvarsskrift.
4. **Undlad at kontakte borgeren eller borgerens familie direkte** om anklagen, selvom det føles naturligt at ville forklare dig. Lad Kursskifte og eventuel fagforening styre den kontakt.

### Dine rettigheder

- **Du har ret til en bisidder** (en støtteperson, fx fra din fagforening) til ethvert møde hvor anklagen drøftes.
- **Du har ingen pligt til at udtale dig til pressen.** Henvis i stedet til Kursskifte.
- Det er normalt, at man midlertidigt fritages fra sager under en undersøgelse — det er **ikke** det samme som en skyldig-kendelse, og bør ske i dialog med dig, ikke som en straf.
- Du kan have brug for krise-psykologisk støtte undervejs — spørg Kursskifte om muligheder.

### Forsikring

Kursskifte har erhvervs- og ansvarsforsikring, der dækker dig som kontaktperson i dit arbejde.

*Kilde til denne vejledning: offentliggjort rådgivning fra BUPL til medlemmer der møder anklager i deres arbejde. Kursskiftes kontaktpersoner er ikke nødvendigvis fagforeningsmedlemmer på samme vilkår — dette punkt bør også afklares konkret.*`,
  },
  {
    id: 'bekymring',
    title: 'Hvis du oplever eller mistænker noget hos borgeren',
    body: `Dette bygger på Kursskiftes egen **Procedure ved bekymring om borger**.

### Hvad tæller som en bekymring

Det er ikke kun mistænkte overgreb. Det tæller også: væsentlig forværring i trivsel, psykisk mistrivsel, social isolation, udadreagerende eller selvskadende adfærd, uforklarede udeblivelser, mistænkt misbrug, eller andet der gør dig urolig på borgerens vegne.

### Din personlige underretningspligt (barnets lov §133)

Hvis borgeren er under 18 år, har du som fagperson en **skærpet, personlig underretningspligt** til kommunen. Tre ting er vigtige at forstå:

- **Den er personlig.** Det er dit ansvar at underretningen rent faktisk når frem — ikke nok at du har nævnt det til Kursskifte, hvis det ikke også er gået videre.
- **Den går forud for tavshedspligten.** Tavshedspligt er aldrig en gyldig grund til ikke at underrette.
- **Den gælder før det bliver alvorligt.** Du skal ikke vente til du er sikker på overgreb eller omsorgssvigt — pligten indtræder allerede når du vurderer at barnet/den unge kan have brug for støtte, også ved mindre alvorlige bekymringer.

Platformens sikkerhedsflag på sessionslog er et **supplement, ikke en erstatning** — det giver Kursskifte et internt overblik, men fritager dig ikke for selv at underrette kommunen direkte.

### Sådan gør du

1. **Bevar roen** og lav en konkret, faglig vurdering — ikke en antagelse.
2. **Vurder om det er akut** (se næste afsnit, hvis ja).
3. **Dokumentér**: dato, tidspunkt, konkrete observationer (ikke tolkninger), hvad du har gjort, hvem du har kontaktet.
4. **Kontakt Kursskifte** — stå ikke alene med en alvorlig vurdering, søg intern sparring hvis muligt.
5. **Underret selv kommunen**, hvis borgeren er under 18 år og du vurderer der er grundlag — det er din pligt, uanset hvad Kursskifte i øvrigt gør.

Kursskifte er ikke en myndighed, et beredskab eller et behandlingstilbud. Ved behov for akut hjælp kontaktes altid de rigtige instanser direkte (næste afsnit).`,
  },
  {
    id: 'konflikt-vold',
    title: 'Fysisk konflikt eller trussel om vold',
    body: `Dette bygger direkte på Kursskiftes egen **Procedure ved konflikter og utrygge situationer**.

### Grundprincip

Rolig, professionel kommunikation. Konfliktnedtrappende tilgang. Tydelige grænser. Du skal **aldrig** udsætte dig selv eller andre for unødig risiko for at "få sagen til at gå".

### I situationen

- Bevar ro og overblik.
- Vurder sikkerhed og risiko løbende.
- Forsøg verbal konfliktnedtrapning — undgå unødige diskussioner eller magtkampe.
- **Afslut situationen**, hvis den føles utryg. Du skal ikke blive for at være høflig.

### Ved fysisk trussel, vold eller akut fare

Afslut situationen hurtigst muligt og kontakt straks:

- **112** ved akut fare
- **Politiet**
- **Kursskifte**

Sikkerhed går altid forud for at færdiggøre mødet eller sessionen.

### Bagefter

- **Dokumentér**: dato, tidspunkt, involverede, konkret hændelsesforløb, hvad du gjorde, hvem du kontaktede. Neutralt og faktuelt — undgå personlige vurderinger.
- **Kontakt Kursskifte** for opfølgning — belastende hændelser skal evalueres, ikke bare lægges væk.
- Du har ret til faglig sparring og støtte efter en belastende hændelse. Sig til, hvis du har brug for det — det forventes ikke at du bare fortsætter som ingenting.`,
  },
  {
    id: 'akut-sundhed',
    title: 'Akutte sundhedssituationer',
    body: `Kursskifte er **ikke** et behandlingstilbud, døgnberedskab eller psykiatrisk akuttilbud — det gælder også her. Din opgave er at reagere rigtigt i øjeblikket, ikke at behandle.

- **Fysisk livsfare eller alvorlig tilskadekomst:** ring **112** først. Bliv hos borgeren hvis det er sikkert.
- **Akut psykisk krise (fx selvmordstruet borger):** kontakt **akut psykiatri** eller **112**, afhængigt af alvor — tag altid det sikreste valg, hvis du er i tvivl.
- **Efter du har fået den rette hjælp på vej:** kontakt Kursskifte så hurtigt som muligt.
- **Dokumentér bagefter**: hvad skete der, hvad gjorde du, hvem kontaktede du, hvornår. Konkret og faktuelt.

Akutte situationer går **altid** forud for almindelige procedurer — du skal ikke bruge tid på at følge den normale sagsgang, før borgeren er i sikkerhed.`,
  },
  {
    id: 'hurtig-opslag',
    title: 'Hurtig-opslag: hvem kontakter du?',
    body: `| Situation | Først | Derefter |
|---|---|---|
| Akut fare for liv/helbred | **112** | Kursskifte, så snart det er sikkert |
| Akut psykisk krise hos borger | **112 / akut psykiatri** | Kursskifte |
| Fysisk trussel eller vold mod dig | **112 / politi**, kom sikkert væk | Kursskifte |
| Bekymring for borger under 18 år | **Kommunen (din underretningspligt)** | Kursskifte, til intern sparring |
| Bekymring for borger over 18 år | Kursskifte | — |
| Du bliver anklaget for noget | **Kursskifte** | Din fagforening (hvis medlem) |
| Tvivl om noget i denne håndbog | Kursskifte | — |

**Husk:** i enhver akut situation går de rigtige myndigheder (112, politi, psykiatri) altid forud for at kontakte Kursskifte først — kontakt os så snart borgeren og du selv er i sikkerhed.`,
  },
]
