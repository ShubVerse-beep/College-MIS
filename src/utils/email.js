const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;

const isEmailConfigured = () =>
  Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });
  }

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    return {
      status: "skipped"
    };
  }

  await activeTransporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    text,
    html
  });

  return {
    status: "sent"
  };
};

module.exports = {
  isEmailConfigured,
  sendEmail
};

