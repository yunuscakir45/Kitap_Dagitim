import React from 'react';
import { pdf } from '@react-pdf/renderer';
import StudentReport from '../components/reports/StudentReport';
import ClassReport from '../components/reports/ClassReport';

/**
 * Common helper to download a PDF blob.
 */
const downloadPdf = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Generates and downloads a PDF report for a single student.
 */
export const generateStudentPdf = async (data) => {
    try {
        const doc = <StudentReport data={data} />;
        const blob = await pdf(doc).toBlob();
        
        const safeName = data.student.fullName.replace(/[^a-zA-Z0-9\u00C0-\u024F\u0400-\u04FF]/g, '_');
        downloadPdf(blob, `Okuma_Raporu_${safeName}.pdf`);
    } catch (error) {
        console.error('Error generating Student PDF:', error);
        throw error;
    }
};

/**
 * Generates and downloads a PDF report for the entire class.
 */
export const generateClassPdf = async (data) => {
    try {
        const doc = <ClassReport data={data} />;
        const blob = await pdf(doc).toBlob();
        
        const dateStr = new Date().toISOString().split('T')[0];
        downloadPdf(blob, `Sinif_Okuma_Raporu_${dateStr}.pdf`);
    } catch (error) {
        console.error('Error generating Class PDF:', error);
        throw error;
    }
};
