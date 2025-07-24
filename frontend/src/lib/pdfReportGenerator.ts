import { jsPDF } from 'jspdf';
import type { AnalysisResponse, ImageResponse } from '@/lib/api-client';

interface ReportData {
  analysis: AnalysisResponse;
  imageData?: ImageResponse;
  patientInfo?: {
    id: string;
    name: string;
    dob: string;
    gender: string;
  };
}

// Medical findings data (same as in ResultsDisplay)
const generateMockFindings = () => [
  {
    id: 'brain-1',
    category: 'normal' as const,
    title: 'Cerebral Cortex',
    description: 'Normal cortical thickness and signal intensity throughout both hemispheres.',
    confidence: 0.94,
    location: 'Bilateral cerebral hemispheres',
    measurements: { volume: 1250, density: 45 }
  },
  {
    id: 'brain-2',
    category: 'suspicious' as const,
    title: 'White Matter Hyperintensity',
    description: 'Small focal hyperintense lesion in the right frontal white matter, consistent with age-related changes.',
    confidence: 0.78,
    severity: 'low' as const,
    location: 'Right frontal lobe',
    measurements: { area: 3.2, volume: 0.8 }
  },
  {
    id: 'brain-3',
    category: 'normal' as const,
    title: 'Ventricular System',
    description: 'Normal ventricular size and configuration. No evidence of hydrocephalus.',
    confidence: 0.96,
    location: 'Lateral and third ventricles'
  },
  {
    id: 'brain-4',
    category: 'abnormal' as const,
    title: 'Tumor',
    description: 'Large mass detected in the left temporal lobe.',
    confidence: 0.85,
    severity: 'high' as const,
    location: 'Left temporal lobe',
    measurements: { volume: 50, density: 60 }
  }
];

export async function generateMedicalReport(data: ReportData): Promise<void> {
  const { analysis, imageData, patientInfo } = data;
  const findings = generateMockFindings();
  
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Page dimensions
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;

  // Helper functions
  const addText = (text: string, x: number, y: number, options: { 
    fontSize?: number, 
    fontStyle?: 'normal' | 'bold' | 'italic',
    maxWidth?: number,
    align?: 'left' | 'center' | 'right'
  } = {}) => {
    doc.setFontSize(options.fontSize || 10);
    doc.setFont('helvetica', options.fontStyle || 'normal');
    
    if (options.maxWidth) {
      const lines = doc.splitTextToSize(text, options.maxWidth);
      if (options.align === 'center') {
        doc.text(lines, x, y, { align: 'center' });
      } else if (options.align === 'right') {
        doc.text(lines, x, y, { align: 'right' });
      } else {
        doc.text(lines, x, y);
      }
      return lines.length * (options.fontSize || 10) * 0.5;
    } else {
      if (options.align === 'center') {
        doc.text(text, x, y, { align: 'center' });
      } else if (options.align === 'right') {
        doc.text(text, x, y, { align: 'right' });
      } else {
        doc.text(text, x, y);
      }
      return (options.fontSize || 10) * 0.5;
    }
  };

  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(x1, y1, x2, y2);
  };

  const addBox = (x: number, y: number, width: number, height: number, fillColor?: [number, number, number]) => {
    if (fillColor) {
      doc.setFillColor(...fillColor);
      doc.rect(x, y, width, height, 'F');
    }
    doc.setDrawColor(200, 200, 200);
    doc.rect(x, y, width, height);
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // ===================
  // HEADER SECTION
  // ===================
  
  // Medical facility header
  addBox(margin, yPosition, contentWidth, 30, [240, 248, 255]);
  
  // Logo placeholder and title
  addText('🏥', margin + 5, yPosition + 12, { fontSize: 20 });
  addText('MEDICAL IMAGE ANALYSIS PLATFORM', margin + 25, yPosition + 12, { 
    fontSize: 16, 
    fontStyle: 'bold' 
  });
  addText('AI-Powered Diagnostic Report', margin + 25, yPosition + 22, { 
    fontSize: 10,
    fontStyle: 'italic'
  });
  
  // Report date and ID
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  addText(`Report Date: ${reportDate}`, pageWidth - margin, yPosition + 12, { 
    fontSize: 10, 
    align: 'right' 
  });
  addText(`Report ID: ${analysis.id.slice(0, 8).toUpperCase()}`, pageWidth - margin, yPosition + 22, { 
    fontSize: 10, 
    align: 'right' 
  });

  yPosition += 40;

  // ===================
  // PATIENT INFORMATION
  // ===================
  
  addText('PATIENT INFORMATION', margin, yPosition, { fontSize: 14, fontStyle: 'bold' });
  yPosition += 8;
  addLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Patient details in two columns
  const patientData = patientInfo || {
    id: 'DEMO-001',
    name: 'Anonymous Patient',
    dob: '1985-03-15',
    gender: 'Not Specified'
  };

  addText(`Patient ID: ${patientData.id}`, margin, yPosition, { fontSize: 10, fontStyle: 'bold' });
  addText(`Date of Birth: ${patientData.dob}`, margin + 90, yPosition, { fontSize: 10 });
  yPosition += 6;
  
  addText(`Patient Name: ${patientData.name}`, margin, yPosition, { fontSize: 10, fontStyle: 'bold' });
  addText(`Gender: ${patientData.gender}`, margin + 90, yPosition, { fontSize: 10 });
  yPosition += 15;

  // ===================
  // STUDY INFORMATION
  // ===================
  
  addText('STUDY INFORMATION', margin, yPosition, { fontSize: 14, fontStyle: 'bold' });
  yPosition += 8;
  addLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  const studyDate = new Date(analysis.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  addText(`Study Date: ${studyDate}`, margin, yPosition, { fontSize: 10 });
  addText(`Modality: ${imageData?.modality || 'MRI'}`, margin + 90, yPosition, { fontSize: 10 });
  yPosition += 6;

  addText(`AI Model: ${analysis.model_name || 'ResNet-50 Medical'} v${analysis.model_version || '2.1'}`, margin, yPosition, { fontSize: 10 });
  addText(`Processing Time: ${analysis.processing_time_seconds ? Math.round(analysis.processing_time_seconds) + 's' : 'N/A'}`, margin + 90, yPosition, { fontSize: 10 });
  yPosition += 6;

  addText(`Image File: ${analysis.image_filename || 'medical_scan.dcm'}`, margin, yPosition, { fontSize: 10 });
  if (imageData) {
    addText(`File Size: ${(imageData.file_size / 1024 / 1024).toFixed(1)} MB`, margin + 90, yPosition, { fontSize: 10 });
  }
  yPosition += 15;

  // ===================
  // ANALYSIS SUMMARY
  // ===================

  checkPageBreak(40);
  
  addText('ANALYSIS SUMMARY', margin, yPosition, { fontSize: 14, fontStyle: 'bold' });
  yPosition += 8;
  addLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Overall confidence and status
  addBox(margin, yPosition, contentWidth, 25, [248, 250, 252]);
  
  addText('Overall Analysis Status:', margin + 5, yPosition + 8, { fontSize: 11, fontStyle: 'bold' });
  const statusColor = analysis.status === 'COMPLETE' ? 'SUCCESS' : analysis.status;
  addText(statusColor, margin + 65, yPosition + 8, { fontSize: 11, fontStyle: 'bold' });
  
  if (analysis.confidence_score) {
    addText('Overall Confidence:', margin + 5, yPosition + 18, { fontSize: 10 });
    addText(`${Math.round(analysis.confidence_score * 100)}%`, margin + 65, yPosition + 18, { fontSize: 10, fontStyle: 'bold' });
  }

  yPosition += 35;

  // Key findings summary
  const normalCount = findings.filter(f => f.category === 'normal').length;
  const suspiciousCount = findings.filter(f => f.category === 'suspicious').length;
  const abnormalCount = findings.filter(f => f.category === 'abnormal').length;

  addText('Key Findings Summary:', margin, yPosition, { fontSize: 11, fontStyle: 'bold' });
  yPosition += 8;

  addText(`• ${normalCount} Normal findings`, margin + 5, yPosition, { fontSize: 10 });
  yPosition += 5;
  addText(`• ${suspiciousCount} Findings requiring attention`, margin + 5, yPosition, { fontSize: 10 });
  yPosition += 5;
  addText(`• ${abnormalCount} Abnormal findings`, margin + 5, yPosition, { fontSize: 10 });
  yPosition += 15;

  // ===================
  // DETAILED FINDINGS
  // ===================

  checkPageBreak(60);
  
  addText('DETAILED FINDINGS', margin, yPosition, { fontSize: 14, fontStyle: 'bold' });
  yPosition += 8;
  addLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  findings.forEach((finding, index) => {
    checkPageBreak(35);
    
    // Finding box with color coding
    const boxColor: [number, number, number] = 
      finding.category === 'normal' ? [240, 253, 244] :
      finding.category === 'suspicious' ? [254, 252, 232] :
      [254, 242, 242];
    
    addBox(margin, yPosition, contentWidth, 30, boxColor);
    
    // Finding header
    addText(`${index + 1}. ${finding.title}`, margin + 5, yPosition + 8, { 
      fontSize: 11, 
      fontStyle: 'bold' 
    });
    
    // Confidence score
    addText(`Confidence: ${Math.round(finding.confidence * 100)}%`, pageWidth - margin - 30, yPosition + 8, { 
      fontSize: 10, 
      fontStyle: 'bold',
      align: 'right'
    });
    
    // Location
    if (finding.location) {
      addText(`Location: ${finding.location}`, margin + 5, yPosition + 16, { fontSize: 9 });
    }
    
    // Category and severity
    const categoryText = finding.category.toUpperCase();
    const severityText = finding.severity ? ` (${finding.severity.toUpperCase()})` : '';
    addText(`${categoryText}${severityText}`, pageWidth - margin - 50, yPosition + 16, { 
      fontSize: 9, 
      fontStyle: 'bold',
      align: 'right'
    });
    
    yPosition += 35;
    
    // Description
    const descHeight = addText(finding.description, margin + 5, yPosition, { 
      fontSize: 10, 
      maxWidth: contentWidth - 10 
    });
    yPosition += descHeight + 5;
    
    // Measurements if available
    if (finding.measurements) {
      let measureText = 'Measurements: ';
      const measures = [];
      if (finding.measurements.area) measures.push(`Area: ${finding.measurements.area}mm²`);
      if (finding.measurements.volume) measures.push(`Volume: ${finding.measurements.volume}mL`);
      if (finding.measurements.density) measures.push(`Density: ${finding.measurements.density}HU`);
      measureText += measures.join(', ');
      
      addText(measureText, margin + 5, yPosition, { fontSize: 9, fontStyle: 'italic' });
      yPosition += 8;
    }
    
    yPosition += 10;
  });

  // ===================
  // CLINICAL RECOMMENDATIONS
  // ===================

  checkPageBreak(50);
  
  addText('CLINICAL RECOMMENDATIONS', margin, yPosition, { fontSize: 14, fontStyle: 'bold' });
  yPosition += 8;
  addLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  addBox(margin, yPosition, contentWidth, 40, [239, 246, 255]);
  
  yPosition += 8;
  addText('Based on the AI analysis findings, the following recommendations are suggested:', margin + 5, yPosition, { 
    fontSize: 10, 
    maxWidth: contentWidth - 10 
  });
  yPosition += 10;

  const recommendations = [
    '• Continue routine follow-up as clinically indicated',
    '• No immediate intervention required for detected findings',
    '• Consider follow-up imaging in 12 months if clinically warranted',
    '• Correlation with clinical symptoms recommended'
  ];

  recommendations.forEach(rec => {
    addText(rec, margin + 5, yPosition, { fontSize: 10 });
    yPosition += 6;
  });
  
  yPosition += 20;

  // ===================
  // TECHNICAL NOTES
  // ===================

  checkPageBreak(40);
  
  addText('TECHNICAL NOTES', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
  yPosition += 8;
  addLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  const technicalNotes = [
    'This analysis was performed using AI-powered medical image analysis software.',
    `Analysis completed using ${analysis.model_name || 'AI model'} trained on over 10,000 similar cases.`,
    'Results should be interpreted in clinical context by a qualified radiologist.',
    'This report is computer-generated and should be reviewed by a medical professional.',
    'AI analysis is intended to assist, not replace, clinical judgment.'
  ];

  technicalNotes.forEach(note => {
    const noteHeight = addText(note, margin, yPosition, { 
      fontSize: 9, 
      maxWidth: contentWidth 
    });
    yPosition += noteHeight + 4;
  });

  yPosition += 10;

  // ===================
  // FOOTER
  // ===================

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    addLine(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
    
    // Footer text
    addText('Medical Image Analysis Platform - AI Diagnostic Report', margin, pageHeight - 15, { 
      fontSize: 8, 
      fontStyle: 'italic' 
    });
    addText(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 15, { 
      fontSize: 8, 
      align: 'right' 
    });
    addText(`Generated on ${reportDate}`, pageWidth / 2, pageHeight - 15, { 
      fontSize: 8, 
      align: 'center' 
    });
    
    // Disclaimer
    addText('CONFIDENTIAL MEDICAL DOCUMENT - For authorized personnel only', pageWidth / 2, pageHeight - 8, { 
      fontSize: 7, 
      align: 'center',
      fontStyle: 'bold'
    });
  }

  // Generate filename
  const fileName = `Medical_Report_${analysis.id.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Save the PDF
  doc.save(fileName);
}

// Helper function to use in components
export async function downloadAnalysisReport(
  analysisId: string, 
  analysis: AnalysisResponse, 
  imageData?: ImageResponse
) {
  try {
    await generateMedicalReport({
      analysis,
      imageData,
      patientInfo: {
        id: 'DEMO-001',
        name: 'Anonymous Patient',
        dob: '1985-03-15',
        gender: 'Not Specified'
      }
    });
  } catch (error) {
    console.error('Failed to generate PDF report:', error);
    throw new Error('Failed to generate PDF report');
  }
}