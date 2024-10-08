const transporter = require('../config/emailConfig');


// Generic OTP message for fallback
exports.otpMessage = (email, otp) => {
    return {
        from: '"SPOTT App" <noreply@spottapp.com>',
        to: email,
        subject: 'Your OTP Code',
        html: `<div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2;">
            <div style="margin: 50px auto; width: 70%; padding: 20px 0;">
              <div style="border-bottom: 1px solid #eee;">
                <a href="" style="font-size: 1.4em; color: #3AB091; text-decoration: none; font-weight: 600;">SPOTT</a>
              </div>
              <p style="font-size: 1.1em;">Hello,</p>
              <p>Here is your OTP code. The OTP is valid for 30 minutes.</p>
              <h2 style="background: #3AB091; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${otp}</h2>
              <p>Best regards,<br />SPOTT Team</p>
            </div>
          </div>`
    };
};

// Function to generate the OTP email for password reset
exports.otpPasswordMessage = (email, otp) => {
    return {
        from: '"SPOTT App" <noreply@spottapp.com>',
        to: email,
        subject: 'Forgot Password OTP',
        html: `<div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2;">
            <div style="margin: 50px auto; width: 70%; padding: 20px 0;">
              <div style="border-bottom: 1px solid #eee;">
                <a href="" style="font-size: 1.4em; color: #3AB091; text-decoration: none; font-weight: 600;">SPOTT</a>
              </div>
              <p style="font-size: 1.1em;">Hello,</p>
              <p>Use the following OTP to reset your password. The OTP is valid for 30 minutes.</p>
              <h2 style="background: #3AB091; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${otp}</h2>
              <p>Best regards,<br />SPOTT Team</p>
            </div>
          </div>`
    };
};

// Function to generate the OTP email for profile update confirmation
exports.otpUpdateMessage = (email, otp) => {
    return {
        from: '"SPOTT App" <noreply@spottapp.com>',
        to: email,
        subject: 'Profile Update OTP',
        html: `<div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2;">
            <div style="margin: 50px auto; width: 70%; padding: 20px 0;">
              <div style="border-bottom: 1px solid #eee;">
                <a href="" style="font-size: 1.4em; color: #3AB091; text-decoration: none; font-weight: 600;">SPOTT</a>
              </div>
              <p style="font-size: 1.1em;">Hello,</p>
              <p>Use the following OTP to confirm your profile update. The OTP is valid for 30 minutes.</p>
              <h2 style="background: #3AB091; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${otp}</h2>
              <p>Best regards,<br />SPOTT Team</p>
            </div>
          </div>`
    };
};

// Function to generate the OTP email for email verification
exports.otpVerifyMessage = (email, otp) => {
    return {
        from: '"SPOTT App" <noreply@spottapp.com>',
        to: email,
        subject: 'Email Verification OTP',
        html: `<div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2;">
            <div style="margin: 50px auto; width: 70%; padding: 20px 0;">
              <div style="border-bottom: 1px solid #eee;">
                <a href="" style="font-size: 1.4em; color: #3AB091; text-decoration: none; font-weight: 600;">SPOTT</a>
              </div>
              <p style="font-size: 1.1em;">Hello,</p>
              <p>Use the following OTP to verify your email address. The OTP is valid for 30 minutes.</p>
              <h2 style="background: #3AB091; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${otp}</h2>
              <p>Best regards,<br />SPOTT Team</p>
            </div>
          </div>`
    };
};

// Function to generate the OTP email for email modification confirmation
exports.otpModifyEmailMessage = (email, otp) => {
    return {
        from: '"SPOTT App" <noreply@spottapp.com>',
        to: email,
        subject: 'Email Modification OTP',
        html: `<div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2;">
            <div style="margin: 50px auto; width: 70%; padding: 20px 0;">
              <div style="border-bottom: 1px solid #eee;">
                <a href="" style="font-size: 1.4em; color: #3AB091; text-decoration: none; font-weight: 600;">SPOTT</a>
              </div>
              <p style="font-size: 1.1em;">Hello,</p>
              <p>Use the following OTP to confirm your email modification. The OTP is valid for 30 minutes.</p>
              <h2 style="background: #3AB091; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${otp}</h2>
              <p>Best regards,<br />SPOTT Team</p>
            </div>
          </div>`
    };
};

// Service to send an email
exports.sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,  // Sender address
        to,                            // Recipient address
        subject,                       // Subject of the email
        html                           // HTML content of the email
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (err) {
        console.error(`Error sending email: ${err.message}`);
        throw new Error('Email sending failed');
    }
};
