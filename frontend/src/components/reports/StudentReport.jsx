import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register Turkish-friendly font
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
    fontSize: 10,
    color: '#1e293b', // Slate-800
  },
  header: {
    backgroundColor: '#4f46e5', // Indigo-600
    padding: 20,
    marginBottom: 20,
    borderRadius: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 5,
  },
  headerSubtitle: {
    color: '#e0e7ff', // Indigo-100
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 20,
    marginBottom: 10,
    color: '#334155', // Slate-700
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    marginBottom: 20,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    color: '#64748b', // Slate-500
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 500,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 16,
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
    minHeight: 25,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#4f46e5',
    borderBottomWidth: 0,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 9,
  },
  tableCell: {
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

const StudentReport = ({ data }) => {
  const { student, currentBooks, readingHistory, stats } = data;
  const now = new Date().toLocaleDateString('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Öğrenci Okuma Raporu</Text>
          <Text style={styles.headerSubtitle}>{student.fullName} {student.studentNumber ? `(No: ${student.studentNumber})` : ''}</Text>
        </View>

        {/* Student Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Ad Soyad</Text>
            <Text style={styles.infoValue}>{student.fullName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Öğrenci No</Text>
            <Text style={styles.infoValue}>{student.studentNumber || '-'}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: '#eef2ff' }]}>
            <Text style={[styles.statValue, { color: '#4f46e5' }]}>{stats.totalBooksRead}</Text>
            <Text style={styles.statLabel}>Okunan Kitap</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#ecfdf5' }]}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.currentBookCount}</Text>
            <Text style={styles.statLabel}>Elinde Mevcut</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#fffbeb' }]}>
            <Text style={[styles.statValue, { color: '#b45309' }]}>
              {student.createdAt ? new Date(student.createdAt).toLocaleDateString('tr-TR') : '-'}
            </Text>
            <Text style={styles.statLabel}>Kayıt Tarihi</Text>
          </View>
        </View>

        {/* Current Books */}
        {currentBooks && currentBooks.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Elindeki Kitaplar</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableHeaderText}>No</Text></View>
                <View style={[styles.tableCell, { flex: 2 }]}><Text style={styles.tableHeaderText}>Barkod</Text></View>
                <View style={[styles.tableCell, { flex: 6 }]}><Text style={styles.tableHeaderText}>Kitap Adı</Text></View>
                <View style={[styles.tableCell, { flex: 4 }]}><Text style={styles.tableHeaderText}>Yazar</Text></View>
              </View>
              {currentBooks.map((book, i) => (
                <View key={book.id} style={styles.tableRow}>
                  <View style={[styles.tableCell, { flex: 1 }]}><Text>{i + 1}</Text></View>
                  <View style={[styles.tableCell, { flex: 2 }]}><Text>{book.labelNumber || '-'}</Text></View>
                  <View style={[styles.tableCell, { flex: 6 }]}><Text>{book.title || 'İsimsiz'}</Text></View>
                  <View style={[styles.tableCell, { flex: 4 }]}><Text>{book.author || '-'}</Text></View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* History */}
        <View>
          <Text style={styles.sectionTitle}>Okuma Geçmişi</Text>
          {readingHistory && readingHistory.length > 0 ? (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableHeaderText}>No</Text></View>
                <View style={[styles.tableCell, { flex: 2 }]}><Text style={styles.tableHeaderText}>Etiket</Text></View>
                <View style={[styles.tableCell, { flex: 6 }]}><Text style={styles.tableHeaderText}>Kitap Adı</Text></View>
                <View style={[styles.tableCell, { flex: 3 }]}><Text style={styles.tableHeaderText}>Okuma Tarihi</Text></View>
              </View>
              {readingHistory.map((h, i) => (
                <View key={h.id} style={styles.tableRow}>
                  <View style={[styles.tableCell, { flex: 1 }]}><Text>{i + 1}</Text></View>
                  <View style={[styles.tableCell, { flex: 2 }]}><Text>{h.book.labelNumber || '-'}</Text></View>
                  <View style={[styles.tableCell, { flex: 6 }]}><Text>{h.book.title || 'İsimsiz'}</Text></View>
                  <View style={[styles.tableCell, { flex: 3 }]}><Text>{new Date(h.readAt).toLocaleDateString('tr-TR')}</Text></View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 9, color: '#64748b', fontStyle: 'italic', marginTop: 5 }}>Henüz okuma geçmişi bulunmamaktadır.</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Kitap Dağıtım Sistemi</Text>
          <Text style={styles.footerText}>Rapor Tarihi: {now}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export default StudentReport;
