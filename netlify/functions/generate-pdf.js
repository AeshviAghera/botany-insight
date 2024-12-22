const PDFDocument = require('pdfkit');
exports.handler = async (event, context) => {if (event.httpMethod !== 'POST') {
                   return {
                     statusCode: 405,
                     body: JSON.stringify({ error: 'Method not allowed' })
                   };
                 }
               
                 try {
                   const { result, image } = JSON.parse(event.body);
               
                   const doc = new PDFDocument();
                   const chunks = [];
               
                   doc.on('data', chunk => chunks.push(chunk));
               
                   doc.fontSize(24).text("Plant Analysis Report", {
                     align: "center"
                   });
                  doc.moveDown();
                   doc.fontSize(24).text(`Date: ${new Date().toLocaleDateString()}`);
                   doc.moveDown();
                   doc.fontSize(14).text(result, { align: "left" });
               
                   if (image) {
                     const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
                     const buffer = Buffer.from(base64Data, 'base64');
                     doc.moveDown();
                     doc.image(buffer, {
                       fit: [500, 300],
                       align: 'center',
                       valign: 'center'
                     });
                   }
               
                   doc.end();
               
                   const pdfBuffer = await new Promise((resolve) => {
                     const bufs = [];
                     doc.on('data', chunk => bufs.push(chunk));
                     doc.on('end', () => resolve(Buffer.concat(bufs)));
                  });
              
                   return {
                     statusCode: 200,
                     headers: {
                       'Content-Type': 'application/pdf',
                       'Content-Disposition': `attachment; filename=plant_analysis_report_${Date.now()}.pdf`
                     },
                     body: pdfBuffer.toString('base64'),
                    isBase64Encoded: true
                   };
                } catch (error) {
                   console.error('Error generating PDF:', error);
                   return {
                     statusCode: 500,
                     body: JSON.stringify({ error: 'An error occurred while generating the PDF' })
                   };
                 }
               };