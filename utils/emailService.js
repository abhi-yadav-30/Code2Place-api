// import nodemailer from "nodemailer";

// let transporter;

// const getTransporter = () => {
//   if (!transporter) {
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       console.error("❌ EMAIL_USER or EMAIL_PASS is missing in .env. OTP emails will not be sent.");
//       return null;
//     }
//     transporter = nodemailer.createTransport({
//        host: "smtp.gmail.com",
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
//     });
//   }
//   return transporter;
// };

// // export const sendOTP = async (email, otp) => {
// //   const currentTransporter = getTransporter();
// //   if (!currentTransporter) return false;

// //   const mailOptions = {
// //     from: `"Code2Place" <${process.env.EMAIL_USER}>`,
// //     to: email,
// //     subject: "Verify Your Email - Code2Place",
// //     html: `
// //       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
// //         <h2 style="color: #f97316; text-align: center;">Welcome to Code2Place!</h2>
// //         <p style="font-size: 16px; color: #333;">Hello,</p>
// //         <p style="font-size: 16px; color: #333;">Thank you for registering. Please use the following OTP to verify your email address:</p>
// //         <div style="text-align: center; margin: 30px 0;">
// //           <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #f97316; background: #fff7ed; padding: 10px 20px; border-radius: 8px; border: 1px dashed #f97316;">
// //             ${otp}
// //           </span>
// //         </div>
// //         <p style="font-size: 14px; color: #666;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
// //         <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
// //         <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2026 Code2Place. All rights reserved.</p>
// //       </div>
// //     `,
// //   };

// //   try {
// //     await currentTransporter.sendMail(mailOptions);
// //     console.log(`OTP sent to ${email}`);
// //     return true;
// //   } catch (error) {
// //     console.error("Error sending email:", error);
// //     return false;
// //   }
// // };
