const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: "Gmail",
    secure: false, // use SSL
    port: 25, // port for secure SMTP
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    }
});


const sendEmail = async (email, name, title, message, file) => {

    try {

        await transporter.sendMail({
            from: '"SPOTT" <contact@simtech.com>',
            to: email,
            subject: title,
            html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #92b127;text-decoration:none;font-weight:600">SPOTT</a>
              </div>
              <p style="font-size:1.1em">Cher ${name},</p>
              <p>${message}.</p>
              <p style="font-size:0.9em;">Cordialement,<br />SPOTT</p>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>SPOTT Inc</p>
                <p>Developer par Simbtech,<br /> copyright ©</p>
                <p>Cameroun-Yaoundé</p>
              </div>
            </div>
            </div>`,
            attachments: [
                {   // utf-8 string as an attachment
                    filename: file.name,
                    content: fs.createReadStream(file.path),
                },
            ],
        });

        return true;

    } catch (error) {
        console.log('Error sending email: ' + email, error);
        return false;
    }

}


module.exports = { transporter, sendEmail }