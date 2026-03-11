import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 200,
      margin: 1
    });
  } catch (error) {
    throw new Error('QR code generation failed');
  }
};

export const generatePassPDF = async (pass) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Header with border
      doc.rect(50, 50, 495, 700).stroke();
      
      // Title
      doc.fontSize(28).font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text('VISITOR PASS', 50, 80, { align: 'center' });
      
      doc.moveTo(100, 130).lineTo(495, 130).stroke();
      
      // QR Code
      if (pass.qrCode) {
        const qrImage = pass.qrCode.split(',')[1];
        const qrBuffer = Buffer.from(qrImage, 'base64');
        doc.image(qrBuffer, 225, 150, { width: 150, height: 150 });
      }
      
      // Pass Number (prominent)
      doc.fontSize(16).font('Helvetica-Bold')
         .fillColor('#e74c3c')
         .text(pass.passNumber, 50, 320, { align: 'center' });
      
      // Visitor Details Section
      doc.fontSize(14).font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text('VISITOR INFORMATION', 80, 370);
      
      doc.fontSize(11).font('Helvetica');
      let yPos = 400;
      
      const details = [
        { label: 'Name:', value: pass.visitor.name },
        { label: 'Email:', value: pass.visitor.email },
        { label: 'Phone:', value: pass.visitor.phone },
        { label: 'Company:', value: pass.visitor.company || 'N/A' },
        { label: 'Host:', value: pass.host.name },
        { label: 'Purpose:', value: pass.purpose || 'Official Visit' }
      ];
      
      details.forEach(item => {
        doc.font('Helvetica-Bold').text(item.label, 80, yPos, { continued: true, width: 120 });
        doc.font('Helvetica').text(item.value, { width: 350 });
        yPos += 25;
      });
      
      // Validity Section
      doc.fontSize(14).font('Helvetica-Bold')
         .fillColor('#27ae60')
         .text('VALIDITY PERIOD', 80, yPos + 20);
      
      yPos += 50;
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#2c3e50');
      doc.text('Valid From:', 80, yPos, { continued: true, width: 120 });
      doc.font('Helvetica').text(new Date(pass.validFrom).toLocaleString());
      
      yPos += 25;
      doc.font('Helvetica-Bold').text('Valid Until:', 80, yPos, { continued: true, width: 120 });
      doc.font('Helvetica').text(new Date(pass.validUntil).toLocaleString());
      
      // Access Areas
      if (pass.accessAreas && pass.accessAreas.length > 0) {
        yPos += 40;
        doc.fontSize(14).font('Helvetica-Bold')
           .fillColor('#3498db')
           .text('AUTHORIZED AREAS', 80, yPos);
        
        yPos += 30;
        doc.fontSize(10).font('Helvetica')
           .fillColor('#2c3e50')
           .text(pass.accessAreas.join(', '), 80, yPos, { width: 450 });
      }
      
      // Footer
      doc.fontSize(8).font('Helvetica')
         .fillColor('#7f8c8d')
         .text('This pass must be worn visibly at all times. Report to security if lost.', 
               50, 720, { align: 'center', width: 495 });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
