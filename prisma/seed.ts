import { db as prisma } from '@/lib/db';
import { hash } from 'bcryptjs';

async function main() {
  const defaultPassword = await hash('password123', 12);

  // Create users with roles
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

  // Create demo organizations
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

  // Consultant also works with second org
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

  // Create assessment template with questions
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

  // Define questions per layer and perspective
  const assessmentQuestions: Array<{
    layer: 'RUIMTE_INRICHTING' | 'WERKWIJZE_PROCESSEN' | 'ORGANISATIE_BESTURING';
    perspective: 'EFFICIENT' | 'VEILIG';
    questionText: string;
    helpText?: string;
    sortOrder: number;
  }> = [
    // Ruimte & Inrichting — Efficiëntie
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

    // Ruimte & Inrichting — Veiligheid
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

    // Werkwijze & Processen — Efficiëntie
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

    // Werkwijze & Processen — Veiligheid
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

    // Organisatie & Besturing — Efficiëntie
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

    // Organisatie & Besturing — Veiligheid
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
