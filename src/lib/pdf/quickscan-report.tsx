import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { QuickScanData } from '@/components/quickscan/quickscan-hub';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#666' },
  date: { fontSize: 9, color: '#999', marginTop: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#1a1a1a' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  scoreCard: { flex: 1, padding: 10, borderRadius: 4, backgroundColor: '#f5f5f5' },
  scoreLabel: { fontSize: 9, color: '#666', marginBottom: 2 },
  scoreValue: { fontSize: 14, fontWeight: 'bold' },
  matrixGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  matrixCell: { width: '48%', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#e0e0e0' },
  matrixCellTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
  matrixCellScore: { fontSize: 8, marginBottom: 2 },
  matrixCellSummary: { fontSize: 8, color: '#555' },
  findingItem: { padding: 8, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: '#3b82f6', backgroundColor: '#f8fafc' },
  findingTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  findingDescription: { fontSize: 9, color: '#555', marginBottom: 2 },
  findingRecommendation: { fontSize: 9, color: '#2563eb' },
  roadmapItem: { padding: 8, marginBottom: 4, backgroundColor: '#fafafa', borderRadius: 4 },
  roadmapTitle: { fontSize: 10, fontWeight: 'bold' },
  roadmapMeta: { fontSize: 8, color: '#888', marginTop: 2 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#999', flexDirection: 'row', justifyContent: 'space-between' },
});

const RAG_LABELS: Record<string, string> = {
  ROOD: 'Rood',
  ORANJE: 'Oranje',
  GROEN: 'Groen',
};

const LAYER_LABELS: Record<string, string> = {
  RUIMTE_INRICHTING: 'Ruimte & Inrichting',
  WERKWIJZE_PROCESSEN: 'Werkwijze & Processen',
  ORGANISATIE_BESTURING: 'Organisatie & Besturing',
};

const PERSPECTIVE_LABELS: Record<string, string> = {
  EFFICIENT: 'Efficiënt',
  VEILIG: 'Veilig',
};

const TIMEFRAME_LABELS: Record<string, string> = {
  QUICK_WIN: 'Quick Win',
  DAYS_30: '30 dagen',
  DAYS_60: '60 dagen',
  DAYS_90: '90 dagen',
};

interface QuickScanReportProps {
  scan: QuickScanData;
  orgName: string;
}

export function QuickScanReport({ scan, orgName }: QuickScanReportProps) {
  const reportDate = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const findingsByCell = new Map<string, typeof scan.findings>();
  for (const finding of scan.findings) {
    if (!finding.cell) continue;
    const key = `${finding.cell.layer}:${finding.cell.perspective}`;
    const existing = findingsByCell.get(key) ?? [];
    existing.push(finding);
    findingsByCell.set(key, existing);
  }

  const roadmapByTimeframe = new Map<string, typeof scan.roadmapItems>();
  for (const item of scan.roadmapItems) {
    const existing = roadmapByTimeframe.get(item.timeframe) ?? [];
    existing.push(item);
    roadmapByTimeframe.set(item.timeframe, existing);
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{scan.title}</Text>
          <Text style={styles.subtitle}>{orgName}</Text>
          <Text style={styles.date}>Rapportdatum: {reportDate}</Text>
          {scan.consultant?.name && (
            <Text style={styles.date}>Consultant: {scan.consultant.name}</Text>
          )}
        </View>

        {/* Overall Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overzicht</Text>
          <View style={styles.row}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Efficiëntie</Text>
              <Text style={styles.scoreValue}>
                {scan.overallEfficiency ? RAG_LABELS[scan.overallEfficiency] : 'n.v.t.'}
              </Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Veiligheid</Text>
              <Text style={styles.scoreValue}>
                {scan.overallSafety ? RAG_LABELS[scan.overallSafety] : 'n.v.t.'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3x2 Matrix */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matrix</Text>
          <View style={styles.matrixGrid}>
            {scan.cells.map((cell) => (
              <View key={cell.id} style={styles.matrixCell}>
                <Text style={styles.matrixCellTitle}>
                  {LAYER_LABELS[cell.layer]} — {PERSPECTIVE_LABELS[cell.perspective]}
                </Text>
                <Text style={styles.matrixCellScore}>
                  Score: {cell.score ? RAG_LABELS[cell.score] : 'Niet beoordeeld'}
                </Text>
                {cell.summary && <Text style={styles.matrixCellSummary}>{cell.summary}</Text>}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Magazijn op Maat — QuickScan Rapport</Text>
          <Text>Gegenereerd op {reportDate}</Text>
        </View>
      </Page>

      {/* Findings Page */}
      {scan.findings.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bevindingen</Text>
            {Array.from(findingsByCell.entries()).map(([key, findings]) => {
              const [layer, perspective] = key.split(':');
              return (
                <View key={key} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 6 }}>
                    {LAYER_LABELS[layer]} — {PERSPECTIVE_LABELS[perspective]}
                  </Text>
                  {findings.map((finding) => (
                    <View key={finding.id} style={styles.findingItem}>
                      <Text style={styles.findingTitle}>{finding.title}</Text>
                      {finding.description && (
                        <Text style={styles.findingDescription}>{finding.description}</Text>
                      )}
                      {finding.recommendation && (
                        <Text style={styles.findingRecommendation}>
                          Aanbeveling: {finding.recommendation}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Text>Magazijn op Maat — QuickScan Rapport</Text>
            <Text>Gegenereerd op {reportDate}</Text>
          </View>
        </Page>
      )}

      {/* Roadmap Page */}
      {scan.roadmapItems.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Routekaart</Text>
            {Array.from(roadmapByTimeframe.entries()).map(([timeframe, items]) => (
              <View key={timeframe} style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 6 }}>
                  {TIMEFRAME_LABELS[timeframe] ?? timeframe}
                </Text>
                {items.map((item) => (
                  <View key={item.id} style={styles.roadmapItem}>
                    <Text style={styles.roadmapTitle}>{item.title}</Text>
                    {item.description && (
                      <Text style={styles.roadmapMeta}>{item.description}</Text>
                    )}
                    <Text style={styles.roadmapMeta}>
                      Status: {item.status}
                      {item.owner?.name ? ` — ${item.owner.name}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text>Magazijn op Maat — QuickScan Rapport</Text>
            <Text>Gegenereerd op {reportDate}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
