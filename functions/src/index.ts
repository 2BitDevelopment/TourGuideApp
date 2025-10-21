import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import { mailersendConfig } from "./config";

// Initialize Firebase Admin with proper error handling
if (!admin.apps.length) {
  try {
    admin.initializeApp();
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

export const generateReport = onRequest(async (req, res) => {
  try {
    console.log("Starting report generation...");
    
    // Check if Firebase Admin is properly initialized
    if (!admin.apps.length) {
      throw new Error("Firebase Admin not properly initialized");
    }
    
    const db = admin.firestore();

    // Fetch analytics data
    console.log("Fetching analytics data from Firestore...");
    const viewsSnap = await db.collection("website_views").get();
    const mapViewsSnap = await db.collection("map_views").get();
    const poiViewsSnap = await db.collection("poi_views").get();
    const poiClicksSnap = await db.collection("poi_clicks").get();
    const poiInteractionsSnap = await db.collection("poi_interactions").get();
    const sessionDurationsSnap = await db.collection("session_durations").get();

    console.log(`Fetched data: ${viewsSnap.size} website views, ${sessionDurationsSnap.size} sessions`);

    const totalViews = viewsSnap.size + mapViewsSnap.size;
    const totalClicks = poiClicksSnap.size + poiInteractionsSnap.size;

    // Calculate session duration statistics
    const durationStats = { short: 0, medium: 0, long: 0 };
    sessionDurationsSnap.docs.forEach(doc => {
      const data = doc.data();
      const duration = data.durationMinutes || 0;
      if (duration < 10) durationStats.short++;
      else if (duration < 20) durationStats.medium++;
      else durationStats.long++;
    });

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
    console.log("Generating PDF report...");
    const pdfBuffer = await generatePdfReport(totalViews, totalClicks, topPOIs, durationStats);
    console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    // Send Email with fallback
    console.log("Attempting to send email...");
    try {
      await sendEmail(pdfBuffer, "Website Analytics Report - Manual");
      console.log("Email sent successfully!");
      res.status(200).send("Report generated and sent successfully!");
    } catch (emailError) {
      console.error("Email sending failed, but PDF was generated successfully:", emailError);
      // Return success but mention email issue
      res.status(200).send("Report generated successfully, but email delivery failed. Please check email configuration.");
    }
  } catch (error) {
    console.error("Error generating report:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    res.status(500).send(`Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const sessionDurationsSnap = await db.collection("session_durations").get();

    const totalViews = viewsSnap.size + mapViewsSnap.size;
    const totalClicks = poiClicksSnap.size + poiInteractionsSnap.size;

    // Calculate session duration statistics
    const durationStats = { short: 0, medium: 0, long: 0 };
    sessionDurationsSnap.docs.forEach(doc => {
      const data = doc.data();
      const duration = data.durationMinutes || 0;
      if (duration < 10) durationStats.short++;
      else if (duration < 20) durationStats.medium++;
      else durationStats.long++;
    });

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
    const pdfBuffer = await generatePdfReport(totalViews, totalClicks, topPOIs, durationStats);

    // Send Email
    await sendEmail(pdfBuffer, "TourApp Analytics Report - Monthly");
  });

async function generatePdfReport(views: number, clicks: number, topPOIs: { name: string; views: number }[], durationStats: { short: number; medium: number; long: number }) {
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
      .text("Contact: jwehart.7@gmail.com", { align: 'right', continued: false });

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

    // Session Duration section title
    doc.fontSize(16)
      .fillColor('#4A90A4')
      .text("Session Duration", 330, 350);

    // Session Duration Pie Chart
    const centerX = 420;
    const centerY = 400;
    const radius = 60;

    // Calculate total sessions and percentages
    const totalSessions = durationStats.short + durationStats.medium + durationStats.long;

    if (totalSessions > 0) {
      const shortPercent = durationStats.short / totalSessions;
      const mediumPercent = durationStats.medium / totalSessions;

      // Draw base circle (long sessions - largest or default)
      doc.circle(centerX, centerY, radius)
        .fillColor('#87CEEB')
        .fill();

      // Draw medium sessions segment if it exists (approximate with bezier curves)
      if (durationStats.medium > 0 && mediumPercent > 0.1) {
        doc.save();
        doc.fillColor('#6BB6FF');
        doc.moveTo(centerX, centerY);
        doc.lineTo(centerX + radius, centerY);

        // Approximate arc with bezier curve based on percentage
        const controlFactor = Math.min(mediumPercent * 2, 1);
        doc.bezierCurveTo(
          centerX + radius, centerY - radius * controlFactor,
          centerX + radius * (1 - controlFactor), centerY - radius,
          centerX - radius * 0.5, centerY - radius * 0.8
        );
        doc.closePath();
        doc.fill();
        doc.restore();
      }

      // Draw short sessions segment if it exists (smallest segment)
      if (durationStats.short > 0 && shortPercent > 0.1) {
        doc.save();
        doc.fillColor('#4A90A4');
        doc.moveTo(centerX, centerY);

        // Position based on other segments
        if (durationStats.medium > 0) {
          doc.lineTo(centerX - radius * 0.5, centerY - radius * 0.8);
          const controlFactor = Math.min(shortPercent * 2, 0.8);
          doc.bezierCurveTo(
            centerX - radius * 0.9, centerY - radius * 0.3,
            centerX - radius * 0.9, centerY + radius * 0.3,
            centerX - radius * 0.5, centerY + radius * controlFactor
          );
        } else {
          doc.lineTo(centerX + radius, centerY);
          const controlFactor = Math.min(shortPercent * 2, 1);
          doc.bezierCurveTo(
            centerX + radius, centerY - radius * controlFactor,
            centerX + radius * (1 - controlFactor), centerY - radius,
            centerX - radius * 0.3, centerY - radius * 0.7
          );
        }
        doc.closePath();
        doc.fill();
        doc.restore();
      }
    } else {
      // No data available - show empty circle
      doc.circle(centerX, centerY, radius)
        .fillColor('#E0E0E0')
        .fill();
    }

    // Legend with actual data
    const legendY = 480;

    doc.rect(330, legendY, 12, 12)
      .fillColor('#4A90A4')
      .fill();
    doc.fontSize(10)
      .fillColor('#666666')
      .text(`Under 10 min (${durationStats.short})`, 350, legendY + 2);

    doc.rect(330, legendY + 20, 12, 12)
      .fillColor('#6BB6FF')
      .fill();
    doc.text(`10-20 min (${durationStats.medium})`, 350, legendY + 22);

    doc.rect(330, legendY + 40, 12, 12)
      .fillColor('#87CEEB')
      .fill();
    doc.text(`20+ min (${durationStats.long})`, 350, legendY + 42);

    // Add total sessions count
    doc.fontSize(12)
      .fillColor('#4A90A4')
      .text(`Total Sessions: ${totalSessions}`, 330, legendY + 65);

    // Footer
    doc.fontSize(10)
      .fillColor('#666666')
      .text("This report includes data from the St. George's Cathedral mobile tour guide website.", 60, 580, {
        align: "center",
        width: 480
      });

    doc.end();
  });
}

async function sendEmail(attachment: Buffer, subject: string) {
  console.log("Preparing to send email...");
  const transporter = nodemailer.createTransport(mailersendConfig);

  try {


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
  catch (error) {
    console.error("Error sending email:", error);
    if (error instanceof Error) {
      console.error("Test error details:", {
        name: error.name,
        message: error.message,
        code: (error as any).code,
        errno: (error as any).errno,
        syscall: (error as any).syscall,
      });
    }
  }
}
