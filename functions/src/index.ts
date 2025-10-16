import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as nodemailer from "nodemailer";
import PDFDocument from "pdfkit";

admin.initializeApp();

export const sendMonthlyReport = onSchedule(
  {
    schedule: "0 8 1 * *", // Runs 8 AM on the 1st of every month
    timeZone: "Africa/Johannesburg"
  },
  async (event) => {
    const db = admin.firestore();

    // Fetch analytics data
    const viewsSnap = await db.collection("website_views").get();
    const clicksSnap = await db.collection("website_clicks").get();
    const reportsSnap = await db.collection("user_spots").get();

    const views = viewsSnap.size;
    const clicks = clicksSnap.size;
    const topSpots = reportsSnap.docs.map(d => d.data().name).slice(0, 5);

    // Create PDF
    const pdfBuffer = await generatePdfReport(views, clicks, topSpots);

    // Send Email
    await sendEmail(pdfBuffer, "Website Analytics Report - Monthly");
  });

async function generatePdfReport(views: number, clicks: number, topSpots: string[]) {
  const doc = new PDFDocument();
  const chunks: any[] = [];
  doc.on("data", chunk => chunks.push(chunk));
  doc.on("end", () => Buffer.concat(chunks));

  doc.fontSize(24).text("Website Analytics Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(18).text(`Total Visitors: ${views}`);
  doc.fontSize(16).text(`Total Clicks: ${clicks}`);
  doc.moveDown();
  doc.text("Top 5 Spots:");
  topSpots.forEach((spot, index) => doc.text(`${index + 1}. ${spot}`));

  doc.end();

  return Buffer.concat(chunks);
}

async function sendEmail(attachment: Buffer, subject: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your_email@gmail.com",
      pass: "your_app_password", // use App Password, not your actual Gmail password
    },
  });

  await transporter.sendMail({
    from: "2BIT Analytics <your_email@gmail.com>",
    to: "jwehart.7@gmail.com",
    subject,
    text: "Here is your monthly website analytics report.",
    attachments: [
      {
        filename: "Monthly_Report.pdf",
        content: attachment,
      },
    ],
  });
}
