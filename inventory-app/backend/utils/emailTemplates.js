const escapeHtml = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const getInitials = (label = 'IA') => {
  return String(label)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
};

const buildBrandHeader = ({ appName, appLogoUrl, eyebrow, title, subtitle }) => {
  const safeAppName = escapeHtml(appName || 'Inventory App');
  const safeEyebrow = escapeHtml(eyebrow || 'Notification');
  const safeTitle = escapeHtml(title || 'Update');
  const safeSubtitle = escapeHtml(subtitle || 'Important account update');
  const safeLogoUrl = appLogoUrl ? escapeHtml(appLogoUrl) : '';
  const initials = getInitials(safeAppName);
  const logoBlock = safeLogoUrl
    ? `
      <img src="${safeLogoUrl}" width="44" height="44" alt="${safeAppName} logo" style="display:block;width:44px;height:44px;border-radius:12px;border:1px solid rgba(255,255,255,0.35);" />
    `
    : `
      <div class="brand-mark" style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#0f2c45,#1b5f96,#ff7a59);color:#ffffff;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.38);box-shadow:inset 0 1px 0 rgba(255,255,255,0.2);letter-spacing:0.02em;position:relative;overflow:hidden;">
        <span style="position:absolute;top:7px;left:8px;width:20px;height:4px;border-radius:999px;background:rgba(255,255,255,0.45);"></span>
        ${escapeHtml(initials)}
      </div>
    `;

  return `
    <td class="hero" style="padding:24px 28px;background:linear-gradient(120deg,#0f2c45,#1b5f96,#ff7a59);color:#ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="vertical-align:middle;">${logoBlock}</td>
          <td style="padding-left:12px;vertical-align:middle;">
            <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.88;">${safeEyebrow}</p>
            <p style="margin:8px 0 0;font-size:22px;line-height:1.25;font-weight:700;color:#ffffff;">${safeTitle}</p>
          </td>
        </tr>
      </table>
      <p style="margin:14px 0 0;font-size:14px;line-height:1.65;opacity:0.93;">${safeSubtitle}</p>
    </td>
  `;
};

const buildShell = ({ appName, heroMarkup, bodyMarkup, footerNote }) => {
  const safeAppName = escapeHtml(appName || 'Inventory App');
  const safeFooterNote = escapeHtml(footerNote || 'This is an automated message.');

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>
          :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
          }
          body,
          .email-shell {
            background: #eef4fb;
          }
          .email-card {
            background: #ffffff;
            border: 1px solid #dbe4ef;
          }
          .hero {
            background: linear-gradient(120deg, #0f2c45, #1b5f96, #ff7a59);
            color: #ffffff;
          }
          .copy,
          .steps-item {
            color: #334155;
          }
          .steps-item {
            background: #f8fbff;
            border: 1px solid #e1ecf8;
          }
          .muted {
            color: #64748b;
          }
          .divider {
            border-top: 1px solid #e2e8f0;
          }
          .cta {
            background: #1167b1;
            color: #ffffff !important;
          }
          .minimal-card {
            background: #f8fbff;
            border: 1px solid #e1ecf8;
            border-radius: 10px;
            padding: 12px 14px;
          }
          @media (prefers-color-scheme: dark) {
            body,
            .email-shell {
              background: #0b1520 !important;
            }
            .email-card {
              background: #0f1c2b !important;
              border-color: #25364a !important;
            }
            .copy,
            .steps-item {
              color: #d3deea !important;
            }
            .steps-item,
            .minimal-card {
              background: #12253a !important;
              border-color: #2c4560 !important;
            }
            .muted {
              color: #a5b8cd !important;
            }
            .divider {
              border-top-color: #2c3f56 !important;
            }
            .brand-mark {
              border-color: rgba(255, 255, 255, 0.5) !important;
            }
            .cta {
              background: #2a86d6 !important;
              color: #ffffff !important;
            }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background:#eef4fb;">
        <div class="email-shell" style="margin:0;padding:24px;background:#eef4fb;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td align="center">
                <table class="email-card" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:660px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dbe4ef;box-shadow:0 12px 34px rgba(15,44,69,0.10);">
                  <tr>
                    ${heroMarkup}
                  </tr>
                  <tr>
                    <td style="padding:24px 28px 8px;">
                      ${bodyMarkup}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:2px 28px 24px;">
                      <div class="divider muted" style="font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:14px;line-height:1.65;">
                        ${safeFooterNote}
                        <br />
                        This is an automated message from ${safeAppName}.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
};

const buildWelcomeEmail = ({ name, appName, appUrl, appLogoUrl }) => {
  const safeName = escapeHtml(name || 'there');
  const safeAppName = escapeHtml(appName || 'Inventory App');
  const safeAppUrl = escapeHtml(appUrl || 'http://localhost:3000');
  const heroMarkup = buildBrandHeader({
    appName: safeAppName,
    appLogoUrl,
    eyebrow: 'Account Created',
    title: `Welcome to ${safeAppName}`,
    subtitle:
      'Your workspace is ready. Start tracking inventory, reducing stockouts, and making faster restock decisions.'
  });
  const bodyMarkup = `
    <p style="margin:0 0 12px;font-size:16px;">Hi ${safeName},</p>
    <p class="copy" style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#334155;">Thanks for signing up. Your account has been created successfully and your command center is now active.</p>
    <p class="copy" style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#334155;">Use the button below to jump into your dashboard and complete your first setup in under 2 minutes.</p>
    <div style="margin:0 0 20px;">
      <a class="cta" href="${safeAppUrl}" style="display:inline-block;background:#1167b1;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.01em;">Open Dashboard</a>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;border-spacing:0 8px;margin-bottom:16px;">
      <tr><td class="steps-item" style="background:#f8fbff;border:1px solid #e1ecf8;border-radius:10px;padding:12px 14px;font-size:13px;color:#334155;">1. Add products and SKUs</td></tr>
      <tr><td class="steps-item" style="background:#f8fbff;border:1px solid #e1ecf8;border-radius:10px;padding:12px 14px;font-size:13px;color:#334155;">2. Update stock and recent sales</td></tr>
      <tr><td class="steps-item" style="background:#f8fbff;border:1px solid #e1ecf8;border-radius:10px;padding:12px 14px;font-size:13px;color:#334155;">3. Monitor risk alerts and forecast signals</td></tr>
    </table>
  `;

  return {
    subject: `Welcome to ${safeAppName}`,
    text:
      `Hi ${safeName}, your account has been created successfully on ${safeAppName}. ` +
      `Sign in here: ${safeAppUrl}. ` +
      `Next steps: add your first product, update stock, and track forecast alerts.`,
    html: buildShell({
      appName: safeAppName,
      heroMarkup,
      bodyMarkup,
      footerNote: 'If this signup was not done by you, you can safely ignore this email.'
    })
  };
};

const buildPasswordResetEmail = ({ name, appName, appUrl, appLogoUrl, resetUrl }) => {
  const safeName = escapeHtml(name || 'there');
  const safeAppName = escapeHtml(appName || 'Inventory App');
  const safeAppUrl = escapeHtml(appUrl || 'http://localhost:3000');
  const safeResetUrl = escapeHtml(resetUrl || safeAppUrl);
  const heroMarkup = buildBrandHeader({
    appName: safeAppName,
    appLogoUrl,
    eyebrow: 'Security',
    title: 'Reset Your Password',
    subtitle: 'Use the secure link below to set a new password for your account.'
  });
  const bodyMarkup = `
    <p style="margin:0 0 12px;font-size:16px;">Hi ${safeName},</p>
    <p class="copy" style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#334155;">We received a request to reset your password.</p>
    <div style="margin:0 0 18px;">
      <a class="cta" href="${safeResetUrl}" style="display:inline-block;background:#1167b1;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:700;">Reset Password</a>
    </div>
    <div class="minimal-card" style="background:#f8fbff;border:1px solid #e1ecf8;border-radius:10px;padding:12px 14px;">
      <p class="copy" style="margin:0;font-size:13px;line-height:1.65;color:#334155;">If you did not request this, no changes are needed. Your current password will remain active.</p>
    </div>
  `;

  return {
    subject: `${safeAppName} Password Reset`,
    text:
      `Hi ${safeName}, we received a request to reset your password. ` +
      `Use this link: ${safeResetUrl}. If this was not you, ignore this email.`,
    html: buildShell({
      appName: safeAppName,
      heroMarkup,
      bodyMarkup,
      footerNote: 'For your safety, this reset link should be used as soon as possible.'
    })
  };
};

const buildStockAlertEmail = ({ name, appName, appUrl, appLogoUrl, productName, currentStock, minStockLevel }) => {
  const safeName = escapeHtml(name || 'there');
  const safeAppName = escapeHtml(appName || 'Inventory App');
  const safeAppUrl = escapeHtml(appUrl || 'http://localhost:3000');
  const safeProductName = escapeHtml(productName || 'Selected Product');
  const safeCurrentStock = Number(currentStock ?? 0);
  const safeMinStock = Number(minStockLevel ?? 0);
  const heroMarkup = buildBrandHeader({
    appName: safeAppName,
    appLogoUrl,
    eyebrow: 'Inventory Alert',
    title: 'Low Stock Detected',
    subtitle: 'A product has fallen near or below your minimum stock threshold.'
  });
  const bodyMarkup = `
    <p style="margin:0 0 12px;font-size:16px;">Hi ${safeName},</p>
    <p class="copy" style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#334155;">Your inventory monitor flagged a stock-risk item that may need immediate restock.</p>
    <div class="minimal-card" style="background:#f8fbff;border:1px solid #e1ecf8;border-radius:10px;padding:12px 14px;margin-bottom:14px;">
      <p style="margin:0 0 6px;font-size:13px;color:#334155;"><strong>Product:</strong> ${safeProductName}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#334155;"><strong>Current Stock:</strong> ${safeCurrentStock}</p>
      <p style="margin:0;font-size:13px;color:#334155;"><strong>Minimum Level:</strong> ${safeMinStock}</p>
    </div>
    <div style="margin:0 0 18px;">
      <a class="cta" href="${safeAppUrl}" style="display:inline-block;background:#1167b1;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:700;">Review Inventory</a>
    </div>
  `;

  return {
    subject: `${safeAppName} Low Stock Alert: ${safeProductName}`,
    text:
      `Hi ${safeName}, low stock detected for ${safeProductName}. ` +
      `Current stock: ${safeCurrentStock}, minimum level: ${safeMinStock}. ` +
      `Review inventory here: ${safeAppUrl}`,
    html: buildShell({
      appName: safeAppName,
      heroMarkup,
      bodyMarkup,
      footerNote: 'You are receiving this alert because stock monitoring is enabled for your workspace.'
    })
  };
};

const buildTransactionalEmail = ({ type = 'welcome', ...payload }) => {
  switch (type) {
    case 'password-reset':
      return buildPasswordResetEmail(payload);
    case 'stock-alert':
      return buildStockAlertEmail(payload);
    case 'welcome':
    default:
      return buildWelcomeEmail(payload);
  }
};

module.exports = {
  buildWelcomeEmail,
  buildPasswordResetEmail,
  buildStockAlertEmail,
  buildTransactionalEmail
};
