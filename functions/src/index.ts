import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import { mailersendConfig } from "./config";
import {RateLimiter} from "./rateLimiter";

admin.initializeApp();


const reportLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  blockDurationMs: 2 * 60 * 60 * 1000 // 2 hours
});

export const generateReport = onRequest(async (req, res) => {

const identifier = req.headers['x-forwarded-for']?.split(',')[0] ||
                  
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress ||
                   'unknown';

    const isLimited = await reportLimiter.isRateLimited(identifier);

    if (isLimited) {
        res.status(429).json({
            error: 'Too many requests',
            message: 'Please try again later',
            retryAfter:3600
        });
        return;
    }
  try {
    const db = admin.firestore();

    // Fetch analytics data
    const viewsSnap = await db.collection("website_views").get();
    const mapViewsSnap = await db.collection("map_views").get();
    const poiViewsSnap = await db.collection("poi_views").get();
    const poiClicksSnap = await db.collection("poi_clicks").get();
    const poiInteractionsSnap = await db.collection("poi_interactions").get();

    const totalViews = viewsSnap.size + mapViewsSnap.size;
    const totalClicks = poiClicksSnap.size + poiInteractionsSnap.size;
    
    // Calculate top 5 POIs by views
    const poiStats = new Map<string, number>();
    
    poiViewsSnap.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.poiTitle} (ID: ${data.poiId})`;
      poiStats.set(key, (poiStats.get(key) || 0) + 1);
    });
    
    const topPOIs = Array.from(poiStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, views]) => ({ name, views }));

    // Create PDF
    const pdfBuffer = await generatePdfReport(totalViews, totalClicks, topPOIs);

    // Send Email
    await sendEmail(pdfBuffer, "Website Analytics Report - Manual");

    res.status(200).send("Report generated and sent successfully!");
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).send("Error generating report");
  }
});

export const sendMonthlyReport = onSchedule(
  {
    schedule: "0 8 1 * *", // Runs 8 AM on the 1st of every month
    timeZone: "Africa/Johannesburg"
  },
  async (event) => {
    const db = admin.firestore();

    // Fetch analytics data
    const viewsSnap = await db.collection("website_views").get();
    const mapViewsSnap = await db.collection("map_views").get();
    const poiViewsSnap = await db.collection("poi_views").get();
    const poiClicksSnap = await db.collection("poi_clicks").get();
    const poiInteractionsSnap = await db.collection("poi_interactions").get();

    const totalViews = viewsSnap.size + mapViewsSnap.size;
    const totalClicks = poiClicksSnap.size + poiInteractionsSnap.size;
    
    // Calculate top 5 POIs by views
    const poiStats = new Map<string, number>();
    
    poiViewsSnap.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.poiTitle} (ID: ${data.poiId})`;
      poiStats.set(key, (poiStats.get(key) || 0) + 1);
    });
    
    const topPOIs = Array.from(poiStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, views]) => ({ name, views }));

    // Create PDF
    const pdfBuffer = await generatePdfReport(totalViews, totalClicks, topPOIs);

    // Send Email
    await sendEmail(pdfBuffer, "TourApp Analytics Report - Monthly");
  });

async function generatePdfReport(views: number, clicks: number, topPOIs: { name: string; views: number }[]) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];
    
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header with Website Analytics and 2BIT
    doc.fontSize(28)
       .fillColor('#4A90A4')
       .text("Website Analytics", 60, 60, { continued: true })
       .fillColor('#2C5F6F')
       .fontSize(32)
       .text(" 2BIT", { align: 'right' });

    // Date range and contact info
    const currentDate = new Date();
    const endMonth = currentDate.toLocaleDateString('en-US', { month: 'long' });
    const year = currentDate.getFullYear();
    
    doc.fontSize(10)
       .fillColor('#666666')
       .text(`March to ${endMonth} ${year}`, 60, 110)
       .text("Contact: jwehart.7@gmail.com", {align: 'right', continued: false});

    // Large visitor count
    doc.fontSize(72)
       .fillColor('#4A90A4')
       .text(views.toString(), 60, 160);
    
    doc.fontSize(24)
       .fillColor('#333333')
       .text("Visitors", 200, 200);

    // Horizontal line
    doc.strokeColor('#CCCCCC')
       .lineWidth(1)
       .moveTo(60, 250)
       .lineTo(540, 250)
       .stroke();

    // Top 5 Spots section with table styling
    doc.fontSize(16)
       .fillColor('#4A90A4')
       .text("Top 5 Spots", 60, 280);

    // Table header background
    doc.rect(60, 310, 200, 25)
       .fillColor('#E8F4F8')
       .fill();

    // Table border
    doc.rect(60, 310, 200, 25 + (Math.min(topPOIs.length, 5) * 25))
       .strokeColor('#CCCCCC')
       .lineWidth(1)
       .stroke();

    let yPosition = 320;
    
    if (topPOIs.length > 0) {
      topPOIs.slice(0, 5).forEach((poi, index) => {
        // Alternate row background
        if (index % 2 === 1) {
          doc.rect(60, yPosition - 5, 200, 25)
             .fillColor('#F8F8F8')
             .fill();
        }
        
        doc.fontSize(12)
           .fillColor('#333333')
           .text(`${index + 1}. ${poi.name.split(' (ID:')[0]}`, 70, yPosition);
        
        yPosition += 25;
      });
    } else {
      doc.fontSize(12)
         .fillColor('#666666')
         .text("No data available", 70, yPosition);
    }

    // Simple pie chart representation (using circles and paths)
    const centerX = 420;
    const centerY = 400;
    const radius = 60;

    // Background circle (largest segment)
    doc.circle(centerX, centerY, radius)
       .fillColor('#87CEEB')
       .fill();

    // Draw pie segments using bezier curves to approximate arcs
    // Segment 1 (about 60% - darker blue)
    doc.save();
    doc.fillColor('#4A90A4');
    doc.moveTo(centerX, centerY);
    doc.lineTo(centerX + radius, centerY);
    doc.bezierCurveTo(
      centerX + radius, centerY - radius * 0.8,
      centerX + radius * 0.2, centerY - radius,
      centerX - radius * 0.5, centerY - radius * 0.8
    );
    doc.closePath();
    doc.fill();
    doc.restore();

    // Segment 2 (about 25% - medium blue)
    doc.save();
    doc.fillColor('#6BB6FF');
    doc.moveTo(centerX, centerY);
    doc.lineTo(centerX - radius * 0.5, centerY - radius * 0.8);
    doc.bezierCurveTo(
      centerX - radius * 0.9, centerY - radius * 0.3,
      centerX - radius * 0.9, centerY + radius * 0.3,
      centerX - radius * 0.5, centerY + radius * 0.8
    );
    doc.closePath();
    doc.fill();
    doc.restore();

    // Legend
    const legendY = 480;
    doc.rect(330, legendY, 12, 12)
       .fillColor('#4A90A4')
       .fill();
    doc.fontSize(10)
       .fillColor('#666666')
       .text("Under 10 min", 350, legendY + 2);

    doc.rect(330, legendY + 20, 12, 12)
       .fillColor('#6BB6FF')
       .fill();
    doc.text("10 to 20 min", 350, legendY + 22);

    doc.rect(330, legendY + 40, 12, 12)
       .fillColor('#87CEEB')
       .fill();
    doc.text("25 min +", 350, legendY + 42);

    // Footer
    doc.fontSize(10)
       .fillColor('#666666')
       .text("This report includes data from the St. George's Cathedral mobile tour guide application.", 60, 580, { 
         align: "center",
         width: 480
       });

    doc.end();
  });
}

async function sendEmail(attachment: Buffer, subject: string) {
  const transporter = nodemailer.createTransport(mailersendConfig);

  await transporter.sendMail({
    from: `2BitDevelopment <${process.env.SMTP_USER}>`,
    to: process.env.RECIPIENT_EMAIL || "jwehart.7@gmail.com",
    subject,
    text: "Here is your analytics report for the St. George's Cathedral tour app, including POI interaction data and visitor statistics.",
    html: `
      <h2>St. George's Cathedral Tour App Analytics</h2>
      <p>Please find attached your analytics report for the St. George's Cathedral mobile tour app.</p>
      <p>Best regards,<br>2BitDevelopment</p>
    `,
    attachments: [
      {
        filename: "Cathedral_Analytics_Report.pdf",
        content: attachment.toString('base64'),
        encoding: 'base64',
      },
    ],
  });
}
