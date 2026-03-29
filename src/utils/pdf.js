const PDFDocument = require("pdfkit");

const streamPdf = (res, title, rows = [], columns = []) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${title.toLowerCase().replace(/\s+/g, "-")}.pdf"`
  );
  doc.pipe(res);

  doc.fontSize(20).text(title, { align: "center" });
  doc.moveDown();

  if (columns.length) {
    doc.fontSize(11).text(columns.join(" | "));
    doc.moveDown(0.5);
  }

  rows.forEach((row) => {
    doc.fontSize(10).text(columns.map((column) => row[column] ?? "-").join(" | "));
    doc.moveDown(0.2);
  });

  doc.end();
};

module.exports = {
  streamPdf
};

