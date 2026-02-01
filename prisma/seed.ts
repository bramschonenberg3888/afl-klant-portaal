import { db as prisma } from '@/lib/db';
import { hash } from 'bcryptjs';

// ─── Helper: date offsets ──────────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Layers & Perspectives for matrix iteration ────────────────────────────
const LAYERS = [
  'RUIMTE_INRICHTING',
  'WERKWIJZE_PROCESSEN',
  'ORGANISATIE_BESTURING',
] as const;

const PERSPECTIVES = ['EFFICIENT', 'VEILIG'] as const;

async function main() {
  const defaultPassword = await hash('password123', 12);

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. USERS + ORGANIZATIONS (existing, unchanged)
  // ═══════════════════════════════════════════════════════════════════════════

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@logistiekconcurrent.nl' },
    update: {
      hashedPassword: defaultPassword,
      globalRole: 'ADMIN',
    },
    create: {
      email: 'admin@logistiekconcurrent.nl',
      name: 'Admin Beheerder',
      emailVerified: new Date(),
      hashedPassword: defaultPassword,
      globalRole: 'ADMIN',
    },
  });

  const consultantUser = await prisma.user.upsert({
    where: { email: 'consultant@logistiekconcurrent.nl' },
    update: {
      hashedPassword: defaultPassword,
      globalRole: 'CONSULTANT',
    },
    create: {
      email: 'consultant@logistiekconcurrent.nl',
      name: 'Jan de Vries',
      emailVerified: new Date(),
      hashedPassword: defaultPassword,
      globalRole: 'CONSULTANT',
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      hashedPassword: defaultPassword,
      globalRole: 'CLIENT',
    },
    create: {
      email: 'test@example.com',
      name: 'Test Gebruiker',
      emailVerified: new Date(),
      hashedPassword: defaultPassword,
      globalRole: 'CLIENT',
    },
  });

  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo-bedrijf' },
    update: {},
    create: {
      name: 'Demo Bedrijf B.V.',
      slug: 'demo-bedrijf',
      address: 'Industrieweg 10',
      city: 'Rotterdam',
      postalCode: '3000 AA',
      phone: '010-1234567',
    },
  });

  const secondOrg = await prisma.organization.upsert({
    where: { slug: 'warehouse-solutions' },
    update: {},
    create: {
      name: 'Warehouse Solutions B.V.',
      slug: 'warehouse-solutions',
      address: 'Havenstraat 25',
      city: 'Amsterdam',
      postalCode: '1000 AB',
      phone: '020-7654321',
    },
  });

  // Assign users to organizations
  await prisma.organizationUser.upsert({
    where: {
      userId_organizationId: {
        userId: adminUser.id,
        organizationId: demoOrg.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      organizationId: demoOrg.id,
      role: 'ADMIN',
      isDefault: true,
    },
  });

  await prisma.organizationUser.upsert({
    where: {
      userId_organizationId: {
        userId: consultantUser.id,
        organizationId: demoOrg.id,
      },
    },
    update: {},
    create: {
      userId: consultantUser.id,
      organizationId: demoOrg.id,
      role: 'CONSULTANT',
      isDefault: true,
    },
  });

  await prisma.organizationUser.upsert({
    where: {
      userId_organizationId: {
        userId: consultantUser.id,
        organizationId: secondOrg.id,
      },
    },
    update: {},
    create: {
      userId: consultantUser.id,
      organizationId: secondOrg.id,
      role: 'CONSULTANT',
      isDefault: false,
    },
  });

  await prisma.organizationUser.upsert({
    where: {
      userId_organizationId: {
        userId: clientUser.id,
        organizationId: demoOrg.id,
      },
    },
    update: {},
    create: {
      userId: clientUser.id,
      organizationId: demoOrg.id,
      role: 'CLIENT',
      isDefault: true,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ASSESSMENT TEMPLATE + QUESTIONS (existing, unchanged)
  // ═══════════════════════════════════════════════════════════════════════════

  const template = await prisma.assessmentTemplate.upsert({
    where: { id: 'default-template' },
    update: {},
    create: {
      id: 'default-template',
      title: 'Magazijn Zelfevaluatie',
      description:
        'Evalueer de veiligheid en efficiëntie van uw magazijn aan de hand van drie lagen.',
      isActive: true,
      version: 1,
    },
  });

  const assessmentQuestions: Array<{
    layer: 'RUIMTE_INRICHTING' | 'WERKWIJZE_PROCESSEN' | 'ORGANISATIE_BESTURING';
    perspective: 'EFFICIENT' | 'VEILIG';
    questionText: string;
    helpText?: string;
    sortOrder: number;
  }> = [
    {
      layer: 'RUIMTE_INRICHTING',
      perspective: 'EFFICIENT',
      sortOrder: 1,
      questionText: 'Hoe goed is de indeling van uw magazijn afgestemd op de goederenstroom?',
      helpText: 'Denk aan de routing van inkomende goederen, opslag en uitgaande goederen.',
    },
    {
      layer: 'RUIMTE_INRICHTING',
      perspective: 'EFFICIENT',
      sortOrder: 2,
      questionText: 'In hoeverre wordt de beschikbare ruimte optimaal benut?',
      helpText: 'Overweeg de hoogte van stellingen, gangpadbreedtes en ongebruikte ruimtes.',
    },
    {
      layer: 'RUIMTE_INRICHTING',
      perspective: 'EFFICIENT',
      sortOrder: 3,
      questionText: 'Hoe efficiënt zijn de looproutes en transportpaden ingericht?',
      helpText: 'Zijn er onnodige kruisingen of lange omwegen?',
    },
    {
      layer: 'RUIMTE_INRICHTING',
      perspective: 'VEILIG',
      sortOrder: 4,
      questionText: 'Hoe goed zijn de veiligheidsmarkeringen en signaleringen aangebracht?',
      helpText: 'Denk aan vloermarkeringen, waarschuwingsborden en nooduitgangen.',
    },
    {
      layer: 'RUIMTE_INRICHTING',
      perspective: 'VEILIG',
      sortOrder: 5,
      questionText: 'In welke mate voldoet de stellinginrichting aan veiligheidsnormen?',
      helpText: 'Zijn stellingen gekeurd, voorzien van aanrijdbeveiliging en correct belast?',
    },
    {
      layer: 'RUIMTE_INRICHTING',
      perspective: 'VEILIG',
      sortOrder: 6,
      questionText: 'Hoe goed is de verlichting en het klimaat in het magazijn?',
      helpText: 'Voldoende licht, ventilatie en temperatuurbeheersing voor veilig werken.',
    },
    {
      layer: 'WERKWIJZE_PROCESSEN',
      perspective: 'EFFICIENT',
      sortOrder: 7,
      questionText: 'Hoe gestandaardiseerd zijn de pick- en packprocessen?',
      helpText: 'Zijn er duidelijke werkinstructies en wordt er consistent gewerkt?',
    },
    {
      layer: 'WERKWIJZE_PROCESSEN',
      perspective: 'EFFICIENT',
      sortOrder: 8,
      questionText: 'In hoeverre worden hulpmiddelen en technologie effectief ingezet?',
      helpText: 'Denk aan scanners, WMS-systemen, vorkheftrucks en transportbanden.',
    },
    {
      layer: 'WERKWIJZE_PROCESSEN',
      perspective: 'EFFICIENT',
      sortOrder: 9,
      questionText: 'Hoe goed worden voorraadniveaus en -locaties beheerd?',
      helpText: 'Is de voorraad actueel, worden ABC-analyses gebruikt?',
    },
    {
      layer: 'WERKWIJZE_PROCESSEN',
      perspective: 'VEILIG',
      sortOrder: 10,
      questionText: 'In welke mate worden veiligheidsprocedures consequent gevolgd?',
      helpText: 'Denk aan gebruik van PBM, veilig rijden met heftrucks, tilprotocollen.',
    },
    {
      layer: 'WERKWIJZE_PROCESSEN',
      perspective: 'VEILIG',
      sortOrder: 11,
      questionText: 'Hoe goed worden incidenten en bijna-ongevallen geregistreerd en opgevolgd?',
      helpText: 'Is er een meldingssysteem en worden trends geanalyseerd?',
    },
    {
      layer: 'WERKWIJZE_PROCESSEN',
      perspective: 'VEILIG',
      sortOrder: 12,
      questionText: 'In hoeverre zijn noodprocedures bekend en geoefend?',
      helpText: 'Worden BHV-oefeningen gehouden en kennen medewerkers de vluchtwegen?',
    },
    {
      layer: 'ORGANISATIE_BESTURING',
      perspective: 'EFFICIENT',
      sortOrder: 13,
      questionText: "Hoe goed wordt er gestuurd op KPI's en prestatie-indicatoren?",
      helpText: 'Worden doorlooptijden, foutpercentages en productiviteit gemeten?',
    },
    {
      layer: 'ORGANISATIE_BESTURING',
      perspective: 'EFFICIENT',
      sortOrder: 14,
      questionText: 'In hoeverre is de planning en capaciteitsinzet geoptimaliseerd?',
      helpText: 'Worden pieken en dalen goed opgevangen? Is er flexibele inzet?',
    },
    {
      layer: 'ORGANISATIE_BESTURING',
      perspective: 'EFFICIENT',
      sortOrder: 15,
      questionText: 'Hoe effectief is de communicatie tussen afdelingen?',
      helpText: 'Zijn er dagstarts, overlegmomenten en duidelijke verantwoordelijkheden?',
    },
    {
      layer: 'ORGANISATIE_BESTURING',
      perspective: 'VEILIG',
      sortOrder: 16,
      questionText: 'In welke mate is veiligheid verankerd in het beleid en de cultuur?',
      helpText: 'Is er een veiligheidsbeleid, wordt dit uitgedragen door management?',
    },
    {
      layer: 'ORGANISATIE_BESTURING',
      perspective: 'VEILIG',
      sortOrder: 17,
      questionText: 'Hoe goed worden medewerkers opgeleid en gecertificeerd voor veilig werken?',
      helpText: 'Denk aan heftruckcertificaten, BHV-opleidingen, toolbox meetings.',
    },
    {
      layer: 'ORGANISATIE_BESTURING',
      perspective: 'VEILIG',
      sortOrder: 18,
      questionText:
        'In hoeverre voldoet de organisatie aan wettelijke veiligheidseisen (RI&E, Arbobesluit)?',
      helpText: 'Is de RI&E actueel, zijn de actiepunten opgepakt, is er een preventiemedewerker?',
    },
  ];

  for (const q of assessmentQuestions) {
    await prisma.assessmentQuestion.upsert({
      where: {
        id: `${template.id}-q${q.sortOrder}`,
      },
      update: {
        questionText: q.questionText,
        helpText: q.helpText,
        layer: q.layer,
        perspective: q.perspective,
        sortOrder: q.sortOrder,
      },
      create: {
        id: `${template.id}-q${q.sortOrder}`,
        templateId: template.id,
        layer: q.layer,
        perspective: q.perspective,
        questionText: q.questionText,
        helpText: q.helpText,
        sortOrder: q.sortOrder,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. QUICKSCANS → CELLS → FINDINGS → ROADMAP ITEMS
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Published scan (current, 30 days ago) ---
  const publishedScan = await prisma.quickScan.upsert({
    where: { id: 'seed-scan-published' },
    update: {
      summary:
        'Het magazijn scoort voldoende op efficiëntie maar er zijn serieuze veiligheidstekortkomingen geconstateerd, met name bij stellinginrichting en vloermarkering. Directe actie is nodig op het gebied van aanrijdbeveiliging en BHV-procedures.',
      managementSummary: `Management Samenvatting — QuickScan Q4 2025

Geachte directie,

Op basis van de QuickScan uitgevoerd op ${new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })} door consultant Jan de Vries presenteren wij de belangrijkste bevindingen en aanbevelingen voor Demo Bedrijf B.V.

OVERALL BEOORDELING
Het magazijn scoort ORANJE op efficiëntie en ROOD op veiligheid. Dit betekent dat er op korte termijn actie nodig is om aan de wettelijke eisen te voldoen en de veiligheid van medewerkers te waarborgen.

KRITIEKE BEVINDINGEN (directe actie vereist)
1. Aanrijdbeveiliging stellingen — Bij 12 van de 30 stellingrijen ontbreekt aanrijdbeveiliging. Er is zichtbare aanrijdschade geconstateerd. Dit vormt een direct risico voor instorting.
2. RI&E verlopen — De Risico-Inventarisatie en -Evaluatie is meer dan 3 jaar oud en niet geactualiseerd na de verbouwing. Dit is een overtreding van de Arbowet (artikel 5).
3. BHV-certificaten verlopen — Van de 5 BHV-ers hebben er 3 een verlopen certificaat. De wettelijke minimumbezetting is niet gegarandeerd.
4. Nooduitgang geblokkeerd — De nooduitgang aan de zuidzijde wordt regelmatig geblokkeerd door geplaatste pallets.

POSITIEVE PUNTEN
• Pick- en packprocessen zijn goed gestandaardiseerd (GROEN) met een foutpercentage van slechts 0,3%.
• WMS-integratie functioneert uitstekend met realtime voorraadinzicht.
• Dagelijkse afstemming tussen expeditie en productie werkt goed.

AANBEVOLEN ROUTEKAART
Quick wins (< 1 week): Nooduitgangen vrijmaken, veiligheidsoverleg opstarten.
30 dagen: Vloermarkeringen vernieuwen, aanrijdbeveiliging installeren, BHV-cursussen plannen.
60 dagen: RI&E actualiseren, incidentmeldsysteem digitaliseren, ABC-analyse uitvoeren.
90 dagen: Weekplanning implementeren op basis van orderprognoses.

FINANCIËLE INDICATIE
De geschatte investering voor de urgente maatregelen (aanrijdbeveiliging, vloermarkering, RI&E en BHV) bedraagt circa €15.000 - €25.000. Dit bedrag staat in verhouding tot de mogelijke boetes bij inspectie (tot €13.500 per overtreding) en het voorkomen van aansprakelijkheid bij ongevallen.

Wij adviseren om de items met prioriteit URGENT en HOOG binnen 30 dagen op te pakken. Uw consultant Jan de Vries staat klaar om u hierbij te begeleiden.

Met vriendelijke groet,
Jan de Vries
Consultant Magazijnveiligheid — Logistiekconcurrent`,
    },
    create: {
      id: 'seed-scan-published',
      organizationId: demoOrg.id,
      consultantId: consultantUser.id,
      accountManagerId: adminUser.id,
      title: 'QuickScan Q4 2025 — Demo Bedrijf',
      scanDate: daysAgo(30),
      status: 'PUBLISHED',
      overallEfficiency: 'ORANJE',
      overallSafety: 'ROOD',
      summary:
        'Het magazijn scoort voldoende op efficiëntie maar er zijn serieuze veiligheidstekortkomingen geconstateerd, met name bij stellinginrichting en vloermarkering. Directe actie is nodig op het gebied van aanrijdbeveiliging en BHV-procedures.',
      managementSummary: `Management Samenvatting — QuickScan Q4 2025

Geachte directie,

Op basis van de QuickScan uitgevoerd op ${new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })} door consultant Jan de Vries presenteren wij de belangrijkste bevindingen en aanbevelingen voor Demo Bedrijf B.V.

OVERALL BEOORDELING
Het magazijn scoort ORANJE op efficiëntie en ROOD op veiligheid. Dit betekent dat er op korte termijn actie nodig is om aan de wettelijke eisen te voldoen en de veiligheid van medewerkers te waarborgen.

KRITIEKE BEVINDINGEN (directe actie vereist)
1. Aanrijdbeveiliging stellingen — Bij 12 van de 30 stellingrijen ontbreekt aanrijdbeveiliging. Er is zichtbare aanrijdschade geconstateerd. Dit vormt een direct risico voor instorting.
2. RI&E verlopen — De Risico-Inventarisatie en -Evaluatie is meer dan 3 jaar oud en niet geactualiseerd na de verbouwing. Dit is een overtreding van de Arbowet (artikel 5).
3. BHV-certificaten verlopen — Van de 5 BHV-ers hebben er 3 een verlopen certificaat. De wettelijke minimumbezetting is niet gegarandeerd.
4. Nooduitgang geblokkeerd — De nooduitgang aan de zuidzijde wordt regelmatig geblokkeerd door geplaatste pallets.

POSITIEVE PUNTEN
• Pick- en packprocessen zijn goed gestandaardiseerd (GROEN) met een foutpercentage van slechts 0,3%.
• WMS-integratie functioneert uitstekend met realtime voorraadinzicht.
• Dagelijkse afstemming tussen expeditie en productie werkt goed.

AANBEVOLEN ROUTEKAART
Quick wins (< 1 week): Nooduitgangen vrijmaken, veiligheidsoverleg opstarten.
30 dagen: Vloermarkeringen vernieuwen, aanrijdbeveiliging installeren, BHV-cursussen plannen.
60 dagen: RI&E actualiseren, incidentmeldsysteem digitaliseren, ABC-analyse uitvoeren.
90 dagen: Weekplanning implementeren op basis van orderprognoses.

FINANCIËLE INDICATIE
De geschatte investering voor de urgente maatregelen (aanrijdbeveiliging, vloermarkering, RI&E en BHV) bedraagt circa €15.000 - €25.000. Dit bedrag staat in verhouding tot de mogelijke boetes bij inspectie (tot €13.500 per overtreding) en het voorkomen van aansprakelijkheid bij ongevallen.

Wij adviseren om de items met prioriteit URGENT en HOOG binnen 30 dagen op te pakken. Uw consultant Jan de Vries staat klaar om u hierbij te begeleiden.

Met vriendelijke groet,
Jan de Vries
Consultant Magazijnveiligheid — Logistiekconcurrent`,
    },
  });

  // Cell scores for published scan (mixed RAG)
  const publishedCellScores: Record<
    string,
    { score: 'ROOD' | 'ORANJE' | 'GROEN'; summary: string }
  > = {
    'RUIMTE_INRICHTING-EFFICIENT': {
      score: 'ORANJE',
      summary:
        'De indeling is functioneel maar er is onbenutte hoogte in de stellingen en de looproutes bevatten onnodige kruisingen.',
    },
    'RUIMTE_INRICHTING-VEILIG': {
      score: 'ROOD',
      summary:
        'Vloermarkeringen zijn versleten, meerdere stellingen missen aanrijdbeveiliging en nooduitgang-signalering is onvoldoende.',
    },
    'WERKWIJZE_PROCESSEN-EFFICIENT': {
      score: 'GROEN',
      summary:
        'Pick- en packprocessen zijn goed gestandaardiseerd met duidelijke werkinstructies. WMS wordt effectief ingezet.',
    },
    'WERKWIJZE_PROCESSEN-VEILIG': {
      score: 'ORANJE',
      summary:
        'PBM-gebruik is wisselend, incidentenregistratie loopt achter en niet alle medewerkers kennen de noodprocedures.',
    },
    'ORGANISATIE_BESTURING-EFFICIENT': {
      score: 'ORANJE',
      summary:
        "KPI's worden bijgehouden maar niet actief gestuurd. Planning is reactief in plaats van proactief.",
    },
    'ORGANISATIE_BESTURING-VEILIG': {
      score: 'ROOD',
      summary:
        'RI&E is verlopen, BHV-opleidingen zijn niet actueel en er ontbreekt een structureel veiligheidsoverleg.',
    },
  };

  const publishedCells: Record<string, string> = {};
  for (const layer of LAYERS) {
    for (const perspective of PERSPECTIVES) {
      const key = `${layer}-${perspective}`;
      const cellId = `seed-cell-pub-${layer}-${perspective}`.toLowerCase();
      const cellData = publishedCellScores[key];
      await prisma.scanCell.upsert({
        where: { scanId_layer_perspective: { scanId: publishedScan.id, layer, perspective } },
        update: { score: cellData.score, summary: cellData.summary },
        create: {
          id: cellId,
          scanId: publishedScan.id,
          layer,
          perspective,
          score: cellData.score,
          summary: cellData.summary,
        },
      });
      publishedCells[key] = cellId;
    }
  }

  // Findings for published scan (3 per cell = 18 total)
  const findingsData: Array<{
    id: string;
    cellKey: string;
    title: string;
    description: string;
    efficiencyImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    safetyImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    recommendation: string;
    sortOrder: number;
  }> = [
    // RUIMTE_INRICHTING - EFFICIENT
    {
      id: 'seed-finding-1',
      cellKey: 'RUIMTE_INRICHTING-EFFICIENT',
      title: 'Onbenutte hoogte in palletstellingen',
      description:
        'De bovenste twee lagen van de palletstellingen in hal B worden niet gebruikt. Dit vertegenwoordigt circa 200m2 aan onbenutte opslagcapaciteit.',
      efficiencyImpact: 'HIGH',
      safetyImpact: 'NONE',
      recommendation:
        'Investeer in reachtruck met grotere hefhoogte of pas de stellingindeling aan voor betere benutting.',
      sortOrder: 1,
    },
    {
      id: 'seed-finding-2',
      cellKey: 'RUIMTE_INRICHTING-EFFICIENT',
      title: 'Kruisende looproutes bij expeditie',
      description:
        'Voetgangers en heftruckverkeer kruisen elkaar bij de expeditieruimte zonder duidelijke scheiding.',
      efficiencyImpact: 'MEDIUM',
      safetyImpact: 'HIGH',
      recommendation:
        'Breng fysieke scheiding aan met hekwerk of railing en markeer gescheiden routes op de vloer.',
      sortOrder: 2,
    },
    {
      id: 'seed-finding-3',
      cellKey: 'RUIMTE_INRICHTING-EFFICIENT',
      title: 'Geen ABC-zonering toegepast',
      description:
        'Snellopende artikelen (A-producten) staan verspreid door het magazijn in plaats van dicht bij de expeditie.',
      efficiencyImpact: 'HIGH',
      safetyImpact: 'NONE',
      recommendation:
        'Voer ABC-analyse uit en herindeling van locaties op basis van pickfrequentie.',
      sortOrder: 3,
    },
    // RUIMTE_INRICHTING - VEILIG
    {
      id: 'seed-finding-4',
      cellKey: 'RUIMTE_INRICHTING-VEILIG',
      title: 'Versleten vloermarkeringen',
      description:
        'In hal A en C zijn de gele vloermarkeringen voor looppaden grotendeels versleten en nauwelijks zichtbaar.',
      efficiencyImpact: 'LOW',
      safetyImpact: 'HIGH',
      recommendation:
        'Vernieuw alle vloermarkeringen met slijtvaste epoxy-verf. Overweeg ook fysieke barrières.',
      sortOrder: 1,
    },
    {
      id: 'seed-finding-5',
      cellKey: 'RUIMTE_INRICHTING-VEILIG',
      title: 'Ontbrekende aanrijdbeveiliging stellingen',
      description:
        'Bij 12 van de 30 stellingrijen ontbreekt aanrijdbeveiliging aan de kopse kanten. Er zijn zichtbare aanrijdschade-sporen.',
      efficiencyImpact: 'NONE',
      safetyImpact: 'HIGH',
      recommendation:
        'Installeer aanrijdbeveiliging (kolombeschermers en kopbeveiliging) bij alle stellingen.',
      sortOrder: 2,
    },
    {
      id: 'seed-finding-6',
      cellKey: 'RUIMTE_INRICHTING-VEILIG',
      title: 'Nooduitgang geblokkeerd',
      description:
        'De nooduitgang aan de zuidzijde wordt regelmatig geblokkeerd door geplaatste pallets.',
      efficiencyImpact: 'NONE',
      safetyImpact: 'HIGH',
      recommendation:
        'Plaats fysieke barrières om de vrije zone rond nooduitgangen te waarborgen. Markeer met rode arcering.',
      sortOrder: 3,
    },
    // WERKWIJZE_PROCESSEN - EFFICIENT
    {
      id: 'seed-finding-7',
      cellKey: 'WERKWIJZE_PROCESSEN-EFFICIENT',
      title: 'Gestandaardiseerde pickinstructies aanwezig',
      description:
        'Elke pickorder bevat duidelijke looproute-instructies en locatiecodes. Foutpercentage is laag (0,3%).',
      efficiencyImpact: 'NONE',
      safetyImpact: 'NONE',
      recommendation: 'Continueer huidige werkwijze en deel als best practice met andere vestigingen.',
      sortOrder: 1,
    },
    {
      id: 'seed-finding-8',
      cellKey: 'WERKWIJZE_PROCESSEN-EFFICIENT',
      title: 'WMS-integratie goed ingericht',
      description:
        'Het Warehouse Management Systeem is gekoppeld aan het ERP en geeft realtime inzicht in voorraadposities.',
      efficiencyImpact: 'NONE',
      safetyImpact: 'NONE',
      recommendation:
        'Overweeg uitbreiding met voice-picking module voor verdere efficiëntieverbetering.',
      sortOrder: 2,
    },
    {
      id: 'seed-finding-9',
      cellKey: 'WERKWIJZE_PROCESSEN-EFFICIENT',
      title: 'Retourproces niet geoptimaliseerd',
      description:
        'Retouren worden ad hoc verwerkt zonder vaste procedure, wat leidt tot vertraging en fouten.',
      efficiencyImpact: 'MEDIUM',
      safetyImpact: 'NONE',
      recommendation: 'Stel een gestandaardiseerd retourproces op met vaste verwerkingstijden.',
      sortOrder: 3,
    },
    // WERKWIJZE_PROCESSEN - VEILIG
    {
      id: 'seed-finding-10',
      cellKey: 'WERKWIJZE_PROCESSEN-VEILIG',
      title: 'Wisselend PBM-gebruik',
      description:
        'Niet alle medewerkers dragen consequent veiligheidsschoenen en handschoenen bij het lossen van vrachtwagens.',
      efficiencyImpact: 'NONE',
      safetyImpact: 'MEDIUM',
      recommendation:
        'Voer striktere controle op PBM-gebruik in. Overweeg een buddy-systeem voor onderlinge controle.',
      sortOrder: 1,
    },
    {
      id: 'seed-finding-11',
      cellKey: 'WERKWIJZE_PROCESSEN-VEILIG',
      title: 'Incidentenregistratie loopt achter',
      description:
        'Bijna-ongevallen worden niet structureel gemeld. Het registratiesysteem wordt als omslachtig ervaren.',
      efficiencyImpact: 'NONE',
      safetyImpact: 'MEDIUM',
      recommendation:
        'Vereenvoudig het meldformulier en introduceer een digitaal meldsysteem (app of QR-code op de werkvloer).',
      sortOrder: 2,
    },
    {
      id: 'seed-finding-12',
      cellKey: 'WERKWIJZE_PROCESSEN-VEILIG',
      title: 'Noodprocedure niet bij iedereen bekend',
      description:
        'Bij steekproef kon 40% van de medewerkers de dichtstbijzijnde nooduitgang niet aanwijzen.',
      efficiencyImpact: 'NONE',
      safetyImpact: 'HIGH',
      recommendation:
        'Plan kwartaallijkse ontruimingsoefeningen en hang plattegronden op bij elke werkplek.',
      sortOrder: 3,
    },
    // ORGANISATIE_BESTURING - EFFICIENT
    {
      id: 'seed-finding-13',
      cellKey: 'ORGANISATIE_BESTURING-EFFICIENT',
      title: "KPI-dashboard aanwezig maar niet actief gebruikt",
      description:
        "Er is een KPI-dashboard beschikbaar maar teamleiders raadplegen dit zelden. Dagstarts gebruiken geen data.",
      efficiencyImpact: 'MEDIUM',
      safetyImpact: 'NONE',
      recommendation:
        "Integreer KPI-bespreking in dagelijkse dagstart. Train teamleiders op data-gedreven sturing.",
      sortOrder: 1,
    },
    {
      id: 'seed-finding-14',
      cellKey: 'ORGANISATIE_BESTURING-EFFICIENT',
      title: 'Reactieve personeelsplanning',
      description:
        'Capaciteitsinzet wordt pas een dag van tevoren bepaald, waardoor pieken slecht worden opgevangen.',
      efficiencyImpact: 'HIGH',
      safetyImpact: 'LOW',
      recommendation:
        'Implementeer een weekplanning op basis van orderprognoses en historische data.',
      sortOrder: 2,
    },
    {
      id: 'seed-finding-15',
      cellKey: 'ORGANISATIE_BESTURING-EFFICIENT',
      title: 'Goede communicatie expeditie-productie',
      description:
        'Er is een dagelijkse afstemming tussen expeditie en productie over prioriteiten. Dit werkt goed.',
      efficiencyImpact: 'NONE',
      safetyImpact: 'NONE',
      recommendation: 'Formaliseer dit overleg en deel het format met andere afdelingen.',
      sortOrder: 3,
    },
    // ORGANISATIE_BESTURING - VEILIG
    {
      id: 'seed-finding-16',
      cellKey: 'ORGANISATIE_BESTURING-VEILIG',
      title: 'RI&E verlopen',
      description:
        'De Risico-Inventarisatie en -Evaluatie is meer dan 3 jaar oud en niet geactualiseerd na de verbouwing.',
      efficiencyImpact: 'NONE',
      safetyImpact: 'HIGH',
      recommendation:
        'Laat direct een nieuwe RI&E uitvoeren door een gecertificeerde arbodienst.',
      sortOrder: 1,
    },
    {
      id: 'seed-finding-17',
      cellKey: 'ORGANISATIE_BESTURING-VEILIG',
      title: 'BHV-certificaten verlopen',
      description:
        'Van de 5 BHV-ers hebben er 3 een verlopen certificaat. Minimumbezetting is niet gegarandeerd.',
      efficiencyImpact: 'NONE',
      safetyImpact: 'HIGH',
      recommendation:
        'Plan herhalingscursussen BHV en zorg voor minimaal 1 extra BHV-er als buffer.',
      sortOrder: 2,
    },
    {
      id: 'seed-finding-18',
      cellKey: 'ORGANISATIE_BESTURING-VEILIG',
      title: 'Geen structureel veiligheidsoverleg',
      description:
        'Veiligheid wordt alleen besproken na incidenten, niet structureel. Er is geen vaste agenda.',
      efficiencyImpact: 'NONE',
      safetyImpact: 'MEDIUM',
      recommendation:
        'Introduceer een maandelijks veiligheidsoverleg met vaste deelnemers en agenda.',
      sortOrder: 3,
    },
  ];

  for (const f of findingsData) {
    const cellId = publishedCells[f.cellKey];
    await prisma.scanFinding.upsert({
      where: { id: f.id },
      update: {
        title: f.title,
        description: f.description,
        efficiencyImpact: f.efficiencyImpact,
        safetyImpact: f.safetyImpact,
        recommendation: f.recommendation,
        sortOrder: f.sortOrder,
      },
      create: {
        id: f.id,
        scanId: publishedScan.id,
        cellId,
        title: f.title,
        description: f.description,
        efficiencyImpact: f.efficiencyImpact,
        safetyImpact: f.safetyImpact,
        recommendation: f.recommendation,
        photoUrls: [],
        sortOrder: f.sortOrder,
      },
    });
  }

  // Roadmap items for published scan
  const roadmapData: Array<{
    id: string;
    title: string;
    description: string;
    timeframe: 'QUICK_WIN' | 'DAYS_30' | 'DAYS_60' | 'DAYS_90';
    priority: number;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'DEFERRED';
  }> = [
    {
      id: 'seed-roadmap-1',
      title: 'Nooduitgangen vrijmaken',
      description: 'Verwijder alle obstakels bij nooduitgangen en markeer vrije zones met rode arcering.',
      timeframe: 'QUICK_WIN',
      priority: 10,
      status: 'DONE',
    },
    {
      id: 'seed-roadmap-2',
      title: 'Vloermarkeringen vernieuwen',
      description:
        'Vernieuw alle gele vloermarkeringen in hal A en C met slijtvaste epoxy-verf.',
      timeframe: 'DAYS_30',
      priority: 9,
      status: 'IN_PROGRESS',
    },
    {
      id: 'seed-roadmap-3',
      title: 'Aanrijdbeveiliging installeren',
      description:
        'Monteer kolombeschermers en kopbeveiliging bij alle 30 stellingrijen.',
      timeframe: 'DAYS_30',
      priority: 8,
      status: 'TODO',
    },
    {
      id: 'seed-roadmap-4',
      title: 'RI&E actualiseren',
      description:
        'Laat een gecertificeerde arbodienst een nieuwe RI&E uitvoeren inclusief het verbouwde gedeelte.',
      timeframe: 'DAYS_60',
      priority: 9,
      status: 'TODO',
    },
    {
      id: 'seed-roadmap-5',
      title: 'BHV-herhalingscursussen plannen',
      description: 'Plan herhalingscursussen voor de 3 BHV-ers met verlopen certificaat.',
      timeframe: 'DAYS_30',
      priority: 7,
      status: 'IN_PROGRESS',
    },
    {
      id: 'seed-roadmap-6',
      title: 'ABC-analyse en herinrichting',
      description:
        'Voer ABC-analyse uit op productassortiment en herpositioneer snellopers dichter bij expeditie.',
      timeframe: 'DAYS_60',
      priority: 6,
      status: 'TODO',
    },
    {
      id: 'seed-roadmap-7',
      title: 'Incidentmeldingssysteem digitaliseren',
      description:
        'Implementeer een digitaal meldsysteem met QR-codes op de werkvloer voor snelle registratie.',
      timeframe: 'DAYS_60',
      priority: 5,
      status: 'DEFERRED',
    },
    {
      id: 'seed-roadmap-8',
      title: 'Weekplanning implementeren',
      description:
        'Stel een weekplanning op basis van orderprognoses en historische bezettingsdata.',
      timeframe: 'DAYS_90',
      priority: 4,
      status: 'TODO',
    },
    {
      id: 'seed-roadmap-9',
      title: 'Maandelijks veiligheidsoverleg starten',
      description:
        'Stel een vast maandelijks veiligheidsoverleg in met vaste deelnemers, agenda en actiepunten.',
      timeframe: 'QUICK_WIN',
      priority: 6,
      status: 'IN_PROGRESS',
    },
  ];

  for (const r of roadmapData) {
    await prisma.roadmapItem.upsert({
      where: { id: r.id },
      update: {
        title: r.title,
        description: r.description,
        timeframe: r.timeframe,
        priority: r.priority,
        status: r.status,
      },
      create: {
        id: r.id,
        scanId: publishedScan.id,
        title: r.title,
        description: r.description,
        timeframe: r.timeframe,
        priority: r.priority,
        status: r.status,
        ownerId: r.status === 'DONE' ? clientUser.id : consultantUser.id,
        dueDate:
          r.timeframe === 'QUICK_WIN'
            ? daysFromNow(7)
            : r.timeframe === 'DAYS_30'
              ? daysFromNow(30)
              : r.timeframe === 'DAYS_60'
                ? daysFromNow(60)
                : daysFromNow(90),
      },
    });
  }

  // --- Archived scan (older, 6 months ago) ---
  const archivedScan = await prisma.quickScan.upsert({
    where: { id: 'seed-scan-archived' },
    update: {},
    create: {
      id: 'seed-scan-archived',
      organizationId: demoOrg.id,
      consultantId: consultantUser.id,
      title: 'QuickScan Q2 2025 — Demo Bedrijf',
      scanDate: daysAgo(180),
      status: 'ARCHIVED',
      overallEfficiency: 'ROOD',
      overallSafety: 'ROOD',
      summary:
        'Eerste scan na oplevering nieuw magazijn. Significante verbeterpunten op alle vlakken geconstateerd.',
    },
  });

  const archivedCellScores: Record<string, 'ROOD' | 'ORANJE' | 'GROEN'> = {
    'RUIMTE_INRICHTING-EFFICIENT': 'ROOD',
    'RUIMTE_INRICHTING-VEILIG': 'ROOD',
    'WERKWIJZE_PROCESSEN-EFFICIENT': 'ORANJE',
    'WERKWIJZE_PROCESSEN-VEILIG': 'ROOD',
    'ORGANISATIE_BESTURING-EFFICIENT': 'ROOD',
    'ORGANISATIE_BESTURING-VEILIG': 'ROOD',
  };

  for (const layer of LAYERS) {
    for (const perspective of PERSPECTIVES) {
      const key = `${layer}-${perspective}`;
      const cellId = `seed-cell-arch-${layer}-${perspective}`.toLowerCase();
      await prisma.scanCell.upsert({
        where: { scanId_layer_perspective: { scanId: archivedScan.id, layer, perspective } },
        update: { score: archivedCellScores[key] },
        create: {
          id: cellId,
          scanId: archivedScan.id,
          layer,
          perspective,
          score: archivedCellScores[key],
          summary: 'Aandachtspunt geconstateerd tijdens initiële scan.',
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ACTIONS → COMMENTS (some linked to findings)
  // ═══════════════════════════════════════════════════════════════════════════

  const actionsData: Array<{
    id: string;
    title: string;
    description: string;
    layer: 'RUIMTE_INRICHTING' | 'WERKWIJZE_PROCESSEN' | 'ORGANISATIE_BESTURING';
    perspective: 'EFFICIENT' | 'VEILIG';
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'DEFERRED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate: Date;
    completedAt: Date | null;
    findingId: string | null;
    assigneeId: string;
    reporterId: string;
  }> = [
    {
      id: 'seed-action-1',
      title: 'Aanrijdbeveiliging bestellen en monteren',
      description:
        'Bestel kolombeschermers (30x) en kopbeveiliging (30x) bij leverancier. Plan montage in overleg met operations.',
      layer: 'RUIMTE_INRICHTING',
      perspective: 'VEILIG',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      dueDate: daysFromNow(14),
      completedAt: null,
      findingId: 'seed-finding-5',
      assigneeId: clientUser.id,
      reporterId: consultantUser.id,
    },
    {
      id: 'seed-action-2',
      title: 'Vloermarkeringen vernieuwen hal A',
      description:
        'Offertes opvragen voor epoxy-vloermarkering in hal A. Markeer looppaden, heftruckroutes en opslagzones.',
      layer: 'RUIMTE_INRICHTING',
      perspective: 'VEILIG',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: daysFromNow(21),
      completedAt: null,
      findingId: 'seed-finding-4',
      assigneeId: clientUser.id,
      reporterId: consultantUser.id,
    },
    {
      id: 'seed-action-3',
      title: 'Nooduitgang zuidzijde permanent vrijhouden',
      description:
        'Fysieke barrière geplaatst en rode arcering aangebracht. Medewerkers geïnformeerd.',
      layer: 'RUIMTE_INRICHTING',
      perspective: 'VEILIG',
      status: 'DONE',
      priority: 'URGENT',
      dueDate: daysAgo(20),
      completedAt: daysAgo(22),
      findingId: 'seed-finding-6',
      assigneeId: clientUser.id,
      reporterId: consultantUser.id,
    },
    {
      id: 'seed-action-4',
      title: 'ABC-analyse uitvoeren',
      description:
        'Analyseer pickfrequentie van alle SKU\'s over de afgelopen 6 maanden. Classificeer in A (top 20%), B (30%) en C (50%).',
      layer: 'RUIMTE_INRICHTING',
      perspective: 'EFFICIENT',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: daysFromNow(45),
      completedAt: null,
      findingId: 'seed-finding-3',
      assigneeId: clientUser.id,
      reporterId: consultantUser.id,
    },
    {
      id: 'seed-action-5',
      title: 'RI&E laten actualiseren',
      description:
        'Neem contact op met arbodienst voor nieuwe RI&E. Zorg dat verbouwde gedeelte wordt meegenomen.',
      layer: 'ORGANISATIE_BESTURING',
      perspective: 'VEILIG',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: daysFromNow(30),
      completedAt: null,
      findingId: 'seed-finding-16',
      assigneeId: adminUser.id,
      reporterId: consultantUser.id,
    },
    {
      id: 'seed-action-6',
      title: 'BHV-herhalingscursussen inplannen',
      description: 'Plan herhalingscursussen voor Pieter, Marije en Bas. Minimum 2 BHV-ers altijd aanwezig.',
      layer: 'ORGANISATIE_BESTURING',
      perspective: 'VEILIG',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: daysFromNow(14),
      completedAt: null,
      findingId: 'seed-finding-17',
      assigneeId: adminUser.id,
      reporterId: consultantUser.id,
    },
    {
      id: 'seed-action-7',
      title: 'PBM-controle verscherpen',
      description:
        'Introduceer dagelijkse PBM-check bij dagstart. Buddy-systeem opzetten voor onderlinge controle.',
      layer: 'WERKWIJZE_PROCESSEN',
      perspective: 'VEILIG',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: daysFromNow(21),
      completedAt: null,
      findingId: 'seed-finding-10',
      assigneeId: clientUser.id,
      reporterId: consultantUser.id,
    },
    {
      id: 'seed-action-8',
      title: 'Retourproces standaardiseren',
      description:
        'Stel werkinstructie op voor retourverwerking met vaste tijdslots en kwaliteitscontrole.',
      layer: 'WERKWIJZE_PROCESSEN',
      perspective: 'EFFICIENT',
      status: 'DEFERRED',
      priority: 'LOW',
      dueDate: daysFromNow(60),
      completedAt: null,
      findingId: 'seed-finding-9',
      assigneeId: clientUser.id,
      reporterId: consultantUser.id,
    },
    {
      id: 'seed-action-9',
      title: 'Ontruimingsoefening Q1 2026 plannen',
      description:
        'Plan ontruimingsoefening voor januari. Betrek alle medewerkers en evalueer achteraf.',
      layer: 'WERKWIJZE_PROCESSEN',
      perspective: 'VEILIG',
      status: 'DONE',
      priority: 'MEDIUM',
      dueDate: daysAgo(5),
      completedAt: daysAgo(7),
      findingId: 'seed-finding-12',
      assigneeId: adminUser.id,
      reporterId: consultantUser.id,
    },
    {
      id: 'seed-action-10',
      title: 'Veiligheidsoverleg maandelijks instellen',
      description:
        'Richt maandelijks veiligheidsoverleg in met vaste deelnemers: teamleiders, BHV-coördinator en directie.',
      layer: 'ORGANISATIE_BESTURING',
      perspective: 'VEILIG',
      status: 'CANCELLED',
      priority: 'LOW',
      dueDate: daysAgo(10),
      completedAt: null,
      findingId: 'seed-finding-18',
      assigneeId: adminUser.id,
      reporterId: consultantUser.id,
    },
  ];

  for (const a of actionsData) {
    await prisma.action.upsert({
      where: { id: a.id },
      update: {
        title: a.title,
        description: a.description,
        status: a.status,
        priority: a.priority,
      },
      create: {
        id: a.id,
        organizationId: demoOrg.id,
        title: a.title,
        description: a.description,
        layer: a.layer,
        perspective: a.perspective,
        status: a.status,
        priority: a.priority,
        dueDate: a.dueDate,
        completedAt: a.completedAt,
        findingId: a.findingId,
        assigneeId: a.assigneeId,
        reporterId: a.reporterId,
        photoUrls: [],
      },
    });
  }

  // Action comments
  const commentsData: Array<{
    id: string;
    actionId: string;
    authorId: string;
    content: string;
    createdAt: Date;
  }> = [
    {
      id: 'seed-comment-1',
      actionId: 'seed-action-1',
      authorId: consultantUser.id,
      content: 'Offerte ontvangen van SafeRack: €4.200 voor 30 kolombeschermers incl. montage.',
      createdAt: daysAgo(10),
    },
    {
      id: 'seed-comment-2',
      actionId: 'seed-action-1',
      authorId: clientUser.id,
      content: 'Akkoord op offerte. Montage gepland voor week 8.',
      createdAt: daysAgo(7),
    },
    {
      id: 'seed-comment-3',
      actionId: 'seed-action-2',
      authorId: clientUser.id,
      content: 'Twee offertes binnen: VloerTotaal (€3.800) en MarkeerPro (€4.100). VloerTotaal kan sneller leveren.',
      createdAt: daysAgo(5),
    },
    {
      id: 'seed-comment-4',
      actionId: 'seed-action-3',
      authorId: clientUser.id,
      content: 'Barrière geplaatst en vloermarkering aangebracht. Foto\'s toegevoegd aan de scan.',
      createdAt: daysAgo(22),
    },
    {
      id: 'seed-comment-5',
      actionId: 'seed-action-6',
      authorId: adminUser.id,
      content: 'Pieter en Marije aangemeld voor cursus op 15 februari. Bas volgt in maart.',
      createdAt: daysAgo(3),
    },
    {
      id: 'seed-comment-6',
      actionId: 'seed-action-9',
      authorId: adminUser.id,
      content: 'Oefening succesvol verlopen. Ontruimingstijd: 3 min 45 sec. Aandachtspunt: hal C was trager.',
      createdAt: daysAgo(7),
    },
  ];

  for (const c of commentsData) {
    await prisma.actionComment.upsert({
      where: { id: c.id },
      update: { content: c.content },
      create: {
        id: c.id,
        actionId: c.actionId,
        authorId: c.authorId,
        content: c.content,
        createdAt: c.createdAt,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. PRODUCTS → PRODUCT RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const productsData: Array<{
    id: string;
    name: string;
    description: string;
    sku: string;
    category: string;
    layer: 'RUIMTE_INRICHTING' | 'WERKWIJZE_PROCESSEN' | 'ORGANISATIE_BESTURING';
    imageUrl: string;
    productUrl: string;
    priceRange: string;
  }> = [
    {
      id: 'seed-product-1',
      name: 'Stellingbescherming L-profiel 400 mm',
      description:
        'Stalen hoekbeschermer met L-profiel (400x160x160x5 mm) en kunststof coating in geel/zwart. Absorbeert botsingen en minimaliseert aanrijdschade aan stellingen. Montage met 4 ankers.',
      sku: '690000460',
      category: 'Aanrijdbeveiliging',
      layer: 'RUIMTE_INRICHTING',
      imageUrl: 'https://www.logistiekconcurrent.nl/media/catalog/product/cache/186ac57e52cb3cb5c3fa785bfe79c4c9/6/9/690000460-2.jpg',
      productUrl: 'https://www.logistiekconcurrent.nl/stellingbescherming-l-profiel-400-mm-hoog',
      priceRange: '€15 - €25',
    },
    {
      id: 'seed-product-2',
      name: 'Stellingbescherming L-profiel Swing 430 mm',
      description:
        'Stellingbescherming met L-profiel en polyurethaan veerelement (Swing). Absorbeert botsingsenergie en beschermt tevens de magazijnvloer. Hoogwaardig staal met kunststof coating.',
      sku: '690000466',
      category: 'Aanrijdbeveiliging',
      layer: 'RUIMTE_INRICHTING',
      imageUrl: 'https://www.logistiekconcurrent.nl/media/catalog/product/cache/186ac57e52cb3cb5c3fa785bfe79c4c9/4/2/422f3093.jpg',
      productUrl: 'https://www.logistiekconcurrent.nl/stellingbescherming-l-profiel-swing-430-mm-hoog',
      priceRange: '€30 - €45',
    },
    {
      id: 'seed-product-3',
      name: 'Stellingbescherming Kunststof Ø150 Verstelbare Balk',
      description:
        'Kunststof aanrijdbeveiliging met verstelbare balk. Beweegt mee bij impact — geen vervanging of reparatie nodig na aanrijding. Beschermt stelling, voertuig en persoon.',
      sku: 'LC-SB-150',
      category: 'Aanrijdbeveiliging',
      layer: 'RUIMTE_INRICHTING',
      imageUrl: 'https://www.logistiekconcurrent.nl/media/catalog/product/cache/186ac57e52cb3cb5c3fa785bfe79c4c9/6/9/695000025_1.jpg',
      productUrl: 'https://www.logistiekconcurrent.nl/stellingbescherming-o150-verstelbare-balk-550mm-breedte-naar-keuze',
      priceRange: '€149 - €249',
    },
    {
      id: 'seed-product-4',
      name: 'Vloermarkeringstape Geel/Zwart 50 mm x 33 m',
      description:
        'PVC vloermarkeringstape in waarschuwingskleuren geel/zwart (50 mm breed, 33 meter). Sterke rubber plaklaag, geschikt voor magazijnen en orderpickstraten. Voldoet aan EU-regels 2000/53 EC.',
      sku: 'LC-VMT-GZ',
      category: 'Markering & Signalering',
      layer: 'RUIMTE_INRICHTING',
      imageUrl: 'https://www.logistiekconcurrent.nl/media/catalog/product/cache/186ac57e52cb3cb5c3fa785bfe79c4c9/m/a/markeringstape_zwart_geel_1.jpg',
      productUrl: 'https://www.logistiekconcurrent.nl/vloermarkeringstape-50mm-x-33-meter-geel-zwart',
      priceRange: '€8 - €15',
    },
    {
      id: 'seed-product-5',
      name: 'Vloermarkeringstape Geel 50 mm x 33 m',
      description:
        'Gele PVC vloermarkeringstape (50 mm breed, 33 meter) voor markering van looppaden, rijroutes en opslagzones in magazijnen. Slijtvast en geschikt voor heftruckverkeer.',
      sku: 'LC-VMT-G',
      category: 'Markering & Signalering',
      layer: 'RUIMTE_INRICHTING',
      imageUrl: 'https://www.logistiekconcurrent.nl/media/catalog/product/cache/186ac57e52cb3cb5c3fa785bfe79c4c9/3/0/300404003_-_vloermarkeringstape_geel_1.jpg',
      productUrl: 'https://www.logistiekconcurrent.nl/vloermarkeringstape-50-mm-x-33-meter-geel',
      priceRange: '€6 - €12',
    },
    {
      id: 'seed-product-6',
      name: 'Bolspiegel 360° 4-wegen Magazijnspiegel Ø800 mm',
      description:
        'Panorama bolspiegel met 360° zicht en 12 meter kijkafstand. Verhoogt de veiligheid op kruispunten en in gangpaden. Impact-bestendig kunststof, geschikt voor binnen- en buitengebruik.',
      sku: 'LC-BS-360-800',
      category: 'Veiligheidsspiegels',
      layer: 'RUIMTE_INRICHTING',
      imageUrl: 'https://www.logistiekconcurrent.nl/media/catalog/product/cache/186ac57e52cb3cb5c3fa785bfe79c4c9/6/9/690000720.jpg',
      productUrl: 'https://www.logistiekconcurrent.nl/bolspiegel-360-4-wegen-magazijnspiegel-800-mm',
      priceRange: '€89 - €139',
    },
    {
      id: 'seed-product-7',
      name: 'Blue Safety Heftruck Licht 9-96V',
      description:
        'Blauw LED-waarschuwingslicht voor heftrucks. Projecteert een blauwe stip op de vloer om naderende heftrucks te signaleren. Geschikt voor kruispunten en gangpaden. 9-96V breed voltage.',
      sku: 'LC-BSL-96V',
      category: 'Heftruckveiligheid',
      layer: 'WERKWIJZE_PROCESSEN',
      imageUrl: 'https://www.logistiekconcurrent.nl/media/catalog/product/cache/186ac57e52cb3cb5c3fa785bfe79c4c9/2/0/201502005.jpg',
      productUrl: 'https://www.logistiekconcurrent.nl/blue-safety-heftruck-licht-9-96v',
      priceRange: '€35 - €59',
    },
    {
      id: 'seed-product-8',
      name: 'Keep Out Zone Licht Heftruck',
      description:
        'Projecteert een rode waarschuwingszone rondom de heftruck op de vloer. Voetgangers en andere weggebruikers zien direct de werkruimte van de heftruck. Voorkomt actief botsingen.',
      sku: 'LC-KOZ-HT',
      category: 'Heftruckveiligheid',
      layer: 'WERKWIJZE_PROCESSEN',
      imageUrl: 'https://www.logistiekconcurrent.nl/media/catalog/product/cache/186ac57e52cb3cb5c3fa785bfe79c4c9/2/0/201502007-2.jpg',
      productUrl: 'https://www.logistiekconcurrent.nl/keep-out-zone-licht-heftruck',
      priceRange: '€59 - €99',
    },
    {
      id: 'seed-product-9',
      name: 'BHV Training Pakket',
      description:
        'Complete BHV-training inclusief EHBO, brandbestrijding en ontruiming. Inclusief herhalingscursus na 1 jaar. Gecertificeerde opleiding conform Arbowet.',
      sku: 'LC-BHV-TP-009',
      category: 'Opleidingen',
      layer: 'ORGANISATIE_BESTURING',
      imageUrl: '/placeholder/product-bhv.jpg',
      productUrl: 'https://www.logistiekconcurrent.nl/pbm-en-veiligheid',
      priceRange: '€295 - €395',
    },
    {
      id: 'seed-product-10',
      name: 'RI&E Uitvoering Compleet',
      description:
        'Volledige Risico-Inventarisatie en -Evaluatie door gecertificeerde arbodienst. Inclusief plan van aanpak en toetsing. Conform Arbowet artikel 5.',
      sku: 'LC-RIE-UC-010',
      category: 'Advies & Diensten',
      layer: 'ORGANISATIE_BESTURING',
      imageUrl: '/placeholder/product-rie.jpg',
      productUrl: 'https://www.logistiekconcurrent.nl/magazijn/magazijninrichting/aanrijdbeveiliging',
      priceRange: '€1.500 - €3.500',
    },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        description: p.description,
        category: p.category,
        imageUrl: p.imageUrl,
        productUrl: p.productUrl,
      },
      create: {
        id: p.id,
        name: p.name,
        description: p.description,
        sku: p.sku,
        category: p.category,
        layer: p.layer,
        imageUrl: p.imageUrl,
        productUrl: p.productUrl,
        priceRange: p.priceRange,
        isActive: true,
      },
    });
  }

  // Product recommendations (linked to findings and actions)
  const recommendationsData: Array<{
    id: string;
    productId: string;
    findingId: string | null;
    actionId: string | null;
    layer: 'RUIMTE_INRICHTING' | 'WERKWIJZE_PROCESSEN' | 'ORGANISATIE_BESTURING';
    context: string;
    sortOrder: number;
  }> = [
    {
      id: 'seed-rec-1',
      productId: 'seed-product-1',
      findingId: 'seed-finding-5',
      actionId: 'seed-action-1',
      layer: 'RUIMTE_INRICHTING',
      context: 'L-profiel stellingbescherming voor de 12 stellingrijen waar aanrijdbeveiliging ontbreekt.',
      sortOrder: 1,
    },
    {
      id: 'seed-rec-2',
      productId: 'seed-product-3',
      findingId: 'seed-finding-5',
      actionId: 'seed-action-1',
      layer: 'RUIMTE_INRICHTING',
      context: 'Kunststof verstelbare stellingbescherming als alternatief — geen vervanging nodig na impact.',
      sortOrder: 2,
    },
    {
      id: 'seed-rec-3',
      productId: 'seed-product-4',
      findingId: 'seed-finding-4',
      actionId: 'seed-action-2',
      layer: 'RUIMTE_INRICHTING',
      context: 'Geel/zwarte waarschuwingstape voor vervanging van versleten vloermarkeringen in hal A en C.',
      sortOrder: 1,
    },
    {
      id: 'seed-rec-4',
      productId: 'seed-product-9',
      findingId: 'seed-finding-17',
      actionId: 'seed-action-6',
      layer: 'ORGANISATIE_BESTURING',
      context: 'Herhalingscursussen voor 3 BHV-ers met verlopen certificaat.',
      sortOrder: 1,
    },
    {
      id: 'seed-rec-5',
      productId: 'seed-product-10',
      findingId: 'seed-finding-16',
      actionId: 'seed-action-5',
      layer: 'ORGANISATIE_BESTURING',
      context: 'RI&E is verlopen en moet geactualiseerd worden na de verbouwing.',
      sortOrder: 1,
    },
  ];

  for (const r of recommendationsData) {
    await prisma.productRecommendation.upsert({
      where: { id: r.id },
      update: { context: r.context },
      create: {
        id: r.id,
        productId: r.productId,
        findingId: r.findingId,
        actionId: r.actionId,
        layer: r.layer,
        context: r.context,
        sortOrder: r.sortOrder,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. CLIENT DOCUMENTS (with version chain, templates, expiring)
  // ═══════════════════════════════════════════════════════════════════════════

  const documentsData: Array<{
    id: string;
    title: string;
    description: string;
    category:
      | 'QUICKSCAN_REPORT'
      | 'COMPLIANCE'
      | 'SAFETY'
      | 'WORK_INSTRUCTIONS'
      | 'CERTIFICATES'
      | 'TRAINING'
      | 'TEMPLATE'
      | 'OTHER';
    fileName: string;
    fileSize: number;
    mimeType: string;
    version: number;
    parentId: string | null;
    expiresAt: Date | null;
    isTemplate: boolean;
    createdAt: Date;
  }> = [
    {
      id: 'seed-doc-1',
      title: 'QuickScan Rapport Q4 2025',
      description: 'Volledig rapport van de QuickScan uitgevoerd in Q4 2025 door Jan de Vries.',
      category: 'QUICKSCAN_REPORT',
      fileName: 'quickscan-q4-2025-demo-bedrijf.pdf',
      fileSize: 2_450_000,
      mimeType: 'application/pdf',
      version: 1,
      parentId: null,
      expiresAt: null,
      isTemplate: false,
      createdAt: daysAgo(28),
    },
    {
      id: 'seed-doc-2',
      title: 'RI&E Document 2022',
      description: 'Risico-Inventarisatie en -Evaluatie uitgevoerd in 2022. Verloopt binnenkort.',
      category: 'COMPLIANCE',
      fileName: 'rie-2022-demo-bedrijf.pdf',
      fileSize: 5_100_000,
      mimeType: 'application/pdf',
      version: 1,
      parentId: null,
      expiresAt: daysFromNow(10),
      isTemplate: false,
      createdAt: daysAgo(365),
    },
    {
      id: 'seed-doc-3',
      title: 'Heftruckcertificaat — Pieter Bakker',
      description: 'Heftruckcertificaat (reachtruck) geldig tot maart 2026.',
      category: 'CERTIFICATES',
      fileName: 'certificaat-heftruck-pieter-bakker.pdf',
      fileSize: 890_000,
      mimeType: 'application/pdf',
      version: 1,
      parentId: null,
      expiresAt: daysFromNow(45),
      isTemplate: false,
      createdAt: daysAgo(300),
    },
    {
      id: 'seed-doc-4',
      title: 'BHV-certificaat — Marije de Groot',
      description: 'BHV-certificaat verlopen, herhalingscursus gepland.',
      category: 'CERTIFICATES',
      fileName: 'certificaat-bhv-marije-de-groot.pdf',
      fileSize: 750_000,
      mimeType: 'application/pdf',
      version: 1,
      parentId: null,
      expiresAt: daysAgo(30),
      isTemplate: false,
      createdAt: daysAgo(400),
    },
    {
      id: 'seed-doc-5',
      title: 'Werkinstructie Orderpicking',
      description: 'Stap-voor-stap werkinstructie voor het picken van orders met WMS-scanner.',
      category: 'WORK_INSTRUCTIONS',
      fileName: 'werkinstructie-orderpicking-v2.pdf',
      fileSize: 1_200_000,
      mimeType: 'application/pdf',
      version: 2,
      parentId: 'seed-doc-5-v1',
      expiresAt: null,
      isTemplate: false,
      createdAt: daysAgo(14),
    },
    {
      id: 'seed-doc-5-v1',
      title: 'Werkinstructie Orderpicking',
      description: 'Eerste versie werkinstructie orderpicking.',
      category: 'WORK_INSTRUCTIONS',
      fileName: 'werkinstructie-orderpicking-v1.pdf',
      fileSize: 980_000,
      mimeType: 'application/pdf',
      version: 1,
      parentId: null,
      expiresAt: null,
      isTemplate: false,
      createdAt: daysAgo(90),
    },
    {
      id: 'seed-doc-6',
      title: 'Ontruimingsplan',
      description: 'Ontruimingsplan met plattegronden, verzamelplaatsen en BHV-taken.',
      category: 'SAFETY',
      fileName: 'ontruimingsplan-2025.pdf',
      fileSize: 3_400_000,
      mimeType: 'application/pdf',
      version: 1,
      parentId: null,
      expiresAt: null,
      isTemplate: false,
      createdAt: daysAgo(60),
    },
    {
      id: 'seed-doc-7',
      title: 'Veiligheidsinstructie Heftruckgebruik',
      description: 'Veiligheidsinstructie voor het veilig besturen van heftrucks in het magazijn.',
      category: 'SAFETY',
      fileName: 'veiligheidsinstructie-heftruck.pdf',
      fileSize: 1_800_000,
      mimeType: 'application/pdf',
      version: 1,
      parentId: null,
      expiresAt: null,
      isTemplate: false,
      createdAt: daysAgo(120),
    },
    {
      id: 'seed-doc-8',
      title: 'Toolbox Meeting Registratieformulier',
      description: 'Template voor het registreren van toolbox meetings. Inclusief presentielijst en onderwerpen.',
      category: 'TEMPLATE',
      fileName: 'template-toolbox-meeting.docx',
      fileSize: 45_000,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      version: 1,
      parentId: null,
      expiresAt: null,
      isTemplate: true,
      createdAt: daysAgo(180),
    },
    {
      id: 'seed-doc-9',
      title: 'Training Materiaal — Magazijnveiligheid',
      description: 'Presentatie voor de basistraining magazijnveiligheid voor nieuwe medewerkers.',
      category: 'TRAINING',
      fileName: 'training-magazijnveiligheid.pptx',
      fileSize: 8_500_000,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      version: 1,
      parentId: null,
      expiresAt: null,
      isTemplate: false,
      createdAt: daysAgo(150),
    },
    {
      id: 'seed-doc-10',
      title: 'Stellingkeuringsrapport 2025',
      description: 'Jaarlijkse stellingkeuring uitgevoerd door extern bureau. Enkele oranje meldingen.',
      category: 'COMPLIANCE',
      fileName: 'stellingkeuring-2025.pdf',
      fileSize: 4_200_000,
      mimeType: 'application/pdf',
      version: 1,
      parentId: null,
      expiresAt: daysFromNow(330),
      isTemplate: false,
      createdAt: daysAgo(35),
    },
  ];

  // Create v1 parent first, then the version-2 doc
  const sortedDocs = [...documentsData].sort((a, b) => {
    if (a.parentId === null && b.parentId !== null) return -1;
    if (a.parentId !== null && b.parentId === null) return 1;
    return 0;
  });

  for (const d of sortedDocs) {
    await prisma.clientDocument.upsert({
      where: { id: d.id },
      update: {
        title: d.title,
        description: d.description,
        category: d.category,
      },
      create: {
        id: d.id,
        organizationId: demoOrg.id,
        title: d.title,
        description: d.description,
        category: d.category,
        fileUrl: `/placeholder/${d.fileName}`,
        fileName: d.fileName,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        version: d.version,
        parentId: d.parentId,
        expiresAt: d.expiresAt,
        isTemplate: d.isTemplate,
        uploadedById: d.category === 'QUICKSCAN_REPORT' ? consultantUser.id : clientUser.id,
        createdAt: d.createdAt,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. ASSESSMENT RESPONSES → ANSWERS → RESULT CELLS
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Completed assessment ---
  const completedAssessment = await prisma.assessmentResponse.upsert({
    where: { id: 'seed-assessment-completed' },
    update: {},
    create: {
      id: 'seed-assessment-completed',
      templateId: template.id,
      userId: clientUser.id,
      organizationId: demoOrg.id,
      status: 'COMPLETED',
      completedAt: daysAgo(15),
    },
  });

  // Scores per question (1-5) — mixed to produce varied RAG results
  const completedScores: Record<number, { score: number; notes: string | null }> = {
    1: { score: 3, notes: 'Indeling redelijk maar niet optimaal voor huidige goederenstroom.' },
    2: { score: 2, notes: 'Veel onbenutte ruimte, vooral in hoogte.' },
    3: { score: 3, notes: 'Looproutes functioneel maar er zijn kruisingen.' },
    4: { score: 1, notes: 'Vloermarkeringen grotendeels versleten.' },
    5: { score: 2, notes: 'Aanrijdbeveiliging ontbreekt bij veel stellingen.' },
    6: { score: 3, notes: 'Verlichting voldoende, ventilatie kan beter.' },
    7: { score: 4, notes: 'Pickprocessen goed gestandaardiseerd.' },
    8: { score: 4, notes: 'WMS goed ingezet, scanners werken prima.' },
    9: { score: 3, notes: 'Voorraad redelijk actueel, ABC-analyse ontbreekt.' },
    10: { score: 2, notes: 'PBM-gebruik is wisselend.' },
    11: { score: 2, notes: 'Incidentenregistratie loopt achter.' },
    12: { score: 2, notes: 'Noodprocedures niet bij iedereen bekend.' },
    13: { score: 3, notes: "KPI-dashboard beschikbaar maar niet actief gebruikt." },
    14: { score: 2, notes: 'Planning is reactief.' },
    15: { score: 4, notes: 'Dagelijkse afstemming expeditie-productie werkt goed.' },
    16: { score: 1, notes: 'Veiligheid niet structureel op de agenda.' },
    17: { score: 1, notes: 'Meerdere BHV-certificaten verlopen.' },
    18: { score: 1, notes: 'RI&E verlopen, geen preventiemedewerker aangewezen.' },
  };

  for (const q of assessmentQuestions) {
    const questionId = `${template.id}-q${q.sortOrder}`;
    const answerId = `seed-answer-completed-${q.sortOrder}`;
    const scoreData = completedScores[q.sortOrder];
    await prisma.assessmentAnswer.upsert({
      where: { responseId_questionId: { responseId: completedAssessment.id, questionId } },
      update: { score: scoreData.score, notes: scoreData.notes },
      create: {
        id: answerId,
        responseId: completedAssessment.id,
        questionId,
        score: scoreData.score,
        notes: scoreData.notes,
      },
    });
  }

  // Compute and seed result cells for completed assessment
  function computeRAGScore(rawScore: number): 'ROOD' | 'ORANJE' | 'GROEN' {
    if (rawScore < 2.0) return 'ROOD';
    if (rawScore <= 3.5) return 'ORANJE';
    return 'GROEN';
  }

  for (const layer of LAYERS) {
    for (const perspective of PERSPECTIVES) {
      const matching = assessmentQuestions.filter(
        (q) => q.layer === layer && q.perspective === perspective
      );
      const scores = matching.map((q) => completedScores[q.sortOrder].score);
      const rawScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const cellId = `seed-result-cell-completed-${layer}-${perspective}`.toLowerCase();

      await prisma.assessmentResultCell.upsert({
        where: {
          responseId_layer_perspective: {
            responseId: completedAssessment.id,
            layer,
            perspective,
          },
        },
        update: { rawScore, score: computeRAGScore(rawScore) },
        create: {
          id: cellId,
          responseId: completedAssessment.id,
          layer,
          perspective,
          rawScore,
          score: computeRAGScore(rawScore),
        },
      });
    }
  }

  // --- In-progress assessment (partial, 8 of 18 answered) ---
  const inProgressAssessment = await prisma.assessmentResponse.upsert({
    where: { id: 'seed-assessment-inprogress' },
    update: {},
    create: {
      id: 'seed-assessment-inprogress',
      templateId: template.id,
      userId: clientUser.id,
      organizationId: demoOrg.id,
      status: 'IN_PROGRESS',
    },
  });

  const partialScores: Record<number, number> = {
    1: 4,
    2: 3,
    3: 4,
    4: 2,
    5: 3,
    6: 3,
    7: 4,
    8: 5,
  };

  for (const [sortOrderStr, score] of Object.entries(partialScores)) {
    const sortOrder = Number(sortOrderStr);
    const questionId = `${template.id}-q${sortOrder}`;
    const answerId = `seed-answer-inprogress-${sortOrder}`;
    await prisma.assessmentAnswer.upsert({
      where: { responseId_questionId: { responseId: inProgressAssessment.id, questionId } },
      update: { score },
      create: {
        id: answerId,
        responseId: inProgressAssessment.id,
        questionId,
        score,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. QUOTE REQUESTS
  // ═══════════════════════════════════════════════════════════════════════════

  const quotesData: Array<{
    id: string;
    productId: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    message: string;
    status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'CLOSED';
    createdAt: Date;
  }> = [
    {
      id: 'seed-quote-1',
      productId: 'seed-product-1',
      contactName: 'Test Gebruiker',
      contactEmail: 'test@example.com',
      contactPhone: '06-12345678',
      message: 'Graag offerte voor 30 kolombeschermers Heavy Duty inclusief montage.',
      status: 'QUOTED',
      createdAt: daysAgo(12),
    },
    {
      id: 'seed-quote-2',
      productId: 'seed-product-10',
      contactName: 'Test Gebruiker',
      contactEmail: 'test@example.com',
      contactPhone: '06-12345678',
      message: 'Wij willen graag een volledige RI&E laten uitvoeren. Magazijn is circa 2.500m2.',
      status: 'CONTACTED',
      createdAt: daysAgo(8),
    },
    {
      id: 'seed-quote-3',
      productId: 'seed-product-9',
      contactName: 'Test Gebruiker',
      contactEmail: 'test@example.com',
      contactPhone: '06-12345678',
      message: 'Offerte voor 3x BHV-herhalingscursus, bij voorkeur op locatie.',
      status: 'NEW',
      createdAt: daysAgo(2),
    },
    {
      id: 'seed-quote-4',
      productId: 'seed-product-8',
      contactName: 'Test Gebruiker',
      contactEmail: 'test@example.com',
      contactPhone: '06-12345678',
      message: 'Interesse in voice-picking demo. Wij gebruiken SAP WMS.',
      status: 'CLOSED',
      createdAt: daysAgo(45),
    },
  ];

  for (const q of quotesData) {
    await prisma.quoteRequest.upsert({
      where: { id: q.id },
      update: { status: q.status },
      create: {
        id: q.id,
        organizationId: demoOrg.id,
        userId: clientUser.id,
        productId: q.productId,
        contactName: q.contactName,
        contactEmail: q.contactEmail,
        contactPhone: q.contactPhone,
        message: q.message,
        status: q.status,
        createdAt: q.createdAt,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. CONVERSATIONS → MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  const conversationsData: Array<{
    id: string;
    title: string;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      sources: string | null;
      createdAt: Date;
    }>;
  }> = [
    {
      id: 'seed-conv-1',
      title: 'Aanrijdbeveiliging stellingen',
      messages: [
        {
          id: 'seed-msg-1a',
          role: 'user',
          content: 'Welke aanrijdbeveiliging raden jullie aan voor onze palletstellingen?',
          sources: null,
          createdAt: daysAgo(10),
        },
        {
          id: 'seed-msg-1b',
          role: 'assistant',
          content:
            'Op basis van uw QuickScan-resultaten adviseer ik een combinatie van kolombeschermers en kopbeveiliging. De kolombeschermer Heavy Duty (LC-KB-HD-001) absorbeert botsingsenergie tot 10 kJ en is geschikt voor uw situatie met reachtruckverkeer. Voor de kopse kanten van stellingrijen is de U-vormige kopbeveiliging (LC-KB-KS-002) aan te raden.\n\nUit de scan blijkt dat 12 van de 30 stellingrijen aanrijdbeveiliging missen, met zichtbare aanrijdschade. Dit is een urgent veiligheidspunt.',
          sources: JSON.stringify([
            'https://logistiekconcurrent.nl/producten/kolombeschermer-heavy-duty',
            'https://logistiekconcurrent.nl/kennisbank/aanrijdbeveiliging',
          ]),
          createdAt: daysAgo(10),
        },
        {
          id: 'seed-msg-1c',
          role: 'user',
          content: 'Wat zijn de kosten ongeveer voor alle 30 stellingrijen?',
          sources: null,
          createdAt: daysAgo(10),
        },
        {
          id: 'seed-msg-1d',
          role: 'assistant',
          content:
            'Een grove indicatie voor 30 stellingrijen:\n\n- **Kolombeschermers**: 60 stuks (2 per rij) × €89-129 = ca. €5.340 - €7.740\n- **Kopbeveiliging**: 30 stuks × €149-199 = ca. €4.470 - €5.970\n- **Montage**: circa €1.500 - €2.500\n\n**Totaal indicatie: €11.310 - €16.210**\n\nVoor een exacte offerte kunt u een offerteaanvraag doen via de productpagina. De consultant Jan de Vries kan u ook adviseren over de specifieke uitvoering.',
          sources: null,
          createdAt: daysAgo(10),
        },
      ],
    },
    {
      id: 'seed-conv-2',
      title: 'RI&E verplichtingen',
      messages: [
        {
          id: 'seed-msg-2a',
          role: 'user',
          content: 'Onze RI&E is verlopen. Wat zijn de wettelijke consequenties?',
          sources: null,
          createdAt: daysAgo(5),
        },
        {
          id: 'seed-msg-2b',
          role: 'assistant',
          content:
            'Een verlopen RI&E is een overtreding van de Arbeidsomstandighedenwet (Arbowet, artikel 5). De consequenties:\n\n1. **Inspectie SZW** kan een boete opleggen tot **€13.500** per overtreding\n2. Bij een arbeidsongeval zonder actuele RI&E bent u als werkgever **extra aansprakelijk**\n3. Uw **verzekeraar** kan bij schade een uitkering weigeren als de RI&E niet actueel is\n\nUit uw QuickScan blijkt dat de RI&E meer dan 3 jaar oud is en niet is geactualiseerd na de verbouwing. Ik adviseer om dit met prioriteit op te pakken.\n\nLogistiekconcurrent kan een volledige RI&E uitvoering verzorgen via een gecertificeerde arbodienst.',
          sources: JSON.stringify([
            'https://logistiekconcurrent.nl/kennisbank/rie-verplichtingen',
            'https://www.arboportaal.nl/onderwerpen/rie',
          ]),
          createdAt: daysAgo(5),
        },
      ],
    },
    {
      id: 'seed-conv-3',
      title: 'Vloermarkering normen',
      messages: [
        {
          id: 'seed-msg-3a',
          role: 'user',
          content: 'Aan welke normen moeten vloermarkeringen in een magazijn voldoen?',
          sources: null,
          createdAt: daysAgo(3),
        },
        {
          id: 'seed-msg-3b',
          role: 'assistant',
          content:
            'Vloermarkeringen in magazijnen moeten voldoen aan verschillende normen:\n\n**Kleurcodering (NEN-EN-ISO 7010):**\n- **Geel**: looppaden en verkeerszones\n- **Rood**: verbodszones, brandblussers, nooduitgangen\n- **Groen**: veilige zones, eerste hulp\n- **Blauw**: informatie en gebodszones\n- **Wit/zwart arcering**: opslagzones\n\n**Afmetingen:**\n- Gangpaden voor heftrucks: minimaal **3,5 meter** breed (bij tweerichtingsverkeer)\n- Voetgangerspaden: minimaal **0,8 meter** breed\n- Vrije zone rond nooduitgangen: minimaal **1,0 meter**\n\n**Materiaal:**\n- Slijtvast (bestand tegen heftruckverkeer)\n- Anti-slip eigenschappen\n- Goed zichtbaar, ook bij kunstlicht\n\nUit uw QuickScan blijkt dat de markeringen in hal A en C versleten zijn. Wij bieden slijtvaste vloermarkeringstape en kunnen adviseren over een complete herinrichting.',
          sources: JSON.stringify([
            'https://logistiekconcurrent.nl/kennisbank/vloermarkering-normen',
          ]),
          createdAt: daysAgo(3),
        },
        {
          id: 'seed-msg-3c',
          role: 'user',
          content: 'Is tape of verf beter voor een druk magazijn?',
          sources: null,
          createdAt: daysAgo(3),
        },
        {
          id: 'seed-msg-3d',
          role: 'assistant',
          content:
            'Voor een druk magazijn met heftruckverkeer is **epoxy-vloerverf** over het algemeen de betere keuze:\n\n| | Tape | Epoxy-verf |\n|---|---|---|\n| **Levensduur** | 1-2 jaar | 3-5 jaar |\n| **Heftruckbestendig** | Matig | Uitstekend |\n| **Aanbrengsnelheid** | Direct beloopbaar | 24-48 uur droogtijd |\n| **Kosten** | Lager (initieel) | Hoger (initieel) |\n| **TCO** | Hoger (vaker vervangen) | Lager |\n\nVoor uw situatie met circa 2.500m² en intensief heftruckverkeer adviseer ik epoxy-verf. De hogere initiële investering wordt ruimschoots terugverdiend door de langere levensduur.\n\nVoor tijdelijke markering (bijv. tijdens de overgangsperiode) kunt u onze slijtvaste tape gebruiken.',
          sources: null,
          createdAt: daysAgo(3),
        },
      ],
    },
  ];

  for (const conv of conversationsData) {
    await prisma.conversation.upsert({
      where: { id: conv.id },
      update: { title: conv.title },
      create: {
        id: conv.id,
        userId: clientUser.id,
        title: conv.title,
      },
    });

    for (const msg of conv.messages) {
      await prisma.message.upsert({
        where: { id: msg.id },
        update: { content: msg.content },
        create: {
          id: msg.id,
          conversationId: conv.id,
          role: msg.role,
          content: msg.content,
          sources: msg.sources,
          createdAt: msg.createdAt,
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. BENCHMARK SNAPSHOT
  // ═══════════════════════════════════════════════════════════════════════════

  // Simulate benchmark data from 24 organizations
  const benchmarkCells = LAYERS.flatMap((layer) =>
    PERSPECTIVES.map((perspective) => {
      // Generate realistic distribution (24 total organizations)
      const distributions: Record<string, { ROOD: number; ORANJE: number; GROEN: number }> = {
        'RUIMTE_INRICHTING-EFFICIENT': { ROOD: 4, ORANJE: 12, GROEN: 8 },
        'RUIMTE_INRICHTING-VEILIG': { ROOD: 8, ORANJE: 10, GROEN: 6 },
        'WERKWIJZE_PROCESSEN-EFFICIENT': { ROOD: 3, ORANJE: 9, GROEN: 12 },
        'WERKWIJZE_PROCESSEN-VEILIG': { ROOD: 6, ORANJE: 11, GROEN: 7 },
        'ORGANISATIE_BESTURING-EFFICIENT': { ROOD: 5, ORANJE: 13, GROEN: 6 },
        'ORGANISATIE_BESTURING-VEILIG': { ROOD: 9, ORANJE: 10, GROEN: 5 },
      };

      const key = `${layer}-${perspective}`;
      const dist = distributions[key];
      const total = dist.ROOD + dist.ORANJE + dist.GROEN;
      const average = (dist.ROOD * 1 + dist.ORANJE * 2 + dist.GROEN * 3) / total;

      return {
        layer,
        perspective,
        distribution: dist,
        average: Math.round(average * 100) / 100,
        total,
      };
    })
  );

  await prisma.benchmarkSnapshot.upsert({
    where: { id: 'seed-benchmark-1' },
    update: { data: JSON.stringify({ cells: benchmarkCells }) },
    create: {
      id: 'seed-benchmark-1',
      totalScans: 24,
      data: JSON.stringify({ cells: benchmarkCells }),
      generatedAt: daysAgo(1),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('Seed completed:');
  console.log('  Users:');
  console.log(`    - ${adminUser.email} (ADMIN)`);
  console.log(`    - ${consultantUser.email} (CONSULTANT)`);
  console.log(`    - ${clientUser.email} (CLIENT)`);
  console.log('  Organizations:');
  console.log(`    - ${demoOrg.name} (${demoOrg.slug})`);
  console.log(`    - ${secondOrg.name} (${secondOrg.slug})`);
  console.log('  Assessment:');
  console.log(`    - ${template.title} (${assessmentQuestions.length} questions)`);
  console.log('  QuickScans: 2 (PUBLISHED + ARCHIVED)');
  console.log('    - 18 findings, 9 roadmap items');
  console.log('  Actions: 10 (mixed statuses) + 6 comments');
  console.log('  Products: 10 + 5 recommendations');
  console.log('  Documents: 10 (1 version chain, 1 template, 2 expiring)');
  console.log('  Assessments: 2 (1 completed + 1 in-progress)');
  console.log('  Quote Requests: 4 (NEW, CONTACTED, QUOTED, CLOSED)');
  console.log('  Chat: 3 conversations with multi-turn messages');
  console.log('  Benchmark: 1 snapshot (24-org distribution)');
  console.log('\nLogin with password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
