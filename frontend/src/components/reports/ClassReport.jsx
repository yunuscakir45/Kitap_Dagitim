import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Font registration happens in the StudentReport or utility, but let's re-ensure it here if needed 
// though typically it's global.
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 9,
    color: '#1e293b',
  },
  header: {
    backgroundColor: '#4f46e5',
    padding: 15,
    marginBottom: 15,
    borderRadius: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 700,
  },
  headerSubtitle: {
    color: '#e0e7ff',
    fontSize: 9,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 700,
  },
  statLabel: {
    fontSize: 7,
    marginTop: 2,
    color: '#64748b',
  },
  table: {
    width: 'auto',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    minHeight: 22,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#4f46e5',
  },
  tableHeaderText: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 8,
  },
  tableCell: {
    padding: 3,
  },
  studentName: {
    fontWeight: 700,
    color: '#4f46e5',
    marginTop: 15,
    marginBottom: 5,
    fontSize: 10,
    backgroundColor: '#f8fafc',
    padding: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
});

const ClassReport = ({ data }) => {
  const { classStats, students } = data;
  const now = new Date().toLocaleDateString('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sınıf Okuma Genel Raporu</Text>
          <Text style={styles.headerSubtitle}>Toplam {classStats.totalStudents} Öğrenci | {classStats.totalBooksRead} Okuma</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: '#eef2ff' }]}>
            <Text style={[styles.statValue, { color: '#4f46e5' }]}>{classStats.totalStudents}</Text>
            <Text style={styles.statLabel}>Öğrenci</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#ecfdf5' }]}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{classStats.totalBooks}</Text>
            <Text style={styles.statLabel}>Aktif Kitap</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#fff7ed' }]}>
            <Text style={[styles.statValue, { color: '#ea580c' }]}>{classStats.totalDistributions}</Text>
            <Text style={styles.statLabel}>Dağıtım Sayısı</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#f5f3ff' }]}>
            <Text style={[styles.statValue, { color: '#7c3aed' }]}>{classStats.totalBooksRead}</Text>
            <Text style={styles.statLabel}>Toplam Okuma</Text>
          </View>
        </View>

        <Text style={{ fontWeight: 700, fontSize: 11, marginBottom: 5 }}>Öğrenci Özeti</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCell, { flex: 0.5 }]}><Text style={styles.tableHeaderText}>#</Text></View>
            <View style={[styles.tableCell, { flex: 1.5 }]}><Text style={styles.tableHeaderText}>No</Text></View>
            <View style={[styles.tableCell, { flex: 4 }]}><Text style={styles.tableHeaderText}>Öğrenci Adı</Text></View>
            <View style={[styles.tableCell, { flex: 2 }]}><Text style={styles.tableHeaderText}>Okunan</Text></View>
            <View style={[styles.tableCell, { flex: 4 }]}><Text style={styles.tableHeaderText}>Elindeki Kitap</Text></View>
          </View>
          {students.map((s, i) => (
            <View key={s.student.id} style={styles.tableRow} wrap={false}>
              <View style={[styles.tableCell, { flex: 0.5 }]}><Text>{i + 1}</Text></View>
              <View style={[styles.tableCell, { flex: 1.5 }]}><Text>{s.student.studentNumber || '-'}</Text></View>
              <View style={[styles.tableCell, { flex: 4 }]}><Text>{s.student.fullName}</Text></View>
              <View style={[styles.tableCell, { flex: 2 }]}><Text>{s.totalBooksRead}</Text></View>
              <View style={[styles.tableCell, { flex: 4 }]}>
                <Text>
                  {s.currentBooks.length > 0 
                    ? s.currentBooks.map(b => `${b.title} (#${b.labelNumber})`).join(', ')
                    : 'Yok'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Individual Details (on new pages if needed or later in the document) */}
        {students.map((entry) => {
          if (entry.readingHistory.length === 0) return null;
          return (
            <View key={`detail-${entry.student.id}`} break={entry.readingHistory.length > 5 ? true : false}>
              <Text style={styles.studentName}>{entry.student.fullName} - Okuma Detayları</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, { backgroundColor: '#f1f5f9' }]}>
                  <View style={[styles.tableCell, { flex: 1 }]}><Text style={{ fontWeight: 700 }}>Kitap No</Text></View>
                  <View style={[styles.tableCell, { flex: 6 }]}><Text style={{ fontWeight: 700 }}>Kitap Adı</Text></View>
                  <View style={[styles.tableCell, { flex: 3 }]}><Text style={{ fontWeight: 700 }}>Tarih</Text></View>
                </View>
                {entry.readingHistory.map((h, i) => (
                  <View key={`${entry.student.id}-hist-${i}`} style={styles.tableRow}>
                    <View style={[styles.tableCell, { flex: 1 }]}><Text>{h.book.labelNumber}</Text></View>
                    <View style={[styles.tableCell, { flex: 6 }]}><Text>{h.book.title}</Text></View>
                    <View style={[styles.tableCell, { flex: 3 }]}><Text>{new Date(h.readAt).toLocaleDateString('tr-TR')}</Text></View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Kitap Dağıtım Sistemi | Sınıf Raporu</Text>
          <Text style={styles.footerText}>Rapor Tarihi: {now}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export default ClassReport;
