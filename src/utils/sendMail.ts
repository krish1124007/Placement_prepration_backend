import nodemailer from 'nodemailer';



async function sendMail(to: string, subject: string, text: string) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            connectionTimeout: 5000, // 5 second timeout
            greetingTimeout: 5000,
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
        return { success: true };
    } catch (error) {
        console.error('Email sending failed:', error);
        // Don't throw error - just log it so app doesn't crash
        return { success: false, error: error };
    }
}

export { sendMail }