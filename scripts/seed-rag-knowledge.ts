import { MDocument } from '@mastra/rag';
import { embedMany } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const embeddingModel = openai.embedding('text-embedding-3-small');

interface KnowledgeArticle {
  title: string;
  sourceUrl: string;
  content: string;
}

const articles: KnowledgeArticle[] = [
  {
    title: 'NEN-EN 15635 – Stellinginspectie en veiligheid',
    sourceUrl:
      'https://www.logistiekconcurrent.nl/kennis/nen-en-15635-stellinginspectie',
    content: `# NEN-EN 15635 – Gebruik en onderhoud van opslagsystemen

## Wat is NEN-EN 15635?

NEN-EN 15635 is de Europese norm die de eisen beschrijft voor het gebruik en onderhoud van stalen opslagsystemen. Deze norm is van toepassing op alle soorten stellingen in magazijnen, distributiecentra en opslagruimtes.

## Verplichtingen volgens NEN-EN 15635

### Aanstellen van een PRSES
Elke organisatie die stellingen gebruikt, moet een **Persoon Verantwoordelijk voor Stellingveiligheid (PRSES)** aanstellen. Deze persoon is verantwoordelijk voor:
- Het opstellen en bijhouden van een inspectieregime
- Het beoordelen van schademeldingen
- Het coördineren van reparaties
- Het bijhouden van een stellingregister

### Inspecties
De norm schrijft drie niveaus van inspectie voor:

1. **Dagelijkse visuele inspectie**: Medewerkers melden zichtbare schade tijdens het dagelijks werk
2. **Wekelijkse/maandelijkse inspectie**: Door de PRSES of getraind personeel, met aandacht voor:
   - Verbogen staanders en liggers
   - Ontbrekende of beschadigde veiligheidspinnen
   - Overbelading van stellingen
   - Beschadigde pallets in de stelling
3. **Jaarlijkse expertinspectie**: Door een onafhankelijke deskundige die de gehele installatie beoordeelt

### Risicoklassen voor schade
De norm hanteert een verkeerslicht-systeem voor het classificeren van schade:

- **GROEN**: Schade binnen tolerantie, geen directe actie nodig maar wel monitoren
- **ORANJE**: Schade die binnen een afgesproken termijn gerepareerd moet worden, stelling mag onder voorwaarden gebruikt worden
- **ROOD**: Ernstige schade, stelling moet onmiddellijk ontladen en uit gebruik genomen worden tot reparatie is uitgevoerd

### Maximale doorbuiging
Staanders mogen niet meer doorbuigen dan **L/200** (lengte gedeeld door 200). Bij een staander van 3 meter is de maximale doorbuiging dus 15 mm. Grotere doorbuiging vereist onmiddellijke actie.

## Veelgemaakte fouten

- Geen PRSES aangesteld of PRSES niet getraind
- Jaarlijkse expertinspectie wordt overgeslagen of niet door een onafhankelijke partij uitgevoerd
- Schade wordt gemeld maar niet geregistreerd of opgevolgd
- Beschadigde stellingdelen worden niet gemarkeerd (ontbrekende rood/oranje stickers)
- Maximale belasting is niet zichtbaar aangegeven op de stelling
- Stellingaanrijdbeveiligingen ontbreken bij drukke rijpaden

## Relatie met Arbowet

NEN-EN 15635 wordt door de Nederlandse Arbeidsinspectie als referentienorm beschouwd. Bij een inspectie door de Arbeidsinspectie wordt verwacht dat organisaties conform deze norm werken. Het niet naleven kan leiden tot boetes en in ernstige gevallen tot stillegging van werkzaamheden.

## Aanbevolen producten

- **Aanrijdbeveiligingen**: Kolombeschermers, hoekbeschermers en doorrijbeveiliging beschermen stellingen tegen aanrijdschade door heftrucks
- **Stellingstickers**: Rood/oranje/groen stickers voor het markeren van schade volgens het verkeerslicht-systeem
- **Belastingbordjes**: Geven de maximaal toegestane belasting per niveau aan`,
  },
  {
    title: 'Arbowet en Arbobesluit – Magazijnveiligheid',
    sourceUrl:
      'https://www.logistiekconcurrent.nl/kennis/arbowet-magazijnveiligheid',
    content: `# Arbowet en Arbobesluit – Veiligheid in het magazijn

## Arbowet in het kort

De Arbeidsomstandighedenwet (Arbowet) is de Nederlandse basiswet voor arbeidsomstandigheden. De wet verplicht werkgevers om te zorgen voor een veilige en gezonde werkplek. Voor magazijnen zijn met name de volgende bepalingen van belang:

### Algemene zorgplicht (art. 3 Arbowet)
De werkgever voert een beleid gericht op zo goed mogelijke arbeidsomstandigheden. Dit betekent concreet:
- Gevaren bij de bron aanpakken
- Werkplekken, arbeidsmiddelen en werkmethoden aanpassen aan de werknemer
- Monotoon en tempogebonden werk beperken
- Maatregelen treffen voor gevaarlijke stoffen

### RI&E-verplichting (art. 5 Arbowet)
Elke werkgever met personeel is verplicht een **Risico-Inventarisatie en -Evaluatie (RI&E)** uit te voeren en een plan van aanpak op te stellen. Zie het aparte artikel over RI&E.

### Voorlichting en onderricht (art. 8 Arbowet)
Werkgevers moeten werknemers voorlichten over:
- De risico's van het werk
- De maatregelen die getroffen zijn
- Het juist gebruik van persoonlijke beschermingsmiddelen (PBM)
- De werking van noodprocedures

## Arbobesluit – Specifieke magazijneisen

### Vloeren en verkeersroutes (art. 3.2 en 3.13)
- Vloeren moeten vlak, stroef en vrij van obstakels zijn
- Verkeersroutes voor personen en voertuigen moeten duidelijk gemarkeerd zijn
- Eenrichtingsverkeer waar mogelijk
- Voetgangerspaden gescheiden van rijverkeer

### Fysieke belasting (art. 5.2-5.4)
- Tillen: maximaal 25 kg handmatig (aanbevolen max 23 kg volgens NIOSH)
- Werkgevers moeten tilhulpmiddelen beschikbaar stellen
- Werkplekken moeten ergonomisch ingericht zijn
- Beeldschermwerk: pauzes en juiste werkhouding

### Persoonlijke beschermingsmiddelen (art. 8.1-8.3)
In magazijnen zijn vaak verplicht:
- Veiligheidsschoenen (S3 bij heftruckverkeer)
- Veiligheidsvesten met hoge zichtbaarheid
- Handschoenen bij het hanteren van goederen
- Gehoorbescherming bij lawaaiige omgevingen (>80 dB)

### Arbeidsmiddelen (art. 7.1-7.6)
- Alle arbeidsmiddelen (heftrucks, rolcontainers, hoogwerkers) moeten gekeurd en onderhouden zijn
- Alleen bevoegde en getrainde medewerkers mogen arbeidsmiddelen bedienen
- Jaarlijkse keuring van heftrucks is verplicht

## Handhaving door de Arbeidsinspectie

De Nederlandse Arbeidsinspectie (NLA) controleert naleving. Bij overtredingen kan de NLA:
- Een waarschuwing geven
- Een eis tot naleving stellen (met termijn)
- Een boete opleggen (tot €13.500 per overtreding)
- Het werk stilleggen bij direct gevaar
- Bij ernstige ongevallen: strafrechtelijke vervolging van de werkgever

## Praktische tips

1. Zorg dat de RI&E actueel is en specifieke magazijnrisico's bevat
2. Organiseer maandelijkse veiligheidsrondes door het magazijn
3. Registreer alle incidenten en bijna-ongevallen
4. Zorg voor duidelijke vluchtroutes en nooduitgangen
5. Houd BHV-materiaal (brandblusers, EHBO) toegankelijk en gekeurd
6. Markeer looppaden en rijroutes met duurzame vloermarkering`,
  },
  {
    title: 'RI&E – Risico-Inventarisatie en -Evaluatie voor magazijnen',
    sourceUrl: 'https://www.logistiekconcurrent.nl/kennis/rie-magazijn',
    content: `# RI&E – Risico-Inventarisatie en -Evaluatie

## Wat is een RI&E?

De Risico-Inventarisatie en -Evaluatie (RI&E) is een wettelijk verplicht instrument waarmee werkgevers alle arbeidsrisico's in kaart brengen. Voor magazijnen is de RI&E extra belangrijk vanwege de combinatie van zwaar materieel, hoogte, fysieke arbeid en logistieke druk.

## Wettelijke basis

- **Artikel 5 Arbowet**: Elke werkgever met personeel moet een RI&E hebben
- **Plan van Aanpak**: Bij de RI&E hoort verplicht een plan van aanpak met concrete maatregelen en termijnen
- **Toetsing**: Bedrijven met meer dan 25 medewerkers moeten de RI&E laten toetsen door een gecertificeerde arbodienst of arbodeskundige
- **Actualisering**: De RI&E moet geactualiseerd worden bij wijzigingen in werkprocessen, nieuwe risico's of na ernstige incidenten

## Specifieke magazijnrisico's

### 1. Verkeer en transport
- Aanrijdgevaar: heftrucks vs. voetgangers
- Achteruitrijden van heftrucks
- Kruisend verkeer op knooppunten
- Laden en lossen bij docks

### 2. Vallen en vallende objecten
- Werken op hoogte (orderpicken bovenin stellingen)
- Vallende pallets of goederen uit stellingen
- Uitglijden op gladde of natte vloeren
- Struikelen over obstakels of kabels

### 3. Fysieke belasting
- Repetitief tillen en dragen
- Ongunstige werkhoudingen bij orderpicken
- Duwen en trekken van rolcontainers
- Trillingen bij het besturen van heftrucks

### 4. Stellingveiligheid
- Instorten van overbelaste stellingen
- Beschadigde staanders en liggers
- Onjuist geplaatste pallets
- Ontbrekende aanrijdbeveiligingen

### 5. Brand en ontploffing
- Opslag van gevaarlijke stoffen
- Acculaadruimtes (waterstofvorming)
- Brandbare verpakkingsmaterialen
- Onvoldoende brandcompartimentering

### 6. Psychosociale belasting
- Werkdruk en piekbelasting (seizoenen)
- Nachtwerk en ploegendiensten
- Monotoon werk bij orderpicken
- Agressie bij laden/lossen

## Plan van Aanpak

Een goed plan van aanpak bevat voor elk geïdentificeerd risico:
- **Beschrijving** van het risico
- **Prioriteit** (op basis van ernst × waarschijnlijkheid × blootstelling)
- **Maatregel** die genomen wordt
- **Verantwoordelijke** persoon
- **Deadline** voor uitvoering
- **Status** van de uitvoering

### Prioritering volgens de arbeidshygiënische strategie
1. **Bronmaatregelen**: het gevaar wegnemen (bijv. automatisering van tilwerk)
2. **Collectieve maatregelen**: het gevaar afschermen (bijv. aanrijdbeveiligingen, hekwerken)
3. **Individuele maatregelen**: de werknemer beschermen (bijv. PBM's)
4. **Organisatorische maatregelen**: procedures en instructies (bijv. verkeersregels)

## Veelgemaakte fouten bij de RI&E

- RI&E is te generiek en benoemt geen magazijnspecifieke risico's
- Plan van aanpak ontbreekt of is niet actueel
- RI&E is niet getoetst terwijl het bedrijf >25 medewerkers heeft
- Risico's worden geïnventariseerd maar niet geëvalueerd (geen prioritering)
- Medewerkers worden niet betrokken bij het proces
- RI&E wordt als eenmalig document beschouwd in plaats van levend instrument`,
  },
  {
    title: 'Vloermarkering in het magazijn – Normen en richtlijnen',
    sourceUrl:
      'https://www.logistiekconcurrent.nl/kennis/vloermarkering-magazijn',
    content: `# Vloermarkering in het magazijn

## Waarom vloermarkering?

Duidelijke vloermarkering is essentieel voor een veilig en efficiënt magazijn. Het scheidt verkeersstromen, markeert gevaarszones en helpt bij het organiseren van opslagruimte. Vloermarkering is niet alleen een best practice — het is wettelijk verplicht volgens het Arbobesluit.

## Wettelijke basis

- **Arbobesluit art. 3.13**: Verkeersroutes moeten duidelijk gemarkeerd zijn
- **Arbobesluit art. 3.2**: Werkplekken moeten overzichtelijk en veilig ingericht zijn
- **NEN-EN ISO 7010**: Internationale norm voor veiligheidskleuren en -symbolen

## Kleurcodes volgens NEN-EN ISO 7010

### Geel
- **Gebruik**: Looppaden, rijroutes, parkeerplaatsen voor heftrucks
- **Breedte**: Minimaal 50 mm, aanbevolen 75-100 mm voor rijroutes
- **Toepassing**: Continue lijnen voor vaste routes, onderbroken lijnen voor kruisingen

### Wit
- **Gebruik**: Opslaglocaties, palletplaatsen, productie-/werkgebieden
- **Toepassing**: Markering van stellingposities op de vloer, afbakening van werkstations

### Rood
- **Gebruik**: Verbodszones, brandbestrijdingsmiddelen, nooduitgangen
- **Toepassing**: Vrijhoudzone rond brandblusers (minimaal 1 meter), zone voor nooduitgangen

### Groen
- **Gebruik**: Veiligheidsroutes, EHBO-voorzieningen, verzamelplaatsen
- **Toepassing**: Vluchtroutes naar nooduitgangen

### Blauw
- **Gebruik**: Informatieve markering, verplichte zones (bijv. PBM-zone)
- **Toepassing**: Zones waar specifieke persoonlijke beschermingsmiddelen verplicht zijn

### Zwart-geel gestreept
- **Gebruik**: Waarschuwing voor gevaar, obstakels, hoogteverschillen
- **Toepassing**: Rond pilaren, bij drempels, langs platforms of heftruckroutes

## Soorten vloermarkering

### Verf
- **Voordelen**: Goedkoop, snel aan te brengen op grote oppervlakken
- **Nadelen**: Slijt snel bij zwaar verkeer, lastig te verwijderen
- **Levensduur**: 6-12 maanden bij intensief gebruik

### Tape
- **Voordelen**: Eenvoudig aan te brengen en te verwijderen, direct klaar
- **Nadelen**: Kan loslaten bij vuil of vocht, minder duurzaam
- **Levensduur**: 3-12 maanden afhankelijk van kwaliteit

### Epoxy/PU-coating
- **Voordelen**: Zeer duurzaam, bestand tegen zwaar verkeer en chemicaliën
- **Nadelen**: Duurder, langere aanbrengtijd, vloer moet voorbehandeld worden
- **Levensduur**: 3-5 jaar of langer

### Markeringshoeken en -strepen (kunststof)
- **Voordelen**: Snel te leggen, herbruikbaar, zelfklevend
- **Nadelen**: Kunnen loskomen bij intensief heftruckverkeer
- **Levensduur**: 1-3 jaar

## Richtlijnen voor padbreedte

- **Voetgangerspad**: Minimaal 0,8 meter breed (1,2 meter bij tweerichtingsverkeer)
- **Eenrichtingsverkeer heftruck**: Breedte voertuig + 2x 0,5 meter (minimaal 2,5 meter)
- **Tweerichtingsverkeer heftruck**: 2x breedte voertuig + 3x 0,5 meter (minimaal 4,5 meter)
- **Gemengd verkeer**: Voetgangers en heftrucks gescheiden, of duidelijk gemarkeerde oversteken

## Tips voor effectieve vloermarkering

1. Maak een plattegrond met alle verkeersstromen voordat je begint
2. Betrek medewerkers bij het ontwerp — zij kennen de dagelijkse looplijnen
3. Gebruik reflecterende markering bij slechte verlichting
4. Plan onderhoud in: inspecteer markering maandelijks en herstel direct
5. Combineer vloermarkering met verticale signalering (borden, spiegels)
6. Zorg voor een schone, droge vloer bij het aanbrengen

## Producten voor vloermarkering

Logistiekconcurrent biedt een breed assortiment vloermarkering:
- Duurzame vloertape in alle veiligheidskleuren
- Zelfklevende markeringshoeken voor palletplaatsen
- Vloermarkeringsets voor complete magazijninrichting
- Vloerborden en -stickers voor specifieke zones`,
  },
  {
    title: 'Heftruckveiligheid – Regels, keuring en preventie',
    sourceUrl:
      'https://www.logistiekconcurrent.nl/kennis/heftruckveiligheid',
    content: `# Heftruckveiligheid in het magazijn

## Risico's van heftruckgebruik

Heftrucks zijn onmisbaar in het magazijn maar vormen een van de grootste risicobronnen. In Nederland vinden jaarlijks honderden ongelukken plaats met heftrucks, waarvan een deel met dodelijke afloop. De meest voorkomende ongevallen:

- **Aanrijdingen**: Heftruck raakt voetganger of andere heftruck
- **Kantelen**: Door te snel rijden, overbelading of ongelijke vloer
- **Vallende lading**: Onveilig gestapeld of beschadigde pallets
- **Beknelling**: Tussen heftruck en stelling, muur of ander object
- **Vallen van hoogte**: Bij gebruik als personenheftool zonder goedgekeurd werkplatform

## Wettelijke eisen

### Certificering bestuurder
- Heftruckbestuurders moeten aantoonbaar bekwaam zijn
- Er is geen wettelijk verplicht rijbewijs, maar de werkgever moet kunnen aantonen dat de bestuurder:
  - Een opleiding heeft gevolgd
  - Geëxamineerd is (theorie en praktijk)
  - Periodiek wordt herbeoordeeld
- De meest erkende certificeringen zijn via BMWT of SSVV

### Keuring van de heftruck
- **Jaarlijkse keuring**: Volgens Arbobesluit art. 7.4a moeten heftrucks minimaal jaarlijks gekeurd worden
- **Keuringscriteria**: Remmen, stuurinrichting, hefmechanisme, verlichting, claxon, veiligheidsvoorzieningen
- **Keuringssticker**: Goed zichtbaar aangebracht met vervaldatum
- **Dagelijkse controle**: Bestuurder voert voor aanvang een visuele check uit (banden, olie, vorken, remmen)

### Verkeersregels in het magazijn
- Maximumsnelheid: Doorgaans 10-15 km/u, stapvoets bij onoverzichtelijke situaties
- Claxonneren bij hoeken en deur-openingen
- Achteruitrijden alleen wanneer noodzakelijk, met extra alertheid
- Lading altijd zo laag mogelijk vervoeren (vorken max 15-20 cm boven de grond)
- Niet rijden met verhoogde mast

## Aanrijdbeveiliging

Aanrijdbeveiligingen zijn essentieel om schade aan stellingen, muren, machines en personen te voorkomen:

### Kolombeschermers
- Bevestigd rond stellingstaanders
- Absorberen impact bij lichte aanrijdingen
- Materiaal: staal of kunststof (elastisch)
- Kleur: signaal geel conform veiligheidsnormen

### Hoekbeschermers
- Beschermen hoeken van stellingen aan gangpadzijde
- Extra zwaar uitgevoerd bij drukke rijpaden
- Verankerd in de vloer voor maximale bescherming

### Veiligheidsrailing
- Langs looppaden, machines, en in dock-gebieden
- Scheidt voetgangers van heftruckverkeer
- Standaard hoogte: 400-1100 mm
- Geel gecoat staal, verankerd in beton

### Doorrijbeveiliging
- Bij doorrijstellingen en tunnel-stellingen
- Beschermt stellingbenen aan weerszijden van het gangpad
- Zwaar uitgevoerd voor maximale impactabsorptie

## Blauwe veiligheidsverlichting (Blue Spot)

- Projecteert een blauw licht op de vloer voor of achter de heftruck
- Waarschuwt voetgangers die de heftruck niet kunnen horen of zien
- Bijzonder effectief in onoverzichtelijke situaties en bij koelruimtes
- Steeds vaker verplicht gesteld door bedrijven als standaard veiligheidsuitrusting

## Praktische tips

1. Stel een intern heftruckreglement op en laat alle bestuurders tekenen
2. Markeer heftruckroutes duidelijk met gele vloermarkering
3. Installeer bolle spiegels bij blinde hoeken
4. Gebruik een Blue Spot op alle heftrucks
5. Plan een jaarlijkse opfriscursus voor alle bestuurders
6. Registreer elk incident, ook bijna-ongevallen
7. Zorg voor voldoende aanrijdbeveiligingen bij stellingen`,
  },
  {
    title: 'Brandveiligheid in het magazijn',
    sourceUrl:
      'https://www.logistiekconcurrent.nl/kennis/brandveiligheid-magazijn',
    content: `# Brandveiligheid in het magazijn

## Brandrisico's in magazijnen

Magazijnen hebben een verhoogd brandrisico door de combinatie van:
- Grote hoeveelheden brandbaar verpakkingsmateriaal (karton, plastic, hout)
- Hoge opslagdichtheid in stellingen (brandstapeling)
- Acculaadstations voor heftrucks (waterstofgas bij laden)
- Beperkte compartimentering in grote hallen
- Mogelijk opslag van gevaarlijke stoffen

Een brand in een magazijn kan catastrofale gevolgen hebben: volledige vernietiging van voorraden, bedrijfsonderbreking en gevaar voor medewerkers.

## Wettelijke eisen

### Bouwbesluit 2012 / Besluit bouwwerken leefomgeving (Bbl)
- Eisen aan brandcompartimentering, vluchtwegen en brandwerendheid
- Maximale brandcompartiment-grootte afhankelijk van gebruiksfunctie
- Vluchtroutes: maximale loopafstand tot nooduitgang (doorgaans 60 meter)

### PGS 15 (Publicatiereeks Gevaarlijke Stoffen)
- Van toepassing bij opslag van gevaarlijke stoffen
- Eisen aan opslagkast, compartimentering, ventilatie en blusvoorzieningen

### Arbobesluit
- Art. 3.6: Voldoende en duidelijk gemarkeerde nooduitgangen
- Art. 3.7: Brandbestrijdingsmiddelen in voldoende hoeveelheid
- Art. 3.9: Noodverlichting bij uitval van reguliere verlichting

## Brandpreventie

### Brandcompartimentering
- Grote magazijnhallen opdelen in brandcompartimenten
- Brandwerende wanden en deuren (30-60 minuten brandwerendheid)
- Brandschermen in stellingen om verticale branduitbreiding te voorkomen

### Acculaadruimte
- Gescheiden ruimte met goede ventilatie (waterstof is explosief)
- Geen opslag van brandbare materialen in de laadruimte
- Vonkvrije installatie
- Duidelijke markering en toegangsbeperking

### Housekeeping
- Dagelijks opruimen van afvalmateriaal (karton, folie, band)
- Geen opslag in vluchtwegen of bij nooduitgangen
- Regelmatige reiniging om stofophoping te voorkomen

## Brandbestrijding

### Brandblusers
- Minimaal 1 blusser per 200 m² (afhankelijk van risicoclassificatie)
- Maximale loopafstand tot blusser: 20 meter
- Type: ABC-poeder voor algemeen gebruik, CO₂ bij elektrische installaties
- Jaarlijkse keuring verplicht, maandelijkse visuele inspectie aanbevolen
- Vrije zone van minimaal 1 meter rond elke blusser (markeren met rode vloermarkering)

### Sprinklerinstallatie
- Sterk aanbevolen voor magazijnen > 2.500 m²
- Verlaagt verzekeringspremie significant
- ESFR (Early Suppression Fast Response) sprinklers specifiek ontworpen voor hoge stellingen
- Regelmatig testen en onderhouden volgens NEN 1073

### Brandmeldinstallatie
- Rookmelders en/of hittesensoren
- Automatische doormelding naar brandweer
- Jaarlijkse certificering vereist

## Noodorganisatie

### BHV (Bedrijfshulpverlening)
- Voldoende opgeleide BHV'ers (vuistregel: 1 per 50 medewerkers)
- BHV'ers moeten bereikbaar zijn tijdens alle werktijden
- Jaarlijkse herhalingscursus
- Minimaal 1 ontruimingsoefening per jaar

### Vluchtwegen en nooduitgangen
- Altijd vrij en onbelemmerd
- Noodverlichting boven elke nooduitgang
- Vluchtrouteborden op ooghoogte (groen met wit pijlsymbool)
- Maximale loopafstand tot nooduitgang: 30-60 meter (afhankelijk van bezetting)

### Noodplan
- Plattegrond met vluchtwegen bij elke ingang
- Verzamelplaats buiten het gebouw
- Communicatieprotocol bij calamiteiten
- Jaarlijks herzien en oefenen`,
  },
  {
    title: 'Magazijnefficiëntie – Layout en goederenstroom',
    sourceUrl:
      'https://www.logistiekconcurrent.nl/kennis/magazijn-layout-efficientie',
    content: `# Magazijnefficiëntie – Layout en goederenstroom

## Het belang van een goede magazijnlayout

De layout van een magazijn bepaalt voor 60-70% de efficiëntie van het orderverzamelproces. Een slecht ingedeeld magazijn leidt tot:
- Lange loopafstanden voor orderpickers
- Congestie en wachttijden bij drukke gangpaden
- Inefficiënt gebruik van beschikbare ruimte
- Hogere foutpercentages door onoverzichtelijkheid

## Basisprincipes van magazijnindeling

### Goederenstroompatroon

**U-flow (meest voorkomend)**
- Inbound en outbound aan dezelfde zijde van het magazijn
- Voordelen: Flexibele dock-toewijzing, minder ruimte nodig aan buitenzijde
- Geschikt voor: Magazijnen met wisselende in/outbound volumes

**Through-flow (doorstroom)**
- Inbound aan de ene zijde, outbound aan de andere
- Voordelen: Geen kruisend verkeer, logische flow van ontvangst naar verzending
- Geschikt voor: Cross-docking, hoge volumes met stabiele stromen

**L-flow**
- Inbound en outbound aan aangrenzende zijden
- Voordelen: Compromis tussen U-flow en Through-flow
- Geschikt voor: Gebouwen met beperkte dock-mogelijkheden

### Zonering

Een goed magazijn is opgedeeld in duidelijke zones:

1. **Ontvangstzone**: Inbound-docks, kwaliteitscontrole, etikettering
2. **Opslagzone**: Stellingen, bulkopslag, speciale opslag (gekoeld, gevaarlijke stoffen)
3. **Pickzone**: Handpick-stellingen, pick-to-light, doorrolstellingen
4. **Verpak-/consolidatiezone**: Orderverpakking, samenstelling
5. **Verzendzone**: Outbound-docks, staging area, laadruimte
6. **Technische zone**: Acculaden, onderhoud, kantoor

### ABC-analyse voor locatietoewijzing

Verdeel artikelen op basis van pickfrequentie:

- **A-artikelen** (20% van SKU's, 80% van picks): Dicht bij verzendzone, op ergonomische grijphoogte (0,5-1,5m), in snelloop/doorrolstellingen
- **B-artikelen** (30% van SKU's, 15% van picks): Middenzone, conventionele palletstellingen
- **C-artikelen** (50% van SKU's, 5% van picks): Achter in het magazijn, hoge stellingen, minder toegankelijke locaties

## Gangpadoptimalisatie

### Gangpadbreedtes (richtlijnen)

| Type stelling | Gangpadbreedte | Heftruck type |
|---|---|---|
| Breed gangpad | 3,0 - 3,5 meter | Reachtruck, frontstapler |
| Smal gangpad (VNA) | 1,5 - 1,8 meter | Orderverzameltruck, VNA-truck |
| Doorrolstelling | Geen gangpad nodig | FIFO automatisch |

### Smalle gangpaden (VNA)
- Tot 50% meer opslagcapaciteit vergeleken met brede gangpaden
- Vereist speciale VNA-trucks (duurdere investering)
- Inductiedraad of railgeleiding noodzakelijk
- Niet geschikt voor alle producttypen

## Stellingtypen en toepassingen

### Palletstellingen (meest voorkomend)
- Selectief: Directe toegang tot elke pallet
- Beste optie bij veel verschillende SKU's
- Bezettingsgraad: 40-50% van vloeroppervlak

### Inrijstellingen (Drive-in)
- Diepe opslag, beperkt aantal SKU's per blok
- LIFO-principe (Last In, First Out)
- Tot 85% ruimtebenutting
- Geschikt voor: homogene producten, seizoensopslag

### Doorrolstellingen (Pallet Flow)
- FIFO-principe (First In, First Out) — automatische doorrol op zwaartekracht
- Ideaal voor bederfelijke goederen, cross-docking
- Hogere investering, lagere operationele kosten

### Verrijdbare stellingen (Movirack)
- Stellingen op rails, gangpad opent waar nodig
- Maximale opslagdichtheid met behoud van selectiviteit
- Geschikt voor: archieven, lage-frequentie opslag

## Quick wins voor magazijnefficiëntie

1. **Voer een ABC-analyse uit** en herpositioneer A-artikelen naar de snelste locaties
2. **Elimineer dode voorraad**: Artikelen zonder beweging in >12 maanden verwijderen
3. **Optimaliseer reispaden**: Batch-picken, zone-picken of wave-picken implementeren
4. **Standaardiseer palletformaten**: Minder variatie = betere stellingbenutting
5. **Installeer locatieborden en -labels**: Snellere oriëntatie voor orderpickers
6. **Verbeter verlichting**: Goede verlichting verhoogt snelheid en verlaagt fouten
7. **Meet en stuur**: Implementeer KPI's zoals picks per uur, foutpercentage en doorlooptijd`,
  },
  {
    title: 'Orderverzamelen – Methoden en optimalisatie',
    sourceUrl:
      'https://www.logistiekconcurrent.nl/kennis/orderverzamelen-optimalisatie',
    content: `# Orderverzamelen – Methoden en optimalisatie

## Orderverzamelen is de duurste activiteit

Orderverzamelen (orderpicken) is verantwoordelijk voor 50-65% van de totale operationele kosten van een magazijn. De verdeling van de picktijd:
- **Reistijd**: 50-55% (lopen tussen picklocaties)
- **Zoektijd**: 15-20% (locatie vinden, artikel identificeren)
- **Grijptijd**: 10-15% (artikel pakken)
- **Administratie**: 10-15% (scannen, bevestigen, registreren)

Optimalisatie richt zich primair op het verkorten van reis- en zoektijd.

## Orderverzamelmethoden

### Enkelstuks picken (Pick-per-order)
- Eén order tegelijk, compleet door het magazijn
- **Voordelen**: Eenvoudig, weinig fouten, geen sortering nodig
- **Nadelen**: Meeste reistijd, laagste productiviteit
- **Geschikt voor**: Kleine magazijnen, complexe orders, <50 orders/dag

### Batch picken
- Meerdere orders tegelijk combineren in één ronde
- Artikelen worden na het picken gesorteerd per order
- **Voordelen**: 30-50% minder reistijd dan enkelstuks
- **Nadelen**: Sorteertijd en -ruimte nodig, kans op sorteerfouten
- **Geschikt voor**: Veel orders met weinig orderregels

### Zone picken
- Magazijn verdeeld in zones, elke picker werkt in één zone
- Orders worden van zone naar zone doorgegeven (progressief) of gelijktijdig gepickt (parallel)
- **Voordelen**: Korte reisafstanden, specialisatie per zone
- **Nadelen**: Consolidatie nodig, ongelijke werklast tussen zones
- **Geschikt voor**: Grote magazijnen, >500 SKU's

### Wave picken
- Orders worden gegroepeerd in waves (golven) op basis van verzendtijdstip, vervoerder of prioriteit
- Binnen een wave kan batch- of zone-picken toegepast worden
- **Voordelen**: Optimale afstemming op verzendschema, efficiënte dock-planning
- **Nadelen**: Complexere planning, WMS vereist
- **Geschikt voor**: Magazijnen met vaste verzendmomenten

### Cluster picken
- Picker heeft een pickkar met meerdere bakken (clusters), elke bak is een order
- Combineert voordelen van batch en enkelstuks: reistijdreductie zonder sortering
- **Voordelen**: Eenvoudig, effectief, weinig fouten
- **Nadelen**: Beperkt door het aantal bakken op de kar
- **Geschikt voor**: E-commerce, 5-15 orders per ronde

## Pick-technologieën

### Pick-to-Light
- LED-displays bij elke picklocatie, geeft aantal en locatie aan
- **Snelheid**: 300-500 picks/uur
- **Foutpercentage**: <0,1%
- **Investering**: Hoog (€50-150 per locatie)
- **Geschikt voor**: Hoge volumes, beperkt aantal locaties (A-zone)

### Voice picking (Pick-by-Voice)
- Picker ontvangt instructies via headset, bevestigt mondeling
- **Snelheid**: 150-250 picks/uur
- **Foutpercentage**: <0,5%
- **Voordelen**: Handen vrij, ogen op het product, werkt in koelomgevingen
- **Geschikt voor**: Breed inzetbaar, vooral bij pallet- en casepicking

### RF-scanning (barcode)
- Handheld scanner met display geeft instructies en bevestigt picks
- **Snelheid**: 100-200 picks/uur
- **Foutpercentage**: <1%
- **Investering**: Laag-middel
- **Geschikt voor**: Universeel inzetbaar, standaard in de meeste magazijnen

### Pick-by-Vision (Smart Glasses)
- Augmented reality bril toont locatie-informatie in het gezichtsveld
- Relatief nieuwe technologie, snel in ontwikkeling
- **Voordelen**: Handen vrij, visuele navigatie
- **Nadelen**: Kosten, gewenning, batterijduur

## KPI's voor orderverzamelen

| KPI | Doel | Benchmark |
|---|---|---|
| Picks per uur | Productiviteit | 80-150 (handmatig) |
| Foutpercentage | Kwaliteit | <0,5% |
| Orderdoorlooptijd | Snelheid | <2 uur (standaard) |
| Reistijd % | Efficiëntie | <45% van totale tijd |
| Kosten per orderregel | Kosten | €0,50-2,00 |

## Praktische verbeteringen

1. **Herpositioneer fast-movers**: ABC-analyse, A-artikelen op grijphoogte in golden zone
2. **Combineer orders**: Batch- of clustergewijs picken in plaats van enkelstuks
3. **Optimaliseer looproute**: S-route of largest gap methode via WMS
4. **Elimineer zoektijd**: Duidelijke locatielabels, logische nummering, schone locaties
5. **Verminder grijptijd**: Juiste hoogte, open bakken, geen overvulde locaties
6. **Meet dagelijks**: Visualiseer picks/uur op een dashboard voor het team`,
  },
  {
    title: 'Warehouse Management Systemen (WMS)',
    sourceUrl: 'https://www.logistiekconcurrent.nl/kennis/wms-warehouse-management',
    content: `# Warehouse Management Systemen (WMS)

## Wat is een WMS?

Een Warehouse Management System (WMS) is software die alle magazijnprocessen aanstuurt en optimaliseert: van ontvangst en opslag tot orderverzameling en verzending. Een WMS is het digitale brein van het magazijn.

## Wanneer heb je een WMS nodig?

Een WMS wordt relevant wanneer:
- Meer dan 500 actieve SKU's beheerd worden
- Meer dan 50 orders per dag verwerkt worden
- Foutpercentage bij orderpicken te hoog is (>2%)
- Voorraadinformatie niet real-time beschikbaar is
- Meerdere medewerkers tegelijk in het magazijn werken
- Traceerbaarheid (batch/lot/serienummer) vereist is

## Kernfuncties van een WMS

### Ontvangst (Inbound)
- Registratie van inkomende goederen tegen inkooporder
- Kwaliteitscontrole en afkeurregistratie
- Automatische locatietoewijzing (putaway-logica)
- Genereren van ontvangstlabels en barcode-etiketten

### Voorraadbeheer
- Real-time voorraadoverzicht per locatie
- Batch- en lotnummerregistratie
- FIFO/FEFO-aansturing (First In/First Expired First Out)
- Cycle counting en voorraadcorrecties
- Artikelstamgegevens en locatietypen

### Orderverzameling
- Automatische wave-planning en batch-optimalisatie
- Looproute-optimalisatie (kortste pad algoritme)
- Ondersteuning voor RF-scanning, voice picking, pick-to-light
- Backorder-afhandeling en prioritering
- Real-time voortgangsmonitoring

### Verzending (Outbound)
- Consolidatie van gepickte orders
- Pakbon- en verzendetiketgeneratie
- Vervoerderskoppeling (DHL, PostNL, DPD, etc.)
- Laadvolgorde-optimalisatie
- Track & trace integratie

### Rapportage en analyse
- Productiviteitsrapporten per medewerker
- Voorraadwaardering en -rotatie
- Ruimtebenutting per zone
- Foutanalyse en kwaliteitsmonitoring
- KPI-dashboards

## WMS-keuze: cloud vs. on-premise

### Cloud WMS (SaaS)
- **Voordelen**: Lagere instapkosten, snelle implementatie, automatische updates, schaalbaar
- **Nadelen**: Maandelijkse licentiekosten, afhankelijk van internet, minder maatwerk
- **Geschikt voor**: MKB, groeiende bedrijven, <10.000 orderregels/dag
- **Voorbeelden**: Exact Online WMS, Picqer, Boltrics

### On-premise WMS
- **Voordelen**: Volledig maatwerk, geen afhankelijkheid van internet, volledige controle
- **Nadelen**: Hoge initiële investering, eigen IT-beheer, langere implementatie
- **Geschikt voor**: Grote magazijnen, complexe processen, >10.000 orderregels/dag
- **Voorbeelden**: SAP EWM, Manhattan Associates, Blue Yonder

### Starten zonder WMS
Veel MKB-magazijnen werken (nog) zonder WMS. Stappen om de basis op orde te brengen:
1. **Locatiesysteem**: Label elke locatie uniek (hal-rij-sectie-niveau)
2. **Barcode-etiketten**: Elk artikel voorzien van een scanbare barcode
3. **Spreadsheet-inventaris**: Als tijdelijke oplossing: locatie, artikel, aantal
4. **Vaste picklocaties**: Elk artikel een vaste plek, replenishment vanuit bulkopslag
5. **Eenvoudige scanner-app**: Voorraadregistratie via mobiele scanner

## Implementatie van een WMS

### Fasering
1. **Analyse** (4-8 weken): Procesinventarisatie, eisenlijst, leveranciersselectie
2. **Configuratie** (6-12 weken): Inrichting, masterdata, interfaces
3. **Testen** (4-6 weken): UAT, parallelle run, training
4. **Go-live** (1-2 weken): Big bang of gefaseerde uitrol
5. **Nazorg** (doorlopend): Optimalisatie, updates, support

### Veelgemaakte fouten bij WMS-implementatie
- Onvoldoende aandacht voor masterdata-kwaliteit
- Te veel maatwerk in eerste fase
- Onvoldoende training van magazijnmedewerkers
- Geen duidelijke KPI's gedefinieerd vooraf
- IT-afdeling leidt het project in plaats van operations`,
  },
  {
    title: 'Orde en netheid in het magazijn – 5S methode',
    sourceUrl:
      'https://www.logistiekconcurrent.nl/kennis/5s-methode-magazijn',
    content: `# Orde en netheid in het magazijn – 5S methode

## Waarom orde en netheid?

Een opgeruimd magazijn is een veilig en efficiënt magazijn. Orde en netheid:
- Verminderen het risico op arbeidsongevallen (struikelen, uitglijden)
- Verkorten zoektijden voor materialen en gereedschap
- Verbeteren de productiviteit van orderpickers
- Verhogen de nauwkeurigheid van voorraadbeheer
- Maken een professionele indruk op klanten en bezoekers
- Zijn een basisvoorwaarde voor verdere procesverbetering

## De 5S-methode

5S is een gestructureerde aanpak voor werkplekorganisatie, oorspronkelijk uit Japan (Toyota Production System). De vijf stappen:

### 1. Seiri (Scheiden)
- Verwijder alles wat niet nodig is op de werkplek
- Sorteer materialen in: dagelijks nodig, soms nodig, nooit nodig
- Red tag campagne: markeer twijfelitems met een rode kaart, verwijder na 30 dagen als niet gebruikt
- In het magazijn: verwijder lege pallets, achtergelaten materiaal, defect gereedschap

### 2. Seiton (Schikken)
- Geef elk item een vaste, logische plek
- Label alle locaties duidelijk
- Meest gebruikte items op de best bereikbare plek
- In het magazijn: locatieborden, vloermarkering voor palletplaatsen, gereedschapsborden (shadow boards)

### 3. Seiso (Schoonmaken)
- Maak de werkplek grondig schoon
- Identificeer vervuilingsbronnen en pak deze bij de bron aan
- Maak schoonmaken onderdeel van de dagelijkse routine (5-10 minuten per shift)
- In het magazijn: vloer vegen, stellingen afstoffen, rijpaden vrijhouden

### 4. Seiketsu (Standaardiseren)
- Maak afspraken over hoe de werkplek eruitziet en wie wat doet
- Visueel management: foto's van de gewenste situatie op de werkplek
- Checklists voor dagelijkse, wekelijkse en maandelijkse taken
- In het magazijn: schoonmaakschema, zone-eigenaren, standaard palletposities

### 5. Shitsuke (Standhouden)
- Maak 5S onderdeel van de bedrijfscultuur
- Regelmatige audits (wekelijks/maandelijks) met scoring
- Management loopt mee en geeft het goede voorbeeld
- Vier successen, deel resultaten
- In het magazijn: 5S-scorebord, maandelijkse audit met foto's

## 5S-audit in het magazijn

### Beoordelingscriteria per zone

**Gangpaden en rijroutes**
- Vrij van obstakels en materiaal
- Vloermarkering intact en zichtbaar
- Geen beschadigde pallets of goederen op de vloer
- Verlichting voldoende

**Stellingen**
- Maximale belasting zichtbaar aangegeven
- Geen uitstekende goederen (overhang)
- Beschadigde stellingdelen gemarkeerd
- Pallets correct geplaatst (geen overhang, niet beschadigd)

**Werkstations (pack/kitting)**
- Opgeruimd en georganiseerd
- Gereedschap op vaste plek (shadow board)
- Afval gescheiden en afgevoerd
- Verpakkingsmateriaal aangevuld

**Dock-gebieden**
- Laad/loszone vrij van obstakels
- Bordes en dockshelters intact
- Wielblokken en spiegels aanwezig
- Vloer schoon en droog

## Visueel management

Visueel management maakt de status van het magazijn in één oogopslag duidelijk:

- **Vloermarkering**: Geel voor routes, wit voor opslagplaatsen, rood voor verbodszones
- **Borden en labels**: Locatie-aanduidingen, zone-namen, maximale belasting
- **Kleurcodering**: Gekleurde bakken per productcategorie of zone
- **Andon-systeem**: Lichten of displays die status van een zone aangeven (normaal/probleem)
- **KPI-borden**: Dagelijkse prestaties zichtbaar voor het team

## Producten voor orde en netheid

Logistiekconcurrent levert producten die bijdragen aan een georganiseerd magazijn:
- **Locatieborden en -labels**: Magnetisch, zelfklevend of insteekbaar
- **Stellinglabels**: Barcodelabels voor locatieregistratie
- **Vloermarkering**: Tape, hoeken en symbolen in alle veiligheidskleuren
- **Afvalbakken en containers**: Gescheiden afvalinzameling op de werkplek
- **Shadow boards**: Gereedschapsborden met silhouetten voor visueel beheer`,
  },
  {
    title:
      'Europese regelgeving magazijnstellingen – EN 15512, EN 15620, EN 15629',
    sourceUrl:
      'https://www.logistiekconcurrent.nl/kennis/europese-normen-stellingen',
    content: `# Europese regelgeving voor magazijnstellingen

## Overzicht van relevante normen

Voor stalen opslagsystemen in magazijnen gelden meerdere Europese normen. Samen vormen deze normen het kader waarbinnen stellingen ontworpen, geïnstalleerd en onderhouden moeten worden.

## EN 15512 – Berekening en ontwerp

### Toepassingsgebied
EN 15512 beschrijft de berekeningsmethoden voor het structureel ontwerp van verstelbare palletstellingen. De norm is van toepassing op stellingen tot 12 meter hoogte.

### Belangrijke bepalingen
- **Belastingcombinaties**: Eigen gewicht + nuttige last + seismische belasting + windbelasting (buitenopslag)
- **Veiligheidscoëfficiënten**: Materiaalfactoren en belastingfactoren conform Eurocode
- **Staanderstabiliteit**: Berekening van knik- en buigbelasting van staanders
- **Liggerafbuiging**: Maximale doorbuiging van liggers onder belasting
- **Voetplaatbevestiging**: Eisen aan verankering in de vloer, type en aantal bouten

### Praktische relevantie
- Bij aankoop van nieuwe stellingen: vraag om een berekening conform EN 15512
- De berekening bepaalt de maximale belasting per niveau en per staander
- Wijziging van stellingconfiguratie (hogere niveaus, zwaardere pallets) vereist herberekening

## EN 15620 – Toleranties, vervormingen en vrije ruimtes

### Toepassingsgebied
EN 15620 definieert de toelaatbare toleranties bij installatie en gebruik van palletstellingen, en de vereiste vrije ruimtes tussen pallets en stellingconstructie.

### Belangrijke bepalingen

#### Installatietoleranties
- **Verticaliteit staanders**: Maximaal L/350 (bij 6m staander = max 17mm afwijking)
- **Horizontaliteit liggers**: Maximaal L/500 (bij 2,7m ligger = max 5,4mm afwijking)
- **Gangpadmaat**: Tolerantie ±15mm op de nominale gangpadbreedte

#### Vrije ruimtes (klassen)
De norm definieert drie klassen vrije ruimtes, afhankelijk van het type handling:

| Klasse | Toepassing | Vrije ruimte zijkant | Vrije ruimte bovenkant |
|---|---|---|---|
| 100 | Handmatig, lage snelheid | 75 mm | 75 mm |
| 200 | Standaard reachtruck | 75 mm | 100 mm |
| 300 | VNA, automatisch | 100 mm | 100 mm |
| 400 | Volledig automatisch | 100 mm | 150 mm |

#### Praktische relevantie
- Te krappe vrije ruimtes leiden tot schade aan stellingen en goederen
- Bij VNA-operatie zijn de toleranties kritischer (geleidingssysteem moet precies passen)
- Na een aanrijding: controleer of de stelling nog binnen tolerantie staat

## EN 15629 – Specificatie van opslagsystemen

### Toepassingsgebied
EN 15629 beschrijft wat een klant moet specificeren bij het bestellen van een nieuw opslagsysteem, en wat de leverancier moet leveren.

### Klantspecificatie (wat je moet opgeven)
- **Lasteenheid**: Afmetingen, gewicht, type (EUR-pallet, blokpallet, dozen)
- **Aantal palletposities** en gewenste configuratie
- **Gebouwinformatie**: Vloerbelasting, beschikbare hoogte, kolommen, deuren
- **Handling**: Type heftruck, gangpadbreedte, rijhoogte
- **Omgevingscondities**: Temperatuur, corrosie, seismische zone
- **Brandveiligheidseisen**: Sprinklers, brandschermen, compartimentering

### Leverancierslevering (wat je moet ontvangen)
- **Tekeningen**: Lay-out, dwarsdoorsnede, details
- **Berekening**: Volgens EN 15512, met maximale belasting per niveau
- **Installatie-instructies**: Montage, verankering, kwaliteitsborging
- **Belastingborden**: Per stelling de maximale belasting per niveau
- **Gebruikersinformatie**: Onderhoudsinstructies, inspectie-eisen conform EN 15635

## NEN-EN 15635 – Gebruik en onderhoud

Zie het uitgebreide artikel over NEN-EN 15635 voor details over inspectie, schadeclassificatie en het PRSES-regime.

## Samenvatting normenkader

| Norm | Onderwerp | Primair van belang voor |
|---|---|---|
| EN 15512 | Berekening en ontwerp | Stellingleverancier, constructeur |
| EN 15620 | Toleranties en vrije ruimtes | Installateur, PRSES |
| EN 15629 | Specificatie bij bestelling | Klant en leverancier |
| EN 15635 | Gebruik en onderhoud | Gebruiker, PRSES, inspecteur |

## Praktische aanbevelingen

1. **Bij aankoop**: Eis een compleet dossier conform EN 15629 van de leverancier
2. **Na installatie**: Laat toleranties meten conform EN 15620
3. **Bij wijzigingen**: Laat herberekenen conform EN 15512
4. **Dagelijks gebruik**: Werk conform EN 15635 (inspectieregime, PRSES)
5. **Bewaar documentatie**: Alle berekeningen, tekeningen en keuringsrapporten archiveren`,
  },
  {
    title:
      'Magazijn op Maat – QuickScan methodiek en 3x2 beoordelingsmatrix',
    sourceUrl:
      'https://www.logistiekconcurrent.nl/kennis/quickscan-methodiek',
    content: `# Magazijn op Maat – QuickScan methodiek

## Wat is de Magazijn op Maat QuickScan?

De Magazijn op Maat QuickScan is een professionele beoordeling van uw magazijnoperatie, uitgevoerd door een ervaren consultant in 4 werkdagen. De QuickScan brengt zowel de efficiëntie als de veiligheid van uw magazijn in kaart via een gestructureerde 3x2 beoordelingsmatrix.

## De 3x2 beoordelingsmatrix

De QuickScan beoordeelt uw magazijn op 3 lagen, elk vanuit 2 perspectieven:

### 3 Lagen (hoe de consultant observeert)

**1. Ruimte & Inrichting**
Wat de consultant ziet bij het betreden van het magazijn:
- Lay-out en goederenstroompatroon (U-flow, through-flow)
- Stellingtypen en -configuratie
- Gangpadbreedtes en verkeersroutes
- Vloerkwaliteit en vloermarkering
- Verlichting en klimaatbeheersing
- Dock-faciliteiten en laad/losgebieden
- Opslagcapaciteit en ruimtebenutting

**2. Werkwijze & Processen**
Wat de consultant observeert tijdens het dagelijks werk:
- Orderverzamelmethode en pickefficiëntie
- Ontvangst- en verzendprocessen
- Voorraadbeheer en locatiesysteem
- Gebruik van hulpmiddelen en technologie (WMS, scanners)
- Werkhouding en ergonomie
- Communicatie en coördinatie op de werkvloer
- Kwaliteitscontrole en foutafhandeling

**3. Organisatie & Besturing**
Wat de consultant leert uit interviews en documentatie:
- Managementstructuur en verantwoordelijkheden
- KPI's en prestatiemeting
- Opleidingsbeleid en certificeringen
- Onderhoudsplanning (stellingen, heftrucks, materieel)
- Documentatie (RI&E, inspectierapporten, procedures)
- Cultuur rondom veiligheid en verbetering
- Strategische plannen en investeringsbereidheid

### 2 Perspectieven (wat wordt beoordeeld)

**Efficiënt**
- Wordt de beschikbare ruimte optimaal benut?
- Zijn processen lean en zonder verspilling?
- Worden de juiste technologieën en hulpmiddelen ingezet?
- Is er sprake van continue verbetering?

**Veilig**
- Voldoet het magazijn aan wet- en regelgeving?
- Zijn risico's geïdentificeerd en beheerst?
- Worden medewerkers beschermd en getraind?
- Is er een proactieve veiligheidscultuur?

## RAG-scoring (Rood-Oranje-Groen)

Elke cel in de 3x2 matrix krijgt een RAG-score:

### ROOD (score < 2.0)
- Ernstige tekortkomingen die directe aandacht vereisen
- Veiligheidsrisico's die wettelijke consequenties kunnen hebben
- Efficiëntieproblemen die significant omzetverlies veroorzaken
- Aanbeveling: onmiddellijk actie ondernemen (30 dagen)

### ORANJE (score 2.0 – 3.5)
- Verbeterpunten die aandacht verdienen
- Risico's die beheersbaar zijn maar niet optimaal
- Kansen voor substantiële verbetering
- Aanbeveling: planmatig verbeteren (30-60 dagen)

### GROEN (score > 3.5)
- Goed op orde, voldoet aan normen en best practices
- Kleine optimalisaties mogelijk
- Borging en continuïteit waarborgen
- Aanbeveling: onderhouden en monitoren (60-90 dagen)

## De QuickScan oplevering

### Wat ontvangt de klant?

1. **Visueel dashboard**: Interactief overzicht van de 3x2 matrix met RAG-scores
2. **Bevindingen per cel**: Gedetailleerde observaties met foto's en referenties aan normen
3. **Prioriteitenmatrix**: Bevindingen gerangschikt op impact vs. inspanning
4. **Routekaart**: Concrete acties verdeeld over 30, 60 en 90 dagen
5. **Productaanbevelingen**: Relevante producten van Logistiekconcurrent per bevinding
6. **Benchmarking**: Hoe uw scores zich verhouden tot andere gescande magazijnen

### Doorlopend portaal

Na de QuickScan krijgt de klant toegang tot het Magazijn op Maat portaal:
- Live dashboard met voortgang op acties
- Digitale documenthub voor relevante documenten
- AI-chatbot voor vragen over magazijnveiligheid en -efficiëntie
- Productcatalogus met contextuelle aanbevelingen
- Mogelijkheid tot her-scan om voortgang meetbaar te maken

## Investering

De Magazijn op Maat QuickScan kost een vast bedrag van €3.500 inclusief:
- 4 dagen on-site consultancy door een ervaren magazijnexpert
- Volledige rapportage via het digitale portaal
- 30/60/90 dagen routekaart met concrete acties
- 12 maanden toegang tot het Magazijn op Maat portaal
- Productaanbevelingen afgestemd op uw situatie

## Voor wie?

De QuickScan is ontwikkeld voor MKB-bedrijven met een magazijn die:
- Weten dat hun operatie beter kan maar niet weten waar te beginnen
- Tegen de kosten van traditioneel consultancy (€10.000+) aanlopen
- Een objectieve, externe blik op hun magazijn willen
- Concrete, uitvoerbare verbeteracties zoeken
- Willen voldoen aan wet- en regelgeving (Arbowet, NEN-normen)`,
  },
];

async function main() {
  console.log('🔧 Ensuring pgvector extension...');
  await prisma.$executeRawUnsafe(
    `CREATE EXTENSION IF NOT EXISTS vector`
  );

  console.log(
    `📚 Seeding ${articles.length} knowledge base articles...\n`
  );

  let totalChunks = 0;
  let totalEmbeddings = 0;

  for (const article of articles) {
    console.log(`📄 ${article.title}`);

    // Check if already exists
    const existing = await prisma.document.findFirst({
      where: { sourceUrl: article.sourceUrl },
    });

    if (existing) {
      console.log(`   ⏭️  Already exists, skipping\n`);
      continue;
    }

    // Chunk the content
    const doc = MDocument.fromMarkdown(article.content);
    const chunks = await doc.chunk({
      strategy: 'markdown',
      maxSize: 512,
      overlap: 50,
    });

    console.log(`   📦 Created ${chunks.length} chunks`);

    // Store document
    const document = await prisma.document.create({
      data: {
        title: article.title,
        content: article.content,
        sourceUrl: article.sourceUrl,
      },
    });

    // Generate embeddings in batches
    const batchSize = 100;
    const chunkTexts = chunks.map((c) => c.text);

    for (let i = 0; i < chunkTexts.length; i += batchSize) {
      const batch = chunkTexts.slice(i, i + batchSize);

      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: batch,
      });

      // Store chunks with embeddings
      for (let j = 0; j < batch.length; j++) {
        const chunkIndex = i + j;
        const chunkRecord = await prisma.documentChunk.create({
          data: {
            documentId: document.id,
            content: chunks[chunkIndex].text,
            chunkIndex,
          },
        });

        const vectorLiteral = `[${embeddings[j].join(',')}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
          vectorLiteral,
          chunkRecord.id
        );
      }

      totalEmbeddings += embeddings.length;
    }

    totalChunks += chunks.length;
    console.log(`   ✅ Stored with embeddings\n`);
  }

  console.log('─'.repeat(50));
  console.log(`✅ Done!`);
  console.log(`   Documents: ${articles.length}`);
  console.log(`   Chunks: ${totalChunks}`);
  console.log(`   Embeddings: ${totalEmbeddings}`);
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
