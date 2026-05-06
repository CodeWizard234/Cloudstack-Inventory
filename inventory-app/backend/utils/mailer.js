const nodemailer = require('nodemailer');
const { buildTransactionalEmail } = require('./emailTemplates');

const MAIL_MAX_RETRIES = Number(process.env.MAIL_MAX_RETRIES || 3);
const MAIL_RETRY_BASE_DELAY_MS = Number(process.env.MAIL_RETRY_BASE_DELAY_MS || 1500);

const hasMailConfig = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
};

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    family: 4,
    tls: {
      rejectUnauthorized: false
    },
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendWithRetry = async ({ transporter, mailOptions, attempt = 1 }) => {
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    if (attempt >= MAIL_MAX_RETRIES) {
      throw err;
    }

    const delayMs = MAIL_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
    console.warn(
      `Email send failed (attempt ${attempt}/${MAIL_MAX_RETRIES}). Retrying in ${delayMs}ms: ${err.message}`
    );
    await wait(delayMs);
    return sendWithRetry({ transporter, mailOptions, attempt: attempt + 1 });
  }
};

const sendTransactionalEmail = async ({ to, type = 'welcome', payload = {} }) => {
  if (!hasMailConfig()) {
    console.warn('Mail config missing; skipping welcome email.');
    return;
  }

  const appName = process.env.APP_NAME || 'Cloudstack Inventory';
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const appLogoUrl = process.env.APP_LOGO_URL || '';
  const template = buildTransactionalEmail({
    type,
    appName,
    appUrl,
    appLogoUrl,
    ...payload
  });
  const transporter = getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: template.subject,
    text: template.text,
    html: template.html
  };

  await sendWithRetry({ transporter, mailOptions });
};

const sendWelcomeEmail = async ({ to, name }) => {
  await sendTransactionalEmail({
    to,
    type: 'welcome',
    payload: { name }
  });
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  await sendTransactionalEmail({
    to,
    type: 'password-reset',
    payload: { name, resetUrl }
  });
};

const sendStockAlertEmail = async ({ to, name, productName, currentStock, minStockLevel }) => {
  await sendTransactionalEmail({
    to,
    type: 'stock-alert',
    payload: { name, productName, currentStock, minStockLevel }
  });
};

const queueWelcomeEmail = ({ to, name }) => {
  setImmediate(async () => {
    try {
      await sendWelcomeEmail({ to, name });
    } catch (err) {
      console.error('Welcome email failed after retries:', err.message);
    }
  });
};

const queueTransactionalEmail = ({ to, type = 'welcome', payload = {} }) => {
  setImmediate(async () => {
    try {
      await sendTransactionalEmail({ to, type, payload });
    } catch (err) {
      console.error(`${type} email failed after retries:`, err.message);
    }
  });
};

module.exports = {
  sendTransactionalEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendStockAlertEmail,
  queueWelcomeEmail,
  queueTransactionalEmail
};
