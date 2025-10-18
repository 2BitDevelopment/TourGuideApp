import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import { mailersendConfig } from "./config";

admin.initializeApp();

export const generateReport = onRequest(async (req, res) => {
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
    await sendEmail(pdfBuffer, "Website Analytics Report - Monthly");
  });

async function generatePdfReport(views: number, clicks: number, topPOIs: { name: string; views: number }[]) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(24).text("St. George's Cathedral Tour Guide Analytics", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text(`Report Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
    doc.moveDown(2);

    // Overview Statistics
    doc.fontSize(18).text("Overview Statistics", { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(`Total App/Website Views: ${views}`);
    doc.text(`Total POI Interactions: ${clicks}`);
    doc.moveDown(2);

    // Top POIs Section
    doc.fontSize(18).text("Top 5 Most Popular Points of Interest", { underline: true });
    doc.moveDown();
    
    if (topPOIs.length > 0) {
      topPOIs.forEach((poi, index) => {
        doc.fontSize(14).text(`${index + 1}. ${poi.name}: ${poi.views} views`);
      });
    } else {
      doc.fontSize(14).text("No POI data available for this period.");
    }

    doc.moveDown(2);
    doc.fontSize(12).text("This report includes data from the St. George's Cathedral mobile tour guide application.", { 
      align: "center"
    });

    doc.end();
  });
}

async function sendEmail(attachment: Buffer, subject: string) {
  const transporter = nodemailer.createTransport(mailersendConfig);

  await transporter.sendMail({
    from: `St. George's Cathedral Analytics <${process.env.SMTP_USER}>`,
    to: process.env.RECIPIENT_EMAIL || "jwehart.7@gmail.com",
    subject,
    text: "Here is your analytics report for the St. George's Cathedral tour guide application, including POI interaction data and visitor statistics.",
    html: `
      <h2>St. George's Cathedral Tour Guide Analytics</h2>
      <p>Please find attached your analytics report for the St. George's Cathedral mobile tour guide application.</p>
      <p>This report includes:</p>
      <ul>
        <li>Total app and website views</li>
        <li>POI interaction statistics</li>
        <li>Top 5 most popular points of interest</li>
        <li>User engagement metrics</li>
      </ul>
      <p>Best regards,<br>The Analytics Team</p>
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
