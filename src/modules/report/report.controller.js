const asyncHandler = require("../../utils/asyncHandler");
const { streamPdf } = require("../../utils/pdf");
const service = require("./report.service");

const attendanceReport = asyncHandler(async (req, res) => {
  const report = await service.exportAttendanceReport(req.query);
  streamPdf(res, report.title, report.rows, report.columns);
});

const marksReport = asyncHandler(async (req, res) => {
  const report = await service.exportMarksReport(req.query);
  streamPdf(res, report.title, report.rows, report.columns);
});

module.exports = {
  attendanceReport,
  marksReport
};

